import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  FileText,
  Lock,
  Package,
  RefreshCw,
  Store,
  TagIcon,
  Users,
} from 'lucide-react';

import { BTN_SECONDARY, CARD, CARD_HEADER, PAGE, cx } from '../components/adminUi';
import {
  Alert,
  EmptyState,
  PageHeader,
  SegmentedControl,
  SkeletonRows,
  StatStrip,
  StatusPill,
} from '../components/AdminPrimitives';
import { TrendChart, TrendLegend } from '../../../shared/components/charts/TrendChart';
import { ShareBar } from '../../../shared/components/charts/ShareBar';
import { SERIES } from '../../../shared/components/charts/chartTheme';
import { count as fmtCount, timeAgo } from '../../../shared/utils/format';
import { comparePeriods, countPerDay, dayRange } from '../../../shared/utils/timeseries';
import {
  adminDashboardService,
  normalizeRole,
  rankShops,
  type AdminOverviewData,
} from '../services/adminDashboardService';

type RangeKey = '7' | '30' | '90';

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: '90', label: '90 ngày' },
];

const EMPTY_DATA: AdminOverviewData = {
  users: [],
  products: [],
  productsLoaded: 0,
  productsTotal: 0,
  stats: null,
  pendingTagCount: 0,
  failures: [],
};

/* ------------------------------------------------------------- Section Card */

function SectionCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cx(CARD, 'flex flex-col', className)}>
      <div className={CARD_HEADER}>
        <div className="min-w-0">
          <h2 className="m-0 text-[14px] font-bold text-admin-ink">{title}</h2>
          {description && <p className="mb-0 mt-0.5 text-[12px] text-admin-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------- Queue Row */

function QueueRow({
  icon: Icon,
  label,
  hint,
  value,
  to,
}: {
  icon: React.ElementType;
  label: string;
  hint: string;
  value: number;
  to: string;
}) {
  const urgent = value > 0;
  return (
    <Link
      to={to}
      className="flex items-center gap-3 border-b border-admin-line-soft px-[18px] py-3 no-underline transition-colors duration-[120ms] last:border-b-0 hover:bg-[#fafdfa] motion-reduce:transition-none"
    >
      <span
        className={cx(
          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          urgent ? 'bg-[#fff7ed] text-[#9a3412]' : 'bg-admin-line-soft text-admin-muted'
        )}
      >
        <Icon size={16} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-admin-ink">{label}</span>
        <span className="block text-[12px] text-admin-muted">{hint}</span>
      </span>
      <span
        className={cx(
          'shrink-0 text-[16px] font-extrabold tabular-nums',
          urgent ? 'text-[#9a3412]' : 'text-admin-muted'
        )}
      >
        {fmtCount(value)}
      </span>
      <ArrowRight size={15} className="shrink-0 text-admin-muted" aria-hidden />
    </Link>
  );
}

/* ------------------------------------------------------------- Thumbnail */

function Thumb({ src, alt }: { src?: string; alt: string }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-admin-line-soft text-admin-muted">
        <Package size={15} aria-hidden />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-9 w-9 shrink-0 rounded-lg border border-admin-line object-cover"
    />
  );
}

const STATUS_LABEL: Record<string, { text: string; tone: 'brand' | 'warn' | 'danger' | 'neutral' }> = {
  PUBLISHED: { text: 'Đang bán', tone: 'brand' },
  DRAFT: { text: 'Bản nháp', tone: 'neutral' },
  UNPUBLISHED: { text: 'Đã gỡ', tone: 'danger' },
};

/* ------------------------------------------------------------- Admin Dashboard Page */

