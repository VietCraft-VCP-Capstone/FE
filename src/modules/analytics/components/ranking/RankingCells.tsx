import { Progress, Tag, Tooltip } from 'antd';
import { AlertCircle, AlertTriangle, ArrowRight, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Rank, RankInsight, RankingItem } from '../../rankingTypes';
import { FOCUS } from '../health/healthStats';
import { count } from '../../../../shared/utils/format';
import { scoreText } from '../../format';
import { nextLink, valueOf, type MetricDef } from './rankingMetrics';

const MEDAL = ['#d4a017', '#9ca3af', '#b87333'];

export function RankBadge({ rank }: { rank: number }) {
  const medal = MEDAL[rank - 1];
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-extrabold tabular-nums ${medal ? 'text-white' : 'bg-stone-100 text-stone-600'}`}
      style={medal ? { backgroundColor: medal } : undefined}
      aria-label={`Hạng ${rank}`}
    >
      {rank}
    </span>
  );
}

function Change({ now, before, points }: { now: number; before: number | null; points?: boolean }) {
  if (before === null) return null;
  if (!before) return now ? <span className="text-[11.5px] font-semibold text-[#005B00]">mới có trong tháng này</span> : null;
  const diff = points ? Math.round((now - before) * 10) / 10 : Math.round(((now - before) / before) * 100);
  if (Math.abs(diff) < (points ? 1 : 5)) return <span className="text-[11.5px] text-stone-500">bằng tháng trước</span>;
  const Icon = diff > 0 ? TrendingUp : TrendingDown;
  return (
    <Tooltip title={`So với 30 ngày trước đó (${points ? before : count(before)})`}>
      <span className={`inline-flex cursor-help items-center gap-0.5 text-[11.5px] font-semibold ${diff > 0 ? 'text-[#005B00]' : 'text-red-700'}`}>
        <Icon size={12} aria-hidden />{diff > 0 ? '+' : ''}{diff}{points ? '' : '%'} so với tháng trước
      </span>
    </Tooltip>
  );
}

export function MetricCell({ item, metric, total }: { item: RankingItem; metric: MetricDef; total: number }) {
  const value = valueOf(item, metric.key);
  if (value === null) return <span className="text-xs text-stone-400">Chưa đủ 20 lượt xem để tính</span>;
  const before = metric.key === 'likes' ? null : item.prev[metric.key];
  const share = metric.share && total ? Math.round((value / total) * 100) : null;
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="m-0 text-[14px] font-bold tabular-nums text-stone-900">{metric.format(value)}</p>
      {metric.key === 'units' && <p className="m-0 text-[11.5px] text-stone-500">từ {count(item.metrics.orders)} đơn hàng</p>}
      {metric.key === 'cart_rate' && <p className="m-0 text-[11.5px] text-stone-500">{count(item.metrics.carts)} lượt thêm giỏ / {count(item.metrics.views)} lượt xem</p>}
      <Change now={value} before={before} points={metric.key === 'cart_rate'} />
      {share !== null && (
        <Tooltip title={`Sản phẩm này chiếm ${share}% ${metric.share} trong 30 ngày`}>
          <div className="flex cursor-help items-center gap-2 pt-0.5">
            <Progress percent={share} showInfo={false} size="small" strokeColor="#1a6b1a" className="!m-0 flex-1" />
            <span className="shrink-0 text-[11.5px] tabular-nums text-stone-500">{share}% của shop</span>
          </div>
        </Tooltip>
      )}
    </div>
  );
}

export function MarketRank({ rank, category }: { rank: Rank | null; category: string }) {
  if (!rank) return <span className="text-xs text-stone-400">—</span>;
  const top = rank.rank <= Math.max(1, Math.ceil(rank.of / 3));
  return (
    <Tooltip title={`Đứng thứ ${rank.rank} trong ${rank.of} sản phẩm danh mục ${category} của mọi shop trên sàn`}>
      <span className="inline-flex cursor-help flex-col leading-tight">
        <span className={`text-[13px] font-bold tabular-nums ${top ? 'text-[#005B00]' : 'text-stone-800'}`}>#{rank.rank}<span className="text-xs font-normal text-stone-500">/{rank.of}</span></span>
        <span className="text-[11.5px] text-stone-500">{category} · toàn sàn</span>
      </span>
    </Tooltip>
  );
}

const TONE = {
  good: { Icon: Sparkles, color: 'text-[#2f7d32]' },
  warn: { Icon: AlertTriangle, color: 'text-amber-600' },
  bad: { Icon: AlertCircle, color: 'text-red-600' },
} as const;

function Insight({ insight, item }: { insight: RankInsight; item: RankingItem }) {
  const { Icon, color } = TONE[insight.tone];
  const link = nextLink(item, insight.next);
  return (
    <li className="flex gap-2">
      <Icon size={15} className={`mt-0.5 shrink-0 ${color}`} aria-hidden />
      <div className="min-w-0 text-[13px] leading-snug">
        <p className="m-0 font-semibold text-stone-900">{insight.title}</p>
        <p className="m-0 mt-0.5 text-stone-600">{insight.action}</p>
        {link && (
          <Link to={link.to} className={`mt-1 inline-flex items-center gap-1 rounded text-xs font-semibold text-[#007700] no-underline hover:underline ${FOCUS}`}>
            {link.label} <ArrowRight size={12} aria-hidden />
          </Link>
        )}
      </div>
    </li>
  );
}

export function InsightList({ item }: { item: RankingItem }) {
  return (
    <ul className="m-0 list-none space-y-2.5 p-0">
      {item.insights.map(i => <Insight key={i.title} insight={i} item={item} />)}
    </ul>
  );
}

export function ScoreTag({ score }: { score: number | null }) {
  if (score === null) return null;
  return <Tag variant="filled" color={score >= 80 ? 'success' : score >= 50 ? 'warning' : 'error'} className="!m-0 !text-[11px]">{scoreText(score)} điểm</Tag>;
}
