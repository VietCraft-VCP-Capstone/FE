import { Info } from 'lucide-react';
import { decimal } from '../../format';
import type { ListingIntel } from '../../intelTypes';
import { GROUP_LABEL } from './intelLabels';
import { ModelCard } from './ModelCard';

export function HowScored({ data }: { data: ListingIntel }) {
  const group = data.peers.group ? GROUP_LABEL[data.peers.group] ?? data.peers.group : 'cùng loại';
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md px-1 py-1 text-[13px] font-semibold text-stone-600 hover:text-stone-900">
        <Info size={15} aria-hidden /> Điểm được tính thế nào?
      </summary>
      <div className="mt-2 grid gap-5 rounded-xl border border-stone-200 bg-white px-5 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <ul className="m-0 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-stone-700">
          <li>Điểm do mô hình AI ước tính: sản phẩm của bạn tốt hơn bao nhiêu phần trăm sản phẩm nhóm {group} trong dữ liệu tham chiếu.</li>
          <li>Từ 80 là Tốt, 50 đến 79 là Cần cải thiện, dưới 50 là Kém.</li>
          {data.base !== null && data.demand_factor !== null && (
            <li>Điểm gốc {decimal(data.base, 0)} nhân hệ số nhu cầu ×{decimal(data.demand_factor, 2)} của ngày đang xem, nên điểm đổi theo mùa.</li>
          )}
          <li>Điểm từng phần là chỉ báo riêng, không cộng lại thành điểm tổng. Đánh giá của khách nằm trong việc cần làm, không cộng vào điểm.</li>
          <li>Điểm để bạn tự cải thiện, không ảnh hưởng thứ hạng tìm kiếm và không phải cam kết bán được.</li>
        </ul>
        <ModelCard model={data.model} bare />
      </div>
    </details>
  );
}
