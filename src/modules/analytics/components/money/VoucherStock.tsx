/** Kho voucher: có bao nhiêu mã, đã dùng bao nhiêu, mã nào dùng chậm, kèm việc nên làm khi có. */
import { count } from '../../../../shared/utils/format';
import { shortDate } from '../../format';
import type { VoucherStatus, VoucherStock as Stock } from '../../moneyTypes';
import { Chip, DataTable, InsightCard, Note, type Tone } from '../ui';
import { VoucherSuggestRow } from './VoucherSuggest';
import { idleNote, statusNote } from './voucherNotes';

export const VOUCHER_TYPE: Record<string, string> = {
  PERCENTAGE: 'Giảm %', FIXED_AMOUNT: 'Giảm tiền', FREE_SHIPPING: 'Miễn phí ship', FLASH_SALE: 'Flash sale', BUNDLE: 'Mua kèm',
};
const STATUS: Record<VoucherStatus, [string, Tone]> = {
  ok: ['Đang chạy', 'good'], new: ['Mới chạy', 'neutral'], running_out: ['Sắp hết lượt', 'warn'], unused: ['Chưa ai dùng', 'bad'], low: ['Ít dùng', 'warn'], expiring: ['Sắp hết hạn', 'warn'], ended: ['Đã kết thúc', 'neutral'],
};

export function VoucherStock({ stock, tip, aiLoading }: { stock: Stock; tip?: string; aiLoading: boolean }) {
  const ended = stock.total - stock.active;
  const cells: [string, string, string][] = [
    ['Tổng số mã', count(stock.total), `${count(stock.active)} đang chạy${ended ? `, ${count(ended)} đã kết thúc` : ''}`],
    ['Đã dùng', stock.limit ? `${count(stock.used)}/${count(stock.limit)} lượt` : count(stock.used), 'Cộng mọi mã, tính từ lúc tạo'],
    ['Mã ít người dùng', count(stock.idle), idleNote(stock.items)],
  ];
  return (
    <InsightCard title="Kho voucher" bodyClassName="px-4 py-3">
      <div className="space-y-4">
        <dl className="m-0 grid grid-cols-3 gap-3">
          {cells.map(([k, v, sub]) => (
            <div key={k}>
              <dt className="text-xs text-stone-500">{k}</dt>
              <dd className="m-0 text-sm font-bold tabular-nums text-stone-900">{v}</dd>
              <dd className="m-0 mt-0.5 text-xs text-stone-500">{sub}</dd>
            </div>
          ))}
        </dl>
        {stock.items.length === 0 && !stock.suggest ? <Note>Shop chưa tạo voucher nào.</Note> : (
          <DataTable caption="Danh sách voucher của shop" head={<>
            <th scope="col">Mã</th><th scope="col">Loại</th><th scope="col" className="text-right">Đã dùng <span className="font-normal text-stone-400">(từ lúc tạo)</span></th>
            <th scope="col" className="text-right">Trong kỳ <span className="font-normal text-stone-400">(đơn đã giao)</span></th><th scope="col">Hết hạn</th><th scope="col">Trạng thái</th>
          </>}>
            {stock.suggest && (
              <VoucherSuggestRow suggest={stock.suggest} typeName={VOUCHER_TYPE[stock.suggest.type] ?? stock.suggest.type} tip={tip} aiLoading={aiLoading} codes={stock.items.map(v => v.code)} />
            )}
            {stock.items.map(v => (
              <tr key={v.code}>
                <td className="font-mono text-xs font-semibold text-stone-800">{v.code}</td>
                <td className="text-stone-700">{VOUCHER_TYPE[v.type] ?? v.type}</td>
                <td className="text-right tabular-nums">{v.limit ? `${count(v.used)}/${count(v.limit)}` : count(v.used)}</td>
                <td className="text-right tabular-nums">{count(v.orders_in_range)}</td>
                <td className="tabular-nums text-stone-600">{v.end_date ? shortDate(v.end_date) : '—'}</td>
                <td>
                  <Chip tone={STATUS[v.status][1]}>{STATUS[v.status][0]}</Chip>
                  {statusNote(v) && <span className="ml-2 text-xs text-stone-500">{statusNote(v)}</span>}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
        {stock.items.length > 0 && (
          <Note>"Đã dùng" đếm mọi lượt từ lúc tạo mã. "Trong kỳ" chỉ đếm đơn đã giao trong khoảng thời gian bạn chọn. Mã chạy dưới 7 ngày chưa bị đánh giá.</Note>
        )}
      </div>
    </InsightCard>
  );
}
