import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { FinanceOverview, TrendMonth } from '../../services/adminFinanceService';
import type { ProfitBar } from '../../services/financeSimulation';
import { CHART_INK, SERIES } from '../../../../shared/components/charts/chartTheme';
import { compactMoney, count, money } from '../../../../shared/utils/format';

const AXIS_TICK = { fontSize: 11, fill: CHART_INK.axis };
const LABEL_INK = '#374151';
const CURSOR = { fill: '#f3f6f3' };
// Cột "tổng phụ" và cột tham chiếu: xám để chỉ cột chính nổi lên.
const NEUTRAL = '#9ca3af';
const MUTED_BAR = '#d1d5db';

const signedMoney = (v: number) => (v > 0 ? `+${money(v)}` : money(v));
const signedCompact = (v: number) => (v > 0 ? `+${compactMoney(v)}` : compactMoney(v));

/**
 * Nhãn số đặt ngoài đầu cột. Không dùng vị trí 'top'/'bottom' sẵn có của recharts: nó ép chữ xuống
 * dòng theo bề rộng cột và đảo trên/dưới với cột âm.
 */
function labelAt(where: 'above' | 'below' | 'right' | 'left') {
  return (props: any) => {
    const { viewBox, value } = props;
    if (!value || !viewBox) return null;
    const { x, y, width, height } = viewBox;
    const top = Math.min(y, y + height);
    const bottom = Math.max(y, y + height);
    const left = Math.min(x, x + width);
    const right = Math.max(x, x + width);
    const at: { x: number; y: number; anchor: 'start' | 'middle' | 'end' } =
      where === 'above'
        ? { x: x + width / 2, y: top - 6, anchor: 'middle' }
        : where === 'below'
          ? { x: x + width / 2, y: bottom + 14, anchor: 'middle' }
          : where === 'right'
            ? { x: right + 6, y: y + height / 2 + 4, anchor: 'start' }
            : { x: left - 6, y: y + height / 2 + 4, anchor: 'end' };
    return (
      <text x={at.x} y={at.y} textAnchor={at.anchor} fontSize={11} fill={LABEL_INK}>
        {value}
      </text>
    );
  };
}

/** Giới hạn trục đối xứng quanh 0, làm tròn cho đẹp: 400k → ±600k. */
function symmetricLimit(maxAbs: number): number {
  const target = Math.max(1, maxAbs) * 1.3;
  const mag = 10 ** Math.floor(Math.log10(target));
  return Math.ceil(target / mag) * mag;
}

function TipBox({ title, lines }: { title: string; lines: [string, string][] }) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[12px] shadow-sm">
      <div className="mb-1 font-semibold text-admin-ink">{title}</div>
      {lines.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 text-admin-muted">
          <span>{k}</span>
          <b className="tabular-nums text-admin-ink">{v}</b>
        </div>
      ))}
    </div>
  );
}

export function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-admin-muted">
      {items.map(i => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: i.color }} aria-hidden />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Thác nước "Tiền đi đâu" */

type Kind = 'in' | 'out' | 'sum';
const KIND_COLOR: Record<Kind, string> = { in: SERIES.green, out: SERIES.red, sum: NEUTRAL };

interface WaterfallRow {
  name: string;
  kind: Kind;
  text: string;
  anchor: 'pos' | 'neg';
  basePos: number;
  baseNeg: number;
  pos: number;
  neg: number;
}

export function waterfallRows(o: FinanceOverview): WaterfallRow[] {
  const steps: { name: string; kind: Kind; value: number }[] = [
    { name: 'Hoa hồng', kind: 'in', value: o.pnl.commission },
    { name: 'Voucher sàn', kind: 'out', value: -o.pnl.platform_voucher },
    { name: 'Phí cổng', kind: 'out', value: -o.pnl.payment_fees },
    { name: 'Đơn hoàn', kind: 'out', value: -o.pnl.refund_losses },
    { name: 'Tin nhắn', kind: 'out', value: -o.pnl.notification },
    { name: 'Lãi góp', kind: 'sum', value: o.pnl.contribution },
    { name: 'Chi phí cố định', kind: 'out', value: -o.pnl.fixed_costs },
    { name: 'Lãi/lỗ ròng', kind: 'sum', value: o.pnl.net_profit },
  ];
  let run = 0;
  return steps.map(s => {
    const start = s.kind === 'sum' ? 0 : run;
    const end = s.kind === 'sum' ? s.value : run + s.value;
    run = end;
    const lo = Math.min(start, end);
    const hi = Math.max(start, end);
    // Đoạn nổi = phần đệm trong suốt + phần hiện; chồng theo dấu nên đoạn cắt qua 0 vẫn liền.
    const row: WaterfallRow = {
      name: s.name,
      kind: s.kind,
      text:
        s.value === 0
          ? '0đ'
          : s.kind === 'sum'
            ? signedCompact(s.value)
            : s.value > 0
              ? `+${compactMoney(s.value)}`
              : `−${compactMoney(-s.value)}`,
      anchor: 'pos',
      basePos: 0,
      baseNeg: 0,
      pos: 0,
      neg: 0,
    };
    if (lo >= 0) {
      row.basePos = lo;
      row.pos = hi - lo;
    } else if (hi <= 0) {
      row.baseNeg = hi;
      row.neg = lo - hi;
      row.anchor = 'neg';
    } else {
      row.pos = hi;
      row.neg = lo;
      row.anchor = s.value < 0 ? 'neg' : 'pos';
    }
    return row;
  });
}

