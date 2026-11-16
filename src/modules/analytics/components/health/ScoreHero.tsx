import { Tooltip } from 'antd';
import { Lock, HelpCircle, ShieldCheck } from 'lucide-react';
import { ScoreRing } from '../intel/ScoreRing';
import { healthTier } from '../intel/intelLabels';
import type { ListingHealth } from '../../healthTypes';
import { CAP_FIELD } from './visibleTodos';

export function earned(data: ListingHealth) {
  const scored = data.breakdown.filter(r => r.scored !== false);
  return { points: scored.reduce((s, r) => s + r.points, 0), of: scored.reduce((s, r) => s + r.weight, 0) };
}

export function ScoreHero({ data, onExplain }: { data: ListingHealth; onExplain: () => void }) {
  const tier = healthTier(data.score);
  const { points, of } = earned(data);
  const passedCriteria = data.breakdown.filter(r => (r.sub_score ?? 0) >= 100).length;
  const totalCriteria = data.breakdown.length;

  return (
    <div className="flex flex-col items-center text-center space-y-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between w-full border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500">
          <ShieldCheck size={14} className="text-[#007700]" />
          <span>Điểm tối ưu tin đăng</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${tier.tone === 'good'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
            : tier.tone === 'warn'
              ? 'bg-amber-50 text-amber-800 border border-amber-200/70'
              : 'bg-rose-50 text-rose-800 border border-rose-200/70'
            }`}
        >
          {tier.label}
        </span>
      </div>

      {/* 2. Visual Radial Gauge */}
      <div className="py-2">
        <ScoreRing score={data.score} size={140} />
      </div>

      {/* 3. Inline Metric Counters (No heavy gray boxes!) */}
      <div className="w-full flex items-center justify-around py-3 px-2 rounded-xl bg-stone-50/70 border border-stone-200/60 text-center">
        <div>
          <div className="text-[10px] uppercase font-bold text-stone-400">Điểm đạt nội dung</div>
          <div className="text-base font-black text-stone-900 tabular-nums">
            {Math.round(points)}<span className="text-xs text-stone-400 font-normal">/{of}đ</span>
          </div>
        </div>

        <div className="h-7 w-px bg-stone-200/80" />

        <div>
          <div className="text-[10px] uppercase font-bold text-stone-400">Tiêu chuẩn đạt</div>
          <div className="text-base font-black text-stone-900 tabular-nums">
            <span className="text-[#007700]">{passedCriteria}</span>
            <span className="text-xs text-stone-400 font-normal">/{totalCriteria} đạt</span>
          </div>
        </div>
      </div>

      {/* 4. Score Cap Alert if any */}
      {data.cap && (
        <Tooltip title={`Còn lỗi vi phạm quy định (${data.cap.fields.map(f => CAP_FIELD[f] ?? f).join(', ')}). Sửa xong điểm về ${Math.floor(data.cap.raw)}.`}>
          <div className="w-full cursor-help rounded-xl bg-rose-50/80 border border-rose-200/70 p-2 text-left flex items-start gap-2 text-rose-800">
            <Lock size={13} className="shrink-0 mt-0.5 text-rose-600" />
            <span className="text-[11px] font-semibold leading-tight">
              Tạm khóa tối đa {Math.floor(data.cap.score)}đ do có lỗi cần sửa gấp
            </span>
          </div>
        </Tooltip>
      )}

      {/* 5. Trigger Modal */}
      <button
        type="button"
        onClick={onExplain}
        className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-[#007700] transition-colors cursor-pointer pt-1"
      >
        <HelpCircle size={13} />
        <span>Xem công thức &amp; trọng số điểm</span>
      </button>
    </div>
  );
}
