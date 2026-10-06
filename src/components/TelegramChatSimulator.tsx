import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, ShieldAlert, Sparkles, User, RefreshCw, Bot, AlertTriangle } from 'lucide-react';
import { ChatMessage, UserRecord } from '../types';
import { RatingBadge } from './RatingBadge';

interface TelegramChatSimulatorProps {
  messages: ChatMessage[];
  users: UserRecord[];
  onSendMessage: (payload: {
    userId: string;
    username: string;
    fullName: string;
    text: string;
    avatarUrl?: string;
  }) => Promise<void>;
  onClearChat: () => Promise<void>;
  onSelectUser: (user: UserRecord) => void;
  isLoading: boolean;
  onRefresh?: () => void;
  telegramBotName?: string;
}

const PRESET_PERSONAS = [
  {
    id: 'user_me',
    username: 'my_account',
    fullName: 'Вы (Участник)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    description: 'Обычный участник',
  },
  {
    id: 'user_103',
    username: 'dmitry_chaos',
    fullName: 'Дмитрий (Тролль)',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    description: 'Нарушитель и провокатор',
  },
  {
    id: 'user_101',
    username: 'alex_tech',
    fullName: 'Алексей (Эксперт)',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    description: 'Конструктивный ментор',
  },
  {
    id: 'user_102',
    username: 'anna_dev',
    fullName: 'Анна (Позитив)',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    description: 'Вежливый разработчик',
  },
];

const TEST_SCENARIOS = [
  {
    label: '🤬 Мат и токсичность (-5)',
    personaId: 'user_103',
    text: 'Пошли вы все на***, криворукие дебилы!',
    tooltip: 'Жесткий мат и оскорбление. Приведет к падению рейтинга и авто-муту.',
  },
  {
    label: '😤 Оскорбление (-3)',
    personaId: 'user_103',
    text: 'Ты бездарный клоун, лучше бы вообще молчал.',
    tooltip: 'Грубое оскорбление без явного мата. Оценка -3.',
  },
  {
    label: '🙄 Сарказм / Пассивная агрессия (-1)',
    personaId: 'user_103',
    text: 'Опять этот глупый вопрос, научитесь гуглить наконец.',
    tooltip: 'Токсичный тон, легкая агрессия. Оценка -1.',
  },
  {
    label: '💬 Обычный вопрос (0)',
    personaId: 'user_me',
    text: 'Всем привет! Подскажите, где найти официальную документацию?',
    tooltip: 'Нейтральный вопрос без нарушений. Оценка 0.',
  },
  {
    label: '🌟 Помощь и код (+5)',
    personaId: 'user_101',
    text: 'Держи готовое решение с пояснением каждого шага. Проверил у себя, работает отлично!',
    tooltip: 'Максимальный конструктив и польза сообществу. Оценка +5.',
  },
  {
    label: '👍 Благодарность (+3)',
    personaId: 'user_102',
    text: 'Большое спасибо за подробное разъяснение, теперь всё понятно!',
    tooltip: 'Доброжелательность и позитив. Оценка +3.',
  },
];

