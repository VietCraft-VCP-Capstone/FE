import { Scale } from 'lucide-react';
import { compactMoney } from '../../../../shared/utils/format';
import { vnd } from '../../format';
import type { ListingHealth } from '../../healthTypes';

const MIN_PEERS = 8;

export function PriceCompare({ data }: { data: ListingHealth }) {
  const row = data.breakdown.find(r => r.key === 'price');
  if (!row) return null;
  const ref = row.reference;
  const prices = ref?.prices ?? [];
  const mine = row.value;
  const comparable = Boolean(ref?.comparable) && prices.length > 0;
  const sameCount = ref?.same_n ?? 0;

  const sorted = [...prices].sort((a, b) => a - b);
  const bandLow = row.full?.low ?? row.suggestion?.low ?? (sorted.length ? sorted[Math.floor(sorted.length * 0.25)] : 0);
  const bandHigh = row.full?.high ?? row.suggestion?.high ?? (sorted.length ? sorted[Math.floor(sorted.length * 0.75)] : 0);

  const isLower = mine !== null && bandLow > 0 && mine < bandLow;
  const isHigher = mine !== null && bandHigh > 0 && mine > bandHigh;
  const isOptimal = mine !== null && !isLower && !isHigher;

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-[#007700]" />
          <h2 className="m-0 text-sm font-bold uppercase tracking-wider text-stone-700">
            Định vị giá &amp; Thị trường
          </h2>
        </div>
        {comparable ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#007700] border border-emerald-200/70">
            Đã đối soát ({ref?.n} shop)
          </span>
        ) : (
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 border border-stone-200/70">
            Chờ gom mẫu ({sameCount}/{MIN_PEERS})
          </span>
        )}
      </div>

      {mine === null ? (
        <p className="m-0 text-xs text-stone-400 py-6 text-center">Chưa cập nhật giá bán niêm yết.</p>
      ) : (
        <div className="space-y-3.5">
          {/* 2. Main Price Headline & Badge */}
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold text-stone-400">Giá bán niêm yết</div>
              <div className="text-3xl font-black text-stone-900 tracking-tight tabular-nums mt-0.5">
                {vnd(mine)}
              </div>
            </div>

            {comparable ? (
              isLower ? (
                <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800 border border-sky-200/70">
                  Phân khúc cạnh tranh (-{compactMoney(bandLow - mine)})
                </span>
              ) : isHigher ? (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200/70">
                  Phân khúc cao cấp (+{compactMoney(mine - bandHigh)})
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/70">
                  Vùng giá tối ưu
                </span>
              )
            ) : (
              <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 border border-stone-200/70">
                Bảo lưu 100% điểm
              </span>
            )}
          </div>

          {/* 3. Three-Tier Market Positioning Cards (No Fake Slider Knobs!) */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-stone-500">
              Phân khúc giá thị trường ({comparable ? `${ref?.n} shop cùng loại` : 'Khoảng tham chiếu'}):
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Tier 1: Cạnh tranh */}
              <div
                className={`p-3 rounded-xl border text-center transition-all ${
                  isLower
                    ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-stone-200/70 bg-stone-50/40 text-stone-600'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Cạnh tranh
                </div>
                <div className="text-xs font-black text-stone-800 tabular-nums mt-1">
                  &lt; {compactMoney(bandLow)}
                </div>
                {isLower ? (
                  <div className="mt-2 inline-flex items-center rounded-full bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5">
                    ● Bạn ở đây
                  </div>
                ) : (
                  <div className="text-[10px] text-stone-400 mt-2">Dưới mặt bằng</div>
                )}
              </div>

              {/* Tier 2: Phổ biến */}
              <div
                className={`p-3 rounded-xl border text-center transition-all ${
                  isOptimal
                    ? 'border-[#007700] bg-emerald-50/70 ring-2 ring-[#007700]/20 shadow-xs'
                    : 'border-stone-200/70 bg-stone-50/40 text-stone-600'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#007700]">
                  Phổ biến
                </div>
                <div className="text-xs font-black text-stone-900 tabular-nums mt-1">
                  {compactMoney(bandLow)} – {compactMoney(bandHigh)}
                </div>
                {isOptimal ? (
                  <div className="mt-2 inline-flex items-center rounded-full bg-[#007700] text-white text-[10px] font-bold px-2 py-0.5">
                    ● Bạn ở đây
                  </div>
                ) : (
                  <div className="text-[10px] text-[#007700] font-semibold mt-2">Đa số shop</div>
                )}
              </div>

              {/* Tier 3: Cao cấp */}
              <div
                className={`p-3 rounded-xl border text-center transition-all ${
                  isHigher
                    ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-stone-200/70 bg-stone-50/40 text-stone-600'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Cao cấp
                </div>
                <div className="text-xs font-black text-stone-800 tabular-nums mt-1">
                  &gt; {compactMoney(bandHigh)}
                </div>
                {isHigher ? (
                  <div className="mt-2 inline-flex items-center rounded-full bg-amber-700 text-white text-[10px] font-bold px-2 py-0.5">
                    ● Bạn ở đây
                  </div>
                ) : (
                  <div className="text-[10px] text-stone-400 mt-2">Phân khúc cao</div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Strategic Advice */}
          {isHigher && (
            <div className="text-xs text-stone-600 bg-amber-50/50 rounded-xl p-3 border border-amber-200/60 leading-relaxed">
              <div className="font-bold text-amber-900 mb-1">
                Lời khuyên cho phân khúc cao cấp (+{compactMoney(mine - bandHigh)} so với phổ biến):
              </div>
              Bán giá cao hơn mặt bằng chung hoàn toàn có lợi thế nếu sản phẩm dùng nguyên liệu cao cấp, giá vốn lớn, độ bền hay thiết kế xịn hơn. Hãy làm nổi bật các điểm đắt giá này ở mô tả và thêm ảnh chụp cận cảnh chi tiết để khách hàng thấy xứng đáng "tiền nào của nấy".
            </div>
          )}
          {isLower && (
            <div className="text-xs text-stone-600 bg-sky-50/50 rounded-xl p-3 border border-sky-200/60 leading-relaxed">
              <div className="font-bold text-sky-900 mb-1">
                Lời khuyên cho phân khúc cạnh tranh ({compactMoney(bandLow - mine)} thấp hơn phổ biến):
              </div>
              Mức giá này là lợi thế lớn để thu hút lượt click và kích thích khách chốt đơn nhanh. Bạn nên kiểm tra kỹ giá vốn và chi phí sàn để duy trì tỷ suất lợi nhuận kỳ vọng.
            </div>
          )}
          {isOptimal && (
            <div className="text-xs text-stone-600 bg-emerald-50/50 rounded-xl p-3 border border-emerald-200/60 leading-relaxed">
              <div className="font-bold text-[#007700] mb-1">
                Mức giá tối ưu thị trường:
              </div>
              Giá niêm yết của bạn nằm trúng vùng giá có lượng tìm kiếm và tỷ lệ chuyển đổi đơn hàng tốt nhất trong ngành ({compactMoney(bandLow)} – {compactMoney(bandHigh)}).
            </div>
          )}

          {/* 5. Non-comparable Sample Gathering Progress */}
          {!comparable && (
            <div className="rounded-xl border border-stone-200/70 bg-stone-50/60 p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-stone-600">
                <span>Tiến độ đối soát tự động trên VietCraft:</span>
                <span className="font-bold text-stone-800">{sameCount}/{MIN_PEERS} shop</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-stone-200/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#007700] transition-all duration-300"
                  style={{ width: `${Math.max(4, (sameCount / MIN_PEERS) * 100)}%` }}
                />
              </div>
              <p className="m-0 text-[10px] text-stone-400 leading-tight">
                Khi đủ {MIN_PEERS} sản phẩm cùng chất liệu, hệ thống tự động đối soát chi tiết mà không làm giảm điểm tin đăng.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
