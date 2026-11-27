import { Skeleton } from '../ui';

const card = 'rounded-md border border-stone-200 bg-white p-4';

/** Khung chờ cùng bố cục với trang thật, để lúc số về không bị nhảy layout. */
export function MoneySkeleton() {
  return (
    <div className="space-y-5">
      <div className={`${card} grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]`}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`${card} space-y-2`}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className={`${card} space-y-3 lg:col-span-7`}>
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-5 w-full" />)}
        </div>
        <div className={`${card} space-y-3 lg:col-span-5`}>
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-5 w-full" />)}
        </div>
      </div>
      <div className={card}><Skeleton className="h-56 w-full" /></div>
    </div>
  );
}
