import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function ActionRow({
  text,
  sub,
  hint,
  gain,
  to,
  cta = 'Sửa',
}: {
  text: string;
  sub?: ReactNode;
  hint?: string;
  gain?: number;
  to?: string | null;
  cta?: string;
}) {
  const urgent = cta === 'Sửa ngay';
  const title = <div className="text-sm font-semibold leading-snug text-stone-900">{text}</div>;

  const row = (
    <div className="group flex items-center gap-3 py-3">
      <span className={`w-12 shrink-0 text-sm font-bold tabular-nums ${urgent ? 'text-rose-700' : 'text-[#007700]'}`}>
        {urgent ? 'Gấp' : gain !== undefined && gain >= 0.5 ? `+${Math.round(gain)}đ` : ''}
      </span>
      <div className="min-w-0 flex-1">
        {hint ? <Tooltip title={hint} placement="topLeft">{title}</Tooltip> : title}
        {sub && <div className="mt-0.5 text-xs text-stone-500">{sub}</div>}
      </div>
      {to && (
        <span className={`inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold ${urgent ? 'text-rose-700' : 'text-stone-600 group-hover:text-[#007700]'}`}>
          {cta}
          <ChevronRight size={14} aria-hidden />
        </span>
      )}
    </div>
  );

  return <li className="list-none">{to ? <Link to={to} className="block no-underline">{row}</Link> : row}</li>;
}
