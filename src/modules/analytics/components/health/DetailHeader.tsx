import { ExternalLink, Package } from 'lucide-react';
import { vnd } from '../../format';
import type { ListingHealth } from '../../healthTypes';

export function DetailHeader({ id, title, thumbnail, data }: {
  id: string;
  title: string;
  thumbnail: string | null;
  data: ListingHealth | null;
}) {
  const price = data?.breakdown.find(r => r.key === 'price')?.value;

  return (
    <header className="flex items-center gap-3">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
        {thumbnail ? (
          <img src={thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-400">
            <Package size={22} strokeWidth={1.5} aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="m-0 truncate text-base font-bold text-stone-900" title={title}>{title}</h1>
        <div className="mt-0.5 flex items-center gap-3 text-sm text-stone-600">
          {price ? <span className="tabular-nums">{vnd(price)}</span> : null}
          <a
            href={`/products/${id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-stone-600 no-underline hover:text-[#007700]"
          >
            Xem trên sàn
            <ExternalLink size={12} aria-hidden />
          </a>
        </div>
      </div>
    </header>
  );
}
