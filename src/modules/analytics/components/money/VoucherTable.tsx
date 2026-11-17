/** Khối "Voucher của shop": chi phí từng mã, số đơn áp dụng, và so đơn có / không dùng voucher. */
import { DataTable, InsightCard, Note } from '../ui';
import { count, money } from '../../../../shared/utils/format';
import { NA } from '../../format';
import type { MoneyReport } from '../../moneyTypes';
import { sharePct } from './moneyParts';
import { VoucherCompare } from './VoucherCompare';

export function VoucherTable({ data }: { data: MoneyReport }) {
  const { vouchers, voucher_compare: cmp } = data;
  const cost = vouchers.reduce((s, v) => s + v.cost_vnd, 0);
  const net = vouchers.reduce((s, v) => s + v.net_vnd, 0);
  // shortcut: net đã trừ phí sàn nên % hơi cao hơn thật, đổi khi API trả tiền hàng đơn có voucher
  const costPct = cost > 0 && cost + net > 0 ? sharePct(cost, cost + net) : null;

  return (
    <InsightCard title="Voucher của shop" className="h-full" bodyClassName="px-4 py-3">
      <div className="space-y-4">
        {vouchers.length === 0 ? (
          <Note>Chưa có đơn nào dùng voucher của shop trong khoảng thời gian này.</Note>
        ) : (
          <DataTable
            caption="Voucher của shop: số đơn, chi phí và số tiền thực nhận từ các đơn dùng mã"
            head={
              <>
                <th scope="col">Mã</th>
                <th scope="col">Tên</th>
                <th scope="col" className="text-right">Số đơn</th>
                <th scope="col" className="text-right">Chi phí</th>
                <th scope="col" className="text-right">Thực nhận</th>
              </>
            }
          >
            {vouchers.map(v => (
              <tr key={v.code}>
                <td className="font-mono text-xs font-semibold text-stone-800">{v.code}</td>
                <td className="text-stone-700">{v.title || NA}</td>
                <td className="text-right tabular-nums text-stone-700">{count(v.orders)}</td>
                <td className="text-right tabular-nums text-stone-900">{money(v.cost_vnd)}</td>
                <td className="text-right font-semibold tabular-nums text-stone-900">{money(v.net_vnd)}</td>
              </tr>
            ))}
          </DataTable>
        )}

        {costPct && <Note>Voucher chiếm khoảng <b className="text-stone-800">{costPct}</b> tiền hàng của các đơn dùng mã.</Note>}

        {cmp ? (
          <VoucherCompare cmp={cmp} />
        ) : (
          <Note>Chưa đủ dữ liệu để so sánh đơn có và không có voucher (mỗi nhóm cần tối thiểu 10 đơn).</Note>
        )}
      </div>
    </InsightCard>
  );
}
