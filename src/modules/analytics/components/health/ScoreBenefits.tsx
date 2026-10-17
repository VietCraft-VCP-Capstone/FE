import { Image, PackageCheck, Search, Star } from 'lucide-react';

const BENEFITS = [
  { Icon: Search, title: 'Dễ được tìm thấy', text: 'Ô tìm kiếm dò theo tên, mô tả và tag. Mô tả đủ, đủ tag thì khớp nhiều từ khoá người mua gõ hơn.' },
  { Icon: Image, title: 'Người mua yên tâm đặt', text: 'Đủ ảnh nhiều góc, mô tả rõ chất liệu, kích thước giúp người mua hiểu sản phẩm, ít hỏi lại.' },
  { Icon: PackageCheck, title: 'Không mất đơn vì hết hàng', text: 'Phân loại hết hàng thì người mua không thêm vào giỏ được.' },
  { Icon: Star, title: 'Đánh giá tốt kéo khách mới', text: 'Điểm sao hiện ngay trên trang sản phẩm, khách mới nhìn vào để quyết định.' },
];

export function ScoreBenefits() {
  return (
    <section aria-label="Điểm cao giúp gì cho bạn" className="rounded-md border border-[#dfe8d6] bg-[#F7FAF4] px-4 py-3">
      <h2 className="m-0 text-[13px] font-bold text-[#1f4d1f]">Điểm càng cao, sản phẩm càng dễ bán</h2>
      <ul className="m-0 mt-2 grid list-none grid-cols-1 gap-x-6 gap-y-2 p-0 sm:grid-cols-2 xl:grid-cols-4">
        {BENEFITS.map(({ Icon, title, text }) => (
          <li key={title} className="flex items-start gap-2.5">
            <Icon size={16} className="mt-0.5 shrink-0 text-[#007700]" aria-hidden />
            <span className="text-xs leading-relaxed text-stone-600">
              <strong className="block text-[13px] font-semibold text-stone-900">{title}</strong>
              {text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
