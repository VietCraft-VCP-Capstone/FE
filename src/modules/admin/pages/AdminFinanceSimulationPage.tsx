import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Tooltip } from 'antd';
import {
  CreditCard,
  Gauge,
  HelpCircle,
  Loader2,
  Lock,
  type LucideIcon,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Scale,
  Server,
  SlidersHorizontal,
  Split,
  Trash2,
  TrendingDown,
  TrendingUp,
  Undo2,
  Wallet,
} from 'lucide-react';

import {
  adminFinanceService,
  FinanceConfig,
  FinanceOverview,
  OverviewQuery,
  PaymentFee,
  TrendMonth,
} from '../services/adminFinanceService';
import { SCENARIOS, SimInput, profitBars, sensitivity, simulate } from '../services/financeSimulation';
import { Alert, PageHeader, SegmentedControl, StatusPill } from '../components/AdminPrimitives';
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_SECONDARY_SM,
  CARD,
  CARD_HEADER,
  FIELD,
  FIELD_HINT,
  ICON_BTN_DANGER,
  PAGE,
  TABLE,
  TOOLBAR,
  cx,
} from '../components/adminUi';
import {
  BENCHMARKS,
  BenchmarkChart,
  CostBarsChart,
  OrderSplit,
  ProfitBarsChart,
  SensitivityChart,
  TrendBars,
  WaterfallChart,
  monthLabel,
} from '../components/finance/FinanceCharts';
import { SERIES } from '../../../shared/components/charts/chartTheme';
import { count, money } from '../../../shared/utils/format';

type FinanceSection = 'tong-quan' | 'mo-phong' | 'chi-phi';

const SECTIONS: { value: FinanceSection; label: string }[] = [
  { value: 'tong-quan', label: 'Tổng quan' },
  { value: 'mo-phong', label: 'Mô phỏng' },
  { value: 'chi-phi', label: 'Chi phí vận hành' },
];

type RangeKey = '7' | '30' | 'thang-nay' | 'thang-truoc' | '90' | '365' | 'tuy-chon';

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: 'thang-nay', label: 'Tháng này' },
  { value: 'thang-truoc', label: 'Tháng trước' },
  { value: '90', label: '90 ngày' },
  { value: '365', label: '1 năm' },
  { value: 'tuy-chon', label: 'Tùy chọn' },
];

const DAY_MS = 86_400_000;
const MAX_RANGE_DAYS = 365;

// Việt Nam không đổi giờ theo mùa nên cộng cố định 7 giờ, giống BE.
const vnDate = (t: number) => new Date(t + 7 * 3_600_000).toISOString().slice(0, 10);
const dmy = (t: number) => vnDate(t).split('-').reverse().join('/');

/** 0 = tháng này, −1 = tháng trước. Gửi tới cuối tháng, BE tự cắt về hết hôm nay. */
function monthQuery(offset: number): OverviewQuery {
  const [y, m] = vnDate(Date.now()).split('-').map(Number);
  const day = (month: number, d: number) => new Date(Date.UTC(y, month, d)).toISOString().slice(0, 10);
  return { from: day(m - 1 + offset, 1), to: day(m + offset, 0) };
}

function presetQuery(key: RangeKey): OverviewQuery {
  if (key === 'thang-nay') return monthQuery(0);
  if (key === 'thang-truoc') return monthQuery(-1);
  return { days: Number(key) };
}

/** Cùng luật với BE để báo lỗi ngay khi chọn; BE vẫn kiểm lại. */
function customError({ from, to }: { from: string; to: string }, today: string): string {
  if (!from || !to) return 'Chọn đủ ngày bắt đầu và ngày kết thúc.';
  if (from > to) return 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.';
  if (from > today) return 'Ngày bắt đầu không được ở tương lai.';
  if ((Date.parse(to < today ? to : today) - Date.parse(from)) / DAY_MS + 1 > MAX_RANGE_DAYS) {
    return `Khoảng thời gian tối đa ${MAX_RANGE_DAYS} ngày.`;
  }
  return '';
}

/** "trong 30 ngày qua" khi kỳ kéo tới hôm nay, ngược lại "từ 01/09/2026 đến 30/09/2026". */
function periodText(p: FinanceOverview['period']): string {
  const last = Date.parse(p.to) - 1;
  return vnDate(last) >= vnDate(Date.now())
    ? `trong ${p.days} ngày qua`
    : `từ ${dmy(Date.parse(p.from))} đến ${dmy(last)}`;
}

