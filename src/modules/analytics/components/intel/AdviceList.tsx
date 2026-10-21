import { decimal } from '../../format';
import type { IntelAdvice } from '../../intelTypes';
import { Chip, InfoTip, InsightCard, Note } from '../ui';
import { AXIS_LABEL, EFFORT_LABEL, EVIDENCE_LABEL } from './intelLabels';

function AdviceRow({ a }: { a: IntelAdvice }) {
  const ev = EVIDENCE_LABEL[a.evidence] ?? EVIDENCE_LABEL.practice;
  return (
    <li className="py-3">
      <p className="m-0 text-[13px] leading-relaxed text-stone-800">{a.message}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Chip tone={ev.tone}>{ev.label}</Chip>
        <InfoTip text={ev.hint} label={`Giải thích nhãn ${ev.label}`} />
        <Chip>{AXIS_LABEL[a.axis] ?? a.axis}</Chip>
        <Chip>Công sức: {EFFORT_LABEL[a.effort] ?? a.effort}</Chip>
        {a.impact !== null && a.impact > 0 && <Chip tone="brand">+{decimal(a.impact, 1)} điểm</Chip>}
      </div>
    </li>
  );
}

export function AdviceList({ advice }: { advice: IntelAdvice[] }) {
  return (
    <InsightCard
      title="Việc nên làm"
      info="Đã đo: yếu tố này được kiểm chứng trên dữ liệu thật, kèm số điểm tăng thêm ước tính. Thực hành tốt: khuyến nghị theo kinh nghiệm, chưa đo được tác động."
    >
      {advice.length === 0 ? (
        <Note>Chưa có gợi ý nào, listing đã đạt các tiêu chí kiểm tra.</Note>
      ) : (
        <ul className="m-0 -my-3 list-none divide-y divide-stone-100 p-0">
          {advice.map(a => <AdviceRow key={`${a.axis}-${a.code}`} a={a} />)}
        </ul>
      )}
    </InsightCard>
  );
}
