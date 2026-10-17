import { useEnterMotion } from '../../../../shared/hooks/useMotion';
import { Grid, Input, Select, Table } from 'antd';
import { Search } from 'lucide-react';
import { AXIS_ORDER, HEALTH_BANDS, TodoItem, WarningItem } from '../HealthParts';
import type { ListingHealthItem } from '../../healthTypes';
import type { HealthAxis } from '../../types';
import { HEALTH_TABLE_WIDTH, healthColumns } from './HealthColumns';
import { FilterEmpty } from './FilterEmpty';
import { AXIS_SHORT, ISSUES, axisValue, hasIssue, needsWork } from './healthStats';

function tagOptions(items: ListingHealthItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) for (const t of item.tags) counts.set(t.name, (counts.get(t.name) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
    .map(([name, n]) => ({ value: name, label: `${name} (${n})` }));
}

export const TABLE_ID = 'health-table';

export function HealthTable({ items, issue, band, axis, query, tags, setParam, setTags, clearFilters }: {
  items: ListingHealthItem[];
  issue: string;
  band: string;
  axis: HealthAxis | null;
  query: string;
  tags: string[];
  setParam: (key: string, value: string) => void;
  setTags: (tags: string[]) => void;
  clearFilters: () => void;
}) {
  const wide = Grid.useBreakpoint().md ?? true;
  const all = healthColumns(axis);
  const columns = wide ? all : all.map(c => ({ ...c, fixed: undefined }));
  const needle = query.trim().toLowerCase();
  const rows = items
    .filter(item => !issue || hasIssue(item, issue))
    .filter(item => !band || item.status === band)
    .filter(item => !axis || axisValue(item, axis) !== null)
    .filter(item => !needle || item.title.toLowerCase().includes(needle))
    .filter(item => tags.length === 0 || item.tags.some(t => tags.includes(t.name)));

  const bandLabel = HEALTH_BANDS.find(b => b.status === band)?.label;
  const issueLabel = ISSUES.find(i => i.key === issue)?.label;
  const active = [
    band && { label: `mức ${bandLabel}`, clear: () => setParam('health', '') },
    issue && { label: `lỗi "${issueLabel}"`, clear: () => setParam('issue', '') },
    needle && { label: `tìm "${query.trim()}"`, clear: () => setParam('q', '') },
    tags.length > 0 && { label: 'tag', clear: () => setTags([]) },
  ].filter((f): f is { label: string; clear: () => void } => Boolean(f));

  const ref = useEnterMotion<HTMLElement>([issue, band, axis, query, tags.join('|')], { selector: '.ant-table-tbody > tr', stagger: 0.015, y: 4 });

  return (
    <section ref={ref} id={TABLE_ID} className="scroll-mt-4 overflow-hidden rounded-md border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-4 py-3">
        <h2 className="m-0 mr-2 text-sm font-bold text-stone-900">Danh sách sản phẩm</h2>
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
          aria-label="Lọc theo lỗi"
          className="w-full sm:w-44"
          options={[{ value: '', label: 'Mọi lỗi' }, ...ISSUES.map(i => ({ value: i.key, label: i.label }))]}
        />
        <Select
          value={axis ?? ''}
          onChange={value => setParam('axis', value)}
          aria-label="Xếp bảng theo"
          className="w-full sm:w-48"
          options={[{ value: '', label: 'Xếp theo điểm tổng' }, ...AXIS_ORDER.map(a => ({ value: a, label: `Xếp theo ${AXIS_SHORT[a].label.toLowerCase()}` }))]}
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
        <span className="ml-auto text-xs text-stone-500">Lượt xem, số bán tính trong 30 ngày gần nhất</span>
      </div>
      <Table<ListingHealthItem>
        key={axis ?? 'score'}
        rowKey="product_id"
        size="middle"
        tableLayout="fixed"
        columns={columns}
        dataSource={rows}
        scroll={{ x: HEALTH_TABLE_WIDTH + (axis ? 32 : 0) }}
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
            <FilterEmpty active={active} clearAll={clearFilters} />
          ),
        }}
      />
    </section>
  );
}
