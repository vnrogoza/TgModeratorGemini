import { useState, useMemo } from 'react';
import { Search, UserCheck, UserX, Clock, RotateCcw, AlertTriangle, ShieldAlert, ArrowUpDown, ChevronRight, Filter } from 'lucide-react';
import { UserRecord } from '../types';

interface UsersDatabaseProps {
  users: UserRecord[];
  onSelectUser: (user: UserRecord) => void;
  onAction: (userId: string, action: 'mute' | 'unmute' | 'ban' | 'reset_rating', durationMinutes?: number, newRating?: number) => Promise<void>;
}

export function UsersDatabase({ users, onSelectUser, onAction }: UsersDatabaseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'muted' | 'banned' | 'toxic'>('all');
  const [sortBy, setSortBy] = useState<'rating_desc' | 'rating_asc' | 'toxic_desc' | 'messages_desc'>('rating_desc');

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const matchesQuery =
          user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.id.includes(searchQuery);

        if (!matchesQuery) return false;

        if (statusFilter === 'active') return user.status === 'active';
        if (statusFilter === 'muted') return user.status === 'muted';
        if (statusFilter === 'banned') return user.status === 'banned';
        if (statusFilter === 'toxic') return user.toxicMessages > 0 || user.rating < 0;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating_desc') return b.rating - a.rating;
        if (sortBy === 'rating_asc') return a.rating - b.rating;
        if (sortBy === 'toxic_desc') return b.toxicMessages - a.toxicMessages;
        if (sortBy === 'messages_desc') return b.totalMessages - a.totalMessages;
        return 0;
      });
  }, [users, searchQuery, statusFilter, sortBy]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">База пользователей & Карма</h2>
            <p className="text-xs text-slate-500">
              Учет активности участников, кумулятивного рейтинга и автоматических блокировок
            </p>
          </div>

          <div className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
            Всего в базе: {users.length} участников
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, @username или ID..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-2 rounded-xl font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-emerald-700 text-white font-semibold shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Активные
            </button>
            <button
              onClick={() => setStatusFilter('muted')}
              className={`px-3 py-2 rounded-xl font-medium transition-all ${
                statusFilter === 'muted'
                  ? 'bg-purple-700 text-white font-semibold shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              В муте
            </button>
            <button
              onClick={() => setStatusFilter('banned')}
              className={`px-3 py-2 rounded-xl font-medium transition-all ${
                statusFilter === 'banned'
                  ? 'bg-rose-700 text-white font-semibold shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Бан
            </button>
            <button
              onClick={() => setStatusFilter('toxic')}
              className={`px-3 py-2 rounded-xl font-medium transition-all ${
                statusFilter === 'toxic'
                  ? 'bg-amber-700 text-white font-semibold shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Токсичные
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="rating_desc">Сортировка: Рейтинг ↓ (Высокий)</option>
            <option value="rating_asc">Сортировка: Рейтинг ↑ (Отрицательный)</option>
            <option value="toxic_desc">Сортировка: По токсичности</option>
            <option value="messages_desc">Сортировка: По числу сообщений</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Участник</th>
              <th className="py-3 px-4">Кумулятивная Карма</th>
              <th className="py-3 px-4">Статус</th>
              <th className="py-3 px-4">Сообщений / Нарушений</th>
              <th className="py-3 px-4">Уровень риска</th>
              <th className="py-3 px-4 text-right">Быстрые действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  Пользователи не найдены
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isMuted = user.status === 'muted';
                const isBanned = user.status === 'banned';

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => onSelectUser(user)}
                  >
                    {/* User Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            user.avatarUrl ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`
                          }
                          alt={user.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {user.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400">@{user.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Karma / Cumulative Rating */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            user.rating > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : user.rating === 0
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {user.rating > 0 ? `+${user.rating}` : user.rating}
                        </span>
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full ${
                              user.rating >= 0 ? 'bg-teal-500' : 'bg-rose-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.abs(user.rating) * 5)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
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
                        {user.status === 'banned' && 'Бан'}
                      </span>
                    </td>

                    {/* Messages and Violations Stats */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="text-slate-900 font-semibold">{user.totalMessages} сообщ.</span>
                        <div className="flex items-center gap-2 text-[10px]">
                          {user.toxicMessages > 0 && (
                            <span className="text-rose-600 font-medium">
                              Токсичных: {user.toxicMessages}
                            </span>
                          )}
                          {user.profanityMessages > 0 && (
                            <span className="text-amber-600 font-medium">
                              Мат: {user.profanityMessages}
                            </span>
                          )}
                          {user.toxicMessages === 0 && user.profanityMessages === 0 && (
                            <span className="text-emerald-600 font-medium">Без нарушений</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Risk Level */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          user.riskLevel === 'critical'
                            ? 'bg-rose-600 text-white'
                            : user.riskLevel === 'high'
                            ? 'bg-amber-500 text-white'
                            : user.riskLevel === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user.riskLevel === 'critical' && 'Критический'}
                        {user.riskLevel === 'high' && 'Высокий'}
                        {user.riskLevel === 'medium' && 'Средний'}
                        {user.riskLevel === 'low' && 'Низкий'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {isMuted || isBanned ? (
                          <button
                            onClick={() => onAction(user.id, 'unmute')}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                            title="Снять блокировку"
                          >
                            Разблокировать
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => onAction(user.id, 'mute', 60)}
                              className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
                              title="Временный мут на 1 час"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onAction(user.id, 'ban')}
                              className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
                              title="Бан навсегда"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onSelectUser(user)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Просмотреть историю"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
