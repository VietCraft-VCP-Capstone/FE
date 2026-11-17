import { AlertCircle, ChevronRight, DollarSign, FileText, Image, Layers, Star, Tag, type LucideIcon } from 'lucide-react';
import { scoreText } from '../../format';
import type { HealthRow } from '../../healthTypes';
import { URGENT, type ShopIssue } from '../health/commonIssues';
import { TIERS, type TierFilter } from './HealthList';
import { healthTier, TIER_COLOR } from './intelLabels';

const ISSUE_ICONS: Record<string, LucideIcon> = {
  [URGENT]: AlertCircle,
  tags: Tag,
  review: Star,
  image: Image,
  description: FileText,
  material: Layers,
  price: DollarSign,
};

const DOT: Record<string, string> = { 'Tốt': TIER_COLOR.good, 'Cần cải thiện': TIER_COLOR.warn, 'Yếu': TIER_COLOR.bad };

const RANGE: Record<string, string> ={ 'Tốt': 'từ 80', 'Cần cải thiện': '50 đến 79', 'Yếu': 'dưới 50' };

function headline(scored: number, weak: number): string {
  if (scored === 0) return 'Chưa chấm được sản phẩm nào';
  if (weak === 0) return `Cả ${scored} sản phẩm đều từ 80 điểm`;
  return `${weak}/${scored} sản phẩm chưa đạt 80 điểm`;
}

export function ShopOverview({
  items,
  issues,
  onFilter,
  activeFilter,
  activeIssue,
  onIssueFilter,
}: {
  items: HealthRow[];
  issues: ShopIssue[];
  onFilter: (t: TierFilter) => void;
  activeFilter?: TierFilter;
  activeIssue?: string;
  onIssueFilter?: (code: string) => void;
}) {
  const scores = items.map(i => i.score).filter((s): s is number => s !== null);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const countOf = (label: string) => scores.filter(s => healthTier(s).label === label).length;
  const weak = scores.length - countOf('Tốt');

  return (
    <section className="grid grid-cols-1 gap-6 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6 lg:grid-cols-10">
      <div className="space-y-4 lg:col-span-7">
        <div>
          <h2 className="m-0 font-jakarta text-2xl font-extrabold leading-tight tracking-tight text-stone-900">
            {headline(scores.length, weak)}
          </h2>
          <p className="m-0 mt-1 text-sm text-stone-600">
            Điểm trung bình của shop là <b className="tabular-nums text-stone-900">{scoreText(avg)}/100</b>.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Lọc theo mức điểm">
          {[...TIERS].reverse().map(label => {
            const active = activeFilter === label;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => onFilter(active ? '' : label)}
                className={`cursor-pointer rounded-xl border p-2.5 text-left transition ${
                  active ? 'border-[#007700] bg-emerald-50/70 ring-1 ring-[#007700]' : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: DOT[label] }} />
                  <span className="truncate text-xs font-semibold text-stone-700">{label}</span>
                </div>
                <div className="mt-1 text-lg font-extrabold tabular-nums text-stone-900">{countOf(label)}</div>
                <div className="text-[11px] text-stone-500">{RANGE[label]} điểm</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-3 lg:border-l lg:border-stone-100 lg:pl-6">
        <h3 className="m-0 text-sm font-bold text-stone-900">Nên làm trước</h3>
        {issues.length === 0 ? (
          <p className="m-0 mt-3 text-sm text-stone-500">Không còn việc nào chung cho cả shop.</p>
        ) : (
          <ul className="m-0 mt-3 list-none space-y-2 p-0">
            {issues.map(issue => {
              const active = activeIssue === issue.code;
              const urgent = issue.code === URGENT;
              const Icon = ISSUE_ICONS[issue.code] ?? Tag;
              return (
                <li key={issue.code}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onIssueFilter?.(active ? '' : issue.code)}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition ${
                      active
                        ? 'border-[#007700] bg-emerald-50/70 ring-1 ring-[#007700]'
                        : urgent
                          ? 'border-rose-200 bg-rose-50/60 hover:bg-rose-50'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <Icon size={16} className={`shrink-0 ${urgent ? 'text-rose-600' : 'text-stone-500'}`} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold leading-snug text-stone-900">{issue.message}</span>
                      <span className="mt-0.5 block text-xs tabular-nums text-stone-600">
                        {issue.count} sản phẩm
                        {issue.gain !== null && <b className="ml-2 font-bold text-[#007700]">+{issue.gain}đ mỗi sản phẩm</b>}
                      </span>
                    </span>
                    <ChevronRight size={14} className="shrink-0 text-stone-400" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
