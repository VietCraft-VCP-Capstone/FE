import { CheckCircle2, Store } from 'lucide-react';
import type { SeasonalCampaign } from '../../types';
import { Chip } from '../ui';
import { getCampaignLucideIcon } from './SeasonalMonthMatrix';

export const CATEGORY_OPTIONS = [
  { value: 'thoi-trang', label: 'Thời trang & May mặc' },
  { value: 'gia-dung', label: 'Gia dụng & Đồ uống' },
  { value: 'phu-kien', label: 'Phụ kiện & Túi' },
  { value: 'trang-tri', label: 'Trang trí nhà cửa' },
];

interface SeasonalHeaderProps {
  shopName?: string;
  categoryName?: string;
  categorySlug: string;
  onSelectCategory: (slug: string) => void;
  activeCamp?: SeasonalCampaign;
  savedIdeasCount: number;
}

export function SeasonalHeader({
  shopName,
  categoryName,
  categorySlug,
  onSelectCategory,
  activeCamp,
  savedIdeasCount,
}: SeasonalHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Thanh thông tin gian hàng & Bộ lọc ngành hàng */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E2] text-[#007700]">
            <Store className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-stone-900">
                Gian hàng: {shopName || 'SNOWKAT Official'}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                <CheckCircle2 className="h-3 w-3" /> Chính thức
              </span>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              Ngành hàng trọng tâm: {categoryName || 'Thời trang Nữ & Set may mặc'} · Kết hợp xu hướng tìm kiếm và doanh số thực tế
            </p>
          </div>
        </div>

        {/* Dropdown chọn ngành hàng */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            aria-label="Chọn ngành hàng"
            value={categorySlug}
            onChange={e => onSelectCategory(e.target.value)}
            className="cursor-pointer rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-stone-800 transition hover:border-[#007700] focus:border-[#007700] focus:outline-none shadow-sm"
          >
            {CATEGORY_OPTIONS.map(c => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Header chiến dịch đang chọn */}
      {activeCamp && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E2] text-[#007700]">
              {getCampaignLucideIcon(activeCamp.id)}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="m-0 text-base font-bold text-stone-900">{activeCamp.name}</h3>
                {activeCamp.badge && (
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
                    {activeCamp.badge}
                  </span>
                )}
                {activeCamp.timing && (
                  <Chip tone={activeCamp.timing.badge_tone}>
                    {activeCamp.timing.label}
                  </Chip>
                )}
              </div>
              <p className="mb-0 mt-0.5 text-xs text-stone-500 leading-relaxed">
                {activeCamp.description || 'Lên kế hoạch sản xuất, đón đầu sức mua mùa vụ lớn.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-500">
              Đã gom: <strong className="text-stone-800">{savedIdeasCount} ý tưởng</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
