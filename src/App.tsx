import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Users, BarChart3, Settings, ShieldCheck, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { BotSettings, ChatMessage, ModerationResult, ModerationStats, UserRecord } from './types';
import { TelegramChatSimulator } from './components/TelegramChatSimulator';
import { UsersDatabase } from './components/UsersDatabase';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { BotSettingsView } from './components/BotSettingsView';
import { UserDetailModal } from './components/UserDetailModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'users' | 'analytics' | 'settings'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [settings, setSettings] = useState<BotSettings>({
    muteThreshold: -10,
    banThreshold: -25,
    muteDurationMinutes: 120,
    autoDeleteProfanity: true,
    showRatingBadgeUnderAll: true,
    realTelegramConnected: false,
    telegramBotUsername: 'ModAIBot',
  });
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertBanner, setAlertBanner] = useState<{ title: string; message: string; type: 'warning' | 'info' } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [msgRes, usersRes, statsRes, settingsRes] = await Promise.all([
        fetch('/api/chat/messages').then((r) => r.json()),
        fetch('/api/users').then((r) => r.json()),
        fetch('/api/stats').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
      ]);

      if (msgRes.messages) setMessages(msgRes.messages);
      if (usersRes.users) setUsers(usersRes.users);
      if (statsRes.stats) setStats(statsRes.stats);
      if (settingsRes.settings) setSettings(settingsRes.settings);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Fast polling every 2.5s for real-time sync with real Telegram chat
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSendMessage = async (payload: {
    userId: string;
    username: string;
    fullName: string;
    text: string;
    avatarUrl?: string;
  }) => {
    const tempId = `temp_${Date.now()}`;
    // Optimistically add message to UI immediately
    const optimisticMsg: ChatMessage = {
      id: tempId,
      userId: payload.userId,
      user: {
        id: payload.userId,
        username: payload.username,
        fullName: payload.fullName,
        rating: users.find((u) => u.id === payload.userId)?.rating || 0,
        status: users.find((u) => u.id === payload.userId)?.status || 'active',
        avatarUrl: payload.avatarUrl,
      },
      text: payload.text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка сервера (${res.status})`);
      }

      const data = await res.json();

      if (data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
      }

      if (data.autoAction === 'muted') {
        setAlertBanner({
          title: 'Автоматический Мут!',
          message: `Пользователь @${data.user.username} временно заблокирован: кумулятивный рейтинг упал до ${data.user.rating}.`,
          type: 'warning',
        });
        setTimeout(() => setAlertBanner(null), 6000);
      } else if (data.autoAction === 'banned') {
        setAlertBanner({
          title: 'Перманентный Бан!',
          message: `Пользователь @${data.user.username} заблокирован навсегда за критические нарушения.`,
          type: 'warning',
        });
        setTimeout(() => setAlertBanner(null), 6000);
      }

      await loadData();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      // Remove optimistic message if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setAlertBanner({
        title: 'Ошибка отправки',
        message: err.message || 'Не удалось отправить сообщение на сервер.',
        type: 'warning',
      });
      setTimeout(() => setAlertBanner(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    await fetch('/api/chat/clear', { method: 'POST' });
    setMessages([]);
    await loadData();
  };

  const handleUserAction = async (
    userId: string,
    action: 'mute' | 'unmute' | 'ban' | 'reset_rating',
    durationMinutes?: number,
    newRating?: number
  ) => {
    try {
      const res = await fetch(`/api/users/${userId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, durationMinutes, newRating }),
      });
      const data = await res.json();
      if (data.user && selectedUser && selectedUser.id === userId) {
        setSelectedUser(data.user);
      }
      await loadData();
    } catch (err) {
      console.error('Failed to perform user action:', err);
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<BotSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  const handleTestPhrase = async (phrase: string): Promise<ModerationResult | null> => {
    try {
      const res = await fetch('/api/moderation/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: phrase }),
      });
      return await res.json();
    } catch (err) {
      console.error('Failed to analyze test phrase:', err);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Telegram AI Модератор
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3" />
                  Gemini 3.8
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Фильтрация мата • Оценка -5..+5 • Карма пользователей • Авто-мут
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              id="tab-chat"
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Чат & Симулятор</span>
            </button>

            <button
              id="tab-users"
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>База пользователей ({users.length})</span>
            </button>

            <button
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Аналитика</span>
            </button>

            <button
              id="tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Настройки</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Real-time Alert Banner for Mutes/Bans */}
      {alertBanner && (
        <div className="bg-amber-500 text-white px-4 py-2.5 shadow-sm text-xs font-medium flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-bold">{alertBanner.title}</span>
            <span>{alertBanner.message}</span>
          </div>
          <button
            onClick={() => setAlertBanner(null)}
            className="text-white/80 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'chat' && (
          <TelegramChatSimulator
            messages={messages}
            users={users}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onSelectUser={(u) => setSelectedUser(u)}
            isLoading={isLoading}
            onRefresh={loadData}
            telegramBotName={settings?.telegramBotUsername}
          />
        )}

        {activeTab === 'users' && (
          <UsersDatabase
            users={users}
            onSelectUser={(u) => setSelectedUser(u)}
            onAction={handleUserAction}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            stats={stats}
            users={users}
            onSelectUser={(u) => setSelectedUser(u)}
          />
        )}

        {activeTab === 'settings' && (
          <BotSettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onTestPhrase={handleTestPhrase}
          />
        )}
      </main>

      {/* User Details Audit Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAction={handleUserAction}
        />
      )}
    </div>
  );
}