export function WaterfallChart({ o }: { o: FinanceOverview }) {
  const rows = waterfallRows(o);
  return (
    <div className="h-[300px] w-full" role="img" aria-label="Biểu đồ thác nước: từ hoa hồng trừ dần từng khoản chi xuống lãi lỗ ròng">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} stackOffset="sign" margin={{ top: 24, right: 8, bottom: 20, left: 4 }} barCategoryGap="24%">
          <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
          <XAxis dataKey="name" interval={0} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART_INK.grid }} />
          <YAxis tickFormatter={v => compactMoney(v)} tick={AXIS_TICK} tickLine={false} axisLine={false} width={60} />
          <ReferenceLine y={0} stroke={CHART_INK.axis} />
          <Tooltip
            cursor={CURSOR}
            content={({ active, payload }) =>
              active && payload?.length ? <TipBox title={payload[0].payload.name} lines={[['Số tiền', payload[0].payload.text]]} /> : null
            }
          />
          <Bar dataKey="basePos" stackId="w" fill="transparent" maxBarSize={24} isAnimationActive={false} />
          <Bar dataKey="baseNeg" stackId="w" fill="transparent" maxBarSize={24} isAnimationActive={false} />
          <Bar dataKey="pos" stackId="w" maxBarSize={24} isAnimationActive={false}>
            {rows.map(r => (
              <Cell key={r.name} fill={KIND_COLOR[r.kind]} />
            ))}
            <LabelList
              content={labelAt('above')}
              valueAccessor={(e: any) => (e.payload.anchor === 'pos' ? e.payload.text : '')}
            />
          </Bar>
          <Bar dataKey="neg" stackId="w" maxBarSize={24} isAnimationActive={false}>
            {rows.map(r => (
              <Cell key={r.name} fill={KIND_COLOR[r.kind]} />
            ))}
            <LabelList
              content={labelAt('below')}
              valueAccessor={(e: any) => (e.payload.anchor === 'neg' ? e.payload.text : '')}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ Xu hướng 6 tháng */

export const monthLabel = (t: TrendMonth) => `${t.month.slice(5, 7)}/${t.month.slice(0, 4)}${t.partial ? '*' : ''}`;

