import { decimal } from '../../format';
import type { IntelModel } from '../../intelTypes';
import { InsightCard, Note } from '../ui';

export function ModelCard({ model, bare = false }: { model: IntelModel; bare?: boolean }) {
  return (
    <InsightCard bare={bare}
      title="Độ tin cậy của model"
      info="AUC đo khả năng model xếp listing bán chạy lên trên listing bán chậm, trên tập kiểm tra chưa từng thấy. 0,5 là đoán ngẫu nhiên, 1 là hoàn hảo."
    >
      <div className="space-y-2">
        <p className="m-0 text-[13px] leading-relaxed text-stone-800">
          AUC <strong className="tabular-nums">{decimal(model.auc, 3)}</strong>
          {model.auc_ci95[0] !== null && model.auc_ci95[1] !== null && ` (khoảng tin cậy 95%: ${decimal(model.auc_ci95[0], 3)} đến ${decimal(model.auc_ci95[1], 3)})`}.
          Cách tính đơn giản tốt nhất, <strong>{model.best_baseline.name}</strong>, đạt {decimal(model.best_baseline.auc, 3)}.
        </p>
        <Note>Phiên bản {model.version}. Dữ liệu huấn luyện: {model.trained_on}.</Note>
      </div>
    </InsightCard>
  );
}
