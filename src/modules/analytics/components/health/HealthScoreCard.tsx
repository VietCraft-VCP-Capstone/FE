import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { decimal, scoreText } from '../../format';
import type { HealthFactor, ListingHealth } from '../../healthTypes';
import { factorTarget, factorValue, formatAmount } from './factorText';
import { Section } from './Section';

const columns: ColumnsType<HealthFactor> = [
  {
    title: 'Phần được chấm',
    key: 'label',
    render: (_, row) => (
      <div>
        <div className="font-semibold text-stone-900">{row.label}</div>
        {row.missing
          ? <div className="text-xs text-red-700">Chưa có, đang được 0 điểm</div>
          : row.peer_median !== null && row.key !== 'price' && (
            <div className="text-xs text-stone-500">Sản phẩm cùng loại thường có {formatAmount(row.key, row.peer_median)}</div>
          )}
      </div>
    ),
  },
  {
    title: 'Bạn đang có',
    key: 'value',
    render: (_, row) => (
      <div>
        <div className="text-stone-900">{factorValue(row)}</div>
        {row.sub_score < 100 && <div className="text-xs text-stone-500">Cần: {factorTarget(row)}</div>}
      </div>
    ),
  },
  {
    title: 'Điểm',
    key: 'points',
    align: 'right',
    width: 90,
    render: (_, row) => {
      const color = row.sub_score >= 100 ? 'text-green-700' : row.points <= 0 ? 'text-red-700' : 'text-stone-900';
      const bar = row.sub_score >= 100 ? 'bg-green-700' : row.points <= 0 ? 'bg-red-700' : 'bg-amber-500';
      return (
        <div className="inline-flex flex-col items-end gap-1">
          <span className="tabular-nums">
            <span className={`font-semibold ${color}`}>{decimal(row.points, 1)}</span>
            <span className="text-stone-400"> / {row.weight}</span>
          </span>
          {row.points > 0 && <span className={`block h-1 rounded-sm ${bar}`} style={{ width: `${Math.min(100, row.sub_score) * 0.56}px` }} />}
        </div>
      );
    },
  },
];

export function HealthScoreCard({ data }: { data: ListingHealth }) {
  return (
    <Section title="Điểm từng phần" extra={<span className="text-sm tabular-nums text-stone-600">Tổng {scoreText(data.score)} / 100</span>}>
      <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
        <Table rowKey="key" columns={columns} dataSource={data.breakdown} pagination={false} size="middle" />
      </div>
    </Section>
  );
}
