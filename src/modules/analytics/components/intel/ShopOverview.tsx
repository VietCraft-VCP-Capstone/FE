import type { ReactNode } from 'react';
import { Tag } from 'antd';
import { Award, AlertTriangle, AlertCircle, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { scoreText } from '../../format';
import type { HealthRow } from '../../healthTypes';
import type { ShopIssue } from '../health/commonIssues';
import type { TierFilter } from './HealthList';
import { healthTier } from './intelLabels';

export function ShopOverview({
  items,
  issues,
  onFilter,
  children,
}: {
  children?: ReactNode;
  items: HealthRow[];
  issues: ShopIssue[];
  onFilter: (t: TierFilter) => void;
}) {
  const scores = items.map(i => i.score).filter((s): s is number => s !== null);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const count = (label: string) => items.filter(i => i.score !== null && healthTier(i.score).label === label).length;
  const avgTier = healthTier(avg);

  return (
    <div className="space-y-6 pt-1">
      {/* 4 KPI stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Average Health Score */}
        <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-gradient-to-br from-white via-white to-stone-50/70 p-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Điểm TB toàn shop
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-[#007700]">
                <Award size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-jakarta text-4xl font-extrabold tracking-tight tabular-nums text-stone-900">
                {scoreText(avg)}
              </span>
              <span className="text-sm font-semibold text-stone-400">/ 100</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
            <span className="text-stone-500">{scores.length} sản phẩm đã chấm</span>
            <Tag color={avgTier.tone === 'good' ? 'green' : avgTier.tone === 'warn' ? 'orange' : 'red'} className="!m-0 font-bold">
              {avgTier.label}
            </Tag>
          </div>
        </div>

        {/* Card 2: Good (>=80) */}
        <button
          type="button"
          onClick={() => onFilter('Tốt')}
          className="group flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-5 text-left shadow-xs transition-all hover:border-emerald-300 hover:bg-emerald-50/60 hover:shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Sản phẩm Tốt (≥80)
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-[#007700]">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-3 font-jakarta text-4xl font-extrabold tracking-tight tabular-nums text-[#007700]">
              {count('Tốt')}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-emerald-100/80 pt-3 text-xs text-emerald-800 font-medium">
            <span>
              {scores.length ? Math.round((count('Tốt') / scores.length) * 100) : 0}% danh mục shop
            </span>
            <span className="flex items-center gap-0.5 text-xs font-bold group-hover:translate-x-0.5 transition-transform">
              Xem <ChevronRight size={13} />
            </span>
          </div>
        </button>

        {/* Card 3: Needs Improvement (50-79) */}
        <button
          type="button"
          onClick={() => onFilter('Cần cải thiện')}
          className="group flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-amber-50/30 p-5 text-left shadow-xs transition-all hover:border-amber-300 hover:bg-amber-50/60 hover:shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Cần cải thiện (50-79)
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="mt-3 font-jakarta text-4xl font-extrabold tracking-tight tabular-nums text-amber-700">
              {count('Cần cải thiện')}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-amber-100/80 pt-3 text-xs text-amber-800 font-medium">
            <span>
              {scores.length ? Math.round((count('Cần cải thiện') / scores.length) * 100) : 0}% danh mục shop
            </span>
            <span className="flex items-center gap-0.5 text-xs font-bold group-hover:translate-x-0.5 transition-transform">
              Xem <ChevronRight size={13} />
            </span>
          </div>
        </button>

        {/* Card 4: Poor (<50) */}
        <button
          type="button"
          onClick={() => onFilter('Kém')}
          className="group flex flex-col justify-between rounded-2xl border border-rose-200/80 bg-rose-50/30 p-5 text-left shadow-xs transition-all hover:border-rose-300 hover:bg-rose-50/60 hover:shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Kém (&lt;50 điểm)
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="mt-3 font-jakarta text-4xl font-extrabold tracking-tight tabular-nums text-rose-700">
              {count('Kém')}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-rose-100/80 pt-3 text-xs text-rose-800 font-medium">
            <span>Cần ưu tiên xử lý trước</span>
            <span className="flex items-center gap-0.5 text-xs font-bold group-hover:translate-x-0.5 transition-transform">
              Xem <ChevronRight size={13} />
            </span>
          </div>
        </button>
      </div>

      {/* Shop-wide common issues */}
      {issues.length > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Sparkles size={15} />
            </div>
            <h3 className="m-0 font-jakarta text-sm font-bold text-amber-950">
              Việc nên ưu tiên làm hàng loạt cho cả shop
            </h3>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map(issue => (
              <div
                key={issue.code}
                className="flex items-start gap-2.5 rounded-xl border border-amber-200/60 bg-white p-3 shadow-2xs"
              >
                <Tag color="orange" className="!m-0 font-bold shrink-0">
                  {issue.count} sản phẩm
                </Tag>
                <span className="text-xs font-medium text-stone-800 leading-snug">
                  {issue.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
