import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Loader2, Percent, Receipt, Store, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import type { FinanceOverview } from '../types';
import { Alert, EmptyState, PageHeader, SegmentedControl } from '../components/AdminPrimitives';
import { CARD, CARD_HEADER, PAGE, TABLE, TOOLBAR, cx } from '../components/adminUi';
import { TrendChart, TrendLegend } from '../../../shared/components/charts/TrendChart';
import { SERIES } from '../../../shared/components/charts/chartTheme';
import { compactMoney, count, money } from '../../../shared/utils/format';

type RangeKey = '7' | '30' | '90' | '365';

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: '90', label: '90 ngày' },
  { value: '365', label: '1 năm' },
];

/**
 * Biến động so với kỳ liền trước (BR-142).
 *
 * Kỳ trước bằng 0 thì KHÔNG trả về "+100%" — chia cho 0 không có nghĩa, và một con số
 * phần trăm bịa ra ở đây sẽ bị đọc thành tăng trưởng thật.
 */
function changePercent(now: number, before: number): number | null {
  if (!before) return null;
  return Math.round(((now - before) / before) * 1000) / 10;
}

function Delta({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-[12px] text-admin-muted">kỳ trước không có dữ liệu</span>;
  }
  const up = value > 0;
  const flat = value === 0;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 text-[12px] font-bold tabular-nums',
        flat ? 'text-admin-muted' : up ? 'text-admin-brand-700' : 'text-[#b91c1c]'
      )}
    >
      {!flat && (up ? <TrendingUp size={13} aria-hidden /> : <TrendingDown size={13} aria-hidden />)}
      {up ? '+' : ''}
      {value}% <span className="font-medium text-admin-muted">so với kỳ trước</span>
    </span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  hint,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delta?: number | null;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={cx(CARD, 'px-[18px] py-4', accent && 'border-admin-brand')}>
      <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.04em] text-admin-muted">
        <Icon size={14} aria-hidden /> {label}
      </div>
      <div
        className={cx(
          'mt-1.5 text-[23px] font-extrabold leading-none tabular-nums',
          accent ? 'text-admin-brand' : 'text-admin-ink'
        )}
      >
        {value}
      </div>
      <div className="mt-2">{delta !== undefined ? <Delta value={delta} /> : <span className="text-[12px] text-admin-muted">{hint}</span>}</div>
      {delta !== undefined && hint && <div className="mt-0.5 text-[12px] text-admin-muted">{hint}</div>}
    </div>
  );
}

const PAYMENT_LABEL: Record<string, string> = { PAID: 'Đã thanh toán', PENDING: 'Chờ thanh toán', REFUNDED: 'Đã hoàn tiền' };
const ORDER_LABEL: Record<string, string> = {
  ORDERED: 'Đã đặt',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ',
};

