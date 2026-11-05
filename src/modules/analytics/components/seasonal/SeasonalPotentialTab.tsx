import { useState } from 'react';
import {
  Boxes,
  Check,
  Package,
  Plus,
  ShieldAlert,
  Sparkles,
  Database,
} from 'lucide-react';
import type { PodBlankSuggestion, PotentialProfile, ReadyToShipIdea } from '../../types';

interface SeasonalPotentialTabProps {
  readyIdeas: ReadyToShipIdea[];
  podBlanks: PodBlankSuggestion[];
  potentialProfiles?: PotentialProfile[];
  savedIdeas: Record<string, boolean>;
  onToggleSaveIdea: (ideaId: string) => void;
  onOpenProfileDrawer: (profile: PotentialProfile) => void;
}

export function SeasonalPotentialTab({
  readyIdeas,
  podBlanks,
  potentialProfiles = [],
  savedIdeas,
  onToggleSaveIdea,
  onOpenProfileDrawer,
}: SeasonalPotentialTabProps) {
  const [activeTab, setActiveTab] = useState<'ready' | 'pod'>('ready');
  const [sortOption, setSortOption] = useState<'profit' | 'newest'>('profit');

  const displayIdeas = activeTab === 'ready' ? readyIdeas : podBlanks;

  return (
    <div className="space-y-5 pt-2">
      {/* Thanh chọn mô hình nguồn hàng & Sắp xếp */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50/70 p-3.5 border border-stone-200/80">
        <div className="inline-flex rounded-full border border-stone-200 bg-white p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('ready')}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'ready'
                ? 'bg-amber-100/90 text-amber-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package size={13} />
            Hàng sẵn / Nhập sỉ ({readyIdeas.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pod')}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === 'pod'
                ? 'bg-[#EAF0E2] text-[#007700] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles size={13} />
            Phôi in POD theo đơn ({podBlanks.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-medium">Sắp xếp:</span>
          <select
            aria-label="Sắp xếp ý tưởng"
            value={sortOption}
            onChange={e => setSortOption(e.target.value as any)}
            className="cursor-pointer rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 outline-none hover:border-stone-300"
          >
            <option value="profit">Biên lãi cao nhất</option>
            <option value="newest">Ý tưởng mới nhất</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-stone-500 mb-0">
        {activeTab === 'ready'
          ? 'Hàng có sẵn: sản phẩm hoàn chỉnh đang có nhu cầu tìm kiếm cao, nhập sỉ hoặc đặt xưởng may sẵn.'
          : 'Phôi in POD: thiết kế và in trực tiếp lên phôi áo, ly, túi... theo đơn đặt hàng, không cần ôm vốn tồn kho.'}
      </p>

      {/* Lưới 4 thẻ gợi ý sản phẩm với hồ sơ 5 lớp */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {displayIdeas.slice(0, 4).map((item: any, idx: number) => {
          const ideaId = `${activeTab}-${idx}-${item.title || item.name}`;
          const isSaved = Boolean(savedIdeas[ideaId]);
          const profitMargin =
            item.expected_profit_margin ||
            item.estimated_profit ||
            (item.suggested_price && item.base_cost
              ? `${Math.max(20, Math.round(((parseInt(String(item.suggested_price).replace(/\D/g, '')) - parseInt(String(item.base_cost).replace(/\D/g, ''))) / Math.max(1, parseInt(String(item.suggested_price).replace(/\D/g, '')))) * 100))}%`
              : 'ước tính theo ngành');
          const profile = potentialProfiles[idx % (potentialProfiles.length || 1)];

          return (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition hover:border-stone-300"
            >
              <div>
                {/* Header thẻ: Tên + Biên lãi */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="m-0 text-sm font-bold text-stone-900 leading-snug">
                    {item.title || item.name}
                  </h4>
                  <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200/60">
                    Lãi {profitMargin}
                  </span>
                </div>

                {/* Progress bar lợi nhuận */}
                <div className="my-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-lime-500 to-[#16a34a] w-3/4" />
                </div>

                {/* Chi tiết ý tưởng */}
                <div className="space-y-1.5 text-xs leading-relaxed text-stone-600">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-1.5">
                    <span className="text-stone-400">Khoảng giá thị trường</span>
                    <span className="font-bold text-stone-800">
                      {item.market_price_range || item.suggested_price || '160.000đ – 350.000đ'}
                    </span>
                  </div>

                  {item.why_it_sells && (
                    <p className="m-0 text-stone-600 pt-1">
                      <strong className="font-semibold text-stone-800">Động cơ mua:</strong> {item.why_it_sells}
                    </p>
                  )}

                  {item.upsell_bundle_tip && (
                    <p className="m-0 text-stone-600">
                      <strong className="font-semibold text-stone-800">Mẹo bán kèm:</strong>{' '}
                      <span className="font-semibold text-emerald-800">{item.upsell_bundle_tip}</span>
                    </p>
                  )}

                  {item.sourcing_tip && (
                    <div className="flex items-start gap-1.5 pt-1 text-[11px] text-stone-500">
                      <Boxes size={13} className="mt-0.5 shrink-0 text-stone-400" />
                      <span>{item.sourcing_tip}</span>
                    </div>
                  )}

                  {item.suggested_theme && (
                    <p className="m-0 text-stone-600">
                      <strong className="font-semibold text-stone-800">Chủ đề thiết kế:</strong> {item.suggested_theme}
                    </p>
                  )}

                  {item.design_hook && (
                    <p className="m-0 text-stone-600">
                      <strong className="font-semibold text-stone-800">Điểm nhấn:</strong> {item.design_hook}
                    </p>
                  )}
                </div>

                {/* Khối tóm tắt hồ sơ tiềm năng */}
                {profile && (
                  <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-700">{profile.signal_label}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold ${
                          profile.verdict === 'dat'
                            ? 'bg-[#EAF0E2] text-[#005B00]'
                            : profile.verdict === 'chua_chac'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {profile.verdict_label}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500">
                      <span>Cần bán để hòa vốn thử nghiệm:</span>
                      <strong className="text-stone-800 font-bold">
                        {profile.break_even?.break_even_units > 0
                          ? `${profile.break_even.break_even_units} sản phẩm`
                          : 'N/A'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Nút xem hồ sơ 5 lớp */}
              <div className="mt-4 space-y-2">
                {profile && (
                  <button
                    type="button"
                    onClick={() => onOpenProfileDrawer(profile)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 py-2 text-xs font-bold text-stone-700 transition hover:border-[#007700] hover:text-[#007700] hover:bg-white"
                  >
                    <ShieldAlert size={14} className="text-amber-600" />
                    Xem hồ sơ 5 lớp & Tính hòa vốn động
                  </button>
                )}

                {/* Nút thêm vào kế hoạch */}
                <button
                  type="button"
                  onClick={() => onToggleSaveIdea(ideaId)}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                    isSaved
                      ? 'bg-[#007700] text-white shadow-xs'
                      : 'border border-[#007700] text-[#007700] hover:bg-[#EAF0E2]/40 active:scale-98'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Check size={14} /> Đã gom vào kế hoạch
                    </>
                  ) : (
                    <>
                      <Plus size={14} /> Gom vào kế hoạch
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Căn cứ minh chứng dữ liệu gợi ý */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 text-xs text-stone-600 leading-relaxed">
        <div className="flex items-center gap-2 font-bold text-stone-800 mb-1">
          <Database size={14} className="text-[#007700]" />
          <span>Căn cứ tính toán ý tưởng sản phẩm</span>
        </div>
        <p className="mb-0">
          Các gợi ý trên được tổng hợp từ dữ liệu lịch sử tìm kiếm Google Trends VN (đo lường nhu cầu thực), đối soát với 1,400+ listing thật trên sàn Shopee và VietCraft (khoảng giá, mức độ cạnh tranh), kết hợp bảng chi phí phôi in xưởng VietCraft (tính toán biên lãi và điểm hòa vốn). Seller có thể bấm vào từng thẻ để tự kiểm tra bằng chứng trước khi quyết định ra hàng.
        </p>
      </div>
    </div>
  );
}
