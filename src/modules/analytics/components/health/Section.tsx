import type { ReactNode } from 'react';

export function Section({ title, extra, children, className = '' }: { title: string; extra?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`border-t border-stone-200 pt-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 className="m-0 text-base font-bold text-stone-900">{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}
