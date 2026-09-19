import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ImageOff,
  Layers,
  Package,
  PauseCircle,
  RefreshCw,
  Palette,
  Sparkles,
} from 'lucide-react';



import {
  ProgressBar,
  RangeTabs,
  SellerCard,
  StatCard,
  TaskRow,
} from '../components/dashboard/SellerDashboardUi';
import { TrendChart } from '../../../shared/components/charts/TrendChart';
import { ColumnChart } from '../../../shared/components/charts/ColumnChart';
import { ShareBar } from '../../../shared/components/charts/ShareBar';
import { SERIES } from '../../../shared/components/charts/chartTheme';
import { compactMoney, count as fmtCount, money, percentOf, timeAgo } from '../../../shared/utils/format';
import { comparePeriods, countPerDay, dayRange } from '../../../shared/utils/timeseries';
import {
  LOW_STOCK_THRESHOLD,
  derivePriceStats,
  deriveSellerMetrics,
  deriveSetupTasks,
  sellerDashboardService,
  type SellerOverviewData,
} from '../services/sellerDashboardService';
import type { ProductItem } from '../../product/types/product';
import { PRODUCT_CREATE_PATH } from '../featureFlags';

type RangeKey = '7' | '30' | '90';

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: '90', label: '90 ngày' },
];

const CATEGORY_ROWS = 6;

const EMPTY_DATA: SellerOverviewData = {
  products: [],
  productsLoaded: 0,
  productsTotal: 0,
  settings: null,
  failures: [],
};

function Thumb({ product }: { product: ProductItem }) {
  const [broken, setBroken] = useState(false);
  const src = product.thumbnail || product.images?.[0];

  if (!src || broken) {
    return (
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
        <Package size={15} aria-hidden />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-9 w-9 shrink-0 rounded-lg border border-stone-200 object-cover"
    />
  );
}

function PriceStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className="m-0 mt-1 text-lg font-extrabold leading-none text-stone-900 font-jakarta">{value}</dd>
      {hint && <dd className="m-0 mt-1 text-[11.5px] leading-snug text-stone-400">{hint}</dd>}
    </div>
  );
}

