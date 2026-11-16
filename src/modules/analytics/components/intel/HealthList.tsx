import { useState } from 'react';
import { Table, Input, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AlertCircle, CheckCircle2, Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { plainText, scoreText, cleanTitle, formatUrgentWarning } from '../../format';
import type { HealthRow } from '../../healthTypes';
import { detailLink, RowActions } from '../health/HealthCells';
import { Thumb } from '../health/Thumb';
import { healthTier, TIER_COLOR } from './intelLabels';

export const TIERS = ['Cần chú ý', 'Cần cải thiện', 'Tốt'] as const;
export type TierFilter = (typeof TIERS)[number] | '';

function TodoCell({ row }: { row: HealthRow }) {
  if (row.urgent) {
    const { short, detail } = formatUrgentWarning(row.top_todo);
    return (
      <Tooltip title={detail || 'Cần kiểm tra và sửa lỗi nội dung tin đăng'} placement="topLeft">
        <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200/80 px-2.5 py-1 text-xs text-rose-800 font-bold max-w-full cursor-help">
          <AlertCircle size={13} className="shrink-0 text-rose-600" />
          <span className="truncate">{short}</span>
        </div>
      </Tooltip>
    );
  }

  if (!row.top_todo) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
        <CheckCircle2 size={13} className="text-[#007700]" />
        <span>Đạt chuẩn</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center justify-between gap-2 rounded-lg bg-stone-50 border border-stone-200/70 px-2.5 py-1 text-xs text-stone-800 max-w-full">
      <span className="truncate font-medium">{plainText(row.top_todo)}</span>
      {row.top_impact !== null && (
        <span className="shrink-0 rounded bg-emerald-100/90 px-1.5 py-0.2 text-[10px] font-bold text-[#007700] tabular-nums">
          +{Math.round(row.top_impact)}đ
        </span>
      )}
    </div>
  );
}

const columns: ColumnsType<HealthRow> = [
  {
    title: 'Sản phẩm',
    key: 'title',
    render: (_, row) => {
      const displayTitle = cleanTitle(row.title);
      return (
        <div className="flex min-w-0 items-center gap-3.5 py-1.5">
          <span className="shrink-0">
            <Thumb src={row.thumbnail} size={44} />
          </span>
          <div className="min-w-0 space-y-1">
            <Link
              to={detailLink(row.product_id)}
              className="line-clamp-2 text-xs font-bold text-stone-900 no-underline hover:text-[#007700] transition-colors leading-snug"
              onClick={e => e.stopPropagation()}
              title={row.title}
            >
              {displayTitle}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-stone-400">
                #{row.product_id ? row.product_id.slice(-6).toUpperCase() : 'N/A'}
              </span>
              {row.urgent && (
                <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 border border-rose-200/70">
                  <AlertCircle size={10} /> Cần sửa
                </span>
              )}
            </div>
            <div className="md:hidden mt-2">
              <TodoCell row={row} />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    title: 'Điểm tối ưu',
    key: 'score',
    width: 140,
    sorter: (a, b) => (a.score ?? -1) - (b.score ?? -1),
    render: (_, row) => {
      if (row.score === null) return <span className="text-xs text-stone-400">Đang chấm...</span>;
      const tier = healthTier(row.score);
      const color = TIER_COLOR[tier.tone];
      return (
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black tabular-nums text-stone-900">{scoreText(row.score)}</span>
              <span className="text-[10px] font-bold text-stone-400">/100</span>
            </div>
            <span
              className="text-[11px] font-bold"
              style={{ color }}
            >
              {tier.label}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(4, Math.min(100, row.score))}%`, background: color }}
            />
          </div>
        </div>
      );
    },
  },
  {
    title: 'Hành động ưu tiên',
    key: 'todo',
    responsive: ['md'],
    render: (_, row) => <TodoCell row={row} />,
  },
  {
    title: 'Thao tác',
    key: 'actions',
    responsive: ['md'],
    width: 130,
    align: 'right',
    render: (_, row) => (
      <div onClick={e => e.stopPropagation()}>
        <RowActions id={row.product_id} title={row.title} field={row.top_field} />
      </div>
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
    ...(filter ? [{ label: `Phân loại: ${filter}`, clear: () => onFilter('') }] : []),
    ...(activeIssue && onClearIssue ? [{ label: `Cần sửa: ${issueLabel || activeIssue}`, clear: onClearIssue }] : []),
    ...(search ? [{ label: `Tìm: "${search}"`, clear: () => setSearch('') }] : []),
  ];

  return (
    <section className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-2xs">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-base font-bold text-stone-900">
            Danh sách sản phẩm
            <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-600">
              {filtered.length}
            </span>
          </h2>
          <p className="m-0 mt-0.5 text-xs text-stone-500">
            Nhấp vào từng sản phẩm để xem lộ trình tối ưu và phân tích chuyên sâu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Input
              prefix={<Search size={14} className="text-stone-400" />}
              placeholder="Tìm theo tên sản phẩm..."
              allowClear
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="!rounded-xl !border-stone-200 !text-xs !bg-stone-50/50 hover:!bg-white focus:!bg-white"
            />
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 border-t border-stone-100 pt-3">
          <span className="text-[11px] text-stone-400 mr-1">Bộ lọc đang chọn:</span>
          {chips.map(c => (
            <button
              key={c.label}
              type="button"
              onClick={c.clear}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-stone-900 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-2xs hover:bg-stone-800 transition"
            >
              <span>{c.label}</span>
              <X size={11} aria-label="Bỏ lọc" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onFilter('');
              onClearIssue?.();
              setSearch('');
            }}
            className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 underline ml-2 cursor-pointer"
          >
            Xóa tất cả
          </button>
        </div>
      )}

      <Table
        rowKey="product_id"
        columns={columns}
        dataSource={filtered}
        size="middle"
        tableLayout="fixed"
        pagination={{
          pageSize: 10,
          hideOnSinglePage: false,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total, range) => (
            <span className="text-xs text-stone-500 font-medium">
              Hiển thị {range[0]}–{range[1]} trên tổng số {total} sản phẩm
            </span>
          ),
          className: '!px-4 !py-3 !m-0 border-t border-stone-100 flex items-center justify-between',
        }}
        onRow={row => ({
          onClick: () => navigate(detailLink(row.product_id)),
          className: 'cursor-pointer hover:!bg-stone-50/60 transition-colors',
        })}
        locale={{ emptyText: 'Không tìm thấy sản phẩm nào phù hợp.' }}
      />
    </section>
  );
}