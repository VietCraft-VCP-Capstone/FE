import { Segmented, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link, useNavigate } from 'react-router-dom';
import { decimal, plainText, scoreText } from '../../format';
import type { HealthRow } from '../../healthTypes';
import { detailLink, RowActions } from '../health/HealthCells';
import { Thumb } from '../health/Thumb';
import { healthTier } from './intelLabels';

export const TIERS = ['Kém', 'Cần cải thiện', 'Tốt'] as const;
export type TierFilter = (typeof TIERS)[number] | '';

const TAG_COLOR = { good: 'green', warn: 'orange', bad: 'red' } as const;

const columns: ColumnsType<HealthRow> = [
  {
    title: 'Sản phẩm',
    key: 'title',
    width: 280,
    render: (_, row) => (
      <div className="flex min-w-0 items-center gap-3">
        <Thumb src={row.thumbnail} />
        <Link to={detailLink(row.product_id)} className="line-clamp-2 font-semibold text-stone-900 hover:text-[#007700]" onClick={e => e.stopPropagation()}>
          {row.title || 'Sản phẩm chưa có tên'}
        </Link>
      </div>
    ),
  },
  {
    title: 'Điểm',
    key: 'score',
    width: 140,
    sorter: (a, b) => (a.score ?? -1) - (b.score ?? -1),
    render: (_, row) => {
      if (row.score === null) return <span className="text-stone-500">Đang chờ chấm</span>;
      const tier = healthTier(row.score);
      return (
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2.5">
          <span className="w-7 text-lg font-bold tabular-nums text-stone-900">{scoreText(row.score)}</span>
          <Tag variant="filled" color={TAG_COLOR[tier.tone as keyof typeof TAG_COLOR]} className="!m-0">{tier.label}</Tag>
        </div>
      );
    },
  },
  {
    title: 'Nên sửa trước',
    key: 'todo',
    responsive: ['md'],
    render: (_, row) => row.top_todo
      ? (
        <div className="flex items-start gap-3">
          <span className="line-clamp-2 min-w-0 flex-1 text-[13px] text-stone-700">{plainText(row.top_todo)}</span>
          {row.top_impact !== null && <span className="shrink-0 text-[13px] font-semibold tabular-nums text-[#007700]">+{decimal(row.top_impact, 1)} điểm</span>}
        </div>
      )
      : <span className="text-[13px] text-stone-500">Không còn việc cần làm</span>,
  },
  {
    title: '',
    key: 'actions',
    responsive: ['md'],
    width: 100,
    render: (_, row) => <div onClick={e => e.stopPropagation()}><RowActions id={row.product_id} title={row.title} field={row.top_field} /></div>,
  },
];

const byScore = (a: HealthRow, b: HealthRow) => (a.score ?? Number.MAX_SAFE_INTEGER) - (b.score ?? Number.MAX_SAFE_INTEGER);

export function HealthList({ items, filter, onFilter }: { items: HealthRow[]; filter: TierFilter; onFilter: (t: TierFilter) => void }) {
  const navigate = useNavigate();
  const count = (t: TierFilter) => items.filter(i => !t || healthTier(i.score).label === t).length;
  const shown = items.filter(i => !filter || healthTier(i.score).label === filter).sort(byScore);
  const options = (['', ...TIERS] as TierFilter[]).map(t => ({ value: t, label: `${t || 'Tất cả'} (${count(t)})` }));

  return (
    <section className="border-t border-stone-200 pt-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-base font-bold text-stone-900">Từng sản phẩm, điểm thấp lên đầu</h2>
        <div className="max-w-full overflow-x-auto"><Segmented options={options} value={filter} onChange={v => onFilter(v as TierFilter)} /></div>
      </div>
      <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
        <Table
          rowKey="product_id"
          columns={columns}
          dataSource={shown}
          size="middle"
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          onRow={row => ({ onClick: () => navigate(detailLink(row.product_id)), className: 'cursor-pointer' })}
          locale={{ emptyText: 'Không có sản phẩm nào ở mức này.' }}
        />
      </div>
    </section>
  );
}
