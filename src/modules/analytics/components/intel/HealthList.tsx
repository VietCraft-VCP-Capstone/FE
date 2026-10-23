import { Progress, Segmented, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ListFilter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { decimal, plainText, scoreText } from '../../format';
import type { HealthRow } from '../../healthTypes';
import { detailLink, RowActions } from '../health/HealthCells';
import { Thumb } from '../health/Thumb';
import { healthTier } from './intelLabels';

export const TIERS = ['Kém', 'Cần cải thiện', 'Tốt'] as const;
export type TierFilter = (typeof TIERS)[number] | '';

const TAG_COLOR = { good: 'green', warn: 'orange', bad: 'red', neutral: 'default' } as const;

const columns: ColumnsType<HealthRow> = [
  {
    title: 'Sản phẩm',
    key: 'title',
    width: 320,
    render: (_, row) => (
      <div className="flex min-w-0 items-center gap-3.5">
        <Thumb src={row.thumbnail} size={48} />
        <div className="min-w-0">
          <Link
            to={detailLink(row.product_id)}
            className="line-clamp-2 font-jakarta text-sm font-bold text-stone-900 transition-colors hover:text-[#007700]"
            onClick={e => e.stopPropagation()}
          >
            {row.title || 'Sản phẩm chưa có tên'}
          </Link>
          <span className="text-[11px] font-mono text-stone-400">#{row.product_id.slice(0, 8)}</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Điểm sức khoẻ',
    key: 'score',
    width: 170,
    sorter: (a, b) => (a.score ?? -1) - (b.score ?? -1),
    render: (_, row) => {
      if (row.score === null) {
        return <span className="text-xs text-stone-400">Đang chờ chấm</span>;
      }
      const tier = healthTier(row.score);
      const strokeColor =
        tier.tone === 'good' ? '#007700' : tier.tone === 'warn' ? '#d97706' : '#dc2626';

      return (
        <div className="space-y-1 max-w-[130px]">
          <div className="flex items-center justify-between">
            <span className="font-jakarta text-base font-extrabold tabular-nums text-stone-900">
              {scoreText(row.score)}
            </span>
            <Tag color={TAG_COLOR[tier.tone as keyof typeof TAG_COLOR]} className="!m-0 text-[10px] font-bold">
              {tier.label}
            </Tag>
          </div>
          <Progress
            percent={Math.max(0, Math.min(100, row.score))}
            strokeColor={strokeColor}
            showInfo={false}
            size={['100%', 4]}
            railColor="#f5f5f4"
          />
        </div>
      );
    },
  },
  {
    title: 'Nên sửa trước',
    key: 'todo',
    responsive: ['md'],
    render: (_, row) =>
      row.top_todo ? (
        <div className="flex items-center justify-between gap-3">
          <span className="line-clamp-2 min-w-0 flex-1 text-xs font-medium text-stone-700">
            {plainText(row.top_todo)}
          </span>
          {row.top_impact !== null && (
            <Tag color="green" className="!m-0 shrink-0 font-jakarta text-xs font-bold">
              +{decimal(row.top_impact, 1)} điểm
            </Tag>
          )}
        </div>
      ) : (
        <span className="text-xs text-emerald-700 font-medium">Đã đạt tiêu chuẩn tốt</span>
      ),
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
}: {
  items: HealthRow[];
  filter: TierFilter;
  onFilter: (t: TierFilter) => void;
}) {
  const navigate = useNavigate();
  const count = (t: TierFilter) => items.filter(i => !t || healthTier(i.score).label === t).length;
  const shown = items.filter(i => !filter || healthTier(i.score).label === filter).sort(byScore);
  const options = (['', ...TIERS] as TierFilter[]).map(t => ({
    value: t,
    label: `${t || 'Tất cả'} (${count(t)})`,
  }));

  return (
    <section className="rounded-2xl border border-stone-200/80 bg-white p-5 md:p-6 shadow-xs transition-shadow hover:shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#007700] ring-1 ring-[#007700]/15">
            <ListFilter size={18} />
          </div>
          <div>
            <h2 className="m-0 font-jakarta text-base font-bold tracking-tight text-stone-900">
              Chi tiết danh sách sản phẩm
            </h2>
            <p className="m-0 mt-0.5 text-xs text-stone-500">
              Sản phẩm có điểm thấp được xếp lên đầu. Bấm vào bất kỳ dòng nào để mở phân tích chi tiết.
            </p>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Segmented
            options={options}
            value={filter}
            onChange={v => onFilter(v as TierFilter)}
            className="!p-1"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200/80 bg-white">
        <Table
          rowKey="product_id"
          columns={columns}
          dataSource={shown}
          size="middle"
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          onRow={row => ({
            onClick: () => navigate(detailLink(row.product_id)),
            className: 'cursor-pointer transition-colors hover:bg-stone-50/80',
          })}
          locale={{ emptyText: 'Không có sản phẩm nào ở mức phân loại này.' }}
        />
      </div>
    </section>
  );
}
