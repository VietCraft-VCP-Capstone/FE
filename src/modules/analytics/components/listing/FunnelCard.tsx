import { Eye, ShoppingBag, ShoppingCart } from 'lucide-react';
import { dateRange, decimal, pct } from '../../format';
import { categoryLabel } from '../../labels';
import type { InsightMeta, ListingConversion } from '../../types';
import { FunnelFlow } from '../charts/FunnelFlow';
import { SourceFooter } from '../SourceFooter';
import { InsightCard } from '../ui';

const BUOC_YEU = { view_to_cart: 1, cart_to_order: 2 } as const;

function CompareBar({ label, value, max, mine }: { label: string; value: number; max: number; mine?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-stone-600">{label}</span>
        <span className="font-bold tabular-nums text-stone-900">{pct(value, 2)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-200/70" aria-hidden>
        <div className="h-full rounded-full" style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%`, background: mine ? '#1a6b1a' : '#a8a29e' }} />
      </div>
    </div>
  );
}

function Compare({ data }: { data: ListingConversion }) {
  const mine = data.view_to_order_pct;
  const avg = data.category_avg_pct;
  return (
    <div className="flex flex-col justify-center rounded-md bg-stone-50 p-4">
      <span className="text-xs font-semibold text-stone-500">Xem thành mua</span>
      <span className="mt-1 font-jakarta text-[26px] font-extrabold leading-none tabular-nums text-stone-900">{pct(mine, 2)}</span>
      {mine == null || avg == null ? (
        <p className="mb-0 mt-3 text-xs leading-relaxed text-stone-500">Chưa có sản phẩm khác cùng danh mục để so sánh.</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          <CompareBar label="Sản phẩm này" value={mine} max={Math.max(mine, avg)} mine />
          <CompareBar label={`Trung bình ${categoryLabel(data.category_id)}`} value={avg} max={Math.max(mine, avg)} />
          {data.cr_index != null && (
            <p className="m-0 text-xs text-stone-600">
              {data.cr_index >= 1 ? `Bán tốt hơn danh mục, gấp ${decimal(data.cr_index)} lần.` : `Mới bằng ${decimal(data.cr_index)} lần mức danh mục.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function FunnelCard({ data, meta }: { data: ListingConversion; meta: InsightMeta }) {
  return (
    <InsightCard title="Phễu mua hàng" description={`Từ ${dateRange(data.window.from, data.window.to)}.`} footer={<SourceFooter meta={meta} />}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <FunnelFlow
          stages={[
            { label: 'Người xem', value: data.funnel.views, icon: <Eye size={15} /> },
            { label: 'Thêm vào giỏ', value: data.funnel.carts, icon: <ShoppingCart size={15} /> },
            { label: 'Đặt mua', value: data.funnel.orders, icon: <ShoppingBag size={15} /> },
          ]}
          rates={[data.view_to_cart_pct, data.cart_to_order_pct]}
          weakest={data.weakest_step ? BUOC_YEU[data.weakest_step] : null}
        />
        <Compare data={data} />
      </div>
      {data.tips.length > 0 && (
        <ul className="m-0 mt-4 list-none space-y-2 p-0">
          {data.tips.map(tip => (
            <li key={tip.issue} className="rounded-md bg-amber-50 px-3.5 py-3">
              <p className="m-0 text-[13px] font-semibold text-amber-900">{tip.issue}</p>
              <p className="mb-0 mt-1 text-[13px] leading-relaxed text-amber-900/90">{tip.action}</p>
            </li>
          ))}
        </ul>
      )}
    </InsightCard>
  );
}
