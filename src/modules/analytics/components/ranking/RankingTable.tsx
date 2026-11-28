import { Select, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ListingRanking, RankMetric, RankingItem } from '../../rankingTypes';
import { cleanTitle } from '../../format';
import { detailLink } from '../health/HealthCells';
import { FOCUS } from '../health/healthStats';
import { Thumb } from '../health/Thumb';
import { Link } from 'react-router-dom';
import { InsightList, MarketRank, MetricCell, RankBadge, RankingRowActions, ScoreTag } from './RankingCells';
import { metricOf, valueOf } from './rankingMetrics';

type Row = RankingItem & { rank: number };

function columns(metric: RankMetric, total: number): ColumnsType<Row> {
  const m = metricOf(metric);
  return [
    {
      title: <Tooltip title="Thứ hạng của sản phẩm so với các sản phẩm khác trong shop bạn">Hạng shop</Tooltip>,
      key: 'rank',
      width: 90,
      align: 'center',
      render: (_, r) => <RankBadge rank={r.rank} active={(valueOf(r, metric) ?? 0) > 0} />,
    },
    {
      title: 'Sản phẩm',
      key: 'title',
      width: 320,
      render: (_, r) => {
        const title = cleanTitle(r.title);
        return (
          <div className="flex min-w-0 items-center gap-3.5 py-1.5">
            <span className="shrink-0">
              <Thumb src={r.thumbnail} size={44} />
            </span>
            <div className="min-w-0 flex-1">
              <Link
                to={detailLink(r.product_id)}
                className={`line-clamp-2 text-xs font-bold leading-snug text-stone-900 no-underline transition-colors hover:text-[#007700] ${FOCUS}`}
                title={title}
              >
                {title}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 font-medium">
                <span>{r.category}</span>
                <span className="text-stone-300">·</span>
                <ScoreTag score={r.score} />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: <Tooltip title={m.hint}>{m.column}</Tooltip>,
      key: 'metric',
      width: 190,
      render: (_, r) => <MetricCell item={r} metric={m} total={total} />,
    },
    {
      title: (
        <Tooltip title="Thứ hạng của sản phẩm này so với tất cả sản phẩm cùng ngành trên toàn sàn VietCraft (bao gồm cả shop đối thủ)">
          Vị thế toàn sàn
        </Tooltip>
      ),
      key: 'market',
      width: 170,
      render: (_, r) => (
        <MarketRank rank={r.market[metric]} category={r.category} active={(valueOf(r, metric) ?? 0) > 0} />
      ),
    },
    {
      title: 'Gợi ý tối ưu',
      key: 'insights',
      render: (_, r) => <InsightList item={r} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      align: 'right',
      render: (_, r) => (
        <RankingRowActions id={r.product_id} title={cleanTitle(r.title)} field={r.insights.find(i => i.field)?.field} />
      ),
    },
  ];
}

export function RankingTable({
  data,
  rows,
  metric,
  category,
  onCategory,
}: {
  data: ListingRanking;
  rows: Row[];
  metric: RankMetric;
  category: string;
  onCategory: (c: string) => void;
}) {
  const m = metricOf(metric);
  const total = data.items.reduce((s, r) => s + (valueOf(r, metric) ?? 0), 0);
  return (
    <section className="overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-xs font-bold text-stone-900">
              Xếp hạng theo {m.label.toLowerCase()}
            </h2>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-stone-600">
              {rows.length} sản phẩm
            </span>
          </div>
          <Select
            value={category}
            onChange={onCategory}
            aria-label="Lọc theo loại sản phẩm"
            className="w-full sm:w-52"
            options={[
              { value: '', label: 'Tất cả loại sản phẩm' },
              ...data.categories.map(c => ({ value: c.name, label: `${c.name} (${c.n_mine})` })),
            ]}
          />
        </div>
        <div className="text-xs text-stone-400">
          Tính trong {data.window_days} ngày gần nhất
        </div>
      </div>
      <Table<Row>
        rowKey="product_id"
        size="middle"
        tableLayout="fixed"
        columns={columns(metric, total)}
        dataSource={rows}
        scroll={{ x: 1180 }}
        pagination={{
          pageSize: 10,
          hideOnSinglePage: false,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (t, range) => (
            <span className="text-xs text-stone-500 font-medium">
              Hiển thị {range[0]}–{range[1]} trên tổng số {t} sản phẩm
            </span>
          ),
          className: '!px-4 !py-3 !m-0 border-t border-stone-100 flex items-center justify-between',
        }}
        locale={{ emptyText: 'Không có sản phẩm nào trong tiêu chí này.' }}
      />
    </section>
  );
}
