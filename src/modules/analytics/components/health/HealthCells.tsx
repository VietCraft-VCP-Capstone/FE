import { Avatar, Button, Popover, Progress, Tag, Tooltip } from 'antd';
import { CheckCircle2, Eye, ImageOff, PencilLine } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { HEALTH_STATUS_LABEL } from '../../format';
import type { ListingHealthItem } from '../../healthTypes';
import type { HealthAxis, HealthStatus } from '../../types';
import { editLink } from '../HealthParts';
import { AXIS_SHORT, BAND_COLOR, FOCUS, axisValue, bandOf } from './healthStats';
import { AxisHow, ScoreBreakdown } from './ScoreBreakdown';

export const detailLink = (id: string) => `/seller/insights/listings/${id}`;

const BAND_TAG: Record<HealthStatus, string> = { good: 'success', needs_improvement: 'warning', poor: 'error' };

function Tags({ tags }: { tags: ListingHealthItem['tags'] }) {
  if (tags.length === 0) return <span className="text-[11.5px] text-stone-400">Chưa gắn tag</span>;
  const shown = tags.slice(0, 2);
  return (
    <>
      {shown.map(t =>
        t.pending ? (
          <Tooltip key={t.name} title="Đang chờ duyệt, người mua chưa thấy">
            <Tag variant="outlined" className="!m-0 cursor-help border-dashed !text-[11px] text-stone-500">{t.name}</Tag>
          </Tooltip>
        ) : (
          <Tag key={t.name} variant="filled" className="!m-0 !text-[11px]">{t.name}</Tag>
        ),
      )}
      {tags.length > 2 && (
        <Tooltip title={tags.slice(2).map(t => t.name).join(', ')}>
          <Tag variant="filled" className="!m-0 cursor-help !text-[11px]">+{tags.length - 2}</Tag>
        </Tooltip>
      )}
    </>
  );
}

export function ProductCell({ item }: { item: ListingHealthItem }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar shape="square" size={48} src={item.thumbnail || undefined} icon={<ImageOff size={18} />} className="shrink-0 !bg-stone-100 !text-stone-400" />
      <div className="min-w-0">
        <Link
          to={detailLink(item.product_id)}
          className={`line-clamp-2 rounded text-[13.5px] font-semibold leading-snug text-stone-800 no-underline transition-colors duration-150 hover:text-[#007700] motion-reduce:transition-none ${FOCUS}`}
        >
          {item.title}
        </Link>
        <div className="mt-1.5 flex flex-wrap gap-1"><Tags tags={item.tags} /></div>
      </div>
    </div>
  );
}

export function ScoreCell({ item, compact }: { item: ListingHealthItem; compact?: boolean }) {
  if (item.score === null || !item.status) return <Tag variant="filled">{compact ? '—' : 'Đang chấm'}</Tag>;
  const score = Math.round(item.score);
  const label = HEALTH_STATUS_LABEL[item.status] ?? item.status;
  return (
    <Popover title={`${score} điểm · ${label}`} content={<ScoreBreakdown item={item} />} trigger={['hover', 'focus']} placement="right">
      <div tabIndex={0} className={`flex cursor-help items-center gap-2.5 rounded ${FOCUS}`}>
        <Progress
          type="circle"
          size={42}
          strokeWidth={10}
          percent={score}
          strokeColor={BAND_COLOR[item.status]}
          format={() => <span className="text-[13px] font-bold tabular-nums text-stone-900">{score}</span>}
          aria-label={`${score} điểm`}
        />
        {!compact && <Tag color={BAND_TAG[item.status]} variant="filled" className="!m-0">{label}</Tag>}
      </div>
    </Popover>
  );
}

export function NextStep({ item }: { item: ListingHealthItem }) {
  if (item.score === null) return <span className="text-xs text-stone-500">Đang chấm, có điểm sau khoảng 1 phút</span>;
  const first = item.todos[0] ?? item.warnings[0];
  if (!first) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2f7d32]">
        <CheckCircle2 size={14} aria-hidden /> Đã ổn, không cần sửa
      </span>
    );
  }
  const others = item.todos.length + item.warnings.length - 1;
  return (
    <div className="text-[13px] leading-snug">
      <span className={first.type === 'warning' ? 'text-amber-800' : 'text-green-700'}>{first.message}</span>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {first.impact != null && first.impact > 0 && (
          <Tag  className="!m-0 !border-0 !bg-[#0e870c] !px-2 !py-0.5 !text-[11px] !font-semibold !text-white" >+{Math.max(1, Math.round(first.impact))} điểm</Tag>
        )}
        {others > 0 && <span className="text-[11.5px] text-stone-500">+{others} việc khác</span>}
      </div>
    </div>
  );
}

export function AxisCell({ item, axis }: { item: ListingHealthItem; axis: HealthAxis }) {
  const value = axisValue(item, axis);
  if (value === null) return <span className="text-xs text-stone-400">Chưa tính</span>;
  return (
    <Popover title={`Điểm ${AXIS_SHORT[axis].label.toLowerCase()}: ${Math.round(value)}/100`} content={<AxisHow item={item} axis={axis} />} trigger={['hover', 'focus']} placement="right">
      <div tabIndex={0} className={`flex cursor-help items-center gap-2 rounded ${FOCUS}`}>
        <Progress percent={value} showInfo={false} size="small" strokeColor={BAND_COLOR[bandOf(value)]} className="!m-0 w-16" />
        <span className="text-[13px] font-bold tabular-nums" style={{ color: BAND_COLOR[bandOf(value)] }}>{Math.round(value)}</span>
      </div>
    </Popover>
  );
}

export function RowActions({ id, title, field }: { id: string; title: string; field?: string | null }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Tooltip title="Xem chi tiết">
        <Button aria-label={`Xem chi tiết ${title}`} icon={<Eye size={16} />} onClick={() => navigate(detailLink(id))} />
      </Tooltip>
      <Tooltip title={field ? 'Sửa ngay chỗ cần sửa' : 'Sửa sản phẩm'}>
        <Button type="primary" aria-label={`Sửa ${title}`} icon={<PencilLine size={16} />} onClick={() => navigate(editLink(id, field))} />
      </Tooltip>
    </div>
  );
}
