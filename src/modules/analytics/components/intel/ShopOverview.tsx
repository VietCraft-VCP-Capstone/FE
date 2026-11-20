import { AlertCircle, ChevronRight, DollarSign, FileText, Image, Layers, Star, Tag, type LucideIcon } from 'lucide-react';
import { scoreText } from '../../format';
import type { HealthRow } from '../../healthTypes';
import { URGENT, type ShopIssue } from '../health/commonIssues';
import { TIERS, TIER_INFO, inTier, tierOf, type Tier, type TierFilter } from './HealthList';
import { TIER_COLOR } from './intelLabels';
import { SCORE_MEANING } from '../health/factorState';
import { InfoTip } from '../ui';

const ISSUE_ICONS: Record<string, LucideIcon> = {
  [URGENT]: AlertCircle,
  tags: Tag,
  review: Star,
  image: Image,
  description: FileText,
  material: Layers,
  price: DollarSign,
};

const HINT: Record<Tier, string> = {
  good: 'từ 80 điểm',
  needs_improvement: 'từ 50 đến 79 điểm',
  poor: 'dưới 50 điểm',
  blocked: 'có lỗi phải sửa ngay',
};

const CRITERIA: [string, string][] = [
  ['Ảnh', 'số ảnh hữu ích so với mức phổ biến trong danh mục'],
  ['Mô tả', 'đủ dài, có kích thước và chất liệu, không chép lại tên'],
  ['Từ khoá và tag', 'có tag đã duyệt và phủ các từ khách tìm'],
  ['Đánh giá', 'tỉ lệ đánh giá tốt của khách'],
  ['Giá', 'so với sản phẩm cùng loại'],
];

const SCORE_HELP = (
  <div className="space-y-1.5">
    <p className="m-0"><b>Điểm = 5 tiêu chí, mỗi tiêu chí có trọng số riêng</b> (tổng 100, xem ở từng sản phẩm):</p>
    <ul className="m-0 list-disc space-y-0.5 pl-4">
      {CRITERIA.map(([name, rule]) => <li key={name}><b>{name}</b>: {rule}</li>)}
    </ul>
    <p className="m-0">Chưa điền một tiêu chí thì được 0 điểm. Chưa có đánh giá, không áp dụng hoặc chưa đánh giá được thì không tính: điểm quy về thang 100 trên các tiêu chí còn lại, hiện "Đánh giá x/5 tiêu chí".</p>
    <p className="m-0">Tốt từ 80 điểm · Cần cải thiện 50–79 · Kém dưới 50. Bị chặn bán là lỗi phải sửa ngay, được đếm riêng.</p>
    <p className="m-0 text-stone-500">{SCORE_MEANING}</p>
  </div>
);

function headline(rated: number, good: number): string {
  if (rated === 0) return 'Chưa chấm được sản phẩm nào';
  if (good === rated) return `Cả ${rated} sản phẩm đều Tốt`;
  return `${rated - good}/${rated} sản phẩm chưa đạt mức Tốt`;
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
  const countOf = (level: Tier) => items.filter(i => inTier(i, level)).length;
  const rated = items.filter(i => tierOf(i) !== null).length;

  return (
    <section className="grid grid-cols-1 gap-6 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6 lg:grid-cols-10">
      <div className="space-y-4 lg:col-span-7">
        <div>
          <h2 className="m-0 flex flex-wrap items-center gap-2 font-jakarta text-2xl font-extrabold leading-tight tracking-tight text-stone-900">
            {headline(rated, countOf('good'))}
            <InfoTip text={SCORE_HELP} label="Cách tính độ hoàn thiện trang sản phẩm" wide />
          </h2>
          <p className="m-0 mt-1 text-sm text-stone-600">
            Độ hoàn thiện trung bình của các trang sản phẩm trong shop <b className="tabular-nums text-stone-900">{scoreText(avg)}/100</b>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Lọc theo mức điểm">
          {TIERS.map(level => {
            const active = activeFilter === level;
            const { label, tone } = TIER_INFO[level];
            return (
              <button
                key={level}
                type="button"
                aria-pressed={active}
                onClick={() => onFilter(active ? '' : level)}
                className={`cursor-pointer rounded-xl border p-2.5 text-left transition ${
                  active ? 'border-[#007700] bg-emerald-50/70 ring-1 ring-[#007700]' : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TIER_COLOR[tone] }} />
                  <span className="truncate text-xs font-semibold text-stone-700">{label}</span>
                </div>
                <div className="mt-1 text-lg font-extrabold tabular-nums text-stone-900">{countOf(level)}</div>
                <div className="text-[11px] text-stone-500">{HINT[level]}</div>
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
