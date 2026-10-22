import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Lock, Plus, RefreshCw, Save, Trash2, Undo2 } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { adminFinanceService, FinanceConfig, FinanceOverview, PaymentFee } from '../services/adminFinanceService';
import { SCENARIOS, SimInput, profitCurve, sensitivity, simulate } from '../services/financeSimulation';
import { Alert, PageHeader, SegmentedControl } from '../components/AdminPrimitives';
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
import { CHART_INK, SERIES } from '../../../shared/components/charts/chartTheme';
import { compactMoney, count, money } from '../../../shared/utils/format';

type RangeKey = '7' | '30' | '90' | '365';

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: '90', label: '90 ngày' },
  { value: '365', label: '1 năm' },
];

/** Giống `gatewayCode` ở BE: "Ví MoMo" → "VI_MOMO". Chỉ để xem trước, BE mới là nơi tạo mã. */
function gatewayCode(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

function Tile({
  label,
  value,
  tone,
  children,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'bad';
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
      {children && <div className="mt-2 text-[12px] leading-[1.5] text-admin-muted">{children}</div>}
    </div>
  );
}

interface FlowRow {
  label: string;
  note: string;
  value: number;
  kind: 'in' | 'out' | 'sum';
}

function MoneyFlow({ rows }: { rows: FlowRow[] }) {
  const max = Math.max(1, ...rows.map(r => Math.abs(r.value)));
  return (
    <ul className="m-0 list-none p-0">
      {rows.map(r => {
        const sum = r.kind === 'sum';
        const bar = r.kind === 'in' ? SERIES.green : r.kind === 'out' ? SERIES.red : CHART_INK.axis;
        const text = r.kind === 'in' ? `+${money(r.value)}` : r.kind === 'out' ? `−${money(r.value)}` : signedMoney(r.value);
        return (
          <li
            key={r.label}
            className={cx(
              'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-admin-line-soft px-[18px] py-3 last:border-b-0 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_150px]',
              sum && 'bg-[#fafcfa]'
            )}
          >
            <div className="min-w-0 [overflow-wrap:anywhere]">
              <div className={cx('text-[13.5px] text-admin-ink', sum ? 'font-bold' : 'font-semibold')}>{r.label}</div>
              <div className="text-[12px] leading-[1.5] text-admin-muted">{r.note}</div>
            </div>
            <div className="order-last col-span-2 h-2 rounded-full bg-admin-line-soft md:order-none md:col-span-1" aria-hidden>
              <div
                className="h-full rounded-full"
                style={{ width: `${(Math.abs(r.value) / max) * 100}%`, backgroundColor: bar }}
              />
            </div>
            <div
              className={cx(
                'text-right text-[14px] tabular-nums',
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
          {unit === 'đ' && (
            <span className="hidden whitespace-nowrap text-[12px] text-admin-muted sm:inline" aria-hidden>
              {compactMoney(value)}
            </span>
          )}
          <input
            id={id}
            type="number"
            min={min}
            step={step}
            value={value}
            onChange={e => onChange(Math.max(min, Number(e.target.value) || 0))}
            className={cx(FIELD, 'w-[130px] py-1.5 text-right tabular-nums')}
          />
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

function Verdict({ o }: { o: FinanceOverview }) {
  const days = o.period.days;
  const profit = o.pnl.net_profit;
  const be = o.monthly.break_even_orders;
  const perMonth = o.monthly.orders;
  const cpo = o.contribution_per_order ?? 0;

  if (!o.orders.paid) {
    return (
      <Alert tone="warn">
        Chưa có đơn đã thanh toán trong {days} ngày qua. Bảng bên dưới chỉ còn chi phí cố định; phần mô phỏng đang dùng
        giá trị giả định — hãy sửa cho sát thực tế.
      </Alert>
    );
  }
  if (profit >= 0) {
    return (
      <Alert tone="success">
        {days} ngày qua sàn <b>lãi {money(profit)}</b> sau mọi chi phí. Cần {count(be ?? 0)} đơn/tháng để hòa vốn, hiện
        đạt khoảng {count(perMonth)} đơn/tháng.
      </Alert>
    );
  }
  if (be === null) {
    return (
      <Alert tone="danger">
        {days} ngày qua sàn <b>lỗ {money(-profit)}</b>.{' '}
        {cpo < 0 ? `Mỗi đơn đang làm sàn lỗ thêm ${money(-cpo)}` : 'Mỗi đơn không góp được đồng nào'} vì phí cổng, voucher
        sàn và hoàn tiền lớn hơn hoa hồng — bán thêm cũng không hòa vốn được. Cần tăng hoa hồng hoặc giảm voucher sàn.
      </Alert>
    );
  }
  return (
    <Alert tone="warn">
      {days} ngày qua sàn <b>lỗ {money(-profit)}</b>. Mỗi đơn góp {money(cpo)}, nên cần <b>{count(be)} đơn/tháng</b> để
      hòa vốn — hiện khoảng {count(perMonth)} đơn/tháng, còn thiếu {count(Math.max(0, be - perMonth))}.
    </Alert>
  );
}

export function AdminFinanceSimulationPage() {
  const [range, setRange] = useState<RangeKey>('30');
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

  const load = useCallback(async (days: number) => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const [o, c] = await Promise.all([adminFinanceService.getOverview(days), adminFinanceService.getConfig()]);
      if (id !== requestId.current) return;
      setOverview(o);
      setConfig(c);
      setForm(c);
      setSim(baselineOf(o));
      setScenario('base');
    } catch {
      if (id === requestId.current) setError('Không tải được số liệu tài chính. Bấm "Làm mới" để thử lại.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(Number(range));
  }, [range, load]);

  const base = useMemo(() => (overview ? baselineOf(overview) : null), [overview]);
  const result = useMemo(() => (sim ? simulate(sim) : null), [sim]);
  const curve = useMemo(() => (sim ? profitCurve(sim) : []), [sim]);
  const shocks = useMemo(() => (sim ? sensitivity(sim) : []), [sim]);
  const dirty = JSON.stringify(form) !== JSON.stringify(config);
  const costsInvalid = !!form?.monthly_costs.some(c => !c.name.trim());
  const gatewaysInvalid = !!form?.payment_fees.some(g => !g.is_default && !gatewayCode(g.name));
  const formInvalid = costsInvalid || gatewaysInvalid;

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
      await load(Number(range));
      setNotice('Đã lưu cấu hình. Các số liệu trên trang đã tính lại theo chi phí mới.');
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
  const days = o?.period.days ?? Number(range);
  const flow: FlowRow[] = o
    ? [
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
      ]
    : [];

  const be = o?.monthly.break_even_orders ?? null;
  const reach = o && be ? Math.min(100, (o.monthly.orders / be) * 100) : 0;
  const lowestProfit = curve.length ? Math.min(...curve.map(p => p.profit)) : 0;
  const maxX = curve.length ? curve[curve.length - 1].orders : 0;

  return (
    <div className={PAGE}>
      <PageHeader
        title="Tài chính & hòa vốn"
        description="Sàn thu được bao nhiêu, tốn bao nhiêu để vận hành và cần bao nhiêu đơn để không lỗ. Chỉ tính đơn đã thanh toán — cùng cách đếm với trang Thống kê thu nhập."
        actions={
          <button type="button" className={BTN_SECONDARY} onClick={() => void load(Number(range))} disabled={loading}>
            <RefreshCw size={15} className={cx(loading && 'animate-spin')} aria-hidden /> Làm mới
          </button>
        }
      />

      <div className={TOOLBAR}>
        <SegmentedControl<RangeKey> value={range} onChange={setRange} options={RANGE_OPTIONS} label="Khoảng thời gian" />
        {o && (
          <span className="text-[12.5px] text-admin-muted">
            {o.period.from.slice(0, 10).split('-').reverse().join('/')} –{' '}
            {o.period.to.slice(0, 10).split('-').reverse().join('/')} · mức hoa hồng mặc định{' '}
            <b className="text-admin-ink">{o.commission_percent}%</b>
          </span>
        )}
      </div>

      {error && <Alert tone="danger" onDismiss={() => setError('')}>{error}</Alert>}
      {notice && <Alert tone="success" onDismiss={() => setNotice('')}>{notice}</Alert>}

      {o && (
        <div className={cx('transition-opacity duration-150', loading && 'opacity-60')}>
          <Verdict o={o} />

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Tile label="Lãi/lỗ ròng" value={signedMoney(o.pnl.net_profit)} tone={o.pnl.net_profit < 0 ? 'bad' : 'good'}>
              {days} ngày, sau mọi chi phí
            </Tile>
            <Tile label="Doanh thu thuần của sàn" value={money(o.pnl.net_revenue)}>
              Bằng {pct(o.take_rate)} tổng tiền hàng {compactMoney(o.gmv)}
            </Tile>
            <Tile
              label="Lãi góp mỗi đơn"
              value={o.contribution_per_order === null ? '—' : signedMoney(o.contribution_per_order)}
              tone={o.contribution_per_order !== null && o.contribution_per_order < 0 ? 'bad' : undefined}
            >
              Phần mỗi đơn còn lại để trả chi phí cố định
            </Tile>
            <Tile label="Đơn mỗi tháng / cần để hòa vốn" value={`${count(o.monthly.orders)} / ${be === null ? '—' : count(be)}`}>
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
            </Tile>
          </div>

          <section className={cx(CARD, 'mb-5')}>
            <div className={CARD_HEADER}>
              <h2 className="m-0 text-[15px] font-bold text-admin-ink">Tiền đi đâu trong {days} ngày qua</h2>
              <span className="text-[12px] text-admin-muted">Đi từ trên xuống: cộng phần sàn thu, trừ dần từng khoản chi</span>
            </div>
            <MoneyFlow rows={flow} />
          </section>
        </div>
      )}

      {sim && result && (
        <section className={cx(CARD, 'mb-5')}>
          <div className={CARD_HEADER}>
            <div>
              <h2 className="m-0 text-[15px] font-bold text-admin-ink">Mô phỏng: nếu thay đổi thì sao?</h2>
              <p className="m-0 mt-0.5 text-[12px] text-admin-muted">
                {SCENARIOS.find(s => s.key === scenario)?.note ?? 'Đang dùng giá trị bạn tự chỉnh'}
                {o && !o.orders.paid && ' · chưa có đơn trong kỳ nên điểm xuất phát là giả định'}
              </p>
            </div>
            <SegmentedControl
              value={scenario}
              onChange={pickScenario}
              options={SCENARIOS.map(s => ({ value: s.key, label: s.label }))}
              label="Kịch bản"
            />
          </div>

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

            <div className="min-w-0">
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                  <div className="text-[12px] font-semibold text-admin-muted">Cần để hòa vốn</div>
                  <div className="mt-1 text-[20px] font-extrabold text-admin-ink">
                    {result.breakEvenOrders === null ? 'Không thể' : `${count(result.breakEvenOrders)} đơn`}
                  </div>
                </div>
              </div>

              <p className="mb-3 mt-0 text-[12.5px] leading-[1.6] text-admin-muted">
                Mỗi đơn: hoa hồng {money(Math.round(result.commissionPerOrder))} − phí cổng{' '}
                {money(Math.round(result.paymentFeePerOrder))} − voucher sàn {money(Math.round(sim.voucherPerOrder))} − thất thoát hoàn
                tiền {money(Math.round(result.refundLossPerOrder))} − thông báo {money(sim.notificationPerOrder)} ={' '}
                <b className="text-admin-ink">{signedMoney(Math.round(result.contributionPerOrder))}</b>
              </p>

              <div className="h-[360px] w-full" role="img" aria-label="Lãi lỗ mỗi tháng theo số đơn">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curve} margin={{ top: 20, right: 16, bottom: 4, left: 4 }}>
                    <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
                    <XAxis
                      dataKey="orders"
                      type="number"
                      domain={[0, maxX]}
                      ticks={[0, 1, 2, 3, 4].map(k => (maxX * k) / 4)}
                      tickFormatter={v => count(v)}
                      tick={{ fontSize: 11, fill: CHART_INK.axis }}
                      tickLine={false}
                      axisLine={{ stroke: CHART_INK.grid }}
                    />
                    <YAxis
                      tickFormatter={v => compactMoney(v)}
                      tick={{ fontSize: 11, fill: CHART_INK.axis }}
                      tickLine={false}
                      axisLine={false}
                      width={64}
                    />
                    {lowestProfit < 0 && (
                      <ReferenceArea
                        y1={lowestProfit}
                        y2={0}
                        fill={SERIES.red}
                        fillOpacity={0.06}
                        label={{ value: 'Vùng lỗ', position: 'insideBottomRight', fontSize: 11, fill: CHART_INK.axis }}
                      />
                    )}
                    <ReferenceLine y={0} stroke={CHART_INK.axis} />
                    <ReferenceLine
                      x={sim.orders}
                      stroke={SERIES.green}
                      label={{ value: `Đang chọn: ${count(sim.orders)} đơn`, position: sim.orders > maxX / 2 ? 'insideTopRight' : 'insideTopLeft', fontSize: 11, fill: CHART_INK.axis }}
                    />
                    {result.breakEvenOrders !== null && (
                      <ReferenceDot
                        x={result.breakEvenOrders}
                        y={0}
                        r={5}
                        fill={SERIES.blue}
                        stroke="#ffffff"
                        strokeWidth={2}
                        label={{
                          value: `Hòa vốn: ${count(result.breakEvenOrders)} đơn`,
                          position: 'right',
                          offset: 10,
                          fontSize: 11,
                          fill: CHART_INK.axis,
                        }}
                      />
                    )}
                    <Tooltip
                      formatter={(value: any) => [signedMoney(Number(value)), 'Lãi/lỗ mỗi tháng']}
                      labelFormatter={label => `${count(Number(label))} đơn/tháng`}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                    />
                    <Line
                      type="linear"
                      dataKey="profit"
                      stroke={SERIES.blue}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="border-t border-admin-line">
            <h3 className="m-0 px-[18px] pb-1 pt-3.5 text-[13.5px] font-bold text-admin-ink">
              Yếu tố nào ảnh hưởng mạnh nhất?
            </h3>
            <p className="m-0 px-[18px] pb-2 text-[12px] text-admin-muted">
              Đổi từng yếu tố một so với mô phỏng đang xem, xếp theo mức làm lãi/lỗ tháng thay đổi nhiều nhất.
            </p>
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
          </div>
        </section>
      )}

      {form && (
        <section className={CARD}>
          <div className={CARD_HEADER}>
            <div>
              <h2 className="m-0 text-[15px] font-bold text-admin-ink">Chi phí vận hành</h2>
              <p className="m-0 mt-0.5 text-[12px] text-admin-muted">
                Nhập theo hóa đơn thật.
                {config?.updated_at && ` Lưu lần cuối ${new Date(config.updated_at).toLocaleString('vi-VN')}.`}
              </p>
            </div>
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

          <div className="grid grid-cols-1 gap-6 p-[18px] xl:grid-cols-2">
            <div>
              <h3 className="m-0 text-[13.5px] font-bold text-admin-ink">Chi phí cố định mỗi tháng</h3>
              <p className={cx(FIELD_HINT, 'mb-3')}>
                Khoản phải trả dù không có đơn nào: máy chủ, tên miền, Vercel, MongoDB Atlas, Cloudinary, API AI… 4 khoản
                mặc định (có ổ khóa) chỉ sửa số tiền, dùng gói miễn phí thì để 0. Khoản tự thêm thì sửa và xóa được.
              </p>
              <div className="flex flex-col gap-2">
                {form.monthly_costs.map((c, idx) => (
                  <div key={idx} className="grid grid-cols-[minmax(0,1fr)_150px_auto] items-center gap-2">
                    <input
                      aria-label={`Tên khoản chi phí ${idx + 1}`}
                      value={c.name}
                      maxLength={60}
                      placeholder="VD: MongoDB Atlas"
                      disabled={!!c.key}
                      onChange={e => updateCost(idx, { name: e.target.value })}
                      className={cx(FIELD, 'py-2', !c.name.trim() && 'border-[#f6caca]')}
                    />
                    <input
                      aria-label={`Số tiền mỗi tháng của khoản ${idx + 1}`}
                      type="number"
                      min={0}
                      step={10000}
                      value={c.amount}
                      onChange={e => updateCost(idx, { amount: Math.max(0, Number(e.target.value) || 0) })}
                      className={cx(FIELD, 'py-2 text-right tabular-nums')}
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
            </div>

            <div>
              <h3 className="m-0 text-[13.5px] font-bold text-admin-ink">Phí cổng thanh toán</h3>
              <p className={cx(FIELD_HINT, 'mb-3')}>
                Hiện chưa tính phí cổng nên để 0. Khi cổng bắt đầu thu phí thì nhập theo hợp đồng; phí tính trên toàn bộ
                tiền khách trả. COD là phí thu hộ của đơn vị vận chuyển. Tích hợp cổng mới (vd MoMo) thì bấm{' '}
                <b>Thêm cổng</b>: mã cổng tạo từ tên và phải trùng mã phương thức thanh toán lưu trong đơn hàng.
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
                              <input
                                aria-label={`Phí cố định của ${label}`}
                                type="number"
                                min={0}
                                step={100}
                                value={g.fixed}
                                onChange={e => updateFee(idx, { fixed: Math.max(0, Number(e.target.value) || 0) })}
                                className={cx(FIELD, 'w-[110px] py-1.5 text-right tabular-nums')}
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
                onClick={() =>
                  setForm(f => f && { ...f, payment_fees: [...f.payment_fees, { name: '', rate: 0, fixed: 0 }] })
                }
              >
                <Plus size={14} aria-hidden /> Thêm cổng
              </button>
              {gatewaysInvalid && (
                <p className="mb-0 mt-2 text-[12px] text-[#b91c1c]">Cổng thêm mới cần tên có chữ hoặc số trước khi lưu.</p>
              )}

              <label className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13.5px] font-bold text-admin-ink">Phí gửi thông báo mỗi đơn</span>
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={form.notification_per_order}
                    onChange={e =>
                      setForm(f => f && { ...f, notification_per_order: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className={cx(FIELD, 'w-[110px] py-1.5 text-right tabular-nums')}
                  />
                  <span className="text-[12px] text-admin-muted">đ</span>
                </span>
              </label>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default AdminFinanceSimulationPage;
