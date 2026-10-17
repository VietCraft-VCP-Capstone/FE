import { Image, PackageCheck, Search, Star } from 'lucide-react';

const BENEFITS = [
  { Icon: Search, title: 'Khách dễ tìm thấy', text: 'Tên, mô tả và tag đầy đủ thì khớp nhiều từ khoá khách gõ hơn.' },
  { Icon: Image, title: 'Khách yên tâm đặt', text: 'Nhiều ảnh, mô tả rõ chất liệu và kích thước thì khách ít phải hỏi lại.' },
  { Icon: PackageCheck, title: 'Không mất đơn', text: 'Hết hàng thì khách không thêm vào giỏ được.' },
  { Icon: Star, title: 'Kéo thêm khách mới', text: 'Sao đánh giá hiện ngay trên trang, khách mới nhìn vào để quyết định.' },
];

export function ScoreBenefits() {
  return (
    <section aria-label="Điểm cao giúp gì" className="rounded-md border border-[#dfe8d6] bg-[#F7FAF4] px-4 py-3">
      <h2 className="m-0 text-[13px] font-bold text-[#1f4d1f]">Vì sao nên sửa? Điểm càng cao, sản phẩm càng dễ bán</h2>
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