export function AdminRevenue() {
  const [range, setRange] = useState<RangeKey>('30');
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    adminService
      .getFinanceOverview(Number(range))
      .then(d => alive && setData(d))
      .catch(() => alive && setError('Không tải được số liệu tài chính. Tải lại trang để thử lại.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [range]);

  const cur = data?.current;
  const prev = data?.previous;

  /** Tỉ lệ phí thực tế trên GMV. Khác với % cấu hình vì % đó tính trên tiền người bán nhận. */
  const effectiveRate = cur && cur.gmv > 0 ? Math.round((cur.commission / cur.gmv) * 1000) / 10 : null;

  const chart = useMemo(
    () =>
      (data?.daily || []).map(d => ({
        // Trục hoành chỉ cần ngày/tháng; năm nằm ở nhãn kỳ phía trên.
        label: `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}`,
        gmv: d.gmv,
        commission: d.commission,
      })),
    [data]
  );
  const hasSales = Boolean(cur && cur.orders > 0);

  return (
    <div className={PAGE}>
      <PageHeader
        title="Thống kê thu nhập"
        description="Hoa hồng sàn thu được, tổng tiền hàng và tiền trả người bán. Chỉ tính đơn đã thanh toán — đơn chờ thanh toán chưa phải tiền thật."
        actions={
          <Link to="/admin/commission" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-admin-brand no-underline hover:underline">
            Đổi mức hoa hồng <ArrowUpRight size={15} aria-hidden />
          </Link>
        }
      />

      <div className={TOOLBAR}>
        <SegmentedControl<RangeKey> value={range} onChange={setRange} options={RANGE_OPTIONS} label="Khoảng thời gian" />
        {data && (
          <span className="text-[12.5px] text-admin-muted">
            {data.period.from.slice(0, 10).split('-').reverse().join('/')} –{' '}
            {data.period.to.slice(0, 10).split('-').reverse().join('/')} · mức hoa hồng đang áp dụng{' '}
            <b className="text-admin-ink">{data.commissionPercent}%</b>
          </span>
        )}
      </div>

      {error && <Alert tone="danger" onDismiss={() => setError('')}>{error}</Alert>}

      {data && data.refunded.orders > 0 && (
        <Alert tone="warn">
          Kỳ này có <b>{count(data.refunded.orders)} đơn đã hoàn tiền</b> (tiền hàng {money(data.refunded.gmv)}, hoa
          hồng {money(data.refunded.commission)}). Số đó <b>không nằm trong</b> các con số bên dưới — hoa hồng của đơn
          hoàn là khoản mất, không phải khoản thu.
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center gap-2.5 py-10 text-[13.5px] text-admin-muted">
          <Loader2 size={18} className="animate-spin" aria-hidden /> Đang tính số liệu…
        </div>
      ) : !hasSales ? (
        <div className={CARD}>
          <EmptyState
            icon={Receipt}
            title="Chưa có đơn nào đã thanh toán trong kỳ"
            description="Chọn khoảng thời gian dài hơn, hoặc chờ đơn đầu tiên được thanh toán. Đơn ở trạng thái chờ thanh toán không được tính vào doanh thu."
          />
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={Percent}
              label="Hoa hồng sàn thu được"
              value={money(cur!.commission)}
              delta={changePercent(cur!.commission, prev!.commission)}
              hint={effectiveRate !== null ? `${effectiveRate}% trên tổng tiền hàng` : undefined}
              accent
            />
            <KpiCard
              icon={Receipt}
              label="Tổng tiền hàng (GMV)"
              value={money(cur!.gmv)}
              delta={changePercent(cur!.gmv, prev!.gmv)}
              hint="trước phí, chưa gồm vận chuyển"
            />
            <KpiCard
              icon={Wallet}
              label="Trả người bán"
              value={money(cur!.payout)}
              delta={changePercent(cur!.payout, prev!.payout)}
              hint="sau khi trừ hoa hồng"
            />
            <KpiCard
              icon={Store}
              label="Đơn đã thanh toán"
              value={count(cur!.orders)}
              delta={changePercent(cur!.orders, prev!.orders)}
              hint={`trung bình ${money(Math.round(cur!.commission / cur!.orders))} hoa hồng/đơn`}
            />
          </div>

          <div className={cx(CARD, 'mb-5')}>
            <div className={CARD_HEADER}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="m-0 text-[15px] font-bold text-admin-ink">Diễn biến theo ngày</h2>
                <TrendLegend
                  items={[
                    { name: 'Tiền hàng', color: SERIES.blue, total: compactMoney(cur!.gmv) },
                    { name: 'Hoa hồng sàn', color: SERIES.green, total: compactMoney(cur!.commission) },
                  ]}
                />
              </div>
            </div>
            <div className="px-5 py-4">
              <TrendChart
                data={chart}
                series={[
                  { key: 'gmv', name: 'Tiền hàng', color: SERIES.blue },
                  { key: 'commission', name: 'Hoa hồng sàn', color: SERIES.green },
                ]}
                formatValue={compactMoney}
                ariaLabel={`Tiền hàng và hoa hồng sàn theo từng ngày trong ${data!.period.days} ngày qua`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className={CARD}>
              <div className={CARD_HEADER}>
                <h2 className="m-0 text-[15px] font-bold text-admin-ink">Gian hàng đóng góp nhiều nhất</h2>
                <p className="mb-0 mt-1 text-[12.5px] text-admin-muted">Xếp theo hoa hồng sàn thu được trong kỳ.</p>
              </div>
              <div className="overflow-x-auto">
                <table className={TABLE}>
                  <thead>
                    <tr>
                      <th>Gian hàng</th>
                      <th className="text-right">Đơn</th>
                      <th className="text-right">Tiền hàng</th>
                      <th className="text-right">Hoa hồng</th>
                      <th className="text-right">Tỉ trọng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.topShops.map(s => (
                      <tr key={s.shopId}>
                        <td className="max-w-[200px] truncate font-semibold text-admin-ink" title={s.name}>
                          {s.name}
                        </td>
                        <td className="text-right tabular-nums">{count(s.orders)}</td>
                        <td className="text-right tabular-nums text-admin-muted">{money(s.gmv)}</td>
                        <td className="text-right font-bold tabular-nums text-admin-brand">{money(s.commission)}</td>
                        <td className="text-right tabular-nums text-admin-muted">
                          {cur!.commission > 0 ? `${Math.round((s.commission / cur!.commission) * 100)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={CARD}>
              <div className={CARD_HEADER}>
                <h2 className="m-0 text-[15px] font-bold text-admin-ink">Giao dịch gần nhất</h2>
                <p className="mb-0 mt-1 text-[12.5px] text-admin-muted">
                  Nhìn từ phía sàn: hoa hồng là tiền vào, tiền trả người bán là tiền ra.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className={TABLE}>
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Gian hàng</th>
                      <th className="text-right">Hoa hồng</th>
                      <th className="text-right">Trả người bán</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.recent.map(t => (
                      <tr key={t.orderCode}>
                        <td>
                          <div className="font-semibold text-admin-ink">{t.orderCode}</div>
                          <div className="text-[12px] text-admin-muted">
                            {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="max-w-[150px] truncate" title={t.shopName}>
                          {t.shopName}
                        </td>
                        {/* BR-116: tiền vào xanh có dấu +, tiền ra đỏ có dấu − */}
                        <td className="text-right font-bold tabular-nums text-admin-brand-700">+{money(t.commission)}</td>
                        <td className="text-right tabular-nums text-[#b91c1c]">−{money(t.payout)}</td>
                        <td>
                          <div className="text-[12.5px] font-semibold text-admin-ink">
                            {PAYMENT_LABEL[t.paymentStatus] || t.paymentStatus}
                          </div>
                          <div className="text-[12px] text-admin-muted">{ORDER_LABEL[t.orderStatus] || t.orderStatus}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <p className="mt-5 text-[12.5px] leading-[1.6] text-admin-muted">
            Số liệu lấy từ đơn có trạng thái thanh toán <b>PAID</b> trong kỳ, cắt ngày theo giờ Việt Nam. Kỳ so sánh là{' '}
            {data!.period.days} ngày liền trước. Vận chuyển ({money(cur!.shipping)}) và giảm giá ({money(cur!.discount)})
            không nằm trong tiền hàng ở trên.
          </p>
        </>
      )}
    </div>
  );
}

export default AdminRevenue;
