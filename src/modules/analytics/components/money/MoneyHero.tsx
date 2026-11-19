/** Đầu trang: Doanh thu − Chi phí = Thực nhận, kèm thanh tỉ lệ từng khoản trừ. */
import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import { count, money } from '../../../../shared/utils/format';
import { rangeText, type MoneyReport } from '../../moneyTypes';
import { PART_COLOR, sharePct } from './moneyParts';

const COST_COLOR = ['#3b82f6', '#f43f5e', '#a8a29e', '#93c5fd'];

function Op({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="z-10 mx-auto -my-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-bold text-stone-500 shadow-sm lg:-mx-3.5 lg:my-auto">
      {children}
    </span>
  );
}

function Cell({ label, value, sub, tone }: { label: string; value: string; sub: ReactNode; tone?: 'net' }) {
  return (
    <div className={`min-w-0 flex-1 px-6 py-5 ${tone ? 'bg-[#f3f9f3] lg:rounded-r-2xl' : ''}`}>
      <p className="m-0 text-xs font-semibold text-stone-500">{label}</p>
      <p className="m-0 mt-1.5 font-jakarta text-3xl font-extrabold tabular-nums tracking-tight" style={{ color: tone ? PART_COLOR.net : '#1c1917' }}>{value}</p>
      <div className="mt-1.5 text-xs text-stone-500">{sub}</div>
    </div>
  );
}

export function MoneyHero({ data }: { data: MoneyReport }) {
  const { flow } = data;
  const paid = flow.buyer_paid_vnd;
  const pct = (v: number) => (paid > 0 ? sharePct(v, paid) : '0%');
  const costs = ([
    ['Phí sàn', flow.platform_fee_vnd],
    ['Voucher shop', flow.shop_voucher_vnd],
    ['Hoàn tiền', flow.refund_vnd],
    ['Phí sàn tối thiểu', flow.other_vnd],
  ] as [string, number][]).map(([name, value], i) => ({ name, value, color: COST_COLOR[i] })).filter(c => c.value !== 0);
  const segs = [{ name: 'Thực nhận', value: flow.net_vnd, color: PART_COLOR.net }, ...costs];

  return (
    <section aria-label="Doanh thu, chi phí và thực nhận" className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm">
      <div className="flex flex-col lg:flex-row">
        <Cell label="Doanh thu" value={money(paid)} sub={`${count(data.orders)} đơn giao xong ${rangeText(data)}`} />
        <Op>−</Op>
        <Cell label="Chi phí" value={money(paid - flow.net_vnd)} sub={`Bằng ${pct(paid - flow.net_vnd)} doanh thu`} />
        <Op>=</Op>
        <Cell
          tone="net"
          label="Thực nhận"
          value={money(flow.net_vnd)}
          sub={<span className="rounded-full bg-[#dcefdc] px-2 py-0.5 font-bold text-[#005B00]">Giữ lại {pct(flow.net_vnd)}</span>}
        />
      </div>

      <div className="border-t border-stone-100 px-6 py-4">
        <div role="img" aria-label={segs.map(s => `${s.name} ${pct(s.value)}`).join(', ')} className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-stone-100">
          {paid > 0 && segs.filter(s => s.value > 0).map(s => (
            <Tooltip key={s.name} title={`${s.name}: ${pct(s.value)} (${money(s.value)})`}>
              <span className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(s.value / paid) * 100}%`, background: s.color }} />
            </Tooltip>
          ))}
        </div>
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-5 gap-y-1.5 p-0 text-xs">
          {costs.length === 0 && <li className="text-stone-500">Không bị trừ khoản nào</li>}
          {costs.map(c => (
            <li key={c.name} className="flex items-center gap-1.5 text-stone-600">
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} aria-hidden />
              {c.name}
              <b className="tabular-nums text-stone-900">{pct(c.value)}</b>
              <span className="tabular-nums text-stone-400">{money(c.value)}</span>
            </li>
          ))}
          <li className="ml-auto text-stone-400">Tính theo ngày giao; Tổng quan tính theo ngày đặt nên kỳ ngắn có thể lệch</li>
        </ul>
      </div>
    </section>
  );
}
