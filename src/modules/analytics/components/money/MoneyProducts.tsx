import { DataTable, InsightCard, Note } from '../ui';
import { count, money } from '../../../../shared/utils/format';
import { rangeText, type MoneyReport } from '../../moneyTypes';
import { useState } from 'react';
import { sharePct } from './moneyParts';
import { MoneyProductsModal } from './MoneyProductsModal';
import { ProductTitle, ShareCell } from './productCells';

const TOP = 5;

export function MoneyProducts({ data }: { data: MoneyReport }) {
  const total = data.flow.net_vnd;
  const rest = data.by_product.length - TOP;
  const restNet = data.by_product.slice(TOP).reduce((s, p) => s + p.net_vnd, 0);
  const [open, setOpen] = useState(false);
  const footer = rest > 0 ? (
    <div className="flex items-center justify-between gap-3">
      <Note>{rest} sản phẩm khác: {money(restNet)}{total > 0 && restNet > 0 && ` · ${sharePct(restNet, total)} thực nhận`}</Note>
      <button type="button" className="shrink-0 text-xs font-semibold text-[#005B00] hover:underline" onClick={() => setOpen(true)}>
        Xem tất cả {data.by_product.length} sản phẩm
      </button>
    </div>
  ) : undefined;

  return (
    <InsightCard
      title={`Top ${TOP} sản phẩm theo thực nhận`}
      footer={footer}
      className="h-full"
      bodyClassName="px-4 py-3"
    >
      {data.by_product.length === 0 ? (
        <Note>Chưa có sản phẩm phát sinh đơn trong khoảng thời gian này.</Note>
      ) : (
        <DataTable
          caption="Sản phẩm bán được, sắp xếp theo số tiền thực nhận giảm dần"
          head={
            <>
              <th scope="col">Sản phẩm</th>
              <th scope="col" className="text-right">Đã bán</th>
              <th scope="col" className="text-right">Thực nhận</th>
              <th scope="col">Tỷ trọng</th>
            </>
          }
        >
          {data.by_product.slice(0, TOP).map((p, i) => {
            return (
              <tr key={`${p.product_id}-${i}`}>
                <td className="max-w-[18rem]">
                  <ProductTitle p={p} rank={i + 1} />
                </td>
                <td className="text-right tabular-nums text-stone-700">{count(p.units)}</td>
                <td className={`text-right font-semibold tabular-nums ${p.net_vnd < 0 ? 'text-red-600' : 'text-stone-900'}`}>{money(p.net_vnd)}</td>
                <td><ShareCell net={p.net_vnd} total={total} /></td>
              </tr>
            );
          })}
        </DataTable>
      )}
      <MoneyProductsModal open={open} onClose={() => setOpen(false)} products={data.by_product} total={total} period={rangeText(data.range)} />
    </InsightCard>
  );
}
