import { Tooltip } from 'antd';
import { ArrowRight, Eye, PencilLine, TrendingDown, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Rank, RankInsight, RankingItem } from '../../rankingTypes';
import { count } from '../../../../shared/utils/format';
import { cleanAdviceAction, cleanAdviceTitle, scoreText } from '../../format';
import { editLink } from '../HealthParts';
import { detailLink } from '../health/HealthCells';
import { FOCUS } from '../health/healthStats';
import { nextLink, valueOf, type MetricDef } from './rankingMetrics';

export function RankBadge({ rank, active }: { rank: number; active: boolean }) {
  if (!active || rank <= 0) {
    return (
      <Tooltip title="Chưa phát sinh số liệu trong kỳ để xếp hạng">
        <span className="text-xs font-normal text-stone-300 select-none">—</span>
      </Tooltip>
    );
  }

  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center h-7 w-8 rounded-lg bg-emerald-50 text-[#007700] font-black text-xs border border-emerald-200/80 shadow-2xs tabular-nums">
        #1
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center h-7 w-8 rounded-lg bg-stone-100 text-stone-800 font-bold text-xs tabular-nums">
        #2
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center h-7 w-8 rounded-lg bg-stone-50 text-stone-700 font-bold text-xs border border-stone-200/60 tabular-nums">
        #3
      </span>
    );
  }

  return (
    <span className="text-xs font-semibold text-stone-500 tabular-nums">
      #{rank}
    </span>
  );
}

function Change({ now, before, points }: { now: number; before: number | null; points?: boolean }) {
  if (before === null) return null;
  if (!before) {
    return now ? (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-700">
        Mới tháng này
      </span>
    ) : null;
  }
  const diff = points ? Math.round((now - before) * 10) / 10 : Math.round(((now - before) / before) * 100);
  if (Math.abs(diff) < (points ? 1 : 5)) {
    return <span className="text-[10.5px] text-stone-400">Ngang kỳ trước</span>;
  }
  const isUp = diff > 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <Tooltip title={`So với 30 ngày trước (${points ? before : count(before)})`}>
      <span
        className={`inline-flex cursor-help items-center gap-0.5 text-[10.5px] font-bold tabular-nums ${
          isUp ? 'text-emerald-700' : 'text-rose-600'
        }`}
      >
        <Icon size={11} aria-hidden />
        {isUp ? '+' : ''}
        {diff}
        {points ? '' : '%'}
      </span>
    </Tooltip>
  );
}

export function MetricCell({ item, metric, total }: { item: RankingItem; metric: MetricDef; total: number }) {
  const value = valueOf(item, metric.key);
  if (value === null) {
    return <span className="text-xs text-stone-400">Chưa đủ dữ liệu</span>;
  }
  const before = metric.key === 'likes' ? null : item.prev[metric.key];
  const share = metric.share && total ? Math.round((value / total) * 100) : null;

  return (
    <div className="min-w-0 space-y-1">
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className="text-[13.5px] font-extrabold tabular-nums text-stone-900">
          {metric.format(value)}
        </span>
        <Change now={value} before={before} points={metric.key === 'cart_rate'} />
      </div>

      {metric.key === 'units' && (
        <p className="m-0 text-[11px] text-stone-500 font-medium">
          từ {count(item.metrics.orders)} đơn hàng
        </p>
      )}
      {metric.key === 'cart_rate' && (
        <p className="m-0 text-[11px] text-stone-500 font-medium">
          {count(item.metrics.carts)} giỏ / {count(item.metrics.views)} xem
        </p>
      )}

      {share !== null && (
        <Tooltip title={`Chiếm ${share}% ${metric.share} trong shop`}>
          <div className="flex cursor-help items-center gap-1.5 pt-0.5">
            <div className="h-1.5 flex-1 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#007700]"
                style={{ width: `${Math.min(100, Math.max(4, share))}%` }}
              />
            </div>
            <span className="shrink-0 text-[10.5px] font-semibold tabular-nums text-stone-500">
              {share}% shop
            </span>
          </div>
        </Tooltip>
      )}
    </div>
  );
}

export function MarketRank({ rank, category, active }: { rank: Rank | null; category: string; active: boolean }) {
  if (!rank || !active) {
    return (
      <Tooltip title="Chưa có đủ số liệu so sánh trên toàn sàn">
        <span className="text-xs text-stone-400 select-none">Chưa xếp hạng</span>
      </Tooltip>
    );
  }

  const isTopTier = rank.of >= 3 && rank.rank <= Math.ceil(rank.of / 3);

  return (
    <Tooltip title={`Xếp thứ ${rank.rank} trên tổng số ${rank.of} sản phẩm cùng ngành "${category}" của mọi shop trên toàn sàn VietCraft`}>
      <div className="inline-flex cursor-help flex-col items-start gap-0.5">
        <div className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-stone-800">
          <span>Hạng</span>
          <span className={`font-bold ${isTopTier ? 'text-[#007700]' : 'text-stone-900'}`}>
            #{rank.rank}
          </span>
          <span className="text-stone-400 font-normal">/ {rank.of}</span>
        </div>
        <span className="text-[11px] text-stone-500 truncate max-w-[145px]">
          {category} (toàn sàn)
        </span>
      </div>
    </Tooltip>
  );
}

function Insight({ insight, item }: { insight: RankInsight; item: RankingItem }) {
  const link = nextLink(item, insight.next);
  const cleanAction = cleanAdviceAction(insight.action);
  const isBad = insight.tone === 'bad';
  const isWarn = insight.tone === 'warn';

  return (
    <div className="flex items-start gap-2 text-xs leading-relaxed py-0.5">
      <span
        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
          isBad ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-600'
        }`}
      />
      <div className="min-w-0">
        <span className="font-semibold text-stone-900">
          {cleanAdviceTitle(insight.title)}:
        </span>{' '}
        <span className="text-stone-600 font-normal">{cleanAction}</span>
        {link && (
          <Link
            to={link.to}
            className={`ml-1.5 inline-flex items-center gap-0.5 font-semibold text-[#007700] hover:underline ${FOCUS}`}
          >
            {link.label} <ArrowRight size={10} aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}

export function InsightList({ item }: { item: RankingItem }) {
  if (!item.insights || item.insights.length === 0) {
    return <span className="text-xs text-stone-400 font-normal">Chưa có gợi ý thêm</span>;
  }
  return (
    <div className="space-y-1 max-w-lg">
      {item.insights.map(i => (
        <Insight key={i.title} insight={i} item={item} />
      ))}
    </div>
  );
}

export function ScoreTag({ score }: { score: number | null }) {
  if (score === null) return null;
  return (
    <span className="text-[11px] font-semibold text-stone-600 tabular-nums">
      {scoreText(score)}đ tối ưu
    </span>
  );
}

export function RankingRowActions({ id, title, field }: { id: string; title: string; field?: string | null }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-end gap-2 shrink-0">
      <Tooltip title="Xem chi tiết điểm và phân tích">
        <button
          type="button"
          onClick={() => navigate(detailLink(id))}
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-stone-200/90 text-stone-600 hover:text-[#007700] hover:border-[#007700]/40 hover:bg-emerald-50/60 transition-colors cursor-pointer shrink-0"
          aria-label={`Xem chi tiết ${title}`}
        >
          <Eye size={15} />
        </button>
      </Tooltip>
      <Tooltip title={field ? 'Đi tới mục cần tối ưu' : 'Mở trang chỉnh sửa sản phẩm'}>
        <button
          type="button"
          onClick={() => navigate(editLink(id, field))}
          className="h-8 px-3 rounded-lg bg-[#007700] hover:bg-[#005B00] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
          aria-label={`Sửa ${title}`}
        >
          <PencilLine size={13} />
          <span>Sửa</span>
        </button>
      </Tooltip>
    </div>
  );
}
