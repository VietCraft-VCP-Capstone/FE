import { useEnterMotion } from '../../../../shared/hooks/useMotion';
/** Bảng mọi sản phẩm, điểm thấp trước; bộ lọc lưu trên URL. */

import { Grid, Input, Select, Table } from 'antd';
import { Search } from 'lucide-react';
import { HEALTH_BANDS, TodoItem, WarningItem } from '../HealthParts';
import type { ListingHealthItem } from '../../healthTypes';
import { HEALTH_COLUMNS, HEALTH_TABLE_WIDTH } from './HealthColumns';
import { FOCUS, ISSUES, hasIssue, needsWork } from './healthStats';

/** Mọi tag shop đang dùng, kèm số sản phẩm, tag nhiều sản phẩm lên trước. */
function tagOptions(items: ListingHealthItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) for (const t of item.tags) counts.set(t.name, (counts.get(t.name) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
    .map(([name, n]) => ({ value: name, label: `${name} (${n})` }));
}

export function HealthTable({ items, issue, band, query, tags, setParam, setTags, clearFilters }: {
  items: ListingHealthItem[];
  issue: string;
  band: string;
  query: string;
  tags: string[];
  setParam: (key: string, value: string) => void;
  setTags: (tags: string[]) => void;
  clearFilters: () => void;
}) {
  // Cột cố định chiếm gần hết màn điện thoại nên chỉ ghim từ màn md trở lên.
  const wide = Grid.useBreakpoint().md ?? true;
  const columns = wide ? HEALTH_COLUMNS : HEALTH_COLUMNS.map(c => ({ ...c, fixed: undefined }));
  const needle = query.trim().toLowerCase();
  const rows = items
    .filter(item => !issue || hasIssue(item, issue))
    .filter(item => !band || item.status === band)
    .filter(item => !needle || item.title.toLowerCase().includes(needle))
    .filter(item => tags.length === 0 || item.tags.some(t => tags.includes(t.name)));

  const ref = useEnterMotion<HTMLElement>([issue, band, query, tags.join('|')], { selector: '.ant-table-tbody > tr', stagger: 0.015, y: 4 });

  return (
    <section ref={ref} className="overflow-hidden rounded-md border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-4 py-3">
        <h2 className="m-0 mr-2 text-sm font-bold text-stone-900">Tất cả sản phẩm</h2>
        <Input
          allowClear
          value={query}
          onChange={e => setParam('q', e.target.value)}
          prefix={<Search size={15} className="text-stone-400" aria-hidden />}
          placeholder="Tìm theo tên sản phẩm"
          aria-label="Tìm sản phẩm theo tên"
          className="w-full sm:w-60"
        />
        <Select
          value={band}
          onChange={value => setParam('health', value)}
          aria-label="Lọc theo mức điểm"
          className="w-full sm:w-44"
          options={[{ value: '', label: 'Mọi mức điểm' }, ...HEALTH_BANDS.map(b => ({ value: b.status, label: `${b.label} (${b.range})` }))]}
        />
        <Select
          value={issue}
          onChange={value => setParam('issue', value)}
          aria-label="Lọc theo việc cần sửa"
          className="w-full sm:w-40"
          options={[{ value: '', label: 'Mọi việc cần sửa' }, ...ISSUES.map(i => ({ value: i.key, label: i.label }))]}
        />
        <Select
          mode="multiple"
          allowClear
          value={tags}
          onChange={setTags}
          aria-label="Lọc theo tag"
          placeholder="Lọc theo tag"
          maxTagCount="responsive"
          className="w-full sm:w-64"
          options={tagOptions(items)}
          notFoundContent="Shop chưa gắn tag nào"
        />
        <span className="ml-auto text-xs text-stone-500">Số bán tính 30 ngày gần nhất</span>
      </div>
      <Table<ListingHealthItem>
        rowKey="product_id"
        size="middle"
        columns={columns}
        dataSource={rows}
        scroll={{ x: HEALTH_TABLE_WIDTH }}
        sticky
        pagination={{
          defaultPageSize: 20,
          pageSizeOptions: [10, 20, 50, 100],
          showSizeChanger: true,
          hideOnSinglePage: false,
          showTotal: (total, [from, to]) => `${from}–${to} / ${total} sản phẩm${total < items.length ? ` (lọc từ ${items.length})` : ''}`,
          className: '!px-4',
        }}
        expandable={{
          rowExpandable: needsWork,
          expandedRowRender: item => (
            <ul className="m-0 max-w-3xl list-none p-0 pl-2">
              {item.todos.map(t => <TodoItem key={`t-${t.field}`} todo={t} productId={item.product_id} />)}
              {item.warnings.map(w => <WarningItem key={`w-${w.field}-${w.message}`} todo={w} productId={item.product_id} />)}
            </ul>
          ),
        }}
        locale={{
          emptyText: (
            <div className="py-8 text-sm text-stone-600">
              Không có sản phẩm nào khớp bộ lọc.{' '}
              <button type="button" onClick={clearFilters} className={`cursor-pointer rounded border-none bg-transparent p-0 font-semibold text-[#007700] hover:underline ${FOCUS}`}>
                Xoá bộ lọc
              </button>
            </div>
          ),
        }}
      />
    </section>
  );
}
