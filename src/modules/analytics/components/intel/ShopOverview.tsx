import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import { Award, AlertTriangle, AlertCircle, CheckCircle2, ChevronRight, Sparkles, Info } from 'lucide-react';
import { scoreText } from '../../format';
import type { HealthRow } from '../../healthTypes';
import type { ShopIssue } from '../health/commonIssues';
import type { TierFilter } from './HealthList';
import { healthTier } from './intelLabels';

export function ShopOverview({
  items,
  issues,
  onFilter,
  activeFilter,
  activeIssue,
  onIssueFilter,
  children,
}: {
  children?: ReactNode;
  items: HealthRow[];
  issues: ShopIssue[];
  onFilter: (t: TierFilter) => void;
  activeFilter?: TierFilter;
  activeIssue?: string;
  onIssueFilter?: (code: string) => void;
}) {
  const scores = items.map(i => i.score).filter((s): s is number => s !== null);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const count = (label: string) => items.filter(i => i.score !== null && healthTier(i.score).label === label).length;
  const avgTier = healthTier(avg);

  const avgBadgeClass =
    avgTier.tone === 'good'
      ? 'bg-[#EAF0E2] text-[#007700] border-[#BECAB6]'
      : avgTier.tone === 'warn'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-rose-50 text-[#BA1A1A] border-rose-200';

  return (
    <div className="space-y-5 pt-1">
      {/* 4 KPI stat cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Average Health Score */}
        <div className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Điểm TB toàn shop
                </span>
                <Tooltip title="Điểm trung bình chất lượng tin đăng của tất cả các sản phẩm trong gian hàng.">
                  <Info size={11} className="text-stone-300 hover:text-stone-600 cursor-help" />
                </Tooltip>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF0E2] text-[#007700]">
                <Award size={14} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="font-jakarta text-3xl font-extrabold tracking-tight tabular-nums text-stone-900">
                {scoreText(avg)}
              </span>
              <span className="text-xs font-semibold text-stone-400">/ 100</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs">
            <span className="text-[11px] text-stone-400">{scores.length} sản phẩm đã chấm</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${avgBadgeClass}`}>
              {avgTier.label}
            </span>
          </div>
        </div>

        {/* Card 2: Good (>=80) */}
        <Tooltip title="Xem danh sách sản phẩm đã đạt chuẩn tốt (từ 80 điểm trở lên)">
          <button
            type="button"
            onClick={() => onFilter(activeFilter === 'Tốt' ? '' : 'Tốt')}
            className={`group flex flex-col justify-between rounded-xl border p-4 text-left shadow-2xs transition-all cursor-pointer ${
              activeFilter === 'Tốt'
                ? 'border-[#007700] ring-2 ring-[#007700]/20 bg-[#EAF0E2]/40'
                : 'border-stone-200 bg-white hover:border-[#BECAB6] hover:bg-[#EAF0E2]/20'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Sản phẩm Tốt (≥80)
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF0E2] text-[#007700]">
                  <CheckCircle2 size={14} />
                </div>
              </div>
              <div className="mt-2.5 font-jakarta text-3xl font-extrabold tracking-tight tabular-nums text-[#007700]">
                {count('Tốt')}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-[11px] text-stone-500 font-medium">
              <span>
                {scores.length ? Math.round((count('Tốt') / scores.length) * 100) : 0}% danh mục shop
              </span>
              <span className="flex items-center gap-0.5 text-xs font-bold text-[#007700] group-hover:translate-x-0.5 transition-transform">
                {activeFilter === 'Tốt' ? 'Đang lọc' : 'Lọc xem'} <ChevronRight size={12} />
              </span>
            </div>
          </button>
        </Tooltip>

        {/* Card 3: Needs Improvement (50-79) */}
        <Tooltip title="Xem danh sách sản phẩm cần bổ sung thêm ảnh, mô tả hoặc từ khoá (50 - 79 điểm)">
          <button
            type="button"
            onClick={() => onFilter(activeFilter === 'Cần cải thiện' ? '' : 'Cần cải thiện')}
            className={`group flex flex-col justify-between rounded-xl border p-4 text-left shadow-2xs transition-all cursor-pointer ${
              activeFilter === 'Cần cải thiện'
                ? 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/50'
                : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/30'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Cần cải thiện (50-79)
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <AlertCircle size={14} />
                </div>
              </div>
              <div className="mt-2.5 font-jakarta text-3xl font-extrabold tracking-tight tabular-nums text-amber-700">
                {count('Cần cải thiện')}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-[11px] text-stone-500 font-medium">
              <span>
                {scores.length ? Math.round((count('Cần cải thiện') / scores.length) * 100) : 0}% danh mục shop
              </span>
              <span className="flex items-center gap-0.5 text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                {activeFilter === 'Cần cải thiện' ? 'Đang lọc' : 'Lọc xem'} <ChevronRight size={12} />
              </span>
            </div>
          </button>
        </Tooltip>

        {/* Card 4: Needs Attention (<50) */}
        <Tooltip title="Xem danh sách sản phẩm còn thiếu nhiều thông tin quan trọng (dưới 50 điểm)">
          <button
            type="button"
            onClick={() => onFilter(activeFilter === 'Cần chú ý' ? '' : 'Cần chú ý')}
            className={`group flex flex-col justify-between rounded-xl border p-4 text-left shadow-2xs transition-all cursor-pointer ${
              activeFilter === 'Cần chú ý'
                ? 'border-[#BA1A1A] ring-2 ring-[#BA1A1A]/20 bg-rose-50/50'
                : 'border-stone-200 bg-white hover:border-rose-300 hover:bg-rose-50/30'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Cần chú ý (&lt;50)
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-[#BA1A1A]">
                  <AlertTriangle size={14} />
                </div>
              </div>
              <div className="mt-2.5 font-jakarta text-3xl font-extrabold tracking-tight tabular-nums text-[#BA1A1A]">
                {count('Cần chú ý')}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 text-[11px] text-stone-500 font-medium">
              <span>Cần ưu tiên xử lý</span>
              <span className="flex items-center gap-0.5 text-xs font-bold text-[#BA1A1A] group-hover:translate-x-0.5 transition-transform">
                {activeFilter === 'Cần chú ý' ? 'Đang lọc' : 'Lọc xem'} <ChevronRight size={12} />
              </span>
            </div>
          </button>
        </Tooltip>
      </div>

      {/* Shop-wide common issues */}
      {issues.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-[#FBFBFA] p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#007700]" />
              <h3 className="m-0 font-jakarta text-xs font-bold text-stone-900">
                Gợi ý tối ưu chung cho nhiều sản phẩm
              </h3>
              <Tooltip title="Các vấn đề xuất hiện trên nhiều sản phẩm cùng lúc. Bấm vào từng gợi ý để lọc danh sách sản phẩm cần sửa bên dưới.">
                <Info size={11} className="text-stone-300 hover:text-stone-600 cursor-help" />
              </Tooltip>
            </div>
            {activeIssue && onIssueFilter && (
              <button
                type="button"
                onClick={() => onIssueFilter('')}
                className="text-[11px] font-semibold text-[#007700] hover:text-[#005B00] cursor-pointer underline"
              >
                Xoá lọc theo gợi ý
              </button>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map(issue => {
              const isActive = activeIssue === issue.code;
              return (
                <button
                  type="button"
                  key={issue.code}
                  onClick={() => onIssueFilter?.(isActive ? '' : issue.code)}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left shadow-2xs transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#007700] ring-2 ring-[#007700]/20 bg-[#EAF0E2]/40'
                      : 'border-stone-200 bg-white hover:border-[#BECAB6] hover:bg-[#EAF0E2]/20'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 border ${
                      isActive
                        ? 'bg-[#007700] text-white border-[#007700]'
                        : 'bg-[#EAF0E2] text-[#007700] border-[#BECAB6]'
                    }`}
                  >
                    {issue.count} sp
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-stone-800 leading-snug font-medium block">
                      {issue.message}
                    </span>
                    <span className={`text-[10px] mt-0.5 block ${isActive ? 'text-[#007700] font-semibold' : 'text-stone-400'}`}>
                      {isActive ? '✓ Đang lọc theo mục này' : 'Bấm để lọc xem sản phẩm'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
