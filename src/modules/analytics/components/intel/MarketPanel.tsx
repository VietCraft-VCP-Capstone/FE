import { money } from '../../../../shared/utils/format';
import { decimal } from '../../format';
import type { IntelMarket } from '../../intelTypes';
import { InsightCard, Note } from '../ui';

function priceSentence(pct: number | null) {
  if (pct === null) return '-';
  return pct <= 10 ? `Giá của bạn thấp hơn ${decimal(100 - pct, 0)}% sản phẩm tương tự` : `Giá của bạn cao hơn ${decimal(pct, 0)}% sản phẩm tương tự`;
}

function priceHint(pct: number | null, neighbors: number) {
  if (pct !== null && pct <= 10) return `Thuộc nhóm giá thấp nhất trong ${neighbors} sản phẩm gần giống, nên kiểm tra lại biên lợi nhuận`;
  if (pct !== null && pct >= 90) return `Thuộc nhóm giá cao nhất trong ${neighbors} sản phẩm gần giống, nên nêu rõ điểm khác biệt`;
  return `So với ${neighbors} sản phẩm gần giống nhất`;
}

function Stat({ label, value, hint, className = '' }: { label: string; value: string; hint?: string; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="m-0 mt-0.5 text-base font-bold tabular-nums text-stone-900">{value}</dd>
      {hint && <p className="m-0 mt-0.5 text-[11px] text-stone-500">{hint}</p>}
    </div>
  );
}

export function MarketPanel({ market, bare = false }: { market: IntelMarket | null; bare?: boolean }) {
  return (
    <InsightCard bare={bare} title="Thị hiếu và cạnh tranh" info="So với các sản phẩm gần giống nhất về ảnh và tiêu đề, trên sàn và trong VietCraft.">
      {!market ? (
        <Note>Chưa so sánh được với sản phẩm nào gần giống.</Note>
      ) : (
        <dl className="m-0 grid grid-cols-2 gap-4">
          <Stat
            className="col-span-2"
            label="Mức giá của bạn"
            value={priceSentence(market.price_pct)}
            hint={priceHint(market.price_pct, market.neighbors)}
          />
          <Stat label="Mức giữa của sản phẩm gần giống (theo ảnh và tiêu đề)" value={market.median_price === null ? '-' : money(market.median_price)} />
          <Stat
            label="Sản phẩm gần như trùng"
            value={String(market.near_duplicates)}
            hint={market.near_duplicates > 0 ? 'Ảnh và tiêu đề gần giống, nên tạo điểm khác biệt' : 'Chưa thấy sản phẩm nào trùng'}
          />
        </dl>
      )}
    </InsightCard>
  );
}