export function TelegramChatSimulator({
  messages,
  users,
  onSendMessage,
  onClearChat,
  onSelectUser,
  isLoading,
  onRefresh,
  telegramBotName,
}: TelegramChatSimulatorProps) {
  const [inputText, setInputText] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState('user_me');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedPersona = PRESET_PERSONAS.find((p) => p.id === selectedPersonaId) || PRESET_PERSONAS[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    await onSendMessage({
      userId: selectedPersona.id,
      username: selectedPersona.username,
      fullName: selectedPersona.fullName,
      text,
      avatarUrl: selectedPersona.avatarUrl,
    });
  };

  const handleRunPreset = async (scenario: (typeof TEST_SCENARIOS)[0]) => {
    const persona = PRESET_PERSONAS.find((p) => p.id === scenario.personaId) || selectedPersona;
    setSelectedPersonaId(persona.id);
    await onSendMessage({
      userId: persona.id,
      username: persona.username,
      fullName: persona.fullName,
      text: scenario.text,
      avatarUrl: persona.avatarUrl,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Telegram Group Header */}
      <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            TG
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-100">Telegram Чат & Симулятор</h2>
              {telegramBotName ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Бот @{telegramBotName} в сети (Long Polling Live)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  AI Модерация активна
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {users.length} участников • Робот оценивает каждое сообщение от -5 до +5
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5"
              title="Синхронизировать чат"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Синхронизировать</span>
            </button>
          )}
          <button
            onClick={onClearChat}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5"
            title="Очистить историю сообщений"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Очистить чат</span>
          </button>
        </div>
      </div>

      {/* Quick Test Scenarios Bar */}
      <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
          Быстрый тест:
        </span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {TEST_SCENARIOS.map((scenario, index) => (
            <button
              key={index}
              onClick={() => handleRunPreset(scenario)}
              disabled={isLoading}
              title={scenario.tooltip}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-2xs transition-all whitespace-nowrap active:scale-95 disabled:opacity-50"
            >
              {scenario.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream Container (Telegram Wallpaper Style) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/70">
        {messages.map((msg) => {
          const userRecord = users.find((u) => u.id === msg.userId);
          const currentKarma = userRecord ? userRecord.rating : msg.user.rating;
          const isUserMuted = userRecord?.status === 'muted';
          const isUserBanned = userRecord?.status === 'banned';

          return (
            <div key={msg.id} className="flex flex-col space-y-2 max-w-2xl">
              {/* Main Message Bubble */}
              <div
                className={`p-3.5 rounded-2xl border shadow-2xs transition-all ${
                  msg.isDeleted
                    ? 'bg-rose-50/70 border-rose-200 opacity-90'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Header with user avatar and karma */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <button
                    onClick={() => userRecord && onSelectUser(userRecord)}
                    className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={
                        msg.user.avatarUrl ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.userId}`
                      }
                      alt={msg.user.fullName}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                    <span className="text-xs font-bold text-slate-900">{msg.user.fullName}</span>
                    <span className="text-[11px] text-slate-400">@{msg.user.username}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Cumulative Karma Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        currentKarma > 0
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : currentKarma === 0
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                      title="Кумулятивный рейтинг (карма)"
                    >
                      Карма: {currentKarma > 0 ? `+${currentKarma}` : currentKarma}
                    </span>

                    {isUserMuted && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                        В МУТЕ
                      </span>
                    )}

                    {isUserBanned && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                        БАН
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Message Text (strike-through if deleted by moderator) */}
                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed break-words font-normal">
                  {msg.isDeleted ? (
                    <div className="flex items-center gap-2 text-rose-700 font-medium">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span className="line-through">{msg.text}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                        [Удалено модератором]
                      </span>
                    </div>
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>

                {/* Specific Rating Badge under the message (-5 to +5) */}
                {msg.moderation ? (
                  <RatingBadge moderation={msg.moderation} />
                ) : (
                  <div className="mt-2 p-2 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                    <span>Идет анализ тональности и оценка Gemini AI (-5..+5)...</span>
                  </div>
                )}
              </div>

              {/* Bot reply bubble (if bot issued an automatic mute or warning) */}
              {msg.botReply && (
                <div className="ml-6 p-2.5 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                  <Bot className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[11px] text-sky-300">Модератор Bot:</span>
                    <p className="text-slate-200 text-xs leading-relaxed">{msg.botReply}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white/80 rounded-xl border border-slate-200 text-xs text-slate-500 w-fit animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            <span>AI Модератор анализирует сообщение, оценивает от -5 до +5 и проверяет карму...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Sender & Persona Selector Bar */}
      <div className="p-3 bg-white border-t border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Писать от лица:</span>
            <div className="flex items-center gap-1">
              {PRESET_PERSONAS.map((persona) => {
                const isSelected = persona.id === selectedPersonaId;
                const userRec = users.find((u) => u.id === persona.id);
                const karma = userRec ? userRec.rating : 0;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setSelectedPersonaId(persona.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <img src={persona.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full" />
                    <span>{persona.fullName.split(' ')[0]}</span>
                    <span
                      className={`text-[10px] px-1 rounded ${
                        isSelected
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {karma > 0 ? `+${karma}` : karma}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Нажмите Enter для отправки
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Введите сообщение от лица ${selectedPersona.fullName}...`}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Отправить</span>
          </button>
        </form>
      </div>
    </div>
  );
}
