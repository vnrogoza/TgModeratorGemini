import { ShieldAlert, ShieldCheck, AlertTriangle, Sparkles, MessageSquare } from 'lucide-react';
import { ModerationResult } from '../types';

interface RatingBadgeProps {
  moderation: ModerationResult;
  compact?: boolean;
}

export function RatingBadge({ moderation, compact = false }: RatingBadgeProps) {
  const { score, sentiment, profanityDetected, profanityWords, categories, explanation } = moderation;

  // Determine styling based on score (-5 to +5)
  let scoreColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let scoreBg = 'bg-emerald-600';
  let icon = <Sparkles className="w-3.5 h-3.5 text-emerald-600" />;

  if (score >= 4) {
    scoreColor = 'bg-emerald-50 text-emerald-700 border-emerald-300';
    scoreBg = 'bg-emerald-600';
    icon = <Sparkles className="w-3.5 h-3.5 text-emerald-600" />;
  } else if (score >= 1) {
    scoreColor = 'bg-teal-50 text-teal-700 border-teal-200';
    scoreBg = 'bg-teal-600';
    icon = <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />;
  } else if (score === 0) {
    scoreColor = 'bg-slate-50 text-slate-700 border-slate-200';
    scoreBg = 'bg-slate-500';
    icon = <MessageSquare className="w-3.5 h-3.5 text-slate-500" />;
  } else if (score >= -2) {
    scoreColor = 'bg-amber-50 text-amber-800 border-amber-300';
    scoreBg = 'bg-amber-500';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
  } else {
    scoreColor = 'bg-rose-50 text-rose-800 border-rose-300';
    scoreBg = 'bg-rose-600';
    icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
  }

  const sign = score > 0 ? '+' : '';

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${scoreColor}`}
        title={explanation}
      >
        <span>{sign}{score}/5</span>
        {profanityDetected && <span className="text-[10px] text-rose-600 font-bold">МАТ</span>}
      </span>
    );
  }

  return (
    <div className={`mt-2 p-2.5 rounded-lg border text-xs leading-relaxed transition-all ${scoreColor}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="font-semibold text-slate-900">Оценка модератора:</span>
          <span className={`px-2 py-0.5 rounded-full text-white font-bold text-[11px] ${scoreBg}`}>
            {sign}{score} / 5
          </span>
          <span className="text-slate-500 text-[11px] capitalize">
            ({sentiment === 'constructive'
              ? 'Конструктив'
              : sentiment === 'positive'
              ? 'Позитивно'
              : sentiment === 'neutral'
              ? 'Нейтрально'
              : sentiment === 'aggressive'
              ? 'Агрессия'
              : 'Негативно'})
          </span>
        </div>

        {profanityDetected && (
          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            Ненормативная лексика
          </span>
        )}
      </div>

      <p className="text-slate-700 text-[11px]">{explanation}</p>

      {profanityWords && profanityWords.length > 0 && (
        <div className="mt-1 text-[10px] text-rose-700">
          <span className="font-semibold">Выявлено:</span> {profanityWords.join(', ')}
        </div>
      )}

      {categories && categories.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {categories.map((cat, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded bg-white/70 border border-slate-200/80 text-[10px] text-slate-600 font-medium"
            >
              #{cat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
