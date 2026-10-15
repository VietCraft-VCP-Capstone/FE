/**
 * Cột của bảng "Tất cả sản phẩm": điểm, số bán 30 ngày, tag, việc nên làm.
 */

import { Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { count, money } from '../../../../shared/utils/format';
import { editLink, healthTone } from '../HealthParts';
import { Chip } from '../ui';
import { HEALTH_STATUS_LABEL } from '../../format';
import type { ListingHealthItem } from '../../healthTypes';
import { FOCUS } from './healthStats';

function TagList({ tags }: { tags: ListingHealthItem['tags'] }) {
  if (tags.length === 0) return <span className="text-xs text-stone-500">Chưa có tag</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(t =>
        t.pending ? (
          <Tooltip key={t.name} title="Đang chờ duyệt, người mua chưa thấy">
            <span tabIndex={0} className={`cursor-help rounded border border-dashed border-stone-300 px-1.5 py-0.5 text-[11.5px] text-stone-500 ${FOCUS}`}>{t.name}</span>
          </Tooltip>
        ) : (
          <span key={t.name} className="rounded bg-stone-100 px-1.5 py-0.5 text-[11.5px] font-medium text-stone-700">{t.name}</span>
        ),
      )}
    </div>
  );
}

function NextStep({ item }: { item: ListingHealthItem }) {
  if (item.score === null) return <span className="text-xs text-stone-500">Đang chấm, có điểm sau khoảng 1 phút</span>;
  const first = item.todos[0] ?? item.warnings[0];
  if (!first) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2f7d32]">
        <CheckCircle2 size={14} aria-hidden /> Đã ổn, không cần sửa
      </span>
    );
  }
  const others = item.todos.length + item.warnings.length - 1;
  return (
    <div className="text-[13px] leading-snug">
      <span className={first.type === 'warning' ? 'text-amber-800' : 'text-stone-700'}>{first.message}</span>
      {first.impact != null && first.impact > 0 && (
        <span className="ml-1.5 whitespace-nowrap text-xs font-semibold text-[#005B00]">+{Math.max(1, Math.round(first.impact))} điểm</span>
      )}
      {others > 0 && <span className="ml-1.5 whitespace-nowrap text-xs text-stone-500">+{others} việc khác</span>}
    </div>
  );
}

const num = (value: number) => <span className="tabular-nums text-stone-800">{count(value)}</span>;

export const HEALTH_COLUMNS: ColumnsType<ListingHealthItem> = [
  {
    title: 'Sản phẩm',
    key: 'title',
    width: 240,
    fixed: 'left',
    render: (_, item) => (
      <span className="flex min-w-0 items-center gap-2.5">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
        ) : (
          <span className="h-10 w-10 shrink-0 rounded bg-stone-100" aria-hidden />
        )}
        <Link
          to={`/seller/insights/listings/${item.product_id}`}
          className={`line-clamp-2 rounded font-semibold text-stone-800 no-underline transition-colors duration-150 hover:text-[#007700] motion-reduce:transition-none ${FOCUS}`}
        >
          {item.title}
        </Link>
      </span>
    ),
  },
  {
    title: 'Điểm',
    key: 'score',
    width: 140,
    defaultSortOrder: 'ascend',
    sorter: (a, b) => (a.score ?? 101) - (b.score ?? 101),
    render: (_, item) =>
      item.score === null || !item.status ? (
        <Chip tone="neutral">Chưa chấm</Chip>
      ) : (
        <span className="inline-flex items-center gap-2">
          <span className="w-7 text-right font-semibold tabular-nums text-stone-900">{Math.round(item.score)}</span>
          <Chip tone={healthTone(item.status)}>{HEALTH_STATUS_LABEL[item.status] ?? item.status}</Chip>
        </span>
      ),
  },
  {
    title: <Tooltip title="Lượt xem trang sản phẩm trong 30 ngày">Lượt xem</Tooltip>,
    key: 'views',
    width: 104,
    align: 'right',
    sorter: (a, b) => a.sales.views_30d - b.sales.views_30d,
    render: (_, item) => num(item.sales.views_30d),
  },
  {
    title: <Tooltip title="Số món đã bán trong 30 ngày (đơn không huỷ)">Đã bán</Tooltip>,
    key: 'units',
    width: 90,
    align: 'right',
    sorter: (a, b) => a.sales.units_30d - b.sales.units_30d,
    render: (_, item) => (
      <span className="flex flex-col items-end leading-tight">
        {num(item.sales.units_30d)}
        <span className="text-[11.5px] text-stone-500">{count(item.sales.orders_30d)} đơn</span>
      </span>
    ),
  },
  {
    title: <Tooltip title="Số món × giá bán, 30 ngày, đơn không huỷ">Doanh thu</Tooltip>,
    key: 'revenue',
    width: 110,
    align: 'right',
    sorter: (a, b) => a.sales.revenue_30d - b.sales.revenue_30d,
    render: (_, item) => <span className="tabular-nums font-semibold text-stone-800">{money(item.sales.revenue_30d)}</span>,
  },
  { title: 'Tag', key: 'tags', width: 150, render: (_, item) => <TagList tags={item.tags} /> },
  { title: 'Việc nên làm', key: 'next', render: (_, item) => <NextStep item={item} /> },
  {
    title: <span className="sr-only">Hành động</span>,
    key: 'actions',
    width: 72,
    fixed: 'right',
    render: (_, item) => {
      const first = item.todos[0] ?? item.warnings[0];
      return (
        <span className="flex items-center justify-end">
          <Link
            to={editLink(item.product_id, first?.field)}
            aria-label={`Sửa ${item.title}`}
            className={`inline-flex h-8 items-center rounded-md bg-[#007700] px-3 text-xs font-semibold text-white no-underline transition-colors duration-150 hover:bg-[#005B00] motion-reduce:transition-none ${FOCUS}`}
          >
            Sửa
          </Link>
        </span>
      );
    },
  },
];

/** Bề rộng tối thiểu trước khi bảng cuộn ngang; cột "Việc nên làm" giãn theo phần còn lại. */
export const HEALTH_TABLE_WIDTH = 1120;
