import type { ReactNode } from 'react';

export interface SectionProps {
  title: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: 'card' | 'plain';
}

export function Section({
  title,
  subtitle,
  icon,
  extra,
  children,
  className = '',
  variant = 'card',
}: SectionProps) {
  if (variant === 'plain') {
    return (
      <section className={`border-t border-stone-200/80 pt-6 ${className}`}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-2.5">
            {icon && <span className="text-[#007700]">{icon}</span>}
            <div>
              <h2 className="m-0 font-jakarta text-base font-bold text-stone-900">{title}</h2>
              {subtitle && <p className="m-0 mt-0.5 text-xs text-stone-500">{subtitle}</p>}
            </div>
          </div>
          {extra}
        </div>
        {children}
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border border-stone-200/80 bg-white p-5 md:p-6 shadow-xs transition-shadow duration-200 hover:shadow-sm ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#007700] ring-1 ring-[#007700]/15">
              {icon}
            </div>
          )}
          <div>
            <h2 className="m-0 font-jakarta text-base font-bold tracking-tight text-stone-900">{title}</h2>
            {subtitle && <p className="m-0 mt-0.5 text-xs text-stone-500">{subtitle}</p>}
          </div>
        </div>
        {extra && <div className="flex items-center gap-2">{extra}</div>}
      </div>
      {children}
    </section>
  );
}