export function TrendBars({ trend }: { trend: TrendMonth[] }) {
  const data = trend.map(t => ({ ...t, label: monthLabel(t) }));
  return (
    <>
      <ChartLegend
        items={[
          { color: SERIES.green, label: 'Lãi góp (phần sàn còn lại sau chi phí theo đơn)' },
          { color: SERIES.blue, label: 'Chi phí cố định' },
        ]}
      />
      <div className="mt-2 h-[260px] w-full" role="img" aria-label="Lãi góp so với chi phí cố định trong 6 tháng gần nhất">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }} barGap={2} barCategoryGap="30%">
            <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: CHART_INK.grid }} />
            <YAxis tickFormatter={v => compactMoney(v)} tick={AXIS_TICK} tickLine={false} axisLine={false} width={60} />
            <ReferenceLine y={0} stroke={CHART_INK.axis} />
            <Tooltip
              cursor={CURSOR}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const t = payload[0].payload;
                return (
                  <TipBox
                    title={`Tháng ${t.label}`}
                    lines={[
                      ['Đơn đã thanh toán', count(t.orders)],
                      ['Lãi góp', money(t.contribution)],
                      ['Chi phí cố định', money(t.fixed_costs)],
                      ['Lãi/lỗ', signedMoney(t.net_profit)],
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="contribution" fill={SERIES.green} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="fixed_costs" fill={SERIES.blue} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ Mô phỏng: lãi/lỗ theo số đơn */

export function ProfitBarsChart({ bars }: { bars: ProfitBar[] }) {
  const data = bars.map(b => ({
    ...b,
    label: count(b.orders),
    pos: Math.max(0, b.profit),
    neg: Math.min(0, b.profit),
    mark: b.current ? 'Đang chọn' : b.breakEven ? 'Hòa vốn' : '',
  }));
  const opacity = (b: ProfitBar) => (b.current || b.breakEven ? 1 : 0.45);
  return (
    <>
      <ChartLegend
        items={[
          { color: SERIES.green, label: 'Có lãi' },
          { color: SERIES.red, label: 'Lỗ' },
        ]}
      />
      <div className="mt-2 h-[300px] w-full" role="img" aria-label="Lãi lỗ mỗi tháng ở từng mức số đơn">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} stackOffset="sign" margin={{ top: 22, right: 8, bottom: 16, left: 4 }} barCategoryGap="22%">
            <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
            <XAxis
              dataKey="label"
              interval={0}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: CHART_INK.grid }}
              label={{ value: 'Số đơn mỗi tháng', position: 'insideBottom', offset: -10, fontSize: 11, fill: CHART_INK.axis }}
            />
            <YAxis tickFormatter={v => compactMoney(v)} tick={AXIS_TICK} tickLine={false} axisLine={false} width={60} />
            <ReferenceLine y={0} stroke={CHART_INK.axis} />
            <Tooltip
              cursor={CURSOR}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const b = payload[0].payload;
                return <TipBox title={`${count(b.orders)} đơn/tháng`} lines={[['Lãi/lỗ mỗi tháng', signedMoney(b.profit)]]} />;
              }}
            />
            <Bar dataKey="pos" stackId="p" fill={SERIES.green} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map(b => (
                <Cell key={b.orders} fillOpacity={opacity(b)} />
              ))}
              <LabelList
                content={labelAt('above')}
                valueAccessor={(e: any) => (e.payload.profit >= 0 ? e.payload.mark : '')}
              />
            </Bar>
            <Bar dataKey="neg" stackId="p" fill={SERIES.red} maxBarSize={24} radius={[0, 0, 4, 4]} isAnimationActive={false}>
              {data.map(b => (
                <Cell key={b.orders} fillOpacity={opacity(b)} />
              ))}
              <LabelList
                content={labelAt('below')}
                valueAccessor={(e: any) => (e.payload.profit < 0 ? e.payload.mark : '')}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ Độ nhạy (tornado) */

