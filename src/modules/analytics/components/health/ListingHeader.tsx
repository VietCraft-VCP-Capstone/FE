/** Dải đầu trang chi tiết: ảnh, tên, giá, tồn kho, số bán 30 ngày. */

import { ExternalLink, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { count, money } from '../../../../shared/utils/format';
import type { ListingHealthDetailFull } from '../../healthTypes';
import { editLink } from '../HealthParts';
import { FOCUS } from './healthStats';

const TYPE_LABEL: Record<string, string> = {
  READY_TO_SHIP: 'Hàng có sẵn',
  POD_TEMPLATE: 'In theo yêu cầu',
  CUSTOM_DESIGN_REQUEST: 'Làm theo yêu cầu',
};

function priceText(min: number | null, max: number | null): string {
  if (min === null || max === null) return '—';
  return min === max ? money(min) : `${money(min)} – ${money(max)}`;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 lg:border-l lg:border-stone-100 lg:pl-4 lg:first:border-l-0 lg:first:pl-0">
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="m-0 mt-0.5 text-base font-bold tabular-nums text-stone-900">
        {value}
        {hint && <span className="ml-1 text-xs font-normal text-stone-500">{hint}</span>}
      </dd>
    </div>
  );
}

export function ListingHeader({ data }: { data: ListingHealthDetailFull }) {
  const { product, sales } = data;
  const title = data.title || 'Sản phẩm';
  return (
    <header className="rounded-md border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          {product.thumbnail ? (
            <img src={product.thumbnail} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
          ) : (
            <span className="h-14 w-14 shrink-0 rounded bg-stone-100" aria-hidden />
          )}
          <div className="min-w-0">
            <h1 className="m-0 line-clamp-2 font-jakarta text-lg font-extrabold leading-snug tracking-tight text-stone-900 md:text-xl">{title}</h1>
            {product.product_type && <p className="m-0 mt-0.5 text-xs text-stone-500">{TYPE_LABEL[product.product_type] ?? product.product_type}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={editLink(data.product_id)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md bg-[#007700] px-3.5 text-sm font-semibold text-white no-underline transition-colors duration-150 hover:bg-[#005B00] motion-reduce:transition-none ${FOCUS}`}
          >
            <Pencil size={15} aria-hidden /> Sửa sản phẩm
          </Link>
          <a
            href={`/product/${data.product_id}`}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex h-9 items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3.5 text-sm font-semibold text-stone-700 no-underline transition-colors duration-150 hover:border-[#007700] hover:text-[#007700] motion-reduce:transition-none ${FOCUS}`}
          >
            <ExternalLink size={15} aria-hidden /> Xem trên sàn
          </a>
        </div>
      </div>
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-stone-100 px-4 py-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Giá bán" value={priceText(product.price_min, product.price_max)} />
        <Stat label="Tồn kho" value={count(product.stock_total)} hint="món" />
        <Stat label="Lượt xem 30 ngày" value={count(sales.views_30d)} />
        <Stat label="Đã bán 30 ngày" value={count(sales.units_30d)} hint={`món · ${count(sales.orders_30d)} đơn`} />
        <Stat label="Doanh thu 30 ngày" value={money(sales.revenue_30d)} />
      </dl>
    </header>
  );
}
