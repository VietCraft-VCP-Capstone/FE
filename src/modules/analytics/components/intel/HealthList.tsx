import { useState } from 'react';
import { Table, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircle2, ChevronRight, Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { plainText, scoreText, cleanTitle } from '../../format';
import type { HealthRow } from '../../healthTypes';
import type { HealthStatus } from '../../types';
import { detailLink } from '../health/HealthCells';
import { STATUS_INFO } from '../health/factorState';
import { cleanTodoText } from '../health/visibleTodos';
import { editLink } from '../HealthParts';
import { Thumb } from '../health/Thumb';
import { Chip, type Tone } from '../ui';

export const TIERS = ['good', 'needs_improvement', 'poor', 'blocked'] as const;
export type Tier = (typeof TIERS)[number];
export type TierFilter = Tier | '';

export const TIER_INFO: Record<Tier, { label: string; tone: Tone }> = {
  ...STATUS_INFO,
  blocked: { label: 'Bị chặn bán', tone: 'bad' },
};

export function tierOf(row: Pick<HealthRow, 'status' | 'score'>): HealthStatus | null {
  if (row.status) return row.status;
  if (row.score === null) return null;
  if (row.score >= 80) return 'good';
  return row.score >= 50 ? 'needs_improvement' : 'poor';
}

export const inTier = (row: HealthRow, filter: TierFilter) =>
  !filter || (filter === 'blocked' ? row.blockers.length > 0 : tierOf(row) === filter);

function TodoCell({ row }: { row: HealthRow }) {
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
    title: 'Độ hoàn thiện',
    key: 'score',
    width: 150,
    align: 'right',
    sorter: (a, b) => (a.score ?? -1) - (b.score ?? -1),
    render: (_, row) => (
      <div className="flex flex-col items-end">
        {row.score === null
          ? <span className="text-xs text-stone-400">Đang chấm</span>
          : <span className="text-lg font-extrabold tabular-nums text-stone-900">{scoreText(row.score)}</span>}
        <span className="whitespace-nowrap text-[11px] tabular-nums text-stone-500">
          {row.coverage ? `Đánh giá ${row.coverage.evaluated}/${row.coverage.total} tiêu chí` : '—'}
        </span>
      </div>
    ),
  },
  {
    title: 'Mức',
    key: 'tier',
    width: 150,
    render: (_, row) => {
      const tier = tierOf(row);
      return (
        <div className="flex flex-col items-start gap-1">
          {tier && <Chip tone={TIER_INFO[tier].tone}>{TIER_INFO[tier].label}</Chip>}
          {row.blockers.length > 0 && <Chip tone="bad">Bị chặn bán</Chip>}
        </div>
      );
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
  Number(b.blockers.length > 0) - Number(a.blockers.length > 0) ||
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
    .filter(i => inTier(i, filter))
    .filter(i => !search.trim() || (i.title || '').toLowerCase().includes(search.trim().toLowerCase()))
    .sort(byScore);

  const chips = [
    ...(filter ? [{ label: `Mức điểm: ${TIER_INFO[filter].label}`, clear: () => onFilter('') }] : []),
    ...(activeIssue && onClearIssue ? [{ label: issueLabel || activeIssue, clear: onClearIssue }] : []),
  ];

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs sm:p-6">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="m-0 text-base font-bold text-stone-900">
           Shop đang có {filtered.length} sản phẩm
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