/** Giống `gatewayCode` ở BE: "Ví MoMo" → "VI_MOMO". Chỉ để xem trước, BE mới là nơi tạo mã. */
function gatewayCode(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Kỳ chưa có đơn thì mô phỏng cần điểm xuất phát; giao diện ghi rõ đây là giả định.
const ASSUMED = { orders: 100, aov: 200_000, shipping: 30_000 };

function pct(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return `${(v * 100).toLocaleString('vi-VN', { maximumFractionDigits: digits })}%`;
}

// Dấu trừ thật "−" giống nhãn biểu đồ.
function signedMoney(v: number): string {
  return v > 0 ? `+${money(v)}` : v < 0 ? `−${money(-v)}` : money(0);
}

const round2 = (v: number) => Math.round(v * 100) / 100;
const months = (v: number) => `${v.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tháng`;

/** % thay đổi so với kỳ trước; kỳ trước bằng 0 thì không so được (null), tránh "+100%" bịa. */
function changePercent(now: number, before: number): number | null {
  if (!before) return null;
  return Math.round(((now - before) / Math.abs(before)) * 1000) / 10;
}

function baselineOf(o: FinanceOverview): SimInput {
  const b = o.baseline;
  return {
    orders: o.orders.paid > 0 ? o.monthly.orders : ASSUMED.orders,
    aov: b.aov ?? ASSUMED.aov,
    shipping: b.shipping_per_order ?? ASSUMED.shipping,
    commissionPercent: b.commission_percent,
    paymentFeeRate: b.payment_fee_rate,
    refundRate: b.refund_rate,
    refundFeeRatio: b.refund_fee_ratio,
    voucherPerOrder: b.voucher_per_order,
    notificationPerOrder: b.notification_per_order,
    monthlyFixed: o.monthly.fixed_costs,
  };
}

/** Câu chốt của biểu đồ 6 tháng; lấy tháng đủ ngày gần nhất vì tháng đang chạy chưa trọn. */
function trendSummary(trend: TrendMonth[]): string {
  const n = trend.length;
  if (!n) return '';
  const good = trend.filter(t => t.net_profit >= 0).length;
  const head = good === 0 ? `Cả ${n} tháng đều lỗ.` : good === n ? `Cả ${n} tháng đều có lãi.` : `${good}/${n} tháng có lãi.`;
  const last = [...trend].reverse().find(t => !t.partial && t.fixed_costs > 0);
  return last
    ? `${head} Tháng ${monthLabel(last)} lãi góp bằng ${pct(last.contribution / last.fixed_costs)} chi phí cố định.`
    : head;
}

function benchmarkSummary(rate: number): string {
  const v = Math.round(rate * 1000) / 10;
  const lower = BENCHMARKS.filter(b => v < b.value).map(b => b.name);
  const higher = BENCHMARKS.filter(b => v >= b.value).map(b => b.name);
  return [
    `VietCraft thu ${v.toLocaleString('vi-VN')}% mỗi đơn`,
    lower.length ? `thấp hơn ${lower.join(' và ')}` : '',
    higher.length ? `cao hơn ${higher.join(' và ')}` : '',
  ]
    .filter(Boolean)
    .join(', ')
    .concat('.');
}

/** Báo ngay sau khi lưu: số nào đã đổi vì chi phí mới. */
function savedNotice(before: FinanceOverview | null, after: FinanceOverview | null): string {
  if (!before || !after) return 'Đã lưu cấu hình. Số liệu ở các tab đã tính lại.';
  const be = (o: FinanceOverview) =>
    o.monthly.break_even_orders === null ? 'không thể hòa vốn' : `${count(o.monthly.break_even_orders)} đơn/tháng`;
  const parts: string[] = [];
  if (before.monthly.break_even_orders !== after.monthly.break_even_orders) {
    parts.push(`cần để hòa vốn ${be(before)} → ${be(after)}`);
  }
  if (before.pnl.net_profit !== after.pnl.net_profit) {
    parts.push(`lãi/lỗ ${periodText(after.period)} ${signedMoney(before.pnl.net_profit)} → ${signedMoney(after.pnl.net_profit)}`);
  }
  if (after.monthly.runway_months !== null && before.monthly.runway_months !== after.monthly.runway_months) {
    parts.push(`vốn dự phòng trụ được ${months(after.monthly.runway_months)}`);
  }
  return `Đã lưu cấu hình${parts.length ? `: ${parts.join(' · ')}` : ''}. Số liệu ở các tab đã tính lại.`;
}

/* ------------------------------------------------------------------ Thành phần nhỏ */

const GLOSSARY: [string, string][] = [
  ['Tổng tiền hàng (GMV)', 'Tổng giá trị hàng bán qua sàn. Đây là tiền của người bán, sàn chỉ giữ hộ.'],
  ['Hoa hồng', 'Phần sàn thu trên mỗi đơn (mặc định 5% tiền người bán muốn nhận, cộng vào giá khách trả).'],
  ['Voucher sàn', 'Mã giảm giá do sàn tài trợ: khách được giảm nhưng người bán vẫn nhận đủ, sàn bù phần chênh.'],
  ['Doanh thu thuần', 'Hoa hồng trừ phần voucher sàn bù cho khách — phần thật sự thuộc về sàn.'],
  ['Phí cổng thanh toán', 'Phí cổng (và phí thu hộ COD) tính trên toàn bộ tiền khách trả, gồm cả ship.'],
  ['Thất thoát do hoàn tiền', 'Đơn bị hoàn: cổng không trả lại phí đã thu, và sàn không thu được hoa hồng của đơn đó.'],
  ['Take rate', 'Doanh thu thuần chia tổng tiền hàng: sàn giữ được bao nhiêu % trên mỗi đồng hàng bán ra.'],
  ['Biến phí', 'Chi phí sinh ra theo từng đơn: phí cổng thanh toán, tin nhắn, phí cổng mất ở đơn hoàn.'],
  ['Chi phí cố định (định phí)', 'Trả mỗi tháng dù không bán được gì: server, tên miền, hosting…'],
  ['Lãi góp', 'Doanh thu thuần trừ biến phí: mỗi đơn góp bao nhiêu để trả chi phí cố định.'],
  ['Lãi/lỗ ròng', 'Lãi góp trừ chi phí cố định: sau mọi chi phí, sàn thật sự lãi hay lỗ bao nhiêu.'],
  ['Hòa vốn', 'Số đơn (hoặc tiền hàng) mỗi tháng để tổng lãi góp vừa bằng chi phí cố định. Ít hơn là lỗ, nhiều hơn là lãi.'],
  ['Biên an toàn', 'Đang vượt điểm hòa vốn bao nhiêu %. Càng cao càng an toàn.'],
  ['Runway (số tháng trụ được)', 'Vốn dự phòng chia cho số lỗ mỗi tháng — nếu cứ lỗ như vậy thì vốn đủ bù trong bao lâu.'],
];
const TERMS = new Map(GLOSSARY);

/** Nút "?" cạnh thuật ngữ: rê chuột, chạm hoặc Tab tới để đọc nghĩa ngay tại chỗ. */
function Hint({ term }: { term: string }) {
  const id = useId();
  const text = TERMS.get(term);
  if (!text) return null;
  return (
    <Tooltip title={text} trigger={['hover', 'focus']}>
      <button
        type="button"
        aria-label={`${term} là gì?`}
        aria-describedby={id}
        className="ml-1 inline-flex cursor-help items-center rounded-sm align-[-2px] text-admin-muted transition-colors duration-150 hover:text-admin-ink focus-visible:text-admin-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand/30"
      >
        <HelpCircle size={13} aria-hidden />
        <span id={id} className="sr-only">
          {text}
        </span>
      </button>
    </Tooltip>
  );
}

function Delta({ value, format }: { value: number | null; format: (v: number) => string }) {
  if (value === null) return <span className="text-[12px] text-admin-muted">kỳ trước chưa có số liệu</span>;
  if (value === 0) return <span className="text-[12px] text-admin-muted">không đổi so với kỳ trước</span>;
  const up = value > 0;
  return (
    <span className={cx('inline-flex items-center gap-1 text-[12px] font-bold', up ? 'text-admin-brand-700' : 'text-[#b91c1c]')}>
      {up ? <TrendingUp size={13} aria-hidden /> : <TrendingDown size={13} aria-hidden />}
      {format(value)} <span className="font-medium text-admin-muted">so với kỳ trước</span>
    </span>
  );
}

type Tone = 'good' | 'bad' | undefined;
const TONE_INK = (tone: Tone) => (tone === 'good' ? 'text-admin-brand' : tone === 'bad' ? 'text-[#b91c1c]' : 'text-admin-ink');
const toneOf = (v: number | null | undefined): Tone => (v === null || v === undefined ? undefined : v < 0 ? 'bad' : 'good');

const LABEL = 'flex items-center text-[12px] font-semibold text-admin-muted';

/** Một ô trong dải chỉ số; các ô ngăn nhau bằng khe 1px của nền viền (gap-px) nên xếp mấy cột cũng đều. */
function Kpi({
  label,
  term,
  value,
  tone,
  delta,
  sub,
}: {
  label: string;
  term?: string;
  value: string;
  tone?: Tone;
  delta?: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 bg-admin-surface px-5 py-4">
      <div className={LABEL}>
        {label}
        {term && <Hint term={term} />}
      </div>
      <div className={cx('mt-1.5 text-[22px] font-bold leading-tight tracking-[-0.01em]', TONE_INK(tone))}>{value}</div>
      {delta && <div className="mt-1">{delta}</div>}
      {sub && <div className="mt-0.5 text-[12px] text-admin-muted">{sub}</div>}
    </div>
  );
}

/** Ô kết quả của tab Mô phỏng; ô nhấn mạnh được tô nền theo lãi/lỗ. */
function Metric({
  label,
  term,
  value,
  tone,
  sub,
  emphasis,
}: {
  label: string;
  term?: string;
  value: string;
  tone?: Tone;
  sub?: React.ReactNode;
  emphasis?: boolean;
}) {
  const box =
    emphasis && tone === 'bad'
      ? 'border-[#f6caca] bg-admin-danger-050'
      : emphasis && tone === 'good'
        ? 'border-[#b7e0b7] bg-admin-brand-050'
        : 'border-admin-line bg-admin-surface';
  return (
    <div className={cx('rounded-admin border px-4 py-3', box)}>
      <div className={LABEL}>
        {label}
        {term && <Hint term={term} />}
      </div>
      <div className={cx('mt-1 text-[22px] font-bold leading-tight tracking-[-0.01em]', TONE_INK(tone))}>{value}</div>
      {sub && <div className="mt-0.5 text-[12px] text-admin-muted">{sub}</div>}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  sub,
  actions,
  className,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cx(CARD, 'mb-5', className)}>
      <div className={CARD_HEADER}>
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-admin-brand-050 text-admin-brand" aria-hidden>
              <Icon size={16} />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="m-0 text-[15px] font-bold text-admin-ink">{title}</h2>
            {sub && <p className="m-0 mt-0.5 text-[12px] text-admin-muted">{sub}</p>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** Ô nhập tiền hiện dấu chấm ngăn cách (1.200.000) cho dễ đọc. */
function MoneyInput({
  value,
  onChange,
  label,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={Math.round(value || 0).toLocaleString('vi-VN')}
      onChange={e => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
      className={cx(FIELD, 'py-2 text-right tabular-nums', className)}
    />
  );
}

function SimField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  hint?: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <label htmlFor={id} className="text-[13px] font-semibold text-admin-ink">
          {label}
        </label>
        <div className="flex shrink-0 items-center gap-1.5">
          {unit === 'đ' ? (
            <MoneyInput value={value} onChange={v => onChange(Math.max(min, v))} label={label} className="w-[140px] py-1.5" />
          ) : (
            <input
              id={id}
              type="number"
              min={min}
              step={step}
              value={value}
              onChange={e => onChange(Math.max(min, Number(e.target.value) || 0))}
              className={cx(FIELD, 'w-[140px] py-1.5 text-right tabular-nums')}
            />
          )}
          <span className="w-9 text-[12px] text-admin-muted">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(value, max)}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-2 w-full cursor-pointer accent-admin-brand"
      />
      {hint && <p className={cx(FIELD_HINT, 'mt-0')}>{hint}</p>}
    </div>
  );
}

interface FlowRow {
  label: string;
  term?: string;
  note?: string;
  value: number;
  kind: 'in' | 'out' | 'sum';
}

// Cùng màu với cột tương ứng trong biểu đồ thác nước để mắt nối bảng với cột.
const FLOW_DOT = { in: SERIES.green, out: SERIES.red, sum: '#9ca3af' };

/** Bảng số đi kèm biểu đồ thác nước. */
function MoneyFlow({ rows }: { rows: FlowRow[] }) {
  return (
    <ul className="m-0 list-none p-0">
      {rows.map(r => {
        const sum = r.kind === 'sum';
        const text =
          r.value === 0
            ? money(0)
            : r.kind === 'in'
              ? `+${money(r.value)}`
              : r.kind === 'out'
                ? `−${money(r.value)}`
                : signedMoney(r.value);
        return (
          <li
            key={r.label}
            className={cx(
              'flex items-start justify-between gap-4 border-b border-admin-line-soft px-[18px] py-2 last:border-b-0',
              sum && 'bg-[#fafcfa]'
            )}
          >
            <div className="flex min-w-0 gap-2.5 [overflow-wrap:anywhere]">
              <span className="mt-[5px] h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: FLOW_DOT[r.kind] }} aria-hidden />
              <div className="min-w-0">
                <div className={cx('text-[13px] text-admin-ink', sum ? 'font-bold' : 'font-medium')}>
                  {r.label}
                  {r.term && <Hint term={r.term} />}
                </div>
                {r.note && <div className="text-[11.5px] leading-[1.45] text-admin-muted">{r.note}</div>}
              </div>
            </div>
            <div
              className={cx(
                'shrink-0 text-right text-[13.5px] tabular-nums',
                sum ? cx('font-bold', TONE_INK(toneOf(r.value))) : 'font-medium text-admin-ink'
              )}
            >
              {text}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const STATUS = {
  good: { pill: 'brand', label: 'Có lãi', bar: SERIES.green },
  warn: { pill: 'warn', label: 'Đang lỗ', bar: SERIES.red },
  bad: { pill: 'danger', label: 'Lỗ theo từng đơn', bar: SERIES.red },
  none: { pill: 'neutral', label: 'Chưa có đơn', bar: SERIES.red },
} as const;

/** Đầu trang: lãi/lỗ ròng và tiến độ tới hòa vốn, kèm một câu vì sao và việc nên làm. Mỗi số chỉ xuất hiện ở đây. */
function Summary({ o, cash }: { o: FinanceOverview; cash: number }) {
  const profit = o.pnl.net_profit;
  const be = o.monthly.break_even_orders;
  const perMonth = o.monthly.orders;
  const cpo = o.contribution_per_order ?? 0;
  const runway = o.monthly.runway_months;
  const reach = be ? Math.min(100, (perMonth / be) * 100) : 0;
  const state: keyof typeof STATUS = !o.orders.paid ? 'none' : profit >= 0 ? 'good' : be === null ? 'bad' : 'warn';
  const s = STATUS[state];
  const tab = (key: string, text: string) => (
    <Link to={`/admin/finance?tab=${key}`} className="font-semibold text-admin-brand hover:underline">
      {text}
    </Link>
  );

  const why =
    state === 'none'
      ? 'Chưa có đơn đã thanh toán trong kỳ; tab Mô phỏng đang dùng số giả định.'
      : state === 'good'
        ? `Đạt khoảng ${count(perMonth)} đơn/tháng, vượt mức hòa vốn ${count(be ?? 0)} đơn.`
        : state === 'bad'
          ? `${cpo < 0 ? `Mỗi đơn làm sàn lỗ thêm ${money(-cpo)}` : 'Mỗi đơn không góp được đồng nào'} vì phí cổng, voucher sàn và hoàn tiền lớn hơn hoa hồng — bán thêm cũng không hòa vốn.`
          : `Mỗi đơn góp ${money(cpo)} để trả chi phí cố định ${money(o.monthly.fixed_costs)}/tháng.`;
  const advice =
    state === 'good' ? (
      <>Thử kịch bản Bi quan ở tab {tab('mo-phong', 'Mô phỏng')} để xem nếu đơn giảm thì còn lãi không.</>
    ) : state === 'bad' ? (
      <>Tăng hoa hồng hoặc giảm voucher sàn; thử trước ở tab {tab('mo-phong', 'Mô phỏng')}.</>
    ) : (
      <>Thử tăng số đơn, hoa hồng hoặc giảm chi phí ở tab {tab('mo-phong', 'Mô phỏng')} để xem cách nào giảm lỗ nhiều nhất.</>
    );
  const lasts =
    runway !== null ? (
      <>
        Vốn dự phòng {money(cash)} đủ bù lỗ khoảng <b className="text-admin-ink">{months(runway)}</b>.
      </>
    ) : (
      <>Chưa biết — nhập vốn dự phòng ở tab {tab('chi-phi', 'Chi phí vận hành')}.</>
    );

  return (
    <section aria-label="Kết luận" className={cx(CARD, 'mb-4')}>
      <div className="grid grid-cols-1 gap-px bg-admin-line lg:grid-cols-2">
        <div className="bg-admin-surface px-5 py-[18px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className={LABEL}>
              Lãi/lỗ ròng {periodText(o.period)}
              <Hint term="Lãi/lỗ ròng" />
            </span>
            <StatusPill tone={s.pill}>{s.label}</StatusPill>
          </div>
          <div className={cx('mt-2 text-[34px] font-bold leading-none tracking-[-0.02em]', TONE_INK(toneOf(profit)))}>
            {signedMoney(profit)}
          </div>
          <div className="mt-2">
            <Delta value={profit - o.previous.net_profit} format={signedMoney} />
          </div>
          <p className="mb-0 mt-3 max-w-[60ch] text-[13px] leading-[1.55] text-admin-body">{why}</p>
        </div>

        <div className="bg-admin-surface px-5 py-[18px]">
          <span className={LABEL}>
            Đơn mỗi tháng so với mức hòa vốn
            <Hint term="Hòa vốn" />
          </span>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
            <span className="text-[34px] font-bold leading-none tracking-[-0.02em] text-admin-ink">{count(perMonth)}</span>
            <span className="text-[15px] font-semibold text-admin-muted">/ {be === null ? '—' : count(be)} đơn</span>
          </div>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-admin-line-soft"
            role="progressbar"
            aria-label="Tiến độ tới hòa vốn"
            aria-valuenow={Math.floor(reach)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full" style={{ width: `${reach}%`, backgroundColor: reach >= 100 ? SERIES.green : s.bar }} />
          </div>
          <p className="mb-0 mt-2.5 text-[13px] leading-[1.55] text-admin-body">
            {be === null ? (
              'Không thể hòa vốn ở mức phí hiện tại.'
            ) : perMonth >= be ? (
              <>Đã vượt hòa vốn, biên an toàn <b className="text-admin-ink">{pct(o.monthly.margin_of_safety)}</b>.</>
            ) : (
              <>
                Đạt {Math.floor(reach)}% — còn thiếu <b className="text-admin-ink">{count(be - perMonth)} đơn/tháng</b>
                {o.monthly.break_even_gmv !== null && <>, tức khoảng {money(o.monthly.break_even_gmv)} tiền hàng/tháng</>}.
              </>
            )}
          </p>
        </div>
      </div>

      <dl className="m-0 grid grid-cols-1 gap-x-8 gap-y-1.5 border-t border-admin-line bg-[#fafcfa] px-5 py-3 text-[12.5px] leading-[1.55] lg:grid-cols-2">
        {profit < 0 && (
          <div className="flex gap-2">
            <dt className="shrink-0 font-bold text-admin-ink">Trụ được:</dt>
            <dd className="m-0 text-admin-body">{lasts}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="shrink-0 font-bold text-admin-ink">Nên làm gì:</dt>
          <dd className="m-0 text-admin-body">{advice}</dd>
        </div>
      </dl>
    </section>
  );
}

/** Tab gạch chân giữa các mục của trang; tab nằm trên URL (?tab=...) để tải lại hay mở link vẫn đúng mục. */
function SectionTabs({ value, onChange }: { value: FinanceSection; onChange: (v: FinanceSection) => void }) {
  return (
    <div role="tablist" aria-label="Mục tài chính" className="mb-5 flex gap-1 overflow-x-auto border-b border-admin-line">
      {SECTIONS.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              '-mb-px cursor-pointer whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-4 py-2.5 text-[14px] font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-admin-brand motion-reduce:transition-none',
              active ? 'border-admin-brand text-admin-brand' : 'border-transparent text-admin-muted hover:text-admin-ink'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Glossary() {
  return (
    <details className={cx(CARD, 'mb-5')}>
      <summary className="cursor-pointer select-none px-[18px] py-3 text-[14px] font-bold text-admin-ink">
        Giải thích thuật ngữ
      </summary>
      <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-admin-line px-[18px] py-4 md:grid-cols-2">
        {GLOSSARY.map(([term, desc]) => (
          <div key={term}>
            <dt className="text-[13px] font-bold text-admin-ink">{term}</dt>
            <dd className="m-0 text-[12.5px] leading-[1.55] text-admin-muted">{desc}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/* ------------------------------------------------------------------ Trang */

export function AdminFinanceSimulationPage() {
  const [params, setParams] = useSearchParams();
  const section = SECTIONS.find(s => s.value === params.get('tab'))?.value ?? 'tong-quan';
  const [range, setRange] = useState<RangeKey>('30');
  const [query, setQuery] = useState<OverviewQuery>({ days: 30 });
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [config, setConfig] = useState<FinanceConfig | null>(null);
  const [form, setForm] = useState<FinanceConfig | null>(null);
  const [sim, setSim] = useState<SimInput | null>(null);
  const [scenario, setScenario] = useState<string>('base');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async (q: OverviewQuery): Promise<FinanceOverview | null> => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const [o, c] = await Promise.all([adminFinanceService.getOverview(q), adminFinanceService.getConfig()]);
      if (id !== requestId.current) return null;
      setOverview(o);
      setConfig(c);
      setForm(c);
      setSim(baselineOf(o));
      setScenario('base');
      return o;
    } catch (err: any) {
      if (id === requestId.current) {
        setError(err?.response?.data?.error || 'Không tải được số liệu tài chính. Bấm "Làm mới" để thử lại.');
      }
      return null;
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(query);
  }, [query, load]);

  const base = useMemo(() => (overview ? baselineOf(overview) : null), [overview]);
  const baseResult = useMemo(() => (base ? simulate(base) : null), [base]);
  const result = useMemo(() => (sim ? simulate(sim) : null), [sim]);
  const bars = useMemo(() => (sim ? profitBars(sim) : []), [sim]);
  const shocks = useMemo(() => (sim ? sensitivity(sim) : []), [sim]);
  const dirty = JSON.stringify(form) !== JSON.stringify(config);
  const costsInvalid = !!form?.monthly_costs.some(c => !c.name.trim());
  const gatewaysInvalid = !!form?.payment_fees.some(g => !g.is_default && !gatewayCode(g.name));
  const formInvalid = costsInvalid || gatewaysInvalid;
  const cash = config?.cash_reserve ?? 0;

  const setSimField = (patch: Partial<SimInput>) => {
    setSim(s => (s ? { ...s, ...patch } : s));
    setScenario('');
  };

  const pickScenario = (key: string) => {
    const s = SCENARIOS.find(x => x.key === key);
    if (!s || !base) return;
    setSim(s.apply(base));
    setScenario(key);
  };

  const pickRange = (key: RangeKey) => {
    if (key === range) return;
    setRange(key);
    if (key !== 'tuy-chon') setQuery(presetQuery(key));
    // Mở "Tùy chọn" thì điền sẵn kỳ đang xem để chỉ cần sửa.
    else if (overview) {
      setCustom({ from: vnDate(Date.parse(overview.period.from)), to: vnDate(Date.parse(overview.period.to) - 1) });
    }
  };

  const updateCost = (idx: number, patch: Partial<FinanceConfig['monthly_costs'][number]>) =>
    setForm(f => f && { ...f, monthly_costs: f.monthly_costs.map((c, i) => (i === idx ? { ...c, ...patch } : c)) });

  const updateFee = (idx: number, patch: Partial<PaymentFee>) =>
    setForm(f => f && { ...f, payment_fees: f.payment_fees.map((g, i) => (i === idx ? { ...g, ...patch } : g)) });

  const save = async () => {
    if (!form) return;
    const before = overview;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await adminFinanceService.updateConfig({
        ...form,
        monthly_costs: form.monthly_costs.map(c => ({ ...c, name: c.name.trim() })),
      });
      setNotice(savedNotice(before, await load(query)));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Lưu cấu hình thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <>
      <PageHeader
        title="Tài chính"
        description="Sàn thu bao nhiêu, tốn bao nhiêu và cần bán bao nhiêu đơn để hòa vốn. Chỉ tính đơn đã thanh toán."
      />
      <SectionTabs value={section} onChange={v => setParams(v === 'tong-quan' ? {} : { tab: v })} />
    </>
  );

  if (loading && !overview) {
    return (
      <div className={PAGE}>
        {header}
        <div className="flex items-center gap-2.5 py-16 text-[13.5px] text-admin-muted">
          <Loader2 size={18} className="animate-spin" aria-hidden /> Đang tính số liệu tài chính…
        </div>
      </div>
    );
  }

  const o = overview;
  const today = vnDate(Date.now());
  const customErr = range === 'tuy-chon' ? customError(custom, today) : '';
  const refreshButton = (
    <button type="button" className={BTN_SECONDARY} onClick={() => void load(query)} disabled={loading}>
      <RefreshCw size={15} className={cx(loading && 'animate-spin')} aria-hidden /> Làm mới
    </button>
  );

  /* ---------------------------------------------------------------- Tab Tổng quan */
  const renderOverview = (o: FinanceOverview) => {
    const days = o.period.days;
    const prev = o.previous;
    const cpo = o.contribution_per_order;
    const prevCpo = prev.orders ? Math.round(prev.contribution / prev.orders) : null;
    const pctFormat = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toLocaleString('vi-VN')}%`;
    const feeRate = o.gmv > 0 ? o.pnl.commission / o.gmv : o.commission_percent / (100 + o.commission_percent);
    const mix = o.payment_mix.filter(m => m.orders);
    const flow: FlowRow[] = [
      {
        label: 'Hoa hồng thu được',
        term: 'Hoa hồng',
        note: `${count(o.orders.paid)} đơn đã thanh toán`,
        value: o.pnl.commission,
        kind: 'in',
      },
      { label: 'Voucher sàn tài trợ', term: 'Voucher sàn', value: o.pnl.platform_voucher, kind: 'out' },
      { label: 'Doanh thu thuần', term: 'Doanh thu thuần', value: o.pnl.net_revenue, kind: 'sum' },
      {
        label: 'Phí cổng thanh toán',
        term: 'Phí cổng thanh toán',
        note: mix.length ? mix.map(m => `${m.name} ${count(m.orders)}`).join(' · ') + ' đơn' : undefined,
        value: o.pnl.payment_fees,
        kind: 'out',
      },
      {
        label: 'Thất thoát do hoàn tiền',
        term: 'Thất thoát do hoàn tiền',
        note: o.orders.refunded
          ? `${count(o.orders.refunded)} đơn hoàn, mất hoa hồng ${money(o.refunded_commission)}`
          : 'Không có đơn hoàn',
        value: o.pnl.refund_losses,
        kind: 'out',
      },
      {
        label: 'Gửi thông báo email/SMS',
        note: `${count(o.orders.paid + o.orders.refunded)} đơn × ${money(o.baseline.notification_per_order)}`,
        value: o.pnl.notification,
        kind: 'out',
      },
      { label: 'Lãi góp', term: 'Lãi góp', value: o.pnl.contribution, kind: 'sum' },
      {
        label: 'Chi phí cố định',
        term: 'Chi phí cố định (định phí)',
        note: `${money(o.monthly.fixed_costs)}/tháng × ${days} ngày`,
        value: o.pnl.fixed_costs,
        kind: 'out',
      },
      { label: 'Lãi/lỗ ròng', term: 'Lãi/lỗ ròng', value: o.pnl.net_profit, kind: 'sum' },
    ];

    return (
      <>
        <div className={cx(TOOLBAR, 'justify-between')}>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <div className="max-w-full overflow-x-auto">
              <SegmentedControl<RangeKey> value={range} onChange={pickRange} options={RANGE_OPTIONS} label="Khoảng thời gian" />
            </div>
            {/* w-full/py-2.5 của FIELD đứng sau trong CSS và cx không gộp lớp, nên ô ngày phải ghi đè bằng "!". */}
            {range === 'tuy-chon' && (
              <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={e => {
                  e.preventDefault();
                  if (!customErr) setQuery({ ...custom });
                }}
              >
                <input
                  type="date"
                  aria-label="Từ ngày"
                  value={custom.from}
                  max={today}
                  onChange={e => setCustom(c => ({ ...c, from: e.target.value }))}
                  className={cx(FIELD, '!w-[150px] !py-1.5')}
                />
                <span className="text-admin-muted">–</span>
                <input
                  type="date"
                  aria-label="Đến ngày"
                  value={custom.to}
                  min={custom.from || undefined}
                  max={today}
                  onChange={e => setCustom(c => ({ ...c, to: e.target.value }))}
                  className={cx(FIELD, '!w-[150px] !py-1.5')}
                />
                <button type="submit" className={BTN_SECONDARY_SM} disabled={!!customErr || loading}>
                  Xem
                </button>
                <span aria-live="polite" className="text-[12px] text-[#b91c1c]">
                  {customErr}
                </span>
              </form>
            )}
            <span className="text-[12.5px] text-admin-muted">
              {dmy(Date.parse(o.period.from))} – {dmy(Date.parse(o.period.to) - 1)} · so với {days} ngày liền trước · mức
              hoa hồng mặc định <b className="text-admin-ink">{o.commission_percent}%</b>
            </span>
          </div>
          {refreshButton}
        </div>

        <div className={cx('transition-opacity duration-150', loading && 'opacity-60')}>
          <Summary o={o} cash={cash} />

          <div className={cx(CARD, 'mb-5 grid grid-cols-1 gap-px bg-admin-line sm:grid-cols-2 xl:grid-cols-4')}>
            <Kpi
              label="Doanh thu thuần"
              term="Doanh thu thuần"
              value={money(o.pnl.net_revenue)}
              delta={<Delta value={changePercent(o.pnl.net_revenue, prev.net_revenue)} format={pctFormat} />}
            />
            <Kpi
              label="Lãi góp mỗi đơn"
              term="Lãi góp"
              value={cpo === null ? '—' : signedMoney(cpo)}
              tone={cpo !== null && cpo < 0 ? 'bad' : undefined}
              delta={
                <Delta
                  value={cpo !== null && prevCpo !== null ? cpo - prevCpo : null}
                  format={v => `${signedMoney(v)}/đơn`}
                />
              }
            />
            <Kpi
              label="Đơn đã thanh toán"
              value={count(o.orders.paid)}
              delta={<Delta value={changePercent(o.orders.paid, prev.orders)} format={pctFormat} />}
            />
            <Kpi
              label="Tổng tiền hàng (GMV)"
              term="Tổng tiền hàng (GMV)"
              value={money(o.gmv)}
              delta={<Delta value={changePercent(o.gmv, prev.gmv)} format={pctFormat} />}
              sub={
                <>
                  Sàn giữ {pct(o.take_rate)}
                  <Hint term="Take rate" />
                </>
              }
            />
          </div>

          <Panel icon={Receipt} title={`Tiền đi đâu ${periodText(o.period)}`} sub="Từ hoa hồng sàn thu, trừ dần từng khoản chi tới lãi/lỗ ròng.">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <div className="min-w-0 px-[18px] pt-4 xl:pb-2">
                <WaterfallChart o={o} height={380} />
              </div>
              <div className="border-t border-admin-line xl:border-l xl:border-t-0">
                <MoneyFlow rows={flow} />
              </div>
            </div>
          </Panel>

          <Panel icon={TrendingUp} title="Xu hướng 6 tháng gần nhất" sub={trendSummary(o.trend)}>
            <div className="px-[18px] pt-4">
              <TrendBars trend={o.trend} />
            </div>
            <p className={cx(FIELD_HINT, 'm-0 px-[18px] pb-3')}>
              Tháng nào cột Lãi góp cao hơn cột Chi phí cố định là tháng đó có lãi. * Tháng này tính đến hôm nay; các tháng
              trước dùng chi phí cố định đang cấu hình.
            </p>
            <details className="border-t border-admin-line">
              <summary className="cursor-pointer select-none px-[18px] py-3 text-[13px] font-semibold text-admin-ink">
                Xem bảng số theo tháng
              </summary>
              <div className="overflow-x-auto">
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th>Tháng</th>
                    <th className="text-right">Đơn</th>
                    <th className="text-right">Lãi góp</th>
                    <th className="text-right">Chi phí cố định</th>
                    <th className="text-right">Lãi/lỗ</th>
                  </tr>
                </thead>
                <tbody>
                  {o.trend.map(t => (
                    <tr key={t.month}>
                      <td>{monthLabel(t)}</td>
                      <td className="text-right tabular-nums">{count(t.orders)}</td>
                      <td className="text-right tabular-nums">{money(t.contribution)}</td>
                      <td className="text-right tabular-nums">{money(t.fixed_costs)}</td>
                      <td
                        className={cx(
                          'text-right font-semibold tabular-nums',
                          t.net_profit < 0 ? 'text-[#b91c1c]' : 'text-admin-brand'
                        )}
                      >
                        {signedMoney(t.net_profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </details>
          </Panel>

          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel
              icon={Split}
              title="Một đơn trung bình chia tiền thế nào"
              sub="Tiền khách trả chia cho người bán, vận chuyển và sàn."
              className="mb-0"
            >
              <div className="p-[18px]">
                <OrderSplit o={o} />
              </div>
            </Panel>
            <Panel icon={Scale} title="Phí sàn mỗi đơn so với các sàn lớn" sub={benchmarkSummary(feeRate)} className="mb-0">
              <div className="px-[18px] pt-3">
                <BenchmarkChart rate={feeRate} />
              </div>
              <p className={cx(FIELD_HINT, 'm-0 px-[18px] pb-4')}>
                Phí VietCraft = hoa hồng ÷ tổng tiền hàng. Shopee: phí cố định 9–12% + phí xử lý giao dịch 6%. Etsy: 6,5% +
                3% thanh toán. Số đối thủ là tham khảo 2026 từ nguồn tổng hợp.
              </p>
            </Panel>
          </div>

          <Glossary />
        </div>
      </>
    );
  };

  /* ---------------------------------------------------------------- Tab Mô phỏng */
  const renderSimulation = (sim: SimInput, result: ReturnType<typeof simulate>) => {
    const runway = result.netProfit < 0 && cash > 0 ? cash / -result.netProfit : null;
    const ref = o?.orders.paid ? 'số thật' : 'giả định ban đầu';
    // Lệch so với điểm xuất phát: kéo thanh nào là thấy ngay lãi/lỗ đổi bao nhiêu.
    const vsBase = (now: number, then: number | undefined, format: (v: number) => string) => {
      const d = Math.round(now - (then ?? now));
      if (!d) return <span>Bằng {ref}</span>;
      return (
        <span className={cx('font-semibold', d > 0 ? 'text-admin-brand-700' : 'text-[#b91c1c]')}>
          {format(d)} <span className="font-normal text-admin-muted">so với {ref}</span>
        </span>
      );
    };
    const receipt: [string, number][] = [
      ['Hoa hồng', result.commissionPerOrder],
      ['Phí cổng thanh toán', -result.paymentFeePerOrder],
      ['Voucher sàn', -sim.voucherPerOrder],
      ['Thất thoát do hoàn tiền', -result.refundLossPerOrder],
      ['Gửi thông báo', -sim.notificationPerOrder],
    ];
    const top = shocks[0];
    const topDelta = top ? Math.round(top.profitDelta) : 0;
    return (
      <>
        <Panel
          icon={SlidersHorizontal}
          title="Mô phỏng: nếu thay đổi thì sao?"
          sub={
            scenario === 'base'
              ? o?.orders.paid
                ? `Xuất phát từ số thật ${periodText(o.period)} — đổi kỳ ở tab Tổng quan.`
                : 'Chưa có đơn trong kỳ nên điểm xuất phát là giả định.'
              : (SCENARIOS.find(s => s.key === scenario)?.note ?? 'Đang dùng giá trị bạn tự chỉnh') + '.'
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-semibold text-admin-muted" aria-hidden>
                Kịch bản
              </span>
              <SegmentedControl
                value={scenario}
                onChange={pickScenario}
                options={SCENARIOS.map(s => ({ value: s.key, label: s.label }))}
                label="Kịch bản"
              />
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-6 p-[18px] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="flex flex-col gap-4">
              <SimField
                label="Số đơn thành công mỗi tháng"
                value={sim.orders}
                onChange={v => setSimField({ orders: Math.round(v) })}
                min={0}
                max={Math.max(2000, (base?.orders ?? 0) * 3)}
                step={10}
                unit="đơn"
              />
              <SimField
                label="Tiền hàng trung bình mỗi đơn"
                hint="Giá khách thấy trên sàn, chưa gồm ship."
                value={Math.round(sim.aov)}
                onChange={v => setSimField({ aov: v })}
                min={0}
                max={2_000_000}
                step={5000}
                unit="đ"
              />
              <SimField
                label="Mức hoa hồng"
                hint={
                  <>
                    Chỉ để thử. Muốn áp dụng thật hãy đổi ở trang{' '}
                    <Link to="/admin/commission" className="font-semibold text-admin-brand hover:underline">
                      Cấu hình lợi nhuận
                    </Link>
                    .
                  </>
                }
                value={round2(sim.commissionPercent)}
                onChange={v => setSimField({ commissionPercent: v })}
                min={0}
                max={30}
                step={0.5}
                unit="%"
              />

              <details className="rounded-admin border border-admin-line">
                <summary className="cursor-pointer select-none px-4 py-3 text-[13px] font-semibold text-admin-ink">
                  Nâng cao{' '}
                  <span className="font-normal text-admin-muted">
                    — phí cổng {pct(sim.paymentFeeRate)}, đơn hoàn {pct(sim.refundRate)}, voucher sàn{' '}
                    {money(Math.round(sim.voucherPerOrder))}/đơn, chi phí cố định {money(Math.round(sim.monthlyFixed))}
                  </span>
                </summary>
                <div className="flex flex-col gap-4 border-t border-admin-line p-4">
                  <SimField
                    label="Phí cổng thanh toán"
                    hint="Trung bình trên tiền hàng + ship, đã gồm cả đơn COD."
                    value={round2(sim.paymentFeeRate * 100)}
                    onChange={v => setSimField({ paymentFeeRate: v / 100 })}
                    min={0}
                    max={5}
                    step={0.1}
                    unit="%"
                  />
                  <SimField
                    label="Tỷ lệ đơn bị hoàn tiền"
                    value={round2(sim.refundRate * 100)}
                    onChange={v => setSimField({ refundRate: Math.min(90, v) / 100 })}
                    min={0}
                    max={50}
                    step={1}
                    unit="%"
                  />
                  <SimField
                    label="Voucher sàn trung bình mỗi đơn"
                    hint="Ví dụ 10% số đơn dùng mã 20.000đ thì bằng 2.000đ mỗi đơn."
                    value={Math.round(sim.voucherPerOrder)}
                    onChange={v => setSimField({ voucherPerOrder: Math.round(v) })}
                    min={0}
                    max={50_000}
                    step={500}
                    unit="đ"
                  />
                  <SimField
                    label="Chi phí cố định mỗi tháng"
                    value={Math.round(sim.monthlyFixed)}
                    onChange={v => setSimField({ monthlyFixed: v })}
                    min={0}
                    max={Math.max(20_000_000, (base?.monthlyFixed ?? 0) * 3)}
                    step={100_000}
                    unit="đ"
                  />
                </div>
              </details>

              <section aria-label="Mỗi đơn sàn còn lại bao nhiêu" className="rounded-admin border border-admin-line">
                <h3 className="m-0 border-b border-admin-line bg-[#fafcfa] px-4 py-2.5 text-[13px] font-semibold text-admin-ink">
                  Mỗi đơn sàn còn lại bao nhiêu
                </h3>
                <dl className="m-0 px-4 py-2 text-[13px]">
                  {receipt.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3 py-1">
                      <dt className="text-admin-body">{k}</dt>
                      <dd className="m-0 tabular-nums text-admin-ink">
                        {Math.round(v) === 0 ? money(0) : v > 0 ? `+${money(Math.round(v))}` : `−${money(Math.round(-v))}`}
                      </dd>
                    </div>
                  ))}
                  <div className="mt-1 flex items-center justify-between gap-3 border-t border-admin-line pb-1 pt-2 font-bold">
                    <dt className="text-admin-ink">
                      = Lãi góp mỗi đơn
                      <Hint term="Lãi góp" />
                    </dt>
                    <dd
                      className={cx(
                        'm-0 tabular-nums',
                        result.contributionPerOrder < 0 ? 'text-[#b91c1c]' : 'text-admin-brand'
                      )}
                    >
                      {signedMoney(Math.round(result.contributionPerOrder))}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>

            <div className="min-w-0">
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Metric
                  emphasis
                  label="Lãi/lỗ mỗi tháng"
                  term="Lãi/lỗ ròng"
                  value={signedMoney(Math.round(result.netProfit))}
                  tone={toneOf(result.netProfit)}
                  sub={vsBase(result.netProfit, baseResult?.netProfit, signedMoney)}
                />
                <Metric
                  label="Lãi góp mỗi đơn"
                  term="Lãi góp"
                  value={signedMoney(Math.round(result.contributionPerOrder))}
                  sub={vsBase(result.contributionPerOrder, baseResult?.contributionPerOrder, v => `${signedMoney(v)}/đơn`)}
                />
                <Metric
                  label="Cần để hòa vốn mỗi tháng"
                  term="Hòa vốn"
                  value={result.breakEvenOrders === null ? 'Không thể' : `${count(result.breakEvenOrders)} đơn`}
                  sub={
                    <>
                      {result.breakEvenGmv !== null && <>≈ {money(result.breakEvenGmv)} tiền hàng</>}
                      {baseResult && result.breakEvenOrders !== baseResult.breakEvenOrders && (
                        <>
                          {result.breakEvenGmv !== null && ' · '}
                          {ref}:{' '}
                          {baseResult.breakEvenOrders === null ? 'không thể' : `${count(baseResult.breakEvenOrders)} đơn`}
                        </>
                      )}
                    </>
                  }
                />
                <Metric
                  label="Vốn dự phòng trụ được"
                  term="Runway (số tháng trụ được)"
                  value={result.netProfit >= 0 ? 'Không hao vốn' : runway !== null ? months(runway) : '—'}
                  sub={
                    result.netProfit >= 0 ? (
                      'Đang có lãi'
                    ) : cash > 0 ? (
                      `Vốn ${money(cash)} ÷ lỗ ${money(Math.round(-result.netProfit))}/tháng`
                    ) : (
                      <>
                        Nhập vốn ở tab{' '}
                        <Link to="/admin/finance?tab=chi-phi" className="font-semibold text-admin-brand hover:underline">
                          Chi phí vận hành
                        </Link>
                      </>
                    )
                  }
                />
              </div>

              <h3 className="m-0 text-[13.5px] font-bold text-admin-ink">Lãi/lỗ mỗi tháng theo số đơn</h3>
              <p className={cx(FIELD_HINT, 'mb-2 mt-0.5')}>
                Mỗi cột: bán được ngần ấy đơn/tháng thì lãi hay lỗ bao nhiêu; cột đậm là mức đang chọn.{' '}
                {result.breakEvenOrders === null
                  ? 'Ở mức phí này bán bao nhiêu cũng lỗ.'
                  : `Từ ${count(result.breakEvenOrders)} đơn/tháng trở lên là có lãi.`}
              </p>
              <ProfitBarsChart bars={bars} />
            </div>
          </div>
        </Panel>

        <Panel
          icon={Gauge}
          title="Yếu tố nào ảnh hưởng mạnh nhất?"
          sub="Đổi từng yếu tố một so với mô phỏng đang xem. Cột đỏ: làm lỗ thêm · cột xanh: làm lãi thêm."
        >
          {top && topDelta !== 0 && (
            <p className="m-0 px-[18px] pt-3 text-[13px] text-admin-body">
              Mạnh nhất: nếu <b className="text-admin-ink">{top.label.charAt(0).toLowerCase() + top.label.slice(1)}</b>,
              mỗi tháng sàn {topDelta < 0 ? 'mất thêm' : 'được thêm'}{' '}
              <b className={topDelta < 0 ? 'text-[#b91c1c]' : 'text-admin-brand'}>{money(Math.abs(topDelta))}</b>.
            </p>
          )}
          <div className="px-[18px] pt-3">
            <SensitivityChart shocks={shocks} />
          </div>
          <details className="border-t border-admin-line">
            <summary className="cursor-pointer select-none px-[18px] py-3 text-[13px] font-semibold text-admin-ink">
              Xem bảng số
            </summary>
            <div className="overflow-x-auto">
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th>Nếu</th>
                    <th className="text-right">Lãi/lỗ mỗi tháng thay đổi</th>
                    <th className="text-right">Cần để hòa vốn</th>
                  </tr>
                </thead>
                <tbody>
                  {shocks.map(s => (
                    <tr key={s.label}>
                      <td>{s.label}</td>
                      <td
                        className={cx(
                          'text-right font-semibold tabular-nums',
                          s.profitDelta < 0 ? 'text-[#b91c1c]' : s.profitDelta > 0 ? 'text-admin-brand' : 'text-admin-muted'
                        )}
                      >
                        {signedMoney(Math.round(s.profitDelta))}
                      </td>
                      <td className="text-right tabular-nums">
                        {s.breakEvenOrders === null ? 'Không thể hòa vốn' : `${count(s.breakEvenOrders)} đơn/tháng`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </Panel>
      </>
    );
  };

  /* ---------------------------------------------------------------- Tab Chi phí vận hành */
  const renderCosts = (form: FinanceConfig) => (
    <>
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <Panel
          icon={Server}
          title="Chi phí cố định mỗi tháng"
          sub="Phải trả dù không có đơn nào: máy chủ, tên miền, Atlas, Cloudinary, API AI…"
          className="mb-0"
        >
        <div className="p-[18px]">
          <p className={cx(FIELD_HINT, 'mb-3 mt-0')}>
            Khoản có ổ khóa chỉ sửa số tiền, dùng gói miễn phí thì để 0. Khoản tự thêm thì sửa và xóa được.
          </p>
          <div className="flex flex-col gap-2">
            {form.monthly_costs.map((c, idx) => (
              <div key={idx} className="grid grid-cols-[minmax(0,1fr)_160px_auto] items-center gap-2">
                <input
                  aria-label={`Tên khoản chi phí ${idx + 1}`}
                  value={c.name}
                  maxLength={60}
                  placeholder="VD: MongoDB Atlas"
                  disabled={!!c.key}
                  onChange={e => updateCost(idx, { name: e.target.value })}
                  className={cx(FIELD, 'py-2', !c.name.trim() && 'border-[#f6caca]')}
                />
                <MoneyInput
                  value={c.amount}
                  onChange={v => updateCost(idx, { amount: v })}
                  label={`Số tiền mỗi tháng của khoản ${c.name || idx + 1}`}
                />
                {c.key ? (
                  <span
                    role="img"
                    aria-label="Khoản mặc định: không xóa được, chỉ sửa số tiền"
                    title="Khoản mặc định: không xóa được, chỉ sửa số tiền"
                    className="inline-flex h-10 w-10 items-center justify-center text-admin-muted md:h-9 md:w-9"
                  >
                    <Lock size={15} aria-hidden />
                  </span>
                ) : (
                  <button
                    type="button"
                    className={ICON_BTN_DANGER}
                    aria-label={`Xóa khoản ${c.name || idx + 1}`}
                    onClick={() => setForm(f => f && { ...f, monthly_costs: f.monthly_costs.filter((_, i) => i !== idx) })}
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className={BTN_SECONDARY_SM}
              disabled={form.monthly_costs.length >= 30}
              onClick={() => setForm(f => f && { ...f, monthly_costs: [...f.monthly_costs, { name: '', amount: 0 }] })}
            >
              <Plus size={14} aria-hidden /> Thêm khoản
            </button>
            <span className="text-[13px] text-admin-muted">
              Tổng{' '}
              <b className="text-[15px] text-admin-ink">
                {money(form.monthly_costs.reduce((s, c) => s + (Number(c.amount) || 0), 0))}
              </b>
              /tháng
            </span>
          </div>
          {costsInvalid && <p className="mb-0 mt-2 text-[12px] text-[#b91c1c]">Mỗi khoản cần có tên trước khi lưu.</p>}
        </div>
        <div className="border-t border-admin-line px-[18px] py-4">
          <h3 className="mb-2 mt-0 text-[13px] font-bold text-admin-ink">Khoản nào tốn nhất</h3>
          <CostBarsChart costs={form.monthly_costs} />
        </div>
        </Panel>

        <div className="flex flex-col gap-5">
        <Panel
          icon={CreditCard}
          title="Phí cổng thanh toán"
          sub="Theo hợp đồng, tính trên toàn bộ tiền khách trả. Chưa thu phí thì để 0."
          className="mb-0"
        >
          <div className="overflow-x-auto">
            <table className={TABLE}>
              <thead>
                <tr>
                  <th>Phương thức</th>
                  <th>Phí theo %</th>
                  <th>Phí cố định mỗi giao dịch</th>
                  <th aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {form.payment_fees.map((g, idx) => {
                  const label = g.name || `cổng ${idx + 1}`;
                  return (
                    <tr key={idx}>
                      <td className="font-semibold">
                        {g.is_default ? (
                          g.name
                        ) : (
                          <>
                            <input
                              aria-label={`Tên cổng thanh toán ${idx + 1}`}
                              value={g.name}
                              maxLength={40}
                              placeholder="VD: MoMo"
                              onChange={e => updateFee(idx, { name: e.target.value })}
                              className={cx(FIELD, 'w-[140px] py-1.5', !gatewayCode(g.name) && 'border-[#f6caca]')}
                            />
                            <div className="mt-1 text-[11.5px] font-normal text-admin-muted">
                              Mã: {gatewayCode(g.name) || '—'}
                            </div>
                          </>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <input
                            aria-label={`Phí phần trăm của ${label}`}
                            type="number"
                            min={0}
                            max={20}
                            step={0.1}
                            value={Math.round(g.rate * 1_000_000) / 10_000}
                            onChange={e => updateFee(idx, { rate: Math.max(0, Number(e.target.value) || 0) / 100 })}
                            className={cx(FIELD, 'w-[90px] py-1.5 text-right tabular-nums')}
                          />
                          <span className="text-[12px] text-admin-muted">%</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <MoneyInput
                            value={g.fixed}
                            onChange={v => updateFee(idx, { fixed: v })}
                            label={`Phí cố định của ${label}`}
                            className="w-[110px] py-1.5"
                          />
                          <span className="text-[12px] text-admin-muted">đ</span>
                        </div>
                      </td>
                      <td className="w-12">
                        {g.is_default ? (
                          <span
                            role="img"
                            aria-label="Cổng mặc định: không xóa được, chỉ sửa phí"
                            title="Cổng mặc định: không xóa được, chỉ sửa phí"
                            className="inline-flex h-10 w-10 items-center justify-center text-admin-muted md:h-9 md:w-9"
                          >
                            <Lock size={15} aria-hidden />
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={ICON_BTN_DANGER}
                            aria-label={`Xóa ${label}`}
                            onClick={() =>
                              setForm(f => f && { ...f, payment_fees: f.payment_fees.filter((_, i) => i !== idx) })
                            }
                          >
                            <Trash2 size={15} aria-hidden />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-admin-line px-[18px] py-3">
            <button
              type="button"
              className={BTN_SECONDARY_SM}
              disabled={form.payment_fees.length >= 10}
              onClick={() => setForm(f => f && { ...f, payment_fees: [...f.payment_fees, { name: '', rate: 0, fixed: 0 }] })}
            >
              <Plus size={14} aria-hidden /> Thêm cổng
            </button>
            <p className={cx(FIELD_HINT, 'mb-0')}>
              Mã cổng tạo từ tên và phải trùng mã phương thức thanh toán lưu trong đơn hàng. COD là phí thu hộ của đơn vị vận
              chuyển.
            </p>
            {gatewaysInvalid && (
              <p className="mb-0 mt-2 text-[12px] text-[#b91c1c]">Cổng thêm mới cần tên có chữ hoặc số trước khi lưu.</p>
            )}
          </div>
        </Panel>

        <Panel icon={Wallet} title="Chi phí khác & vốn" className="mb-0">
          <div className="divide-y divide-admin-line-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-3.5">
              <span className="text-[13.5px] font-semibold text-admin-ink">Phí gửi thông báo mỗi đơn</span>
              <span className="flex items-center gap-1.5">
                <MoneyInput
                  value={form.notification_per_order}
                  onChange={v => setForm(f => f && { ...f, notification_per_order: v })}
                  label="Phí gửi thông báo mỗi đơn"
                  className="w-[160px] py-1.5"
                />
                <span className="w-3 text-[12px] text-admin-muted">đ</span>
              </span>
            </div>
            <div className="px-[18px] py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[13.5px] font-semibold text-admin-ink">
                  Vốn dự phòng hiện có
                  <Hint term="Runway (số tháng trụ được)" />
                </span>
                <span className="flex items-center gap-1.5">
                  <MoneyInput
                    value={form.cash_reserve}
                    onChange={v => setForm(f => f && { ...f, cash_reserve: v })}
                    label="Vốn dự phòng hiện có"
                    className="w-[160px] py-1.5"
                  />
                  <span className="w-3 text-[12px] text-admin-muted">đ</span>
                </span>
              </div>
              <p className={cx(FIELD_HINT, 'mb-0')}>Tiền nhóm còn để bù lỗ. Để 0 nếu chưa có.</p>
            </div>
          </div>
        </Panel>
        </div>
      </div>

      {/* Thanh lưu dính đáy: sửa ở thẻ nào cũng thấy nút lưu mà không phải cuộn lên. */}
      <div
        className={cx(
          'sticky bottom-4 z-20 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-admin border bg-admin-surface px-4 py-3 shadow-admin-md',
          dirty ? 'border-[#b7e0b7]' : 'border-admin-line'
        )}
      >
        <span className="text-[13px] text-admin-muted" aria-live="polite">
          {dirty ? (
            <b className="text-admin-ink">Có thay đổi chưa lưu</b>
          ) : config?.updated_at ? (
            `Lưu lần cuối ${new Date(config.updated_at).toLocaleString('vi-VN')}`
          ) : (
            'Chưa có thay đổi'
          )}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" className={BTN_SECONDARY} onClick={() => setForm(config)} disabled={!dirty || saving}>
            <Undo2 size={15} aria-hidden /> Hoàn tác
          </button>
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => void save()}
            disabled={!dirty || formInvalid || saving}
          >
            <Save size={15} aria-hidden /> {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className={PAGE}>
      {header}
      {error && <Alert tone="danger" onDismiss={() => setError('')}>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}
      {section === 'tong-quan' && o && renderOverview(o)}
      {section === 'mo-phong' && sim && result && renderSimulation(sim, result)}
      {section === 'chi-phi' && form && renderCosts(form)}
    </div>
  );
}

export default AdminFinanceSimulationPage;
