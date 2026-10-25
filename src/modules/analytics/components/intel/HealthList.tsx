import { Progress, Segmented, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ListFilter, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatTodoSummary, plainText, scoreText } from '../../format';
import type { HealthRow } from '../../healthTypes';
import { detailLink, RowActions } from '../health/HealthCells';
import { Thumb } from '../health/Thumb';
import { healthTier } from './intelLabels';

export const TIERS = ['Cần chú ý', 'Cần cải thiện', 'Tốt'] as const;
export type TierFilter = (typeof TIERS)[number] | '';

const columns: ColumnsType<HealthRow> = [
  {
    title: 'Sản phẩm',
    key: 'title',
    width: 320,
    render: (_, row) => (
      <div className="flex min-w-0 items-center gap-3">
        <Thumb src={row.thumbnail} size={44} />
        <div className="min-w-0">
          <Link
            to={detailLink(row.product_id)}
            className="line-clamp-2 font-jakarta text-xs font-bold text-stone-900 transition-colors hover:text-[#007700]"
            onClick={e => e.stopPropagation()}
          >
            {row.title || 'Sản phẩm chưa có tên'}
          </Link>
          <span className="text-[10px] font-mono text-stone-400">
            Mã tin: #{row.product_id.slice(-8).toUpperCase()}
          </span>
        </div>
      </div>
    ),
  },
  {
    title: (
      <div className="flex items-center gap-1">
        <span>Điểm chất lượng</span>
        <Tooltip title="Thang điểm từ 0 đến 100. Từ 80 là Tốt, 50 - 79 là Cần cải thiện, dưới 50 là Cần chú ý.">
          <Info size={11} className="text-stone-300 hover:text-stone-600 cursor-help" />
        </Tooltip>
      </div>
    ),
    key: 'score',
    width: 170,
    sorter: (a, b) => (a.score ?? -1) - (b.score ?? -1),
    render: (_, row) => {
      if (row.score === null) {
        return <span className="text-xs text-stone-400">Đang chờ chấm</span>;
      }
      const tier = healthTier(row.score);
      const strokeColor =
        tier.tone === 'good' ? '#007700' : tier.tone === 'warn' ? '#b45309' : '#BA1A1A';

      const badgeClass =
        tier.tone === 'good'
          ? 'bg-[#EAF0E2] text-[#007700] border-[#BECAB6]'
          : tier.tone === 'warn'
          ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-rose-50 text-[#BA1A1A] border-rose-200';

      return (
        <div className="space-y-1 max-w-[130px]">
          <div className="flex items-center justify-between">
            <span className="font-jakarta text-sm font-extrabold tabular-nums text-stone-900">
              {scoreText(row.score)}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badgeClass}`}>
              {tier.label}
            </span>
          </div>
          <Progress
            percent={Math.max(0, Math.min(100, row.score))}
            strokeColor={strokeColor}
            showInfo={false}
            size={['100%', 3]}
            railColor="#f5f5f4"
          />
        </div>
      );
    },
  },
  {
    title: (
      <div className="flex items-center gap-1">
        <span>Gợi ý ưu tiên sửa</span>
        <Tooltip title="Hành động có tác động lớn nhất giúp bạn tăng điểm chất lượng tin đăng.">
          <Info size={11} className="text-stone-300 hover:text-stone-600 cursor-help" />
        </Tooltip>
      </div>
    ),
    key: 'todo',
    responsive: ['md'],
    render: (_, row) => {
      const summary = formatTodoSummary(row.top_todo, row.top_field);
      if (!summary) {
        return <span className="text-xs text-[#007700] font-medium">Đã đạt tiêu chuẩn tốt</span>;
      }
      return (
        <Tooltip title={plainText(row.top_todo || '')} placement="topLeft">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0 font-mono ${summary.tagColor.bg} ${summary.tagColor.text} ${summary.tagColor.border}`}
                >
                  {summary.tag}
                </span>
                <span className="text-xs font-semibold text-stone-900 truncate" title={summary.primary}>
                  {summary.primary}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-stone-500 truncate" title={summary.secondary}>
                {summary.secondary}
              </div>
            </div>
            {row.top_impact !== null && (
              <Tooltip title="Số điểm bạn sẽ nhận thêm ngay sau khi hoàn thành mục này">
                <span className="cursor-help text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EAF0E2] text-[#007700] border border-[#BECAB6] font-mono shrink-0">
                  +{Math.round(row.top_impact)}đ
                </span>
              </Tooltip>
            )}
          </div>
        </Tooltip>
      );
    },
  },
  {
    title: 'Thao tác',
    key: 'actions',
    responsive: ['md'],
    width: 110,
    align: 'right',
    render: (_, row) => (
      <div onClick={e => e.stopPropagation()}>
        <RowActions id={row.product_id} title={row.title} field={row.top_field} />
      </div>
    ),
  },
];

const byScore = (a: HealthRow, b: HealthRow) =>
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
  const count = (t: TierFilter) => items.filter(i => !t || healthTier(i.score).label === t).length;
  const shown = items.filter(i => !filter || healthTier(i.score).label === filter).sort(byScore);
  const options = (['', ...TIERS] as TierFilter[]).map(t => ({
    value: t,
    label: `${t || 'Tất cả'} (${count(t)})`,
  }));

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF0E2] text-[#007700]">
            <ListFilter size={15} />
          </div>
          <div>
            <h2 className="m-0 font-jakarta text-sm font-bold tracking-tight text-stone-900">
              Danh sách chi tiết sản phẩm
            </h2>
            <p className="m-0 mt-0.5 text-xs text-stone-500">
              Sản phẩm có điểm thấp được xếp trước để tiện theo dõi. Bấm vào dòng để xem chi tiết.
            </p>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Segmented
            options={options}
            value={filter}
            onChange={v => onFilter(v as TierFilter)}
            className="!p-0.5 !bg-stone-100"
          />
        </div>
      </div>

      {activeIssue && (
        <div className="mb-3.5 flex items-center justify-between rounded-lg bg-[#EAF0E2]/60 border border-[#BECAB6] px-3.5 py-2 text-xs text-stone-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-stone-700">Đang lọc theo gợi ý:</span>
            <span className="font-bold text-[#007700] underline">{issueLabel || activeIssue}</span>
            <span className="text-stone-500">({shown.length} sản phẩm phù hợp)</span>
          </div>
          {onClearIssue && (
            <button
              type="button"
              onClick={onClearIssue}
              className="text-xs font-bold text-[#007700] hover:text-[#005B00] cursor-pointer"
            >
              ✕ Bỏ lọc gợi ý
            </button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <Table
          rowKey="product_id"
          columns={columns}
          dataSource={shown}
          size="middle"
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          onRow={row => ({
            onClick: () => navigate(detailLink(row.product_id)),
            className: 'cursor-pointer transition-colors hover:bg-[#EAF0E2]/25',
          })}
          locale={{ emptyText: 'Không có sản phẩm nào phù hợp với bộ lọc hiện tại.' }}
        />
      </div>
    </section>
  );
}
