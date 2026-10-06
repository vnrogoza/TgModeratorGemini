import { X, ShieldAlert, ShieldCheck, Clock, UserX, RotateCcw, AlertTriangle, MessageSquare } from 'lucide-react';
import { UserRecord } from '../types';

interface UserDetailModalProps {
  user: UserRecord | null;
  onClose: () => void;
  onAction: (userId: string, action: 'mute' | 'unmute' | 'ban' | 'reset_rating', durationMinutes?: number, newRating?: number) => Promise<void>;
}

export function UserDetailModal({ user, onClose, onAction }: UserDetailModalProps) {
  if (!user) return null;

  const isMuted = user.status === 'muted';
  const isBanned = user.status === 'banned';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        id="user-detail-modal"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
              alt={user.fullName}
              className="w-12 h-12 rounded-full border border-slate-200 object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{user.fullName}</h3>
                <span className="text-xs text-slate-500">@{user.username}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    user.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : user.status === 'warned'
                      ? 'bg-amber-100 text-amber-800'
                      : user.status === 'muted'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {user.status === 'active' && 'Активен'}
                  {user.status === 'warned' && 'Предупреждён'}
                  {user.status === 'muted' && 'Временный мут'}
                  {user.status === 'banned' && 'Заблокирован (Бан)'}
                </span>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    user.rating > 0
                      ? 'bg-teal-100 text-teal-800'
                      : user.rating === 0
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  Карма: {user.rating > 0 ? `+${user.rating}` : user.rating}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Key Metrics */}
        <div className="grid grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-100 text-center">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Сообщений</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{user.totalMessages}</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="text-xs text-rose-600 font-medium">Токсичных</div>
            <div className="text-lg font-bold text-rose-700 mt-0.5">{user.toxicMessages}</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="text-xs text-amber-600 font-medium">Матерных</div>
            <div className="text-lg font-bold text-amber-700 mt-0.5">{user.profanityMessages}</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="text-xs text-teal-600 font-medium">Позитивных</div>
            <div className="text-lg font-bold text-teal-700 mt-0.5">{user.positiveMessages}</div>
          </div>
        </div>

        {/* Quick Admin Actions Bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">Действия модератора:</span>

          <div className="flex items-center gap-2 flex-wrap">
            {isMuted || isBanned ? (
              <button
                onClick={() => onAction(user.id, 'unmute')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Снять блокировку / Простить
              </button>
            ) : (
              <>
                <button
                  onClick={() => onAction(user.id, 'mute', 60)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Мут 1 час
                </button>
                <button
                  onClick={() => onAction(user.id, 'mute', 1440)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-800 text-white hover:bg-purple-900 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Мут 24 часа
                </button>
                <button
                  onClick={() => onAction(user.id, 'ban')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Бан навсегда
                </button>
              </>
            )}

            <button
              onClick={() => onAction(user.id, 'reset_rating', undefined, 0)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Сбросить рейтинг (0)
            </button>
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            История сообщений и оценок модератора ({user.history?.length || 0})
          </h4>

          {(!user.history || user.history.length === 0) && (
            <div className="text-center py-8 text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              История сообщений пуста
            </div>
          )}

          {user.history?.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border text-xs ${
                item.score < 0
                  ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                  : item.score > 0
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] text-slate-400">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      item.score > 0
                        ? 'bg-teal-600 text-white'
                        : item.score < 0
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-500 text-white'
                    }`}
                  >
                    {item.score > 0 ? `+${item.score}` : item.score} / 5
                  </span>

                  {item.profanity && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px]">
                      МАТ
                    </span>
                  )}
                </div>
              </div>

              <p className="font-normal text-slate-800">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
