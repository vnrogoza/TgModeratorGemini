import { GoogleGenAI, Type } from "@google/genai";
import { ModerationResult } from "../src/types";

// Common Russian profanity roots and patterns for ultra-fast local checking and fallback
const RUSSIAN_PROFANITY_PATTERNS = [
  /х[уеёuy][йяеёиюжп]/iu,
  /п[иеie]зд[аеыуо]/iu,
  /еб[аеёиу]|ёб[аеёты]/iu,
  /бл[яе]д[ьия]/iu,
  /с[уu]к[аеио]/iu,
  /п[ие]д[оае]р[аеыу]?/iu,
  /г[ао]вн[ое]/iu,
  /м[уu]д[аеио]к/iu,
  /шл[юе]х[аеу]/iu,
  /залуп/iu,
  /чмо/iu,
  /тварь/iu,
  /урод/iu,
  /мразь/iu,
  /х\*й|п\*зд|б\*яд|с\*ка|е\*ать/iu
];

function fallbackRuleAnalysis(text: string): ModerationResult {
  const lower = text.toLowerCase();
  const foundProfanity: string[] = [];
  
  for (const pattern of RUSSIAN_PROFANITY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      foundProfanity.push(match[0]);
    }
  }

  const profanityDetected = foundProfanity.length > 0;
  
  // Basic sentiment word detection in Russian
  const positiveWords = ['спасибо', 'благодарю', 'отлично', 'молодец', 'помог', 'круто', 'супер', 'здравствуйте', 'добрый день', 'удачи', 'респект', 'красавчик', 'пожалуйста'];
  const aggressiveWords = ['заткнись', 'пошел на', 'идиот', 'дебил', 'тупой', 'убейся', 'ненавижу', 'сдохни', 'гори в аду', 'задолбал'];
  const negativeWords = ['плохо', 'ужасно', 'ерунда', 'фигня', 'отстой', 'бесит', 'надоело', 'бред'];

  let posCount = 0;
  let negCount = 0;
  let aggCount = 0;

  for (const w of positiveWords) {
    if (lower.includes(w)) posCount++;
  }
  for (const w of aggressiveWords) {
    if (lower.includes(w)) aggCount++;
  }
  for (const w of negativeWords) {
    if (lower.includes(w)) negCount++;
  }

  // Check CAPS LOCK aggression
  const upperCount = text.replace(/[^А-ЯЁA-Z]/g, '').length;
  const lettersCount = text.replace(/[^А-Яа-яЁёA-Za-z]/g, '').length;
  const isCapsRage = lettersCount > 6 && (upperCount / lettersCount) > 0.7;

  let score = 0;
  let sentiment: ModerationResult['sentiment'] = 'neutral';
  const categories: string[] = [];
  let toxicityScore = 0;

  if (profanityDetected || aggCount > 0) {
    toxicityScore = Math.min(1.0, 0.6 + foundProfanity.length * 0.2 + aggCount * 0.2);
    score = profanityDetected ? -4 - Math.min(1, foundProfanity.length - 1) : -3;
    sentiment = 'aggressive';
    if (profanityDetected) categories.push('Ненормативная лексика');
    if (aggCount > 0) categories.push('Оскорбления / Агрессия');
  } else if (isCapsRage || negCount > 0) {
    toxicityScore = 0.4;
    score = isCapsRage ? -2 : -1;
    sentiment = 'negative';
    if (isCapsRage) categories.push('Капс / Крик');
    if (negCount > 0) categories.push('Негативная тональность');
  } else if (posCount > 0) {
    toxicityScore = 0.0;
    score = Math.min(5, 2 + posCount);
    sentiment = posCount > 1 ? 'constructive' : 'positive';
    categories.push(posCount > 1 ? 'Взаимопомощь / Конструктив' : 'Доброжелательность');
  } else {
    sentiment = 'neutral';
    categories.push('Информационное сообщение');
  }

  let action: ModerationResult['action'] = 'allow';
  if (score <= -4) {
    action = 'delete';
  } else if (score < 0) {
    action = 'warn';
  }

  return {
    score,
    sentiment,
    profanityDetected,
    profanityWords: foundProfanity,
    toxicityScore,
    categories,
    explanation: profanityDetected
      ? `Обнаружена ненормативная лексика (${foundProfanity.join(', ')}). Резкое снижение рейтинга.`
      : aggCount > 0
      ? `Выявлена прямая агрессия или оскорбление участников.`
      : score > 0
      ? `Позитивное и вежливое общение в чате.`
      : `Нейтральное сообщение без нарушений правил сообщества.`,
    action,
    muteDurationMinutes: score <= -4 ? 60 : undefined,
  };
}

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export async function analyzeMessageWithGemini(
  text: string,
  userHistorySummary?: string
): Promise<ModerationResult> {
  const fallback = fallbackRuleAnalysis(text);
  const client = getGeminiClient();

  if (!client) {
    return fallback;
  }

  try {
    const prompt = `Ты строгий и объективный робот-модератор сообществ Telegram.
Твоя задача — проанализировать сообщение пользователя, выявить ненормативную лексику (мат, завуалированный мат, эвфемизмы, транслит), оценить эмоциональную тональность, степень токсичности и выставить оценку от -5 до +5.

Правила шкалы оценки (score строго от -5 до +5):
- +5: Исключительная польза, решение проблем других участников, глубокий конструктив, высокая вежливость.
- +3 до +4: Дружелюбное, полезное, позитивное общение, поддержка, благодарность.
- +1 до +2: Приятная беседа, легкий позитив, приветствие.
- 0: Полностью нейтральный текст, вопрос по теме, ссылка без спама, технический ответ.
- -1 до -2: Легкая пассивная агрессия, сарказм, токсичный тон, переход на личности, капс-крик.
- -3 до -4: Явные оскорбления, унижение, нецензурная брань/мат (даже легкий или скрытый точками), спам.
- -5: Жесткий мат, прямые угрозы расправой, разжигание ненависти, деструктивный троллинг.

Сообщение для анализа: "${text.replace(/"/g, '\\"')}"
${userHistorySummary ? `Контекст пользователя: ${userHistorySummary}` : ''}

Ответь в строгом формате JSON:
- score: целое число от -5 до +5
- sentiment: 'positive' | 'neutral' | 'negative' | 'aggressive' | 'constructive'
- profanityDetected: boolean (true если есть русский или иностранный мат/ругательства)
- profanityWords: массив найденных матерных или грубых слов (пустой, если нет)
- toxicityScore: число от 0.0 до 1.0 (0 - чисто, 1.0 - крайняя токсичность)
- categories: массив тегов на русском (например: 'Ненормативная лексика', 'Оскорбление', 'Конструктив', 'Спам', 'Позитив')
- explanation: краткое емкое объяснение на русском языке (до 15 слов) почему выставлена такая оценка
- action: 'allow' | 'warn' | 'delete' | 'mute_temp' | 'ban'`;

    // Call Gemini with a 3.5-second timeout to prevent UI hang
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 3500)
    );

    const apiCallPromise = client.models
      .generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: 'Score strictly from -5 to 5' },
              sentiment: {
                type: Type.STRING,
                description: 'One of: positive, neutral, negative, aggressive, constructive',
              },
              profanityDetected: { type: Type.BOOLEAN },
              profanityWords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              toxicityScore: { type: Type.NUMBER },
              categories: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              explanation: { type: Type.STRING },
              action: {
                type: Type.STRING,
                description: 'One of: allow, warn, delete, mute_temp, ban',
              },
            },
            required: [
              'score',
              'sentiment',
              'profanityDetected',
              'toxicityScore',
              'categories',
              'explanation',
              'action',
            ],
          },
        },
      })
      .catch((err) => {
        console.warn('Gemini API call failed, using rule-based fallback:', err?.message || err);
        return null;
      });

    const response = (await Promise.race([apiCallPromise, timeoutPromise])) as any;
    if (!response || !response.text) {
      return fallback;
    }

    const jsonText = response.text?.trim();
    if (!jsonText) return fallback;

    const parsed = JSON.parse(jsonText);
    
    // Clamp score to -5..+5
    const clampedScore = Math.max(-5, Math.min(5, Number(parsed.score) || 0));

    // Valid sentiments
    const validSentiments: ModerationResult['sentiment'][] = [
      'positive',
      'neutral',
      'negative',
      'aggressive',
      'constructive',
    ];
    const sentiment = validSentiments.includes(parsed.sentiment)
      ? parsed.sentiment
      : fallback.sentiment;

    const profanityDetected = Boolean(parsed.profanityDetected || fallback.profanityDetected);
    const profanityWords = Array.isArray(parsed.profanityWords) && parsed.profanityWords.length > 0
      ? parsed.profanityWords
      : fallback.profanityWords;

    const validActions: ModerationResult['action'][] = [
      'allow',
      'warn',
      'delete',
      'mute_temp',
      'ban',
    ];
    let action = validActions.includes(parsed.action) ? parsed.action : fallback.action;

    // Safety override: if profanity is detected, enforce at least deletion or warning
    if (profanityDetected && action === 'allow') {
      action = 'delete';
    }

    return {
      score: clampedScore,
      sentiment,
      profanityDetected,
      profanityWords,
      toxicityScore: typeof parsed.toxicityScore === 'number' ? parsed.toxicityScore : fallback.toxicityScore,
      categories: Array.isArray(parsed.categories) ? parsed.categories : fallback.categories,
      explanation: parsed.explanation || fallback.explanation,
      action,
      muteDurationMinutes: clampedScore <= -4 ? 60 : undefined,
    };
  } catch (err) {
    console.error('Error calling Gemini moderation API, using fallback rules:', err);
    return fallback;
  }
}
