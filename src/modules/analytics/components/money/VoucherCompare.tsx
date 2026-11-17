import { count, money } from '../../../../shared/utils/format';
import type { MoneyReport } from '../../moneyTypes';

type Compare = NonNullable<MoneyReport['voucher_compare']>;

const fmt = (r: number) => r.toLocaleString('vi-VN', { maximumFractionDigits: 1 });

function badge(r: number) {
  if (r >= 1.1) return { text: `gấp ${fmt(r)} lần`, cls: 'text-emerald-700' };
  if (r <= 0.9) return { text: `chỉ bằng ${Math.round(r * 100)}%`, cls: 'text-red-700' };
  return { text: 'ngang nhau', cls: 'text-stone-600' };
}

function Side({ label, value, orders, dot, align }: { label: string; value: number; orders: number; dot: string; align: string }) {
  return (
    <div className={`min-w-0 ${align}`}>
      <p className="m-0 inline-flex items-center gap-1.5 text-xs text-stone-500">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />
        {label}
      </p>
      <p className="m-0 mt-1 text-xl font-semibold tracking-tight tabular-nums text-stone-900">{money(value)}</p>
      <p className="m-0 text-xs text-stone-400">từ {count(orders)} đơn</p>
    </div>
  );
}

export function VoucherCompare({ cmp }: { cmp: Compare }) {
  const r = cmp.without_avg_vnd > 0 ? cmp.with_avg_vnd / cmp.without_avg_vnd : null;
  const b = r === null ? null : badge(r);
  return (
    <div className="rounded-xl bg-stone-50 px-4 py-3">
      <p className="m-0 text-sm font-medium text-stone-700">Trung bình mỗi đơn mang về</p>
      <div className="relative mt-3 grid grid-cols-2">
        <Side label="Có voucher" value={cmp.with_avg_vnd} orders={cmp.with_orders} dot="#005B00" align="pr-10" />
        <Side label="Không voucher" value={cmp.without_avg_vnd} orders={cmp.without_orders} dot="#a8a29e" align="border-l border-stone-200 pl-10" />
        {b && (
          <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-semibold shadow-sm ring-1 ring-stone-200 ${b.cls}`}>
            {b.text}
          </span>
        )}
      </div>
    </div>
  );
}
