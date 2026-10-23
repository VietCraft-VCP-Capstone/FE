import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Lock, Plus, RefreshCw, Save, Trash2, TrendingDown, TrendingUp, Undo2 } from 'lucide-react';

import {
  adminFinanceService,
  FinanceConfig,
  FinanceOverview,
  OverviewQuery,
  PaymentFee,
} from '../services/adminFinanceService';
import { SCENARIOS, SimInput, profitBars, sensitivity, simulate } from '../services/financeSimulation';
import { Alert, SegmentedControl } from '../components/AdminPrimitives';
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
import { compactMoney, count, money } from '../../../shared/utils/format';

export type FinanceSection = 'tong-quan' | 'mo-phong' | 'chi-phi';

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

function signedMoney(v: number): string {
  return v > 0 ? `+${money(v)}` : money(v);
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

/* ------------------------------------------------------------------ Thành phần nhỏ */

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

function Tile({
  label,
  value,
  tone,
  delta,
  children,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'bad';
  delta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className={cx(CARD, 'px-[18px] py-4')}>
      <div className="text-[12.5px] font-semibold text-admin-muted">{label}</div>
      <div
        className={cx(
          'mt-1.5 text-[23px] font-extrabold leading-none',
          tone === 'good' ? 'text-admin-brand' : tone === 'bad' ? 'text-[#b91c1c]' : 'text-admin-ink'
        )}
      >
        {value}
      </div>
      {delta && <div className="mt-2">{delta}</div>}
      {children && <div className="mt-1.5 text-[12px] leading-[1.5] text-admin-muted">{children}</div>}
    </div>
  );
}

function Panel({
  title,
  sub,
  actions,
  className,
  children,
}: {
  title: string;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cx(CARD, 'mb-5', className)}>
      <div className={CARD_HEADER}>
        <div className="min-w-0">
          <h2 className="m-0 text-[15px] font-bold text-admin-ink">{title}</h2>
          {sub && <p className="m-0 mt-0.5 text-[12px] text-admin-muted">{sub}</p>}
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
  note: string;
  value: number;
  kind: 'in' | 'out' | 'sum';
}

/** Bảng số đi kèm biểu đồ thác nước: mỗi dòng có câu giải thích. */
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
              'flex items-start justify-between gap-4 border-t border-admin-line-soft px-[18px] py-2.5',
              sum && 'bg-[#fafcfa]'
            )}
          >
            <div className="min-w-0 [overflow-wrap:anywhere]">
              <div className={cx('text-[13.5px] text-admin-ink', sum ? 'font-bold' : 'font-semibold')}>{r.label}</div>
              <div className="text-[12px] leading-[1.5] text-admin-muted">{r.note}</div>
            </div>
            <div
              className={cx(
                'shrink-0 text-right text-[14px] tabular-nums',
                sum ? 'font-extrabold' : 'font-semibold text-admin-ink',
                sum && (r.value < 0 ? 'text-[#b91c1c]' : 'text-admin-brand')
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

function Verdict({ o, cash }: { o: FinanceOverview; cash: number }) {
  const when = periodText(o.period);
  const When = when[0].toUpperCase() + when.slice(1);
  const profit = o.pnl.net_profit;
  const be = o.monthly.break_even_orders;
  const perMonth = o.monthly.orders;
  const cpo = o.contribution_per_order ?? 0;
  const runway = o.monthly.runway_months;
  const tail =
    profit < 0 &&
    (runway !== null ? (
      <>
        {' '}
        Với vốn dự phòng {compactMoney(cash)}, nếu giữ mức lỗ này sàn trụ được khoảng <b>{months(runway)}</b>.
      </>
    ) : (
      <>
        {' '}
        Nhập vốn dự phòng ở tab{' '}
        <Link to="/admin/finance?tab=chi-phi" className="font-semibold text-current">
          Chi phí vận hành
        </Link>{' '}
        để biết sàn trụ được bao lâu.
      </>
    ));

  if (!o.orders.paid) {
    return (
      <Alert tone="warn">
        Chưa có đơn đã thanh toán {when}. Bảng bên dưới chỉ còn chi phí cố định; phần mô phỏng đang dùng
        giá trị giả định — hãy sửa cho sát thực tế.{tail}
      </Alert>
    );
  }
  if (profit >= 0) {
    return (
      <Alert tone="success">
        {When} sàn <b>lãi {money(profit)}</b> sau mọi chi phí. Cần {count(be ?? 0)} đơn/tháng để hòa vốn, hiện
        đạt khoảng {count(perMonth)} đơn/tháng.
      </Alert>
    );
  }
  if (be === null) {
    return (
      <Alert tone="danger">
        {When} sàn <b>lỗ {money(-profit)}</b>.{' '}
        {cpo < 0 ? `Mỗi đơn đang làm sàn lỗ thêm ${money(-cpo)}` : 'Mỗi đơn không góp được đồng nào'} vì phí cổng, voucher
        sàn và hoàn tiền lớn hơn hoa hồng — bán thêm cũng không hòa vốn được. Cần tăng hoa hồng hoặc giảm voucher sàn.
        {tail}
      </Alert>
    );
  }
  return (
    <Alert tone="warn">
      {When} sàn <b>lỗ {money(-profit)}</b>. Mỗi đơn góp {money(cpo)}, nên cần <b>{count(be)} đơn/tháng</b> để
      hòa vốn — hiện khoảng {count(perMonth)} đơn/tháng, còn thiếu {count(Math.max(0, be - perMonth))}.{tail}
    </Alert>
  );
}

const GLOSSARY: [string, string][] = [
  ['Tổng tiền hàng (GMV)', 'Tổng giá trị hàng bán qua sàn. Đây là tiền của người bán, sàn chỉ giữ hộ.'],
  ['Hoa hồng', 'Phần sàn thu trên mỗi đơn (mặc định 5% tiền người bán muốn nhận, cộng vào giá khách trả).'],
  ['Doanh thu thuần', 'Hoa hồng trừ phần voucher sàn bù cho khách — phần thật sự thuộc về sàn.'],
  ['Take rate', 'Doanh thu thuần chia tổng tiền hàng: sàn giữ được bao nhiêu % trên mỗi đồng hàng bán ra.'],
  ['Biến phí', 'Chi phí sinh ra theo từng đơn: phí cổng thanh toán, tin nhắn, phí cổng mất ở đơn hoàn.'],
  ['Chi phí cố định (định phí)', 'Trả mỗi tháng dù không bán được gì: server, tên miền, hosting…'],
  ['Lãi góp', 'Doanh thu thuần trừ biến phí: mỗi đơn góp bao nhiêu để trả chi phí cố định.'],
  ['Hòa vốn', 'Số đơn (hoặc tiền hàng) mỗi tháng để tổng lãi góp vừa bằng chi phí cố định. Ít hơn là lỗ, nhiều hơn là lãi.'],
  ['Biên an toàn', 'Đang vượt điểm hòa vốn bao nhiêu %. Càng cao càng an toàn.'],
  ['Runway (số tháng trụ được)', 'Vốn dự phòng chia cho số lỗ mỗi tháng — nếu cứ lỗ như vậy thì vốn đủ bù trong bao lâu.'],
];

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

export function AdminFinanceSimulationPage({ section = 'tong-quan' }: { section?: FinanceSection }) {
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

  const load = useCallback(async (q: OverviewQuery) => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const [o, c] = await Promise.all([adminFinanceService.getOverview(q), adminFinanceService.getConfig()]);
      if (id !== requestId.current) return;
      setOverview(o);
      setConfig(c);
      setForm(c);
      setSim(baselineOf(o));
      setScenario('base');
    } catch (err: any) {
      if (id === requestId.current) {
        setError(err?.response?.data?.error || 'Không tải được số liệu tài chính. Bấm "Làm mới" để thử lại.');
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(query);
  }, [query, load]);

  const base = useMemo(() => (overview ? baselineOf(overview) : null), [overview]);
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
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await adminFinanceService.updateConfig({
        ...form,
        monthly_costs: form.monthly_costs.map(c => ({ ...c, name: c.name.trim() })),
      });
      await load(query);
      setNotice('Đã lưu cấu hình. Số liệu ở các tab đã tính lại theo chi phí mới.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Lưu cấu hình thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !overview) {
    return (
      <div className={PAGE}>
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
    const be = o.monthly.break_even_orders;
    const reach = be ? Math.min(100, (o.monthly.orders / be) * 100) : 0;
    const cpo = o.contribution_per_order;
    const prevCpo = prev.orders ? Math.round(prev.contribution / prev.orders) : null;
    const pctFormat = (v: number) => `${v > 0 ? '+' : ''}${v.toLocaleString('vi-VN')}%`;
    const feeRate = o.gmv > 0 ? o.pnl.commission / o.gmv : o.commission_percent / (100 + o.commission_percent);
    const flow: FlowRow[] = [
      {
        label: 'Hoa hồng thu được',
        note: `${count(o.orders.paid)} đơn đã thanh toán. Tổng tiền hàng ${compactMoney(o.gmv)} là tiền của người bán — sàn chỉ giữ hộ.`,
        value: o.pnl.commission,
        kind: 'in',
      },
      {
        label: 'Voucher sàn tài trợ',
        note: 'Mã giảm giá của sàn: khách được giảm nhưng người bán vẫn nhận đủ, sàn bù phần chênh.',
        value: o.pnl.platform_voucher,
        kind: 'out',
      },
      { label: 'Doanh thu thuần của sàn', note: 'Phần thật sự thuộc về sàn.', value: o.pnl.net_revenue, kind: 'sum' },
      {
        label: 'Phí cổng thanh toán',
        note:
          `Tính trên toàn bộ tiền khách trả (gồm ship) ${compactMoney(o.paid_amount)}` +
          (o.orders.paid
            ? ` — ${o.payment_mix
                .filter(m => m.orders)
                .map(m => `${m.name} ${count(m.orders)} đơn`)
                .join(' · ')}.`
            : '.'),
        value: o.pnl.payment_fees,
        kind: 'out',
      },
      {
        label: 'Thất thoát do hoàn tiền',
        note: o.orders.refunded
          ? `${count(o.orders.refunded)} đơn đã hoàn: cổng không trả lại phí đã thu. Hoa hồng ${compactMoney(o.refunded_commission)} của các đơn này cũng không thu được.`
          : 'Kỳ này không có đơn hoàn tiền.',
        value: o.pnl.refund_losses,
        kind: 'out',
      },
      {
        label: 'Gửi thông báo email/SMS',
        note: `${count(o.orders.paid + o.orders.refunded)} đơn × ${money(o.baseline.notification_per_order)}.`,
        value: o.pnl.notification,
        kind: 'out',
      },
      { label: 'Lãi góp', note: 'Còn lại để trả chi phí cố định.', value: o.pnl.contribution, kind: 'sum' },
      {
        label: 'Chi phí cố định',
        note: `${money(o.monthly.fixed_costs)}/tháng, tính cho ${days} ngày.`,
        value: o.pnl.fixed_costs,
        kind: 'out',
      },
      { label: 'Lãi/lỗ ròng', note: 'Sau mọi chi phí.', value: o.pnl.net_profit, kind: 'sum' },
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
          <Verdict o={o} cash={cash} />

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Tile
              label="Lãi/lỗ ròng"
              value={signedMoney(o.pnl.net_profit)}
              tone={o.pnl.net_profit < 0 ? 'bad' : 'good'}
              delta={<Delta value={o.pnl.net_profit - prev.net_profit} format={signedMoney} />}
            >
              {days} ngày, sau mọi chi phí
            </Tile>
            <Tile
              label="Doanh thu thuần của sàn"
              value={money(o.pnl.net_revenue)}
              delta={<Delta value={changePercent(o.pnl.net_revenue, prev.net_revenue)} format={pctFormat} />}
            >
              Bằng {pct(o.take_rate)} tổng tiền hàng {compactMoney(o.gmv)}
            </Tile>
            <Tile
              label="Lãi góp mỗi đơn"
              value={cpo === null ? '—' : signedMoney(cpo)}
              tone={cpo !== null && cpo < 0 ? 'bad' : undefined}
              delta={
                <Delta
                  value={cpo !== null && prevCpo !== null ? cpo - prevCpo : null}
                  format={v => `${signedMoney(v)}/đơn`}
                />
              }
            >
              Phần mỗi đơn còn lại để trả chi phí cố định
            </Tile>
            <Tile
              label="Đơn mỗi tháng / cần để hòa vốn"
              value={`${count(o.monthly.orders)} / ${be === null ? '—' : count(be)}`}
              delta={<Delta value={changePercent(o.orders.paid, prev.orders)} format={pctFormat} />}
            >
              <div className="mb-1.5 h-2 rounded-full bg-admin-line-soft" aria-hidden>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${reach}%`, backgroundColor: reach >= 100 ? SERIES.green : SERIES.red }}
                />
              </div>
              {be === null
                ? 'Không thể hòa vốn ở mức phí hiện tại'
                : o.monthly.orders >= be
                  ? `Vượt điểm hòa vốn, biên an toàn ${pct(o.monthly.margin_of_safety)}`
                  : `Còn thiếu ${count(be - o.monthly.orders)} đơn/tháng`}
              {o.monthly.break_even_gmv !== null && (
                <> · tức khoảng {compactMoney(o.monthly.break_even_gmv)} tiền hàng/tháng</>
              )}
            </Tile>
          </div>

          <Panel
            title={`Tiền đi đâu ${periodText(o.period)}`}
            sub="Cột xanh: tiền sàn thu · cột đỏ: các khoản chi · cột xám: phần còn lại sau khi trừ"
          >
            <div className="px-[18px] pt-4">
              <WaterfallChart o={o} />
            </div>
            <MoneyFlow rows={flow} />
          </Panel>

          <Panel
            title="Xu hướng 6 tháng gần nhất"
            sub="Tháng nào cột xanh lá (lãi góp) cao hơn cột xanh dương (chi phí cố định) là tháng đó có lãi"
          >
            <div className="px-[18px] pt-4">
              <TrendBars trend={o.trend} />
            </div>
            <div className="overflow-x-auto border-t border-admin-line">
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
            <p className={cx(FIELD_HINT, 'm-0 px-[18px] pb-3')}>
              * Tháng này tính đến hôm nay. Chi phí cố định của các tháng trước dùng mức đang cấu hình.
            </p>
          </Panel>

          <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Một đơn trung bình chia tiền thế nào" className="mb-0">
              <div className="p-[18px]">
                <OrderSplit o={o} />
              </div>
            </Panel>
            <Panel title="Phí sàn mỗi đơn so với các sàn lớn" className="mb-0">
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
    return (
      <>
        <Panel
          title="Mô phỏng: nếu thay đổi thì sao?"
          sub={
            <>
              {SCENARIOS.find(s => s.key === scenario)?.note ?? 'Đang dùng giá trị bạn tự chỉnh'}
              {o &&
                (o.orders.paid
                  ? ` · điểm xuất phát là số thật ${periodText(o.period)} (đổi kỳ ở tab Tổng quan)`
                  : ' · chưa có đơn trong kỳ nên điểm xuất phát là giả định')}
            </>
          }
          actions={
            <SegmentedControl
              value={scenario}
              onChange={pickScenario}
              options={SCENARIOS.map(s => ({ value: s.key, label: s.label }))}
              label="Kịch bản"
            />
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
                    Chỉ để thử. Muốn áp dụng thật hãy đổi ở tab{' '}
                    <Link to="/admin/finance?tab=hoa-hong" className="text-admin-brand">
                      Cấu hình lợi nhuận (%)
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
                    {money(Math.round(sim.voucherPerOrder))}/đơn, chi phí cố định {compactMoney(sim.monthlyFixed)}
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
            </div>

            <div className="min-w-0">
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-admin border border-admin-line px-4 py-3">
                  <div className="text-[12px] font-semibold text-admin-muted">Lãi/lỗ mỗi tháng</div>
                  <div
                    className={cx(
                      'mt-1 text-[20px] font-extrabold',
                      result.netProfit < 0 ? 'text-[#b91c1c]' : 'text-admin-brand'
                    )}
                  >
                    {signedMoney(Math.round(result.netProfit))}
                  </div>
                </div>
                <div className="rounded-admin border border-admin-line px-4 py-3">
                  <div className="text-[12px] font-semibold text-admin-muted">Lãi góp mỗi đơn</div>
                  <div className="mt-1 text-[20px] font-extrabold text-admin-ink">
                    {signedMoney(Math.round(result.contributionPerOrder))}
                  </div>
                </div>
                <div className="rounded-admin border border-admin-line px-4 py-3">
                  <div className="text-[12px] font-semibold text-admin-muted">Cần để hòa vốn mỗi tháng</div>
                  <div className="mt-1 text-[20px] font-extrabold text-admin-ink">
                    {result.breakEvenOrders === null ? 'Không thể' : `${count(result.breakEvenOrders)} đơn`}
                  </div>
                  {result.breakEvenGmv !== null && (
                    <div className="mt-0.5 text-[12px] text-admin-muted">
                      ≈ {compactMoney(result.breakEvenGmv)} tiền hàng
                    </div>
                  )}
                </div>
                <div className="rounded-admin border border-admin-line px-4 py-3">
                  <div className="text-[12px] font-semibold text-admin-muted">Vốn dự phòng trụ được</div>
                  <div className="mt-1 text-[20px] font-extrabold text-admin-ink">
                    {result.netProfit >= 0 ? 'Không hao vốn' : runway !== null ? months(runway) : '—'}
                  </div>
                  <div className="mt-0.5 text-[12px] text-admin-muted">
                    {result.netProfit >= 0 ? (
                      'Đang có lãi'
                    ) : cash > 0 ? (
                      `Vốn ${compactMoney(cash)} ÷ lỗ ${compactMoney(-result.netProfit)}/tháng`
                    ) : (
                      <>
                        Nhập vốn ở tab{' '}
                        <Link to="/admin/finance?tab=chi-phi" className="text-admin-brand">
                          Chi phí vận hành
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <p className="mb-3 mt-0 text-[12.5px] leading-[1.6] text-admin-muted">
                Mỗi đơn: hoa hồng {money(Math.round(result.commissionPerOrder))} − phí cổng{' '}
                {money(Math.round(result.paymentFeePerOrder))} − voucher sàn {money(Math.round(sim.voucherPerOrder))} −
                thất thoát hoàn tiền {money(Math.round(result.refundLossPerOrder))} − thông báo{' '}
                {money(sim.notificationPerOrder)} ={' '}
                <b className="text-admin-ink">{signedMoney(Math.round(result.contributionPerOrder))}</b>
              </p>

              <ProfitBarsChart bars={bars} />
            </div>
          </div>
        </Panel>

        <Panel
          title="Yếu tố nào ảnh hưởng mạnh nhất?"
          sub="Đổi từng yếu tố một so với mô phỏng đang xem. Cột đỏ: làm lỗ thêm · cột xanh: làm lãi thêm."
        >
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
    <Panel
      title="Chi phí vận hành"
      sub={
        <>
          Nhập theo hóa đơn thật.
          {config?.updated_at && ` Lưu lần cuối ${new Date(config.updated_at).toLocaleString('vi-VN')}.`}
        </>
      }
      actions={
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
      }
    >
      <div className="grid grid-cols-1 gap-8 p-[18px] xl:grid-cols-2">
        <div>
          <h3 className="m-0 text-[13.5px] font-bold text-admin-ink">Chi phí cố định mỗi tháng</h3>
          <p className={cx(FIELD_HINT, 'mb-3')}>
            Khoản phải trả dù không có đơn nào: máy chủ, tên miền, Vercel, MongoDB Atlas, Cloudinary, API AI… 4 khoản mặc
            định (có ổ khóa) chỉ sửa số tiền, dùng gói miễn phí thì để 0. Khoản tự thêm thì sửa và xóa được.
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
              <b className="text-admin-ink tabular-nums">
                {money(form.monthly_costs.reduce((s, c) => s + (Number(c.amount) || 0), 0))}
              </b>
              /tháng
            </span>
          </div>
          {costsInvalid && <p className="mb-0 mt-2 text-[12px] text-[#b91c1c]">Mỗi khoản cần có tên trước khi lưu.</p>}

          <h3 className="mb-2 mt-6 text-[13.5px] font-bold text-admin-ink">Khoản nào tốn nhất</h3>
          <CostBarsChart costs={form.monthly_costs} />
        </div>

        <div>
          <h3 className="m-0 text-[13.5px] font-bold text-admin-ink">Phí cổng thanh toán</h3>
          <p className={cx(FIELD_HINT, 'mb-3')}>
            Hiện chưa tính phí cổng nên để 0. Khi cổng bắt đầu thu phí thì nhập theo hợp đồng; phí tính trên toàn bộ tiền
            khách trả. COD là phí thu hộ của đơn vị vận chuyển. Tích hợp cổng mới (vd MoMo) thì bấm <b>Thêm cổng</b>: mã cổng
            tạo từ tên và phải trùng mã phương thức thanh toán lưu trong đơn hàng.
          </p>
          <div className="overflow-x-auto rounded-admin border border-admin-line">
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
          <button
            type="button"
            className={cx(BTN_SECONDARY_SM, 'mt-3')}
            disabled={form.payment_fees.length >= 10}
            onClick={() => setForm(f => f && { ...f, payment_fees: [...f.payment_fees, { name: '', rate: 0, fixed: 0 }] })}
          >
            <Plus size={14} aria-hidden /> Thêm cổng
          </button>
          {gatewaysInvalid && (
            <p className="mb-0 mt-2 text-[12px] text-[#b91c1c]">Cổng thêm mới cần tên có chữ hoặc số trước khi lưu.</p>
          )}

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13.5px] font-bold text-admin-ink">Phí gửi thông báo mỗi đơn</span>
              <span className="flex items-center gap-1.5">
                <MoneyInput
                  value={form.notification_per_order}
                  onChange={v => setForm(f => f && { ...f, notification_per_order: v })}
                  label="Phí gửi thông báo mỗi đơn"
                  className="w-[120px] py-1.5"
                />
                <span className="text-[12px] text-admin-muted">đ</span>
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13.5px] font-bold text-admin-ink">Vốn dự phòng hiện có</span>
                <span className="flex items-center gap-1.5">
                  <MoneyInput
                    value={form.cash_reserve}
                    onChange={v => setForm(f => f && { ...f, cash_reserve: v })}
                    label="Vốn dự phòng hiện có"
                    className="w-[160px] py-1.5"
                  />
                  <span className="text-[12px] text-admin-muted">đ</span>
                </span>
              </div>
              <p className={cx(FIELD_HINT, 'mb-0')}>
                Tiền nhóm còn để bù lỗ. Khi sàn đang lỗ, trang tính được sàn trụ được bao nhiêu tháng. Để 0 nếu chưa có.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );

  return (
    <div className={PAGE}>
      {error && <Alert tone="danger" onDismiss={() => setError('')}>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}
      {section === 'tong-quan' && o && renderOverview(o)}
      {section === 'mo-phong' && sim && result && renderSimulation(sim, result)}
      {section === 'chi-phi' && form && renderCosts(form)}
    </div>
  );
}

export default AdminFinanceSimulationPage;
