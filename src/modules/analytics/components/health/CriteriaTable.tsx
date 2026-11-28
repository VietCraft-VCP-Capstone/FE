import { Banknote, FileText, HelpCircle, Image, Star, Tag, type LucideIcon } from 'lucide-react';
import type { HealthFactorKey, HealthFactorV3 } from '../../healthTypes';
import { TIER_COLOR } from './tier';
import { Chip } from '../ui';
import { factorStateChip, isExcluded } from './factorState';

const GROUPS: { title: string; keys: HealthFactorKey[] }[] = [
  { title: 'Phần bạn sửa được ngay', keys: ['image', 'description', 'tags'] },
  { title: 'Uy tín và giá', keys: ['review', 'price'] },
];

const ICON: Record<HealthFactorKey, LucideIcon> = { image: Image, description: FileText, tags: Tag, review: Star, price: Banknote };

function FactorRow({ f }: { f: HealthFactorV3 }) {
  const chip = factorStateChip(f);
  const Icon = ICON[f.key] ?? FileText;
  const excluded = isExcluded(f);
  const share = excluded || !f.weight ? 0 : Math.min(100, (f.points / f.weight) * 100);
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 py-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg" style={{ background: `${TIER_COLOR[chip.tone]}14`, color: TIER_COLOR[chip.tone] }}>
        <Icon size={17} aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-stone-900">{f.label}</span>
          <Chip tone={chip.tone}>{chip.label}</Chip>
        </div>
        <p className="m-0 mt-0.5 truncate text-xs text-stone-500" title={f.reason}>{f.reason}</p>
      </div>
      <div className="w-24 text-right sm:w-32">
        <span className="text-sm tabular-nums text-stone-500">
          {excluded ? 'Chưa tính' : <>Đạt <b className="font-bold text-stone-900">{Math.round(share)}%</b></>}
        </span>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${share}%`, background: TIER_COLOR[chip.tone] }} />
        </div>
      </div>
    </li>
  );
}

export function CriteriaTable({ factors, onExplain }: { factors?: HealthFactorV3[]; onExplain?: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-base font-bold text-stone-900">Tiêu chí</h2>
        {onExplain && (
          <button
            type="button"
            onClick={onExplain}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-stone-500 transition-colors hover:text-[#007700]"
          >
            <HelpCircle size={13} aria-hidden />
            <span>Cách tính điểm</span>
          </button>
        )}
      </div>
      {factors?.length ? (
        GROUPS.map(g => {
          const rows = factors.filter(f => g.keys.includes(f.key));
          return rows.length ? (
            <div key={g.title} className="mt-2">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-stone-400">{g.title}</p>
              <ul className="m-0 list-none divide-y divide-stone-100 p-0">
                {rows.map(f => <FactorRow key={f.key} f={f} />)}
              </ul>
            </div>
          ) : null;
        })
      ) : (
        <p className="m-0 mt-2 text-sm text-stone-500">Chưa có chi tiết tiêu chí. Lưu lại sản phẩm để tính lại điểm theo 5 tiêu chí.</p>
      )}
    </div>
  );
}
