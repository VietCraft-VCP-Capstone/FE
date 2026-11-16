import { CheckCircle2, AlertTriangle, Tag, Star, Image, FileText, Layers, DollarSign, Sparkles } from 'lucide-react';
import { scoreText } from '../../format';
import type { HealthRow } from '../../healthTypes';
import type { ShopIssue } from '../health/commonIssues';
import { type TierFilter } from './HealthList';
import { healthTier } from './intelLabels';

const ISSUE_ICONS: Record<string, any> = {
  tags: Tag,
  review: Star,
  image: Image,
  description: FileText,
  material: Layers,
  price: DollarSign,
};

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
  const avgTier = healthTier(avg);
  const total = Math.max(1, scores.length);
  const urgentCount = items.filter(i => i.urgent).length;

  const goodCount = items.filter(i => i.score !== null && i.score >= 80).length;
  const warnCount = items.filter(i => i.score !== null && i.score >= 50 && i.score < 80).length;
  const badCount = items.filter(i => i.score !== null && i.score < 50).length;

  const goodPct = Math.round((goodCount / total) * 100);
  const warnPct = Math.round((warnCount / total) * 100);
  const badPct = Math.max(0, 100 - goodPct - warnPct);

  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">
        {/* Left Column: Overall Score & Quality Distribution */}
        <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-gradient-to-b from-stone-50/50 via-white to-white">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#007700]" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Điểm tối ưu trung bình
                </span>
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 border border-stone-200/60">
                {scores.length} sản phẩm
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-sans text-4xl sm:text-5xl font-black tracking-tight text-stone-900 tabular-nums">
                {scoreText(avg)}
              </span>
              <span className="text-base font-bold text-stone-400">/100</span>

              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                    avgTier.tone === 'good'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : avgTier.tone === 'warn'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {avgTier.tone === 'good' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  <span>{avgTier.label}</span>
                </span>
                {urgentCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200/80">
                    {urgentCount} cần sửa gấp
                  </span>
                )}
              </div>
            </div>

            <p className="m-0 text-xs text-stone-500 leading-relaxed">
              Điểm đo lường mức độ hoàn thiện về ảnh chụp, tiêu đề, mô tả, từ khóa và định vị giá bán trên toàn bộ sản phẩm đang đăng bán.
            </p>
          </div>

          {/* Integrated Proportional Segmented Track & Quick Filters */}
          <div className="space-y-2.5 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-stone-700">Phân loại theo mức điểm:</span>
              {activeFilter && (
                <button
                  type="button"
                  onClick={() => onFilter('')}
                  className="text-[#007700] hover:underline font-semibold cursor-pointer"
                >
                  Xóa lọc ({activeFilter})
                </button>
              )}
            </div>

            <div className="h-2 w-full rounded-full bg-stone-100 flex overflow-hidden p-0.5 gap-0.5">
              {goodCount > 0 && (
                <div
                  className="h-full rounded-full bg-[#007700] transition-all duration-300"
                  style={{ width: `${goodPct}%` }}
                  title={`Tốt: ${goodCount} sp (${goodPct}%)`}
                />
              )}
              {warnCount > 0 && (
                <div
                  className="h-full rounded-full bg-[#d97706] transition-all duration-300"
                  style={{ width: `${warnPct}%` }}
                  title={`Cần cải thiện: ${warnCount} sp (${warnPct}%)`}
                />
              )}
              {badCount > 0 && (
                <div
                  className="h-full rounded-full bg-[#e11d48] transition-all duration-300"
                  style={{ width: `${badPct}%` }}
                  title={`Cần chú ý: ${badCount} sp (${badPct}%)`}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: 'Tốt', range: '≥ 80đ', count: goodCount, pct: goodPct, color: '#007700', bg: 'hover:border-emerald-300' },
                { label: 'Cần cải thiện', range: '50–79đ', count: warnCount, pct: warnPct, color: '#d97706', bg: 'hover:border-amber-300' },
                { label: 'Cần chú ý', range: '< 50đ', count: badCount, pct: badPct, color: '#e11d48', bg: 'hover:border-rose-300' },
              ].map(tier => {
                const active = activeFilter === tier.label;
                return (
                  <button
                    key={tier.label}
                    type="button"
                    onClick={() => onFilter(active ? '' : (tier.label as TierFilter))}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      active
                        ? 'border-[#007700] bg-emerald-50/70 ring-1 ring-[#007700]'
                        : `border-stone-200/70 bg-stone-50/40 ${tier.bg} hover:bg-white`
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: tier.color }} />
                      <span className="text-[11px] font-bold text-stone-800 truncate">{tier.label}</span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between w-full">
                      <span className="text-xs font-black text-stone-900 tabular-nums">{tier.count} sp</span>
                      <span className="text-[10px] text-stone-400 tabular-nums">{tier.pct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Broad Actionable Optimizations */}
        <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="m-0 text-sm font-bold text-stone-900">
                  Tiêu chuẩn cần khắc phục chung
                </h3>
                <p className="m-0 mt-0.5 text-xs text-stone-500">
                  Bấm để lọc xem riêng các sản phẩm đang thiếu từng tiêu chí ở bảng bên dưới
                </p>
              </div>
              {activeIssue && (
                <button
                  type="button"
                  onClick={() => onIssueFilter?.('')}
                  className="text-xs font-semibold text-[#007700] hover:underline cursor-pointer"
                >
                  Bỏ lọc · Hiện tất cả {scores.length} sản phẩm
                </button>
              )}
            </div>

            {issues.length === 0 ? (
              <div className="py-10 text-center text-xs text-stone-400">
                Không còn tiêu chuẩn chung nào cần xử lý. Toàn bộ sản phẩm đã đạt chuẩn!
              </div>
            ) : (
              <div className="space-y-2.5 pt-2">
                {issues.map(issue => {
                  const active = activeIssue === issue.code;
                  const Icon = ISSUE_ICONS[issue.code] ?? Sparkles;
                  const pct = Math.round((issue.count / total) * 100);
                  return (
                    <div
                      key={issue.code}
                      onClick={() => onIssueFilter?.(active ? '' : issue.code)}
                      className={`group flex items-center justify-between gap-3 p-3 rounded-xl border transition cursor-pointer ${
                        active
                          ? 'border-[#007700] bg-emerald-50/70 ring-1 ring-[#007700]'
                          : 'border-stone-200/70 bg-stone-50/40 hover:bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-700 group-hover:bg-emerald-50 group-hover:text-[#007700] transition-colors">
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-stone-900 truncate">
                            {issue.message}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                            <span className="font-semibold text-stone-700">{issue.count}/{scores.length} sản phẩm</span>
                            <span>·</span>
                            <span>Chiếm {pct}% gian hàng</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-lg transition inline-flex items-center gap-1 ${
                            active
                              ? 'bg-[#007700] text-white shadow-2xs'
                              : 'bg-stone-100 text-stone-700 group-hover:bg-[#007700] group-hover:text-white'
                          }`}
                        >
                          {active ? `Đang xem (${issue.count} sp)` : `Xem ${issue.count} sản phẩm`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-400 flex items-center justify-between">
            <span>Bấm vào một mục để lọc danh sách sản phẩm cần sửa tương ứng ở bảng bên dưới.</span>
          </div>
        </div>
      </div>
    </div>
  );
}