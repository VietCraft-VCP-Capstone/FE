import { Progress, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BarChart3,
  Image as ImageIcon,
  FileText,
  Tag as TagIcon,
  Layers,
  Star,
  DollarSign,
  Check,
  AlertCircle,
} from 'lucide-react';
import { decimal, scoreText } from '../../format';
import type { HealthFactor, ListingHealth } from '../../healthTypes';
import { factorTarget, factorValue, formatAmount } from './factorText';
import { Section } from './Section';

const FACTOR_ICONS: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  description: FileText,
  tags: TagIcon,
  material: Layers,
  review: Star,
  price: DollarSign,
};

const columns: ColumnsType<HealthFactor> = [
  {
    title: 'Phần được chấm',
    key: 'label',
    width: 220,
    render: (_, row) => {
      const Icon = FACTOR_ICONS[row.key] ?? BarChart3;
      const isPassed = row.sub_score >= 100;
      const isFailed = row.points <= 0;

      return (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isPassed
                ? 'bg-emerald-50 text-[#007700] ring-1 ring-emerald-200/60'
                : isFailed
                ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200/60'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60'
            }`}
          >
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <div className="font-jakarta text-sm font-bold text-stone-900">{row.label}</div>
            {row.missing ? (
              <span className="text-[11px] font-medium text-rose-600">Chưa có dữ liệu</span>
            ) : (
              row.peer_median !== null &&
              row.key !== 'price' && (
                <div className="text-[11px] text-stone-500">
                  Mặt bằng: {formatAmount(row.key, row.peer_median)}
                </div>
              )
            )}
          </div>
        </div>
      );
    },
  },
  {
    title: 'Bạn đang có',
    key: 'value',
    render: (_, row) => (
      <div>
        <div className="font-medium text-stone-900">{factorValue(row)}</div>
        {row.sub_score < 100 ? (
          <div className="text-xs text-amber-700 font-medium">Cần: {factorTarget(row)}</div>
        ) : (
          <div className="text-xs text-emerald-700">Đã đạt mục tiêu</div>
        )}
      </div>
    ),
  },
  {
    title: 'Điểm & Tiến độ',
    key: 'points',
    width: 170,
    render: (_, row) => {
      const isPassed = row.sub_score >= 100;
      const isFailed = row.points <= 0;
      const strokeColor = isPassed ? '#007700' : isFailed ? '#dc2626' : '#d97706';

      return (
        <div className="space-y-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-jakarta font-extrabold tabular-nums text-stone-900">
              {decimal(row.points, 1)}
            </span>
            <span className="text-stone-400">/ {row.weight} điểm</span>
          </div>
          <Progress
            percent={Math.min(100, Math.round(row.sub_score))}
            strokeColor={strokeColor}
            showInfo={false}
            size={['100%', 6]}
            railColor="#f5f5f4"
          />
        </div>
      );
    },
  },
  {
    title: 'Trạng thái',
    key: 'status',
    width: 110,
    align: 'right',
    render: (_, row) => {
      if (row.sub_score >= 100) {
        return (
          <Tag color="green" className="!m-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold">
            <Check size={11} strokeWidth={3} /> Tối đa
          </Tag>
        );
      }
      if (row.points <= 0) {
        return (
          <Tag color="red" className="!m-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold">
            <AlertCircle size={11} /> Cần sửa
          </Tag>
        );
      }
      return (
        <Tag color="orange" className="!m-0 rounded-full px-2.5 py-0.5 text-xs font-bold">
          Cần thêm
        </Tag>
      );
    },
  },
];

export function HealthScoreCard({ data }: { data: ListingHealth }) {
  return (
    <Section
      title="Chi tiết điểm từng phần"
      subtitle="Đánh giá 6 yếu tố quan trọng nhất ảnh hưởng trực tiếp đến thứ hạng và tỷ lệ chốt đơn"
      icon={<BarChart3 size={18} />}
      extra={
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">Tổng đạt:</span>
          <Tag color="green" className="!m-0 font-jakarta text-sm font-extrabold">
            {scoreText(data.score)} / 100 điểm
          </Tag>
        </div>
      }
    >
      <div className="overflow-hidden rounded-xl border border-stone-200/80 bg-white">
        <Table
          rowKey="key"
          columns={columns}
          dataSource={data.breakdown}
          pagination={false}
          size="middle"
        />
      </div>
    </Section>
  );
}
