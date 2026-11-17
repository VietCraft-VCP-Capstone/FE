import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { AdviceKey, MoneyReport } from '../../moneyTypes';
import { Skeleton } from '../ui';
import { moneyVerdicts, type VerdictTone } from './verdictRules';
import { Term } from './Term';

const TONE = {
  good: { Icon: CheckCircle2, cls: 'text-[#007700]', label: 'Tốt' },
  warn: { Icon: AlertTriangle, cls: 'text-amber-600', label: 'Cần chú ý' },
  bad: { Icon: XCircle, cls: 'text-red-600', label: 'Cần xử lý' },
  neutral: { Icon: Info, cls: 'text-stone-400', label: 'Chưa đủ dữ liệu' },
} satisfies Record<VerdictTone, unknown>;

function TipLoading() {
  return (
    <p className="m-0 mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#005B00]">
      Đang soạn gợi ý…
      <Skeleton className="h-3 flex-1" />
    </p>
  );
}

export function MoneyVerdicts({ data, tips, aiLoading }: {
  data: MoneyReport;
  tips: Partial<Record<AdviceKey, string>>;
  aiLoading: boolean;
}) {
  const list = moneyVerdicts(data);
  return (
    <section aria-label="Kết luận nhanh" className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${list.length > 3 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
      {list.map(v => {
        const { Icon, cls, label } = TONE[v.tone];
        const tip = tips[v.key];
        return (
          <article key={v.topic} className="flex min-w-0 gap-3 rounded-md border border-stone-200 bg-white p-4">
            <Icon size={20} className={`mt-0.5 shrink-0 ${cls}`} aria-label={label} />
            <div className="min-w-0">
              <p className="m-0 text-xs font-semibold text-stone-500">{v.hint ? <Term tip={v.hint}>{v.topic}</Term> : v.topic}</p>
              <p className="m-0 mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-stone-900" title={v.title}>{v.title}</p>
              {tip ? (
                <p className="m-0 mt-1.5 text-sm text-stone-700">
                  <span className="mr-1 font-semibold text-[#005B00]">Nên làm:</span>
                  {tip}
                </p>
              ) : (
                <>
                  <p className="m-0 mt-1 text-sm text-stone-600">{v.detail}</p>
                  {aiLoading && <TipLoading />}
                </>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
