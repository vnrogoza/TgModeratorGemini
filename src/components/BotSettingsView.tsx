import React, { useState } from 'react';
import { Bot, Save, ShieldAlert, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Send, Sliders } from 'lucide-react';
import { BotSettings, ModerationResult } from '../types';

interface BotSettingsViewProps {
  settings: BotSettings;
  onUpdateSettings: (newSettings: Partial<BotSettings>) => Promise<void>;
  onTestPhrase: (phrase: string) => Promise<ModerationResult | null>;
}

export function BotSettingsView({ settings, onUpdateSettings, onTestPhrase }: BotSettingsViewProps) {
  const [formData, setFormData] = useState<BotSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Telegram bot token test
  const [botToken, setBotToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false,
  });

  // Direct analyzer playground test
  const [testPhrase, setTestPhrase] = useState('');
  const [testResult, setTestResult] = useState<ModerationResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectTelegram = async () => {
    if (!botToken.trim()) return;
    setTokenStatus({ loading: true });
    try {
      const res = await fetch('/api/telegram/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken }),
      });
      const data = await res.json();
      if (data.success) {
        setTokenStatus({
          loading: false,
          success: true,
          message: `Успешно подключен бот @${data.botName}!`,
        });
        setFormData((prev) => ({
          ...prev,
          realTelegramConnected: true,
          telegramBotUsername: data.botName,
        }));
      } else {
        setTokenStatus({
          loading: false,
          success: false,
          message: data.error || 'Не удалось подключиться к Telegram API.',
        });
      }
    } catch (err: any) {
      setTokenStatus({ loading: false, success: false, message: err.message });
    }
  };

  const handleRunTestPhrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhrase.trim() || isTesting) return;
    setIsTesting(true);
    try {
      const res = await onTestPhrase(testPhrase);
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  const currentWebhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/telegram/webhook` : '';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Moderation Rules & Scoring Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Параметры модерации и авто-блокировок</h3>
              <p className="text-xs text-slate-500">
                Пороги кумулятивного рейтинга и автоматические санкции для нарушителей
              </p>
            </div>
          </div>

          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Настройки сохранены
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Mute threshold */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Порог авто-мута (отрицательный рейтинг):</span>
                <span className="text-rose-600 font-extrabold">{formData.muteThreshold}</span>
              </label>
              <input
                type="range"
                min="-30"
                max="-3"
                step="1"
                value={formData.muteThreshold}
                onChange={(e) => setFormData({ ...formData, muteThreshold: Number(e.target.value) })}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Когда накопленная карма участника опустится до {formData.muteThreshold}, робот автоматически применит временный мут.
              </p>
            </div>

            {/* Mute duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Длительность временного мута:
              </label>
              <select
                value={formData.muteDurationMinutes}
                onChange={(e) => setFormData({ ...formData, muteDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              >
                <option value={30}>30 минут</option>
                <option value={60}>1 час</option>
                <option value={120}>2 часа (Рекомендуется)</option>
                <option value={360}>6 часов</option>
                <option value={720}>12 часов</option>
                <option value={1440}>24 часа (1 сутки)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                По истечении срока статус пользователя автоматически вернется в активный.
              </p>
            </div>

            {/* Ban threshold */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Порог перманентного бана (критический рейтинг):</span>
                <span className="text-rose-700 font-extrabold">{formData.banThreshold}</span>
              </label>
              <input
                type="range"
                min="-50"
                max="-15"
                step="1"
                value={formData.banThreshold}
                onChange={(e) => setFormData({ ...formData, banThreshold: Number(e.target.value) })}
                className="w-full accent-rose-700 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Полная блокировка в чате при падении кармы до {formData.banThreshold}.
              </p>
            </div>

            {/* Auto-delete profanity switch */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">Автоматические действия:</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoDeleteProfanity}
                    onChange={(e) => setFormData({ ...formData, autoDeleteProfanity: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                  />
                  <span>Удалять сообщения с ненормативной лексикой</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showRatingBadgeUnderAll}
                    onChange={(e) => setFormData({ ...formData, showRatingBadgeUnderAll: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                  />
                  <span>Показывать плашку оценки (-5..+5) под каждым сообщением</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Сохранение...' : 'Сохранить настройки'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Real Telegram Bot Setup */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-sky-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Интеграция с реальным Telegram чатом</h3>
              <p className="text-xs text-slate-500">
                Подключение бота через официальный Telegram Bot API
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
              formData.realTelegramConnected
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {formData.realTelegramConnected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                @{formData.telegramBotUsername || 'Бот подключен'}
              </>
            ) : (
              'Не подключен'
            )}
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-sky-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1 text-sky-900">
              <ExternalLink className="w-3.5 h-3.5" />
              Инструкция по подключению в 3 шага:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-sky-800 font-normal">
              <li>Откройте Telegram и напишите боту <b>@BotFather</b> команду <code>/newbot</code>.</li>
              <li>Скопируйте полученный HTTP API Token и вставьте в поле ниже.</li>
              <li>Добавьте вашего бота в ваш Telegram-чат и назначьте его <b>Администратором</b> (права: удаление сообщений, блокировка участников).</li>
            </ol>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Telegram Bot Token (из @BotFather):</label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="1234567890:ABCdefGHIjklmnOPQRstuvWXyz..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
              />
              <button
                type="button"
                onClick={handleConnectTelegram}
                disabled={!botToken.trim() || tokenStatus.loading}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {tokenStatus.loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Проверить токен
              </button>
            </div>

            {tokenStatus.message && (
              <div
                className={`text-xs p-2.5 rounded-lg flex items-center gap-1.5 ${
                  tokenStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {tokenStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{tokenStatus.message}</span>
              </div>
            )}
          </div>

          {/* Connection Mode Info */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Режим соединения: Активный Long Polling (Рекомендуемый)</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch('/api/telegram/start-polling', { method: 'POST' });
                    alert('Long Polling перезапущен и синхронизирует чат Telegram!');
                  } catch (e) {
                    alert('Ошибка запуска polling');
                  }
                }}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Синхронизировать сейчас</span>
              </button>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Бот автоматически непрерывно забирает входящие сообщения из вашей группы Telegram без необходимости открывать сетевые порты или регистрировать внешние вебхуки.
            </p>
          </div>

          {/* Webhook information */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700">Альтернатива: Webhook URL (для собственного сервера VPS):</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentWebhookUrl}
                className="flex-1 px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-600 select-all"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(currentWebhookUrl);
                  alert('Webhook URL скопирован в буфер обмена!');
                }}
                className="px-3 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-300 transition-colors"
              >
                Копировать
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Используйте этот URL при переносе бота на собственный сервер со статическим доменом и SSL.
            </p>
          </div>
        </div>
      </div>

      {/* Direct AI Moderation Test Playground */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Интерактивный тестер фраз (Gemini AI Playground)</h3>
          <p className="text-xs text-slate-500">
            Проверьте, как искусственный интеллект оценивает любую фразу от -5 до +5
          </p>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleRunTestPhrase} className="flex items-center gap-2">
            <input
              type="text"
              value={testPhrase}
              onChange={(e) => setTestPhrase(e.target.value)}
              placeholder="Введите любую фразу для мгновенного анализа (мат, вопрос, благодарность)..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!testPhrase.trim() || isTesting}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Оценить</span>
            </button>
          </form>

          {testResult && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Оценка фразы:</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                      testResult.score > 0
                        ? 'bg-emerald-600 text-white'
                        : testResult.score < 0
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-500 text-white'
                    }`}
                  >
                    {testResult.score > 0 ? `+${testResult.score}` : testResult.score} / 5
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    (Тональность: {testResult.sentiment})
                  </span>
                </div>

                {testResult.profanityDetected && (
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                    МАТ ОБНАРУЖЕН
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-800 font-medium">{testResult.explanation}</p>

              {testResult.profanityWords && testResult.profanityWords.length > 0 && (
                <div className="text-[11px] text-rose-700">
                  <span className="font-bold">Найденные слова:</span> {testResult.profanityWords.join(', ')}
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <span>Токсичность: {Math.round(testResult.toxicityScore * 100)}%</span>
                <span>•</span>
                <span>Рекомендуемое действие: <b>{testResult.action}</b></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
