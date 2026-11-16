import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, AlertCircle } from 'lucide-react';

export function ActionRow({
  mark,
  text,
  sub,
  hint,
  gain,
  to,
  cta = 'Sửa',
}: {
  mark?: ReactNode;
  text: string;
  sub?: ReactNode;
  hint?: string;
  gain?: number;
  to?: string | null;
  cta?: string;
}) {
  const isUrgent = cta === 'Sửa ngay';

  const rowContent = (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl p-3 transition-all duration-150 ${
        isUrgent
          ? 'bg-rose-50/50 hover:bg-rose-50 border border-rose-200/60'
          : 'bg-white hover:bg-stone-50/80 border border-stone-200/70 hover:border-stone-300'
      }`}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        {/* Left Badge: Urgent or Impact Points */}
        <div className="shrink-0 mt-0.5">
          {isUrgent ? (
            <span className="inline-flex items-center gap-1 rounded bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
              <AlertCircle size={11} className="text-rose-600" />
              Sửa gấp
            </span>
          ) : gain !== undefined && gain >= 0.5 ? (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 text-[#007700] px-2 py-0.5 text-[11px] font-bold border border-emerald-200/60 tabular-nums">
              <Sparkles size={11} />
              +{Math.round(gain)}đ
            </span>
          ) : (
            mark
          )}
        </div>

        {/* Center: Title & Hint */}
        <div className="min-w-0 flex-1">
          {hint ? (
            <Tooltip title={hint} placement="topLeft">
              <div className="cursor-help font-bold text-xs text-stone-900 leading-snug group-hover:text-[#007700] transition-colors">
                {text}
              </div>
            </Tooltip>
          ) : (
            <div className="font-bold text-xs text-stone-900 leading-snug group-hover:text-[#007700] transition-colors">
              {text}
            </div>
          )}
          {sub && <div className="mt-0.5 text-[11px] text-stone-500 leading-normal">{sub}</div>}
        </div>
      </div>

      {/* Right: Refined Action CTA */}
      {to && (
        <div className="flex items-center justify-end shrink-0 pt-1 sm:pt-0">
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
              isUrgent
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                : 'bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-[#007700] border border-stone-200/80 hover:border-emerald-300'
            }`}
          >
            <span>{cta}</span>
            <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      )}
    </div>
  );

  return (
    <li className="list-none">
      {to ? (
        <Link to={to} className="no-underline block">
          {rowContent}
        </Link>
      ) : (
        rowContent
      )}
    </li>
  );
}

export function StepMark({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-[10px] font-black text-stone-600 border border-stone-200">
      {n}
    </span>
  );
}
