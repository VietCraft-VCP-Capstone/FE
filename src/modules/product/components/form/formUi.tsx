import { ReactNode } from 'react';

export const LABEL = 'block text-[13px] font-semibold text-stone-800';
export const HINT = 'text-xs leading-relaxed text-stone-500';
export const ERROR_TEXT = 'text-xs font-medium text-rose-600';
export const INPUT =
  'w-full h-10 px-3 bg-white border rounded-lg text-sm text-stone-900 placeholder:text-stone-400 transition-colors ' +
  'focus:outline-none focus:border-[#007700] focus:ring-2 focus:ring-[#007700]/15 disabled:bg-stone-100 disabled:cursor-not-allowed';

export const inputClass = (error?: string, extra = '') =>
  `${INPUT} ${error ? 'border-rose-500 bg-rose-50/40' : 'border-stone-300 hover:border-stone-400'} ${extra}`;

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
  focusTarget?: string;
  children: ReactNode;
}

export function Field({ label, required, error, hint, action, className = '', focusTarget, children }: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`} data-focus-target={focusTarget} data-invalid={error ? true : undefined}>
      <div className="flex items-center justify-between gap-3">
        <label className={LABEL}>
          {label} {required && <span className="text-rose-600" aria-hidden>*</span>}
        </label>
        {action}
      </div>
      {children}
      {error ? <p role="alert" className={ERROR_TEXT}>{error}</p> : hint && <p className={HINT}>{hint}</p>}
    </div>
  );
}

interface SectionProps {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function FormSection({ id, title, description, action, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-5 rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div>
          <h4 className="m-0 text-base font-bold text-stone-900">{title}</h4>
          {description && <p className={`m-0 mt-0.5 ${HINT}`}>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
