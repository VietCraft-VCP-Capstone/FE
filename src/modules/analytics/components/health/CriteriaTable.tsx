import { HelpCircle } from 'lucide-react';
import type { HealthFactorV3 } from '../../healthTypes';
import { Chip } from '../ui';
import { factorStateChip, isExcluded } from './factorState';

function FactorRow({ f }: { f: HealthFactorV3 }) {
  const chip = factorStateChip(f);
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3">
      <span className="w-24 shrink-0 text-sm font-semibold text-stone-900">{f.label}</span>
      <Chip tone={chip.tone}>{chip.label}</Chip>
      <span className="min-w-0 flex-1 truncate text-xs text-stone-500" title={f.reason}>{f.reason}</span>
      <span className="shrink-0 text-sm tabular-nums text-stone-500">
        {isExcluded(f) ? 'Chưa tính' : <><b className="font-bold text-stone-900">{Math.round(f.points)}</b>/{f.weight}</>}
      </span>
    </li>
  );
}

export function CriteriaTable({ factors, onExplain }: { factors?: HealthFactorV3[]; onExplain: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-base font-bold text-stone-900">Tiêu chí</h2>
        <button
          type="button"
          onClick={onExplain}
          className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-stone-500 transition-colors hover:text-[#007700]"
        >
          <HelpCircle size={13} aria-hidden />
          <span>Cách tính điểm</span>
        </button>
      </div>
      {factors?.length ? (
        <ul className="m-0 mt-1 list-none divide-y divide-stone-100 p-0">
          {factors.map(f => <FactorRow key={f.key} f={f} />)}
        </ul>
      ) : (
        <p className="m-0 mt-2 text-sm text-stone-500">Chưa có chi tiết tiêu chí. Lưu lại sản phẩm để tính lại điểm theo 5 tiêu chí.</p>
      )}
    </div>
  );
}
