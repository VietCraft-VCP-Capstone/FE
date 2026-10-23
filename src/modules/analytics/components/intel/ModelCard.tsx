import { NA } from '../../format';
import type { IntelModel } from '../../intelTypes';
import { InsightCard, Note } from '../ui';

const pairText = (auc: number | null) => (auc === null ? NA : `${Math.round(auc * 100)}/100`);

export function ModelCard({ model, bare = false }: { model: IntelModel; bare?: boolean }) {
  const [lo, hi] = model.auc_ci95;
  const base = model.best_baseline;
  return (
    <InsightCard bare={bare}
      title="Độ tin cậy của cách chấm"
      info="Cách chấm xếp đúng sản phẩm bán chạy lên trên sản phẩm bán chậm trong bao nhiêu cặp, trên dữ liệu chưa từng dùng để học. Đoán bừa là 50/100, hoàn hảo là 100/100."
    >
      <div className="space-y-2">
        <p className="m-0 text-[13px] leading-relaxed text-stone-800">
          {model.auc !== null && (
            <>
              Đúng <strong className="tabular-nums">{pairText(model.auc)}</strong> cặp sản phẩm khi kiểm tra (đoán bừa: 50)
              {lo !== null && hi !== null && `, dao động từ ${pairText(lo)} đến ${pairText(hi)}`}.{' '}
            </>
          )}
          {base.auc !== null && <>Cách tính đơn giản tốt nhất, <strong>{base.name}</strong>, đúng {pairText(base.auc)}.</>}
        </p>
        <Note>Phiên bản {model.version}. Dữ liệu dùng để học: {model.trained_on}.</Note>
      </div>
    </InsightCard>
  );
}