export function SensitivityChart({
  shocks,
}: {
  shocks: { label: string; profitDelta: number; breakEvenOrders: number | null }[];
}) {
  const data = shocks.map(s => {
    const d = Math.round(s.profitDelta);
    return { ...s, d, pos: Math.max(0, d), neg: Math.min(0, d) };
  });
  const lim = symmetricLimit(Math.max(...data.map(s => Math.abs(s.d))));
  return (
    <div className="w-full" style={{ height: 24 + data.length * 40 }} role="img" aria-label="Mỗi yếu tố làm lãi lỗ tháng thay đổi bao nhiêu">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" stackOffset="sign" margin={{ top: 4, right: 16, bottom: 4, left: 8 }} barCategoryGap="30%">
          <CartesianGrid stroke={CHART_INK.grid} horizontal={false} />
          <XAxis
            type="number"
            domain={[-lim, lim]}
            ticks={[-lim, -lim / 2, 0, lim / 2, lim]}
            tickFormatter={v => compactMoney(v)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
          />
          <YAxis type="category" dataKey="label" width={250} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <ReferenceLine x={0} stroke={CHART_INK.axis} />
          <Tooltip
            cursor={CURSOR}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const s = payload[0].payload;
              return (
                <TipBox
                  title={s.label}
                  lines={[
                    ['Lãi/lỗ mỗi tháng thay đổi', signedMoney(s.d)],
                    ['Cần để hòa vốn', s.breakEvenOrders === null ? 'Không thể' : `${count(s.breakEvenOrders)} đơn/tháng`],
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="pos" stackId="s" fill={SERIES.green} maxBarSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList
              content={labelAt('right')}
              valueAccessor={(e: any) => (e.payload.d > 0 ? signedCompact(e.payload.d) : '')}
            />
          </Bar>
          <Bar dataKey="neg" stackId="s" fill={SERIES.red} maxBarSize={20} radius={[4, 0, 0, 4]} isAnimationActive={false}>
            <LabelList
              content={labelAt('left')}
              valueAccessor={(e: any) => (e.payload.d < 0 ? signedCompact(e.payload.d) : '')}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ Cơ cấu chi phí cố định */

export function CostBarsChart({ costs }: { costs: { name: string; amount: number }[] }) {
  const data = costs.filter(c => c.name.trim()).sort((a, b) => b.amount - a.amount);
  if (!data.length) return null;
  return (
    <div className="w-full" style={{ height: 16 + data.length * 34 }} role="img" aria-label="Các khoản chi phí cố định, từ lớn đến nhỏ">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 8 }} barCategoryGap="30%">
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={170} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={CURSOR}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TipBox title={payload[0].payload.name} lines={[['Mỗi tháng', money(payload[0].payload.amount)]]} />
              ) : null
            }
          />
          <Bar dataKey="amount" fill={SERIES.blue} maxBarSize={18} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList content={labelAt('right')} valueAccessor={(e: any) => compactMoney(e.payload.amount)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ Phí sàn so với sàn lớn */

// Tham khảo 2026: tổng phí người bán trả mỗi đơn (nguồn tổng hợp, không phải bảng phí chính thức).
const BENCHMARKS = [
  { name: 'Shopee', value: 16.3, text: '≈ 15–18%' },
  { name: 'Etsy', value: 9.5, text: '≈ 9,5%' },
];

export function BenchmarkChart({ rate }: { rate: number }) {
  const data = [
    { name: 'VietCraft', value: Math.round(rate * 1000) / 10, text: `${(Math.round(rate * 1000) / 10).toLocaleString('vi-VN')}%` },
    ...BENCHMARKS,
  ];
  return (
    <div className="h-[150px] w-full" role="img" aria-label="Phí sàn mỗi đơn của VietCraft so với Shopee và Etsy">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 8 }} barCategoryGap="30%">
          <XAxis type="number" hide domain={[0, 20]} />
          <YAxis type="category" dataKey="name" width={80} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Bar dataKey="value" maxBarSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map(d => (
              <Cell key={d.name} fill={d.name === 'VietCraft' ? SERIES.green : MUTED_BAR} />
            ))}
            <LabelList content={labelAt('right')} valueAccessor={(e: any) => e.payload.text} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ Một đơn trung bình chia tiền */

export function OrderSplit({ o }: { o: FinanceOverview }) {
  const n = o.orders.paid;
  if (!n) return <p className="m-0 text-[13px] text-admin-muted">Chưa có đơn đã thanh toán trong kỳ.</p>;
  const shopVoucher = o.discount - o.pnl.platform_voucher;
  const parts = [
    { label: 'Người bán nhận', value: (o.gmv - o.pnl.commission - shopVoucher) / n, color: SERIES.blue },
    { label: 'Phí vận chuyển', value: o.shipping / n, color: MUTED_BAR },
    { label: 'Sàn giữ lại', value: o.pnl.net_revenue / n, color: SERIES.green },
  ];
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0) || 1;
  const perOrderCosts = (o.pnl.payment_fees + o.pnl.refund_losses + o.pnl.notification) / n;
  return (
    <div>
      <div className="text-[13px] text-admin-muted">
        Khách trả trung bình <b className="text-admin-ink">{money(Math.round(o.paid_amount / n))}</b> mỗi đơn, tiền đi về:
      </div>
      <div className="mt-3 flex h-4 w-full gap-[2px]" aria-hidden>
        {parts.map(p => (
          <div
            key={p.label}
            className="h-full first:rounded-l-[4px] last:rounded-r-[4px]"
            style={{ width: `${(Math.max(0, p.value) / total) * 100}%`, minWidth: p.value > 0 ? 4 : 0, backgroundColor: p.color }}
          />
        ))}
      </div>
      <ul className="m-0 mt-3 list-none space-y-1.5 p-0 text-[13px]">
        {parts.map(p => (
          <li key={p.label} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-admin-body">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: p.color }} aria-hidden />
              {p.label}
            </span>
            <span className="tabular-nums text-admin-ink">
              {money(Math.round(p.value))}{' '}
              <span className="text-admin-muted">
                ({((p.value / total) * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mb-0 mt-3 text-[12.5px] leading-[1.6] text-admin-muted">
        Trong {money(Math.round(o.pnl.net_revenue / n))} sàn giữ lại, chi phí theo đơn (phí cổng, đơn hoàn, tin nhắn) là{' '}
        {money(Math.round(perOrderCosts))}, còn lại <b className="text-admin-ink">{signedMoney(Math.round(o.pnl.contribution / n))}</b> để trả
        chi phí cố định.
      </p>
    </div>
  );
}
