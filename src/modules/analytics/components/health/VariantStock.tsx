import { Tag } from 'antd';
import { PackagePlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { count } from '../../../../shared/utils/format';
import type { ListingProductInfo } from '../../healthTypes';
import { editLink } from '../HealthParts';
import { InsightCard, Note } from '../ui';
import { FOCUS } from './healthStats';

const LOW_STOCK = 5;

function status(stock: number) {
  if (stock === 0) return { text: 'Hết hàng', color: 'error', order: 0 };
  if (stock <= LOW_STOCK) return { text: 'Sắp hết', color: 'warning', order: 1 };
  return { text: 'Còn hàng', color: 'default', order: 2 };
}

export function VariantStock({ productId, product }: { productId: string; product: ListingProductInfo }) {
  if (product.product_type !== 'READY_TO_SHIP') {
    return (
      <InsightCard title="Tồn kho">
        <Note>Sản phẩm in hoặc làm theo yêu cầu: chỉ sản xuất khi có đơn nên không cần trữ hàng. Tiêu chí tồn kho không tính cho sản phẩm này.</Note>
      </InsightCard>
    );
  }
  const rows = [...(product.variants ?? [])].sort((a, b) => status(a.stock).order - status(b.stock).order || a.stock - b.stock);
  const out = rows.filter(v => v.stock === 0).length;
  return (
    <InsightCard
      title="Tồn kho từng phân loại"
      info={`Màu, kích cỡ nào đã hết thì khách không đặt được. Còn từ ${LOW_STOCK} món trở xuống là sắp hết.`}
      action={out > 0 ? (
        <Link to={editLink(productId, 'stock_quantity')} className={`inline-flex items-center gap-1 rounded text-xs font-semibold text-[#007700] no-underline hover:underline ${FOCUS}`}>
          <PackagePlus size={14} aria-hidden /> Nhập hàng
        </Link>
      ) : undefined}
      bodyClassName="px-4 py-3"
    >
      <p className="m-0 mb-2 text-[13px] text-stone-600">
        {out > 0 ? <><b className="text-red-700">{out}/{rows.length} phân loại đã hết</b>, còn tổng {count(product.stock_total)} món.</> : `Tất cả ${rows.length} phân loại còn hàng, tổng ${count(product.stock_total)} món.`}
      </p>
      <ul className="m-0 grid list-none grid-cols-2 gap-1.5 p-0">
        {rows.map(v => {
          const s = status(v.stock);
          return (
            <li key={v.label} className="flex items-center justify-between gap-2 rounded-md border border-stone-100 px-2.5 py-1.5">
              <span className="min-w-0 truncate text-[13px] text-stone-800">{v.label}</span>
              <Tag color={s.color} variant="filled" className="!m-0 shrink-0 tabular-nums">{v.stock === 0 ? s.text : `${count(v.stock)} món`}</Tag>
            </li>
          );
        })}
      </ul>
    </InsightCard>
  );
}
