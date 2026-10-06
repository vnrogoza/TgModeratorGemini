import { ShieldCheck, ShieldAlert, Sparkles, MessageSquare, AlertTriangle, Users, TrendingUp, Award, Zap } from 'lucide-react';
import { ModerationStats, UserRecord } from '../types';

interface AnalyticsDashboardProps {
  stats: ModerationStats | null;
  users: UserRecord[];
  onSelectUser: (user: UserRecord) => void;
}

export function AnalyticsDashboard({ stats, users, onSelectUser }: AnalyticsDashboardProps) {
  if (!stats) return null;

  const topConstructive = [...users].sort((a, b) => b.rating - a.rating).slice(0, 5);
  const topToxic = [...users].sort((a, b) => a.rating - b.rating).filter((u) => u.rating < 0 || u.toxicMessages > 0).slice(0, 5);

  const totalSentimentMessages =
    (stats.sentimentCounts?.positive || 0) +
    (stats.sentimentCounts?.constructive || 0) +
    (stats.sentimentCounts?.neutral || 0) +
    (stats.sentimentCounts?.negative || 0) +
    (stats.sentimentCounts?.aggressive || 0) || 1;

  return (
    <div className="space-y-6">
      {/* Top 5 Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Сообщений</span>
            <MessageSquare className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalMessages}</div>
          <div className="text-[11px] text-slate-400 mt-1">Оценено от -5 до +5</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Нарушений</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.totalViolations}</div>
          <div className="text-[11px] text-rose-600/80 mt-1">Токсичность / оскорбления</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Мат & Брань</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.profanityCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-1">Фильтрация мата</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">В Муте / Бан</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700">
            {stats.mutedUsersCount + stats.bannedUsersCount}
          </div>
          <div className="text-[11px] text-purple-600/80 mt-1">Авто-блокировки</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Средняя карма</span>
            <Sparkles className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-600">
            {stats.averageRating > 0 ? `+${stats.averageRating}` : stats.averageRating}
          </div>
          <div className="text-[11px] text-teal-600/80 mt-1">Атмосфера чата</div>
        </div>
      </div>

      {/* Sentiment Breakdown and Rating Scale Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sentiment Analysis Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Анализ эмоциональной тональности</h3>
            <span className="text-xs text-slate-400">Gemini AI</span>
          </div>

          {/* Progress segments */}
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-600 transition-all"
              style={{
                width: `${((stats.sentimentCounts?.constructive || 0) / totalSentimentMessages) * 100}%`,
              }}
              title="Конструктив"
            />
            <div
              className="bg-teal-500 transition-all"
              style={{
                width: `${((stats.sentimentCounts?.positive || 0) / totalSentimentMessages) * 100}%`,
              }}
              title="Позитив"
            />
            <div
              className="bg-slate-400 transition-all"
              style={{
                width: `${((stats.sentimentCounts?.neutral || 0) / totalSentimentMessages) * 100}%`,
              }}
              title="Нейтрально"
            />
            <div
              className="bg-amber-500 transition-all"
              style={{
                width: `${((stats.sentimentCounts?.negative || 0) / totalSentimentMessages) * 100}%`,
              }}
              title="Негатив"
            />
            <div
              className="bg-rose-600 transition-all"
              style={{
                width: `${((stats.sentimentCounts?.aggressive || 0) / totalSentimentMessages) * 100}%`,
              }}
              title="Агрессия"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <div>
                <span className="text-slate-500 font-medium">Конструктив:</span>{' '}
                <span className="font-bold text-slate-900">{stats.sentimentCounts?.constructive || 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal-500"></span>
              <div>
                <span className="text-slate-500 font-medium">Позитив:</span>{' '}
                <span className="font-bold text-slate-900">{stats.sentimentCounts?.positive || 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400"></span>
              <div>
                <span className="text-slate-500 font-medium">Нейтрально:</span>{' '}
                <span className="font-bold text-slate-900">{stats.sentimentCounts?.neutral || 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <div>
                <span className="text-slate-500 font-medium">Негатив:</span>{' '}
                <span className="font-bold text-slate-900">{stats.sentimentCounts?.negative || 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600"></span>
              <div>
                <span className="text-slate-500 font-medium">Агрессия / Мат:</span>{' '}
                <span className="font-bold text-slate-900">{stats.sentimentCounts?.aggressive || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Scale Rules Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Шкала оценивания сообщений (-5 .. +5)</h3>
            <span className="text-xs font-semibold text-indigo-600">Кумулятивный скоринг</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[11px]">
                  +4 ... +5
                </span>
                <span className="text-emerald-950 font-medium">Высокий конструктив, экспертная помощь, менторство</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-teal-50 border border-teal-100">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white font-bold text-[11px]">
                  +1 ... +3
                </span>
                <span className="text-teal-950 font-medium">Вежливое общение, поддержка, благодарности</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-500 text-white font-bold text-[11px]">
                  0
                </span>
                <span className="text-slate-800 font-medium">Нейтральный вопрос, факт, ссылка без нарушений</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-bold text-[11px]">
                  -1 ... -2
                </span>
                <span className="text-amber-950 font-medium">Пассивная агрессия, сарказм, капс-крик</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[11px]">
                  -3 ... -5
                </span>
                <span className="text-rose-950 font-medium">Ненормативная лексика (мат), оскорбления, угрозы</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboards: Top Helpful vs Toxic Watchlist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top Helpful */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Лидеры кармы (Самые полезные)</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {topConstructive.map((u, i) => (
              <div
                key={u.id}
                onClick={() => onSelectUser(u)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4">#{i + 1}</span>
                  <img
                    src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                    alt=""
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{u.fullName}</div>
                    <div className="text-[10px] text-slate-400">@{u.username}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    +{u.rating}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{u.positiveMessages} полезных</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toxic Watchlist */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900">Зона риска (Токсичные пользователи)</h3>
          </div>

          {topToxic.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Нарушителей в зоне риска нет. Чат чист!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topToxic.map((u) => (
                <div
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                      alt=""
                      className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{u.fullName}</div>
                      <div className="text-[10px] text-rose-600">
                        {u.status === 'muted'
                          ? 'Временный мут'
                          : u.status === 'banned'
                          ? 'Заблокирован'
                          : 'В зоне риска'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {u.rating}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {u.toxicMessages} наруш.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
