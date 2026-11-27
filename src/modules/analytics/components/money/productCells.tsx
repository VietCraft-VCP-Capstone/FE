import { Link } from 'react-router-dom';
import { BRAND } from '../ui';
import { Thumb } from '../health/Thumb';
import { detailLink } from '../health/HealthCells';
import { NA } from '../../format';
import type { MoneyReport } from '../../moneyTypes';
import { sharePct } from './moneyParts';

export type Product = MoneyReport['by_product'][number];

export function ProductTitle({ p, rank }: { p: Product; rank: number }) {
  const text = p.title || NA;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="w-5 shrink-0 text-right text-xs tabular-nums text-stone-400">{rank}</span>
      <Thumb src={p.image || null} size={32} />
      {p.product_id ? (
        <Link to={detailLink(p.product_id)} title={p.title || undefined}
          className="block min-w-0 truncate font-medium text-stone-800 underline decoration-stone-300 underline-offset-2 hover:text-[#005B00] hover:decoration-[#005B00]">
          {text}
        </Link>
      ) : (
        <span className="block min-w-0 truncate font-medium text-stone-800" title={p.title || undefined}>{text}</span>
      )}
    </div>
  );
}

export function ShareCell({ net, total }: { net: number; total: number }) {
  if (!(net > 0 && total > 0)) return <span className="text-stone-400">{NA}</span>;
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-stone-100" aria-hidden>
        <span className="block h-full rounded-full" style={{ width: `${Math.min(100, (net / total) * 100)}%`, background: BRAND }} />
      </span>
      <span className="tabular-nums text-stone-700">{sharePct(net, total)}</span>
    </div>
  );
}