export function SellerDashboard() {
  const [data, setData] = useState<SellerOverviewData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [range, setRange] = useState<RangeKey>('30');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const result = await sellerDashboardService.loadOverview();
      setData(result);
      setLoadedAt(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const days = Number(range);

  const metrics = useMemo(() => deriveSellerMetrics(data.products), [data.products]);
  const tasks = useMemo(() => deriveSetupTasks(data.settings), [data.settings]);
  const priceStats = useMemo(() => derivePriceStats(data.products), [data.products]);

  const priceColumns = useMemo(() => {
    if (!priceStats) return [];
    const boundary = (v: number) => (v === 0 ? '0' : compactMoney(v));
    return priceStats.buckets.map(b => ({
      label: boundary(b.from),
      value: b.count,
      detail: b.to > b.from ? `${money(b.from)} – dưới ${money(b.to)}` : money(b.from),
    }));
  }, [priceStats]);

  const trend = useMemo(() => {
    const buckets = dayRange(days);
    const perDay = countPerDay(data.products, p => p.createdAt);
    return buckets.map(d => ({ label: d.label, listings: perDay.get(d.key) ?? 0 }));
  }, [data.products, days]);

  const newInPeriod = useMemo(
    () => comparePeriods(data.products, p => p.createdAt, days),
    [data.products, days]
  );

  const restockList = useMemo(
    () => [...metrics.outOfStockItems, ...metrics.lowStock].slice(0, 6),
    [metrics.outOfStockItems, metrics.lowStock]
  );

  const categoryRows = useMemo(() => {
    const rows = metrics.byCategory.slice(0, CATEGORY_ROWS);
    const rest = metrics.byCategory.slice(CATEGORY_ROWS);
    if (rest.length > 0) {
      rows.push({
        category: `Khác (${rest.length} danh mục)`,
        count: rest.reduce((s, r) => s + r.count, 0),
        value: rest.reduce((s, r) => s + r.value, 0),
      });
    }
    return rows;
  }, [metrics.byCategory]);

  const shopName = data.settings?.brand?.storeName?.trim();
  const tasksDone = tasks.filter(t => t.done).length;
  const restockTotal = metrics.outOfStock + metrics.lowStock.length;

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      {/* Page Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="m-0 text-2xl font-extrabold tracking-tight text-stone-900 font-jakarta">
            Trang chủ gian hàng
          </h1>
          <p className="mb-0 mt-1.5 max-w-[64ch] text-[13.5px] leading-relaxed text-stone-500">
            {shopName ? `${shopName} — t` : 'T'}ình trạng kho hàng và những việc đang chờ bạn xử lý.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/seller/designs"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-[13.5px] font-semibold text-stone-700 no-underline hover:bg-stone-50 transition-colors"
          >
            <Palette size={15} /> Kho thiết kế
          </Link>
          <Link
            to={PRODUCT_CREATE_PATH}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#007700] bg-[#007700] px-4 py-2 text-[13.5px] font-semibold text-white no-underline transition-colors duration-150 hover:bg-[#005B00] motion-reduce:transition-none"
          >
            <Sparkles size={16} aria-hidden />
            Thiết kế POD
          </Link>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing || loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-[13.5px] font-semibold text-stone-600 transition-colors duration-150 hover:bg-stone-50 disabled:pointer-events-none disabled:opacity-55 motion-reduce:transition-none"
          >
            <RefreshCw
              size={15}
              className={refreshing ? 'animate-spin motion-reduce:animate-none' : undefined}
              aria-hidden
            />
            Làm mới
          </button>
        </div>

      </div>

      {/* Time Range Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <RangeTabs value={range} onChange={setRange} options={RANGE_OPTIONS} label="Khoảng thời gian thống kê" />
        {loadedAt && <span className="text-xs text-stone-500">Số liệu lúc {timeAgo(loadedAt)}</span>}
      </div>

      {data.failures.map(msg => (
        <div
          key={msg}
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-900"
        >
          <AlertTriangle size={16} className="mt-px shrink-0" aria-hidden />
          <span>{msg}</span>
        </div>
      ))}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          loading={loading}
          label="Tổng sản phẩm"
          value={fmtCount(metrics.total)}
          hint={`+${fmtCount(newInPeriod.current)} trong ${days} ngày`}
        />
        <StatCard
          loading={loading}
          label="Đang bán"
          accent={SERIES.green}
          value={fmtCount(metrics.active)}
          hint={`${percentOf(metrics.active, metrics.total)}% danh mục sản phẩm`}
        />
        <StatCard
          loading={loading}
          label="Cần nhập thêm"
          accent={restockTotal > 0 ? SERIES.red : undefined}
          value={fmtCount(restockTotal)}
          hint={`${fmtCount(metrics.outOfStock)} hết hàng · ${fmtCount(metrics.lowStock.length)} sắp hết`}
        />
        <StatCard
          loading={loading}
          label="Giá trị tồn kho"
          value={compactMoney(metrics.inventoryValue)}
          hint={money(metrics.inventoryValue)}
        />
      </div>

      {/* Main Charts & Analytics Section */}
      <div className={refreshing ? 'opacity-60 transition-opacity duration-200' : undefined}>
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <SellerCard
            className="xl:col-span-2"
            title="Sản phẩm đăng mới"
            description={`Số sản phẩm bạn tạo mỗi ngày, ${days} ngày gần nhất.`}
            action={
              <span className="text-[13px] font-bold text-stone-900">
                {fmtCount(newInPeriod.current)} sản phẩm
              </span>
            }
          >
            <div className="px-5 pb-4 pt-4">
              {loading ? (
                <div className="h-[260px] animate-pulse rounded-xl bg-stone-100 motion-reduce:animate-none" />
              ) : (
                <TrendChart
                  ariaLabel={`Số sản phẩm tạo mới mỗi ngày trong ${days} ngày gần nhất`}
                  data={trend}
                  series={[{ key: 'listings', name: 'Sản phẩm mới', color: SERIES.green }]}
                />
              )}
            </div>
          </SellerCard>

          <SellerCard title="Cơ cấu sản phẩm" description="Theo trạng thái hiển thị và tồn kho.">
            <div className="px-5 pb-5 pt-5">
              {loading ? (
                <div className="h-[140px] animate-pulse rounded-xl bg-stone-100 motion-reduce:animate-none" />
              ) : (
                <ShareBar
                  ariaLabel="Cơ cấu sản phẩm theo trạng thái"
                  emptyLabel="Gian hàng chưa có sản phẩm nào."
                  segments={[
                    {
                      key: 'active',
                      label: 'Đang bán',
                      value: metrics.active,
                      color: SERIES.green,
                      hint: 'còn hàng, hiển thị với người mua',
                    },
                    {
                      key: 'inactive',
                      label: 'Tạm dừng',
                      value: metrics.inactive,
                      color: SERIES.blue,
                      hint: 'bạn đã tắt hiển thị',
                    },
                    {
                      key: 'out',
                      label: 'Hết hàng',
                      value: metrics.outOfStock,
                      color: SERIES.red,
                      hint: 'tồn kho bằng 0',
                    },
                  ]}
                />
              )}
            </div>
          </SellerCard>
        </div>

        {/* Price Distribution & Onboarding Tasks */}
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <SellerCard
            className="xl:col-span-2"
            title="Phân bố giá bán"
            description="Sản phẩm của bạn đang tập trung ở khoảng giá nào."
            action={
              priceStats && (
                <span className="text-[13px] font-bold text-stone-900">
                  {fmtCount(priceStats.priced)} sản phẩm đã đặt giá
                </span>
              )
            }
          >
            {loading ? (
              <div className="px-5 py-5">
                <div className="h-[200px] animate-pulse rounded-xl bg-stone-100 motion-reduce:animate-none" />
              </div>
            ) : !priceStats ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                  <Package size={18} aria-hidden />
                </span>
                <p className="m-0 text-sm font-semibold text-stone-900">Chưa có sản phẩm nào được đặt giá</p>
                <p className="m-0 max-w-[42ch] text-xs text-stone-500">
                  Đặt giá cho sản phẩm để xem khoảng giá của gian hàng.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 px-5 py-5 sm:grid-cols-[188px_1fr] sm:gap-6">
                <dl className="m-0 flex flex-col justify-center gap-4 sm:border-r sm:border-stone-100 sm:pr-6">
                  <PriceStat label="Thấp nhất" value={money(priceStats.min)} />
                  <PriceStat
                    label="Trung vị"
                    value={money(priceStats.median)}
                    hint="một nửa số sản phẩm rẻ hơn mức này"
                  />
                  <PriceStat label="Cao nhất" value={money(priceStats.max)} />
                </dl>
                <div className="min-w-0">
                  <ColumnChart
                    ariaLabel="Số sản phẩm theo từng khoảng giá"
                    data={priceColumns}
                    color={SERIES.green}
                    unit="sản phẩm"
                  />
                  {priceStats.step > 0 && (
                    <p className="mb-0 mt-2 text-[11.5px] text-stone-400">
                      Nhãn dưới mỗi cột là mức giá bắt đầu; mỗi khoảng rộng {compactMoney(priceStats.step)}.
                    </p>
                  )}
                </div>
              </div>
            )}
          </SellerCard>

          <SellerCard
            title="Hoàn thiện gian hàng"
            description={`${tasksDone}/${tasks.length} mục đã xong`}
            action={
              <Link
                to="/seller/settings"
                className="text-xs font-semibold text-[#007700] no-underline hover:underline"
              >
                Mở cài đặt
              </Link>
            }
          >
            <div className="px-5 pb-3 pt-4">
              <ProgressBar
                percent={percentOf(tasksDone, tasks.length)}
                label={`Mức độ hoàn thiện gian hàng: ${percentOf(tasksDone, tasks.length)}%`}
              />
            </div>
            <div>
              {tasks.map(t => (
                <TaskRow key={t.key} label={t.label} done={t.done} to={t.to} />
              ))}
            </div>
          </SellerCard>
        </div>

        {/* Inventory Restock & Category Breakdown */}
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <SellerCard
            title="Cần nhập thêm hàng"
            description={`Hết hàng, hoặc còn dưới ${LOW_STOCK_THRESHOLD} sản phẩm.`}
            action={
              <Link
                to="/seller/products"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#007700] no-underline hover:underline"
              >
                Quản lí sản phẩm
                <ArrowRight size={13} aria-hidden />
              </Link>
            }
          >
            {loading ? (
              <div className="space-y-3 px-5 py-5">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="h-9 animate-pulse rounded-lg bg-stone-100 motion-reduce:animate-none" />
                ))}
              </div>
            ) : restockList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF0E2] text-[#007700]">
                  <Package size={18} aria-hidden />
                </span>
                <p className="m-0 text-sm font-semibold text-stone-900">Kho hàng đang ổn</p>
                <p className="m-0 max-w-[42ch] text-xs text-stone-500">
                  Không có sản phẩm nào hết hàng hay sắp hết.
                </p>
              </div>
            ) : (
              <ul className="m-0 list-none p-0">
                {restockList.map(p => {
                  const out = Number(p.stock) <= 0;
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 border-b border-stone-100 px-5 py-3 last:border-b-0"
                    >
                      <Thumb product={p} />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-[13.5px] font-semibold text-stone-900">{p.title}</p>
                        <p className="m-0 truncate text-[11.5px] text-stone-500">{p.sku}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          out ? 'bg-rose-50 text-[#BA1A1A]' : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {out ? 'Hết hàng' : `Còn ${fmtCount(p.stock)}`}
                      </span>
                      <span className="w-[104px] shrink-0 text-right text-[12.5px] tabular-nums text-stone-500">
                        {money(p.price)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SellerCard>

          <SellerCard
            title="Giá trị tồn theo danh mục"
            description="Vốn đang nằm ở đâu, tính theo giá bán × tồn kho."
          >
            {loading ? (
              <div className="space-y-3 px-5 py-5">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="h-9 animate-pulse rounded-lg bg-stone-100 motion-reduce:animate-none" />
                ))}
              </div>
            ) : categoryRows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                  <Layers size={18} aria-hidden />
                </span>
                <p className="m-0 text-sm font-semibold text-stone-900">Chưa có dữ liệu tồn kho</p>
              </div>
            ) : (
              <ul className="m-0 list-none p-0">
                {categoryRows.map(row => {
                  const max = categoryRows[0]?.value || 1;
                  return (
                    <li key={row.category} className="border-b border-stone-100 px-5 py-3 last:border-b-0">
                      <div className="flex items-baseline gap-3">
                        <span className="min-w-0 flex-1 truncate text-[13px] text-stone-700">{row.category}</span>
                        <span className="shrink-0 text-[11.5px] tabular-nums text-stone-400">
                          {fmtCount(row.count)} SP
                        </span>
                        <span className="w-[104px] shrink-0 text-right text-[13px] font-bold tabular-nums text-stone-900">
                          {compactMoney(row.value)}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-stone-100">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.max(4, Math.round((row.value / max) * 100))}%`,
                            backgroundColor: SERIES.green,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SellerCard>
        </div>

        {/* Warning Banners */}
        {!loading && (metrics.missingImages.length > 0 || metrics.inactive > 0) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {metrics.missingImages.length > 0 && (
              <Link
                to="/seller/products"
                className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4 no-underline shadow-sm transition-colors duration-150 hover:bg-stone-50 motion-reduce:transition-none"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <ImageOff size={17} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold text-stone-900">
                    {fmtCount(metrics.missingImages.length)} sản phẩm chưa có ảnh riêng
                  </span>
                  <span className="block text-xs text-stone-500">
                    Sản phẩm không ảnh gần như chắc chắn bị người mua lướt qua.
                  </span>
                </span>
                <ArrowRight size={15} className="shrink-0 text-stone-400" aria-hidden />
              </Link>
            )}
            {metrics.inactive > 0 && (
              <Link
                to="/seller/products"
                className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4 no-underline shadow-sm transition-colors duration-150 hover:bg-stone-50 motion-reduce:transition-none"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
                  <PauseCircle size={17} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold text-stone-900">
                    {fmtCount(metrics.inactive)} sản phẩm đang tạm dừng
                  </span>
                  <span className="block text-xs text-stone-500">
                    Bật lại nếu bạn đã có hàng để bán tiếp.
                  </span>
                </span>
                <ArrowRight size={15} className="shrink-0 text-stone-400" aria-hidden />
              </Link>
            )}
          </div>
        )}

        {data.productsTotal > data.productsLoaded && (
          <p className="mt-3 text-[11.5px] text-stone-400">
            Thống kê tính trên {fmtCount(data.productsLoaded)} sản phẩm mới nhất (tổng{' '}
            {fmtCount(data.productsTotal)}).
          </p>
        )}
      </div>
    </div>
  );
}

export default SellerDashboard;
