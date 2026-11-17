import { useState } from 'react';
import { Table, Input, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertCircle, CheckCircle2, ChevronRight, Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { plainText, scoreText, cleanTitle, formatUrgentWarning } from '../../format';
import type { HealthRow } from '../../healthTypes';
import { detailLink } from '../health/HealthCells';
import { cleanTodoText } from '../health/visibleTodos';
import { editLink } from '../HealthParts';
import { Thumb } from '../health/Thumb';
import { Chip } from '../ui';
import { healthTier } from './intelLabels';

export const TIERS = ['Yếu', 'Cần cải thiện', 'Tốt'] as const;
export type TierFilter = (typeof TIERS)[number] | '';

function TodoCell({ row }: { row: HealthRow }) {
  if (row.urgent) {
    const { short, detail } = formatUrgentWarning(row.top_todo);
    return (
      <Tooltip title={detail || undefined} placement="topLeft">
        <div className="inline-flex max-w-full items-center gap-1.5 text-[13px] font-semibold text-rose-700">
          <AlertCircle size={14} className="shrink-0" aria-hidden />
          <span className="truncate">Sửa gấp: {short}</span>
        </div>
      </Tooltip>
    );
  }

  if (!row.top_todo) {
    return (
      <div className="inline-flex items-center gap-1.5 text-[13px] text-stone-500">
        <CheckCircle2 size={14} className="text-[#007700]" aria-hidden />
        <span>Không còn việc cần làm</span>
      </div>
    );
  }

  return (
    <div className="flex max-w-full items-center gap-2 text-[13px] text-stone-800" title={plainText(row.top_todo)}>
      <span className="w-10 shrink-0 font-bold tabular-nums text-[#007700]">
        {row.top_impact !== null ? `+${Math.round(row.top_impact)}đ` : ''}
      </span>
      <span className="truncate">{cleanTodoText(row.top_todo.split(/\.\s/)[0])}</span>
    </div>
  );
}

const columns: ColumnsType<HealthRow> = [
  {
    title: 'Sản phẩm',
    key: 'title',
    render: (_, row) => (
      <div className="flex min-w-0 items-center gap-3 py-1">
        <span className="shrink-0">
          <Thumb src={row.thumbnail} size={44} />
        </span>
        <div className="min-w-0">
          <Link
            to={detailLink(row.product_id)}
            className="block truncate text-[13px] font-semibold text-stone-900 no-underline hover:text-[#007700]"
            onClick={e => e.stopPropagation()}
            title={row.title}
          >
            {cleanTitle(row.title)}
          </Link>
          <div className="mt-1.5 md:hidden">
            <TodoCell row={row} />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Điểm',
    key: 'score',
    width: 80,
    align: 'right',
    sorter: (a, b) => (a.score ?? -1) - (b.score ?? -1),
    render: (_, row) =>
      row.score === null
        ? <span className="text-xs text-stone-400">Đang chấm</span>
        : <span className="text-lg font-extrabold tabular-nums text-stone-900">{scoreText(row.score)}</span>,
  },
  {
    title: 'Mức',
    key: 'tier',
    width: 150,
    render: (_, row) => {
      if (row.score === null) return null;
      const tier = healthTier(row.score);
      return <Chip tone={tier.tone}>{tier.label}</Chip>;
    },
  },
  {
    title: 'Việc nên làm trước',
    key: 'todo',
    width: 300,
    responsive: ['md'],
    render: (_, row) => <TodoCell row={row} />,
  },
  {
    key: 'actions',
    responsive: ['md'],
    width: 70,
    align: 'right',
    render: (_, row) => (
      <Link
        to={editLink(row.product_id, row.top_field)}
        onClick={e => e.stopPropagation()}
        aria-label={`Sửa ${row.title}`}
        className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-[#007700] no-underline hover:underline"
      >
        Sửa
        <ChevronRight size={14} aria-hidden />
      </Link>
    ),
  },
];

const byScore = (a: HealthRow, b: HealthRow) =>
  Number(Boolean(b.urgent)) - Number(Boolean(a.urgent)) ||
  (a.score ?? Number.MAX_SAFE_INTEGER) - (b.score ?? Number.MAX_SAFE_INTEGER);

export function HealthList({
  items,
  filter,
  onFilter,
  activeIssue,
  onClearIssue,
  issueLabel,
}: {
  items: HealthRow[];
  filter: TierFilter;
  onFilter: (t: TierFilter) => void;
  activeIssue?: string;
  onClearIssue?: () => void;
  issueLabel?: string;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = items
    .filter(i => !filter || healthTier(i.score).label === filter)
    .filter(i => !search.trim() || (i.title || '').toLowerCase().includes(search.trim().toLowerCase()))
    .sort(byScore);

  const chips = [
    ...(filter ? [{ label: `Mức điểm: ${filter}`, clear: () => onFilter('') }] : []),
    ...(activeIssue && onClearIssue ? [{ label: issueLabel || activeIssue, clear: onClearIssue }] : []),
  ];

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="m-0 text-base font-bold text-stone-900">
            {filtered.length} sản phẩm
          </h2>
          {chips.map(c => (
            <button
              key={c.label}
              type="button"
              onClick={c.clear}
              aria-label={`Bỏ lọc ${c.label}`}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-stone-900 px-2.5 py-0.5 text-xs font-semibold text-white transition hover:bg-stone-700"
            >
              <span>{c.label}</span>
              <X size={12} aria-hidden />
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Input
            prefix={<Search size={14} className="text-stone-400" />}
            placeholder="Tìm theo tên sản phẩm"
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="!rounded-xl !border-stone-200 !text-[13px]"
          />
        </div>
      </div>

      <Table
        rowKey="product_id"
        columns={columns}
        dataSource={filtered}
        size="small"
        tableLayout="fixed"
        pagination={{
          pageSize: 10,
          hideOnSinglePage: true,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total, range) => (
            <span className="text-xs text-stone-500">
              {range[0]} đến {range[1]} trên {total} sản phẩm
            </span>
          ),
          className: '!px-4 !py-3 !m-0 border-t border-stone-100 flex items-center justify-between',
        }}
        onRow={row => ({
          onClick: () => navigate(detailLink(row.product_id)),
          className: 'cursor-pointer hover:!bg-stone-50/60 transition-colors',
        })}
        locale={{ emptyText: 'Không có sản phẩm nào khớp bộ lọc.' }}
      />
    </section>
  );
}
