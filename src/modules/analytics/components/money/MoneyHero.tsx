/** Đầu trang: một con số thực nhận lớn, và tổng tiền hàng đã đi đâu (thanh phần trăm). */
import { Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { count, money } from '../../../../shared/utils/format';
import { dateRange } from '../../format';
import { rangeText, type MoneyReport } from '../../moneyTypes';
import { Note } from '../ui';
import { PART_COLOR, sharePct } from './moneyParts';
import { NET_TIP, POD_TIP, Term } from './Term';

export function MoneyHero({ data }: { data: MoneyReport }) {
  const { flow, pod } = data;
  const paid = flow.buyer_paid_vnd;
  const parts = [
    { name: 'Thực nhận', value: flow.net_vnd, color: PART_COLOR.net },
    { name: 'Phí sàn', value: flow.platform_fee_vnd, color: PART_COLOR.fee },
    { name: 'Voucher của shop', value: flow.shop_voucher_vnd, color: PART_COLOR.voucher },
    { name: 'Hoàn tiền', value: flow.refund_vnd, color: PART_COLOR.refund },
  ];
  const pct = (v: number) => (paid > 0 ? sharePct(v, paid) : '0%');

  return (
    <section aria-label="Thực nhận" className="grid gap-6 rounded-md border border-stone-200 bg-white p-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center">
      <div className="min-w-0">
        <p className="m-0 text-sm font-semibold text-stone-600"><Term tip={NET_TIP}>Thực nhận {rangeText(data)}</Term></p>
        <p className="m-0 mt-1 font-jakarta text-4xl font-extrabold tabular-nums" style={{ color: PART_COLOR.net }}>{money(flow.net_vnd)}</p>
        <p className="m-0 mt-2 text-sm text-stone-500">{count(data.orders)} đơn, từ {dateRange(data.from, data.to)}</p>
        <p className="m-0 mt-1 text-xs text-stone-500">
          Chỉ tính đơn đã giao xong, xếp theo ngày đặt.{' '}
          <Link to="/seller/payouts" className="font-semibold text-[#005B00] hover:underline">Xem ví</Link>
        </p>
        {pod && (
          <dl className="m-0 mt-3 space-y-1 border-t border-stone-100 pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-stone-600">Hàng có sẵn ({count(data.orders - pod.orders)} đơn)</dt>
              <dd className="m-0 font-semibold tabular-nums text-stone-900">{money(flow.net_vnd - pod.net_vnd)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stone-600"><Term tip={POD_TIP}>Hàng POD ({count(pod.orders)} đơn)</Term></dt>
              <dd className="m-0 font-semibold tabular-nums text-stone-900">{money(pod.net_vnd)}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="min-w-0 space-y-3">
        <p className="m-0 text-sm text-stone-700">
          Từ tổng tiền hàng <b className="tabular-nums text-stone-900">{money(paid)}</b>, shop giữ lại{' '}
          <b className="tabular-nums" style={{ color: PART_COLOR.net }}>{pct(flow.net_vnd)}</b>, phần còn lại bị trừ cho:
        </p>
        <div role="img" aria-label={parts.map(p => `${p.name} ${pct(p.value)}`).join(', ')} className="flex h-3 overflow-hidden rounded-full bg-stone-100">
          {paid > 0 && parts.filter(p => p.value > 0).map(p => (
            <Tooltip key={p.name} title={`${p.name}: ${pct(p.value)} (${money(p.value)})`}>
              <span className="transition-opacity hover:opacity-80" style={{ width: `${Math.min(100, (p.value / paid) * 100)}%`, background: p.color }} />
            </Tooltip>
          ))}
        </div>
        <dl className="m-0 grid grid-cols-3 gap-3">
          {parts.slice(1).map(p => (
            <div key={p.name} className="min-w-0">
              <dt className="flex items-center gap-1.5 text-xs text-stone-500">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
                {p.name}
              </dt>
              <dd className="m-0 mt-0.5 text-sm font-bold tabular-nums text-stone-900">{pct(p.value)}</dd>
              <dd className="m-0 text-xs tabular-nums text-stone-500">{money(p.value)}</dd>
              {p.name === 'Hoàn tiền' && p.value > 0 && (
                <dd className="m-0 text-xs"><Link to="/seller/refund-requests" className="font-semibold text-[#005B00] hover:underline">Xem đơn bị hoàn</Link></dd>
              )}
            </div>
          ))}
        </dl>
        {flow.other_vnd !== 0 && <Note>Điều chỉnh khác {money(Math.abs(flow.other_vnd))}: do phí sàn tối thiểu hoặc làm tròn.</Note>}
        {flow.platform_voucher_vnd > 0 && <Note>Voucher của sàn {money(flow.platform_voucher_vnd)} do sàn chi trả, không trừ vào thực nhận.</Note>}
      </div>
    </section>
  );
}
