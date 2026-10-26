import { Avatar, Segmented, Select, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowRight, ImageOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ListingRanking, RankMetric, RankingItem } from '../../rankingTypes';
import { RowActions, detailLink } from '../health/HealthCells';
import { FOCUS } from '../health/healthStats';
import { InsightList, MarketRank, MetricCell, RankBadge, ScoreTag } from './RankingCells';
import { METRICS, metricOf, valueOf } from './rankingMetrics';

type Row = RankingItem & { rank: number };

function columns(metric: RankMetric, total: number): ColumnsType<Row> {
  const m = metricOf(metric);
  return [
    { title: <Tooltip title="Thứ hạng giữa các sản phẩm của shop bạn">Hạng trong shop</Tooltip>, key: 'rank', width: 100, align: 'center', render: (_, r) => <RankBadge rank={r.rank} /> },
    {
      title: 'Sản phẩm',
      key: 'title',
      width: 280,
      render: (_, r) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar shape="square" size={44} src={r.thumbnail || undefined} icon={<ImageOff size={16} />} className="shrink-0 !bg-stone-100 !text-stone-400" />
          <div className="min-w-0">
            <Link to={detailLink(r.product_id)} className={`line-clamp-2 rounded text-[13.5px] font-semibold leading-snug text-stone-800 no-underline hover:text-[#007700] ${FOCUS}`}>{r.title}</Link>
            <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-stone-500">{r.category}<ScoreTag score={r.score} /></div>
          </div>
        </div>
      ),
    },
    { title: <Tooltip title={m.hint}>{m.column}</Tooltip>, key: 'metric', width: 200, render: (_, r) => <MetricCell item={r} metric={m} total={total} /> },
    { title: <Tooltip title="Chỉ là con số hạng so với sản phẩm cùng danh mục của mọi shop, dùng làm căn cứ cho gợi ý. Muốn so kỹ từng đối thủ, xem trang Phân tích đối thủ.">Hạng toàn sàn</Tooltip>, key: 'market', width: 130, render: (_, r) => <MarketRank rank={r.market[metric]} category={r.category} /> },
    { title: 'Nên làm gì để có thêm khách', key: 'insights', render: (_, r) => <InsightList item={r} /> },
    { title: 'Thao tác', key: 'actions', width: 108, align: 'right', render: (_, r) => <RowActions id={r.product_id} title={r.title} field={r.insights.find(i => i.field)?.field} /> },
  ];
}

export function RankingTable({ data, rows, metric, category, onMetric, onCategory }: {
  data: ListingRanking;
  rows: Row[];
  metric: RankMetric;
  category: string;
  onMetric: (m: RankMetric) => void;
  onCategory: (c: string) => void;
}) {
  const total = data.items.reduce((s, r) => s + (valueOf(r, metric) ?? 0), 0);
  return (
    <section className="overflow-hidden rounded-md border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-4 py-3">
        <h2 className="m-0 mr-2 text-sm font-bold text-stone-900">Xếp hạng sản phẩm trong shop</h2>
        <Segmented<RankMetric> value={metric} onChange={onMetric} options={METRICS.map(m => ({ value: m.key, label: m.label }))} />
        <Select
          value={category}
          onChange={onCategory}
          aria-label="Lọc theo loại sản phẩm"
          className="w-full sm:w-56"
          options={[{ value: '', label: 'Mọi loại sản phẩm' }, ...data.categories.map(c => ({ value: c.name, label: `${c.name} (${c.n_mine})` }))]}
        />
        <span className="ml-auto flex flex-wrap items-center gap-3 text-xs text-stone-500">
          Tính trong {data.window_days} ngày gần nhất
          <Link to="/seller/insights/competitors" className={`inline-flex items-center gap-1 rounded font-semibold text-[#007700] no-underline hover:underline ${FOCUS}`}>
            Xem phân tích đối thủ <ArrowRight size={12} aria-hidden />
          </Link>
        </span>
      </div>
      <Table<Row>
        rowKey="product_id"
        size="middle"
        tableLayout="fixed"
        columns={columns(metric, total)}
        dataSource={rows}
        scroll={{ x: 1150 }}
        pagination={rows.length > 20 ? { pageSize: 20, className: '!px-4' } : false}
      />
    </section>
  );
}
