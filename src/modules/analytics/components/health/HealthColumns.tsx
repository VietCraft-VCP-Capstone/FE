import { Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { count, money } from '../../../../shared/utils/format';
import type { ListingHealthItem } from '../../healthTypes';
import type { HealthAxis } from '../../types';
import { AxisCell, NextStep, ProductCell, RowActions, ScoreCell } from './HealthCells';
import { AXIS_SHORT, axisValue } from './healthStats';

const num = (value: number) => <span className="tabular-nums text-stone-800">{count(value)}</span>;

export const HEALTH_COLUMNS: ColumnsType<ListingHealthItem> = [
  {
    title: 'Sản phẩm',
    key: 'title',
    width: 260,
    fixed: 'left',
    render: (_, item) => <ProductCell item={item} />,
  },
  {
    title: <Tooltip title="Điểm 0–100, càng cao càng dễ bán">Điểm</Tooltip>,
    key: 'score',
    width: 170,
    defaultSortOrder: 'ascend',
    sorter: (a, b) => (a.score ?? 101) - (b.score ?? 101),
    render: (_, item) => <ScoreCell item={item} />,
  },
  {
    title: <Tooltip title="Số lần khách mở trang sản phẩm trong 30 ngày">Lượt xem</Tooltip>,
    key: 'views',
    width: 92,
    align: 'right',
    sorter: (a, b) => a.sales.views_30d - b.sales.views_30d,
    render: (_, item) => num(item.sales.views_30d),
  },
  {
    title: <Tooltip title="Số món đã bán trong 30 ngày (không tính đơn huỷ)">Đã bán</Tooltip>,
    key: 'units',
    width: 88,
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
    title: <Tooltip title="Tiền bán được trong 30 ngày (không tính đơn huỷ)">Doanh thu</Tooltip>,
    key: 'revenue',
    width: 112,
    align: 'right',
    sorter: (a, b) => a.sales.revenue_30d - b.sales.revenue_30d,
    render: (_, item) => <span className="font-semibold tabular-nums text-stone-800">{money(item.sales.revenue_30d)}</span>,
  },
  { title: 'Nên làm gì', key: 'next', width: 240, render: (_, item) => <NextStep item={item} /> },
  {
    title: 'Thao tác',
    key: 'actions',
    width: 108,
    align: 'right',
    fixed: 'right',
    render: (_, item) => <RowActions id={item.product_id} title={item.title} field={(item.todos[0] ?? item.warnings[0])?.field} />,
  },
];

export const HEALTH_TABLE_WIDTH = 1118;

export function healthColumns(axis: HealthAxis | null): ColumnsType<ListingHealthItem> {
  if (!axis) return HEALTH_COLUMNS;
  const column: ColumnsType<ListingHealthItem>[number] = {
    title: `Điểm ${AXIS_SHORT[axis].label.toLowerCase()}`,
    key: `axis-${axis}`,
    width: 130,
    defaultSortOrder: 'ascend',
    sorter: (a, b) => (axisValue(a, axis) ?? 101) - (axisValue(b, axis) ?? 101),
    render: (_, item) => <AxisCell item={item} axis={axis} />,
  };
  const compactScore = { width: 72, defaultSortOrder: undefined, render: (_: unknown, item: ListingHealthItem) => <ScoreCell item={item} compact /> };
  return HEALTH_COLUMNS.flatMap(c => (c.key === 'score' ? [{ ...c, ...compactScore }, column] : [c]));
}
