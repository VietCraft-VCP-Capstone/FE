import { useState, useEffect } from 'react';
import { Tooltip } from 'antd';
import {
  Check,
  Image,
  FileText,
  Tag,
  Layers,
  Star,
  DollarSign,
  HelpCircle,
  BarChart2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { scoreText, vnd } from '../../format';
import type { HealthFactor, ListingHealth } from '../../healthTypes';
import { earned } from './ScoreHero';

const LABEL: Record<string, { name: string; icon: any; color: string; bg: string }> = {
  price: { name: 'Định vị giá', icon: DollarSign, color: 'text-stone-700', bg: 'bg-stone-100' },
  image: { name: 'Ảnh sản phẩm', icon: Image, color: 'text-sky-700', bg: 'bg-sky-50' },
  description: { name: 'Mô tả chi tiết', icon: FileText, color: 'text-purple-700', bg: 'bg-purple-50' },
  tags: { name: 'Thẻ từ khóa', icon: Tag, color: 'text-amber-700', bg: 'bg-amber-50' },
  material: { name: 'Chất liệu chế tác', icon: Layers, color: 'text-teal-700', bg: 'bg-teal-50' },
  review: { name: 'Đánh giá người mua', icon: Star, color: 'text-yellow-700', bg: 'bg-yellow-50' },
};

const ORIGIN = 'Tiêu chuẩn chất lượng TMĐT: tối thiểu 5 ảnh, mô tả từ 115 từ, đủ từ khóa phân loại và chất liệu. Giá được đối soát tự động với sản phẩm cùng loại trên sàn.';

function metricText(r: HealthFactor): string {
  const v = r.value ?? 0;
  if (r.key === 'price') return r.value ? vnd(r.value) : 'Chưa có giá';
  if (r.key === 'image') return `${v}/${r.target} ảnh chụp`;
  if (r.key === 'description') return `${v} từ (chuẩn ≥ ${r.target})`;
  if (r.key === 'tags') return `${v}/${r.target} thẻ tag`;
  if (r.key === 'material') return v ? 'Đã khai báo rõ' : 'Chưa khai báo';
  return v ? `${r.n_good ?? 0}/${v} đánh giá tốt` : 'Chưa có đánh giá';
}

function Row({ r, index, animateWidth }: { r: HealthFactor; index: number; animateWidth: boolean }) {
  const off = r.scored === false;
  const targetPct = off ? 100 : Math.min(100, r.sub_score ?? 0);
  const pct = animateWidth ? targetPct : 0;
  const meta = LABEL[r.key] ?? { name: r.key, icon: Layers, color: 'text-stone-700', bg: 'bg-stone-50' };
  const Icon = meta.icon;

  return (
    <li
      className="list-none py-2.5 px-3 transition-all duration-200 hover:bg-stone-50/80 hover:-translate-y-px rounded-xl animate-cascade"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Col 1: Icon & Criterion Name (40% width on desktop) */}
        <div className="flex items-center gap-3 sm:w-5/12 min-w-0">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.color} transition-transform duration-200 group-hover:scale-105`}>
            <Icon size={15} />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs text-stone-900 block truncate">{meta.name}</span>
            <span className="text-[11px] text-stone-500 font-medium tabular-nums sm:hidden block mt-0.5">
              {metricText(r)}
            </span>
          </div>
        </div>

        {/* Col 2: Current Actual Metric (Desktop only - 25% width) */}
        <div className="hidden sm:block sm:w-3/12 min-w-0 text-left">
          <span className="text-xs text-stone-600 font-medium tabular-nums">
            {metricText(r)}
          </span>
        </div>

        {/* Col 3: Compact Progress Mini-Track & Points (20% width) */}
        <div className="flex items-center gap-2 sm:w-2/12 sm:justify-end shrink-0">
          {off ? (
            <span className="text-[11px] font-semibold text-stone-400">
              Bảo lưu
            </span>
          ) : (
            <>
              {/* Compact 48px micro-track */}
              <div className="h-1.5 w-12 rounded-full bg-stone-100 overflow-hidden shrink-0">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(pct, 4)}%`,
                    background: targetPct >= 100 ? '#007700' : targetPct > 0 ? '#d97706' : '#e11d48',
                  }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums text-stone-800">
                {Math.round(r.points)}<span className="text-[10px] text-stone-400 font-normal">/{r.weight}đ</span>
              </span>
            </>
          )}
        </div>

        {/* Col 4: Status Pill (15% width - right aligned) */}
        <div className="flex sm:w-2/12 justify-end shrink-0">
          {off ? (
            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600 border border-stone-200/60 inline-flex items-center gap-1 transition-transform duration-150 hover:scale-102">
              <Clock size={10} /> Chờ gom mẫu
            </span>
          ) : targetPct >= 100 ? (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/70 inline-flex items-center gap-1 transition-transform duration-150 hover:scale-102">
              <Check size={10} /> Đạt chuẩn
            </span>
          ) : targetPct > 0 ? (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/70 inline-flex items-center gap-1 transition-transform duration-150 hover:scale-102">
              Cần bổ sung
            </span>
          ) : (
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200/70 inline-flex items-center gap-1 transition-transform duration-150 hover:scale-102">
              <AlertCircle size={10} /> Chưa đạt
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

export function CriteriaTable({ data }: { data: ListingHealth }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const rows = [...data.breakdown].sort((a, b) => b.weight - a.weight);
  const { points, of } = earned(data);
  const raw = data.cap?.raw ?? data.score;

  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-[#007700]" />
          <h2 className="m-0 text-base font-bold text-stone-900">Tiêu chuẩn chất lượng tin đăng</h2>
          <Tooltip title={ORIGIN} placement="top">
            <span className="cursor-help inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-stone-700">
              <HelpCircle size={12} />
            </span>
          </Tooltip>
        </div>
        <span className="text-xs font-semibold text-stone-500 tabular-nums">
          Thang điểm 100đ
        </span>
      </div>

      {/* Table Column Labels (Desktop) */}
      <div className="hidden sm:flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3 pb-1 border-b border-stone-100">
        <span className="w-5/12">Tiêu chuẩn đánh giá</span>
        <span className="w-3/12">Hiện trạng</span>
        <span className="w-2/12 text-right">Mức đạt &amp; Điểm</span>
        <span className="w-2/12 text-right">Trạng thái</span>
      </div>

      {/* Rows */}
      <ul className="m-0 list-none divide-y divide-stone-100 p-0 border border-stone-100 rounded-2xl bg-stone-50/20">
        {rows.map((r, i) => <Row key={r.key} r={r} index={i} animateWidth={mounted} />)}
      </ul>

      {/* Footer Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-stone-600">
        <div className="flex items-center gap-1.5">
          <span>Tổng điểm nội dung:</span>
          <b className="text-stone-900 font-bold tabular-nums">{Math.round(points)}/{of}đ</b>
          {of < 100 && (
            <span className="text-stone-500 ml-1">
              → Quy đổi chuẩn sàn: <b className="text-[#007700] font-black">{scoreText(raw)}/100</b>
            </span>
          )}
        </div>
        {data.cap && (
          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200/70 inline-flex items-center gap-1">
            <AlertCircle size={11} /> Tạm khóa tối đa {Math.floor(data.cap.score)}đ do có lỗi cần sửa gấp
          </span>
        )}
      </div>
    </div>
  );
}