export function AdminDashboard() {
  const [data, setData] = useState<AdminOverviewData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [range, setRange] = useState<RangeKey>('30');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const result = await adminDashboardService.loadOverview();
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

  const derived = useMemo(() => {
    const { users, products, stats } = data;

    const range7 = dayRange(days);
    const userPerDay = countPerDay(users, u => u.created_at);
    const productPerDay = countPerDay(products, p => p.created_at);

    const trend = range7.map(d => ({
      label: d.label,
      users: userPerDay.get(d.key) ?? 0,
      products: productPerDay.get(d.key) ?? 0,
    }));

    const userDelta = comparePeriods(users, u => u.created_at, days);
    const productDelta = comparePeriods(products, p => p.created_at, days);

    const sellers = users.filter(u => normalizeRole(u.role) === 'seller').length;
    const buyers = users.filter(u => normalizeRole(u.role) === 'buyer').length;
    const locked = users.filter(u => !!u.is_locked).length;

    const fromSample = {
      published: products.filter(p => p.status === 'PUBLISHED').length,
      unpublished: products.filter(p => p.status === 'UNPUBLISHED').length,
      draft: products.filter(p => p.status === 'DRAFT').length,
      total: products.length,
    };
    const productStats = stats ?? fromSample;

    return {
      trend,
      userDelta,
      productDelta,
      sellers,
      buyers,
      locked,
      productStats,
      statsFromSample: !stats,
      shops: rankShops(products),
      recentProducts: products.slice(0, 6),
      recentUsers: [...users]
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 6),
    };
  }, [data, days]);

    const pendingCount = data.pendingTagCount;
  const actionTotal = pendingCount + derived.productStats.draft + derived.productStats.unpublished + derived.locked;

  const productSampleNote =
    data.productsTotal > data.productsLoaded
      ? `Đường "sản phẩm mới" tính trên ${fmtCount(data.productsLoaded)} sản phẩm mới nhất (tổng ${fmtCount(
          data.productsTotal
        )}).`
      : null;

  return (
    <div className={PAGE}>
      {/* Header Section */}
      <PageHeader
        title="Tổng quan hệ thống"
        description="Sức khoẻ của sàn và những việc đang chờ xử lý, tổng hợp từ dữ liệu thật của hệ thống."
        actions={
          <button
            type="button"
            className={BTN_SECONDARY}
            onClick={() => void load(true)}
            disabled={refreshing || loading}
          >
            <RefreshCw
              size={15}
              className={refreshing ? 'animate-spin motion-reduce:animate-none' : undefined}
              aria-hidden
            />
            Làm mới
          </button>
        }
      />

      {/* Filter / Range Selector Section */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={range}
          onChange={setRange}
          options={RANGE_OPTIONS}
          label="Khoảng thời gian thống kê"
        />
        {loadedAt && (
          <span className="text-[12px] text-admin-muted">Số liệu lúc {timeAgo(loadedAt)}</span>
        )}
      </div>

      {data.failures.map(msg => (
        <Alert key={msg} tone="warn">
          {msg}
        </Alert>
      ))}

      {/* Stat Strip Section */}
      <StatStrip
        loading={loading}
        items={[
          {
            label: 'Tổng người dùng',
            value: fmtCount(data.users.length),
            hint: `+${fmtCount(derived.userDelta.current)} trong ${days} ngày`,
          },
          {
            label: 'Người bán',
            value: fmtCount(derived.sellers),
            hint: `${fmtCount(derived.buyers)} người mua`,
          },
          {
            label: 'Sản phẩm đang bán',
            value: fmtCount(derived.productStats.published),
            dot: SERIES.green,
            hint: `trên ${fmtCount(derived.productStats.total)} sản phẩm`,
          },
          {
            label: 'Việc cần xử lý',
            value: fmtCount(actionTotal),
            dot: actionTotal > 0 ? SERIES.red : undefined,
            hint: actionTotal > 0 ? 'xem khối bên dưới' : 'không còn tồn đọng',
          },
        ]}
      />

      {/* Growth Chart & Composition Section */}
      <div className={refreshing ? 'opacity-60 transition-opacity duration-200' : undefined}>
        <div className="grid gap-4 xl:grid-cols-3">
          <SectionCard
            title="Tăng trưởng"
            description={`Người dùng và sản phẩm tạo mới mỗi ngày, ${days} ngày gần nhất.`}
            className="xl:col-span-2"
          >
            <div className="px-[18px] pb-4 pt-4">
              {loading ? (
                <div className="h-[288px] animate-pulse rounded-admin bg-admin-line-soft motion-reduce:animate-none" />
              ) : (
                <>
                  <TrendLegend
                    items={[
                      {
                        name: 'Người dùng mới',
                        color: SERIES.green,
                        total: fmtCount(derived.userDelta.current),
                      },
                      {
                        name: 'Sản phẩm mới',
                        color: SERIES.blue,
                        total: fmtCount(derived.productDelta.current),
                      },
                    ]}
                  />
                  <div className="mt-3">
                    <TrendChart
                      ariaLabel={`Người dùng và sản phẩm tạo mới mỗi ngày trong ${days} ngày gần nhất`}
                      data={derived.trend}
                      series={[
                        { key: 'users', name: 'Người dùng mới', color: SERIES.green },
                        { key: 'products', name: 'Sản phẩm mới', color: SERIES.blue },
                      ]}
                    />
                  </div>
                  {productSampleNote && (
                    <p className="mb-0 mt-2 text-[11.5px] leading-[1.5] text-admin-muted">
                      {productSampleNote}
                    </p>
                  )}
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Cơ cấu sản phẩm"
            description={
              derived.statsFromSample
                ? 'Tính trên số sản phẩm đã tải được (chưa lấy được thống kê tổng).'
                : 'Toàn bộ sản phẩm trên hệ thống.'
            }
          >
            <div className="px-[18px] pb-5 pt-5">
              {loading ? (
                <div className="h-[140px] animate-pulse rounded-admin bg-admin-line-soft motion-reduce:animate-none" />
              ) : (
                <ShareBar
                  ariaLabel="Cơ cấu sản phẩm theo trạng thái"
                  emptyLabel="Hệ thống chưa có sản phẩm nào."
                  segments={[
                    {
                      key: 'published',
                      label: 'Đang bán',
                      value: derived.productStats.published,
                      color: SERIES.green,
                      hint: 'hiển thị với người mua',
                    },
                    {
                      key: 'draft',
                      label: 'Bản nháp',
                      value: derived.productStats.draft,
                      color: SERIES.blue,
                      hint: 'người bán chưa đăng',
                    },
                    {
                      key: 'unpublished',
                      label: 'Đã gỡ',
                      value: derived.productStats.unpublished,
                      color: SERIES.red,
                      hint: 'gỡ bởi kiểm duyệt',
                    },
                  ]}
                />
              )}
            </div>
          </SectionCard>
        </div>

        {/* Action Queue & Recent Products Section */}
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <SectionCard title="Cần xử lý" description="Bấm vào từng dòng để sang màn hình tương ứng.">
            {loading ? (
              <SkeletonRows rows={4} columns={['40%', '15%']} />
            ) : (
              <div>
                <QueueRow
                  icon={TagIcon}
                  label="Thẻ chờ duyệt"
                  hint="do người bán đề xuất"
                  value={pendingCount}
                  to="/admin/tags"
                />
                <QueueRow
                  icon={FileText}
                  label="Sản phẩm bản nháp"
                  hint="chưa được đăng bán"
                  value={derived.productStats.draft}
                  to="/admin/moderation"
                />
                <QueueRow
                  icon={ClipboardCheck}
                  label="Sản phẩm đã gỡ"
                  hint="chờ xem xét khôi phục"
                  value={derived.productStats.unpublished}
                  to="/admin/moderation"
                />
                <QueueRow
                  icon={Lock}
                  label="Tài khoản bị khoá"
                  hint="đang bị chặn đăng nhập"
                  value={derived.locked}
                  to="/admin/users"
                />
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Sản phẩm mới đăng"
            className="xl:col-span-2"
            action={
              <Link
                to="/admin/moderation"
                className="text-[12.5px] font-semibold text-admin-brand no-underline hover:underline"
              >
                Tới kiểm duyệt
              </Link>
            }
          >
            {loading ? (
              <SkeletonRows rows={5} columns={['46%', '18%', '12%']} />
            ) : derived.recentProducts.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Chưa có sản phẩm nào"
                description="Khi người bán đăng sản phẩm đầu tiên, chúng sẽ xuất hiện ở đây."
              />
            ) : (
              <ul className="m-0 list-none p-0">
                {derived.recentProducts.map(p => {
                  const badge = STATUS_LABEL[p.status || ''] ?? { text: 'Không rõ', tone: 'neutral' as const };
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 border-b border-admin-line-soft px-[18px] py-3 last:border-b-0"
                    >
                      <Thumb src={p.images?.[0]} alt="" />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-[13.5px] font-semibold text-admin-ink">
                          {p.title || 'Sản phẩm chưa đặt tên'}
                        </p>
                        <p className="m-0 flex items-center gap-1.5 truncate text-[12px] text-admin-muted">
                          <Store size={12} aria-hidden />
                          {p.shop_name || 'Không rõ gian hàng'}
                        </p>
                      </div>
                      <StatusPill tone={badge.tone}>{badge.text}</StatusPill>
                      <span className="w-[92px] shrink-0 text-right text-[12px] text-admin-muted">
                        {timeAgo(p.created_at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* Recent Users & Top Shops Section */}
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <SectionCard
            title="Người dùng mới"
            action={
              <Link
                to="/admin/users"
                className="text-[12.5px] font-semibold text-admin-brand no-underline hover:underline"
              >
                Quản lý người dùng
              </Link>
            }
          >
            {loading ? (
              <SkeletonRows rows={5} columns={['50%', '20%']} />
            ) : derived.recentUsers.length === 0 ? (
              <EmptyState icon={Users} title="Chưa có người dùng nào" />
            ) : (
              <ul className="m-0 list-none p-0">
                {derived.recentUsers.map(u => {
                  const role = normalizeRole(u.role);
                  const name = u.full_name || 'Người dùng';
                  return (
                    <li
                      key={u._id}
                      className="flex items-center gap-3 border-b border-admin-line-soft px-[18px] py-3 last:border-b-0"
                    >
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-admin-brand-050 text-[12px] font-bold text-admin-brand">
                        {name[0]?.toUpperCase() || 'U'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-[13.5px] font-semibold text-admin-ink">{name}</p>
                        <p className="m-0 truncate text-[12px] text-admin-muted">{u.email || '—'}</p>
                      </div>
                      <StatusPill tone={role === 'seller' ? 'brand' : 'neutral'}>
                        {role === 'admin' ? 'Quản trị' : role === 'seller' ? 'Người bán' : 'Người mua'}
                      </StatusPill>
                      <span className="w-[92px] shrink-0 text-right text-[12px] text-admin-muted">
                        {timeAgo(u.created_at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Gian hàng hoạt động mạnh"
            description={
              data.productsTotal > data.productsLoaded
                ? `Xếp theo số sản phẩm trong ${fmtCount(data.productsLoaded)} bản ghi mới nhất.`
                : 'Xếp theo số sản phẩm đã đăng.'
            }
          >
            {loading ? (
              <SkeletonRows rows={5} columns={['45%', '18%']} />
            ) : derived.shops.length === 0 ? (
              <EmptyState icon={BarChart3} title="Chưa đủ dữ liệu để xếp hạng" />
            ) : (
              <ul className="m-0 list-none p-0">
                {derived.shops.map(shop => {
                  const max = derived.shops[0]?.total || 1;
                  return (
                    <li
                      key={shop.name}
                      className="border-b border-admin-line-soft px-[18px] py-3 last:border-b-0"
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-admin-ink">
                          {shop.name}
                        </span>
                        <span className="shrink-0 text-[13.5px] font-bold tabular-nums text-admin-ink">
                          {fmtCount(shop.total)}
                        </span>
                        <span className="w-[86px] shrink-0 text-right text-[12px] tabular-nums text-admin-muted">
                          {fmtCount(shop.published)} đang bán
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-admin-line-soft">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.max(4, Math.round((shop.total / max) * 100))}%`,
                            backgroundColor: SERIES.green,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
