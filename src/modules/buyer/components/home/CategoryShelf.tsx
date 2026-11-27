import type { FeaturedCategory } from '../../../product/services/productsService';

interface CategoryShelfProps {
  categories: FeaturedCategory[];
  onSelect: (c: FeaturedCategory) => void;
}

// Tailwind chỉ sinh class viết nguyên văn trong mã nguồn, nên không ghép chuỗi động.
const MD_COLS: Record<number, string> = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' };

/** Danh mục đang có hàng, xếp theo số sản phẩm thật. Ô đầu lớn hơn để mắt có điểm bắt đầu. */
export function CategoryShelf({ categories, onSelect }: CategoryShelfProps) {
  // 1 ô lớn + 4 ô nhỏ lấp kín 2 hàng; chưa đủ 5 danh mục thì chia đều, không để ô trống.
  const feature = categories.length >= 5;
  const items = feature ? categories.slice(0, 5) : categories.slice(0, 4);
  return (
    <div className={`grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[170px] ${feature ? 'md:grid-cols-4' : MD_COLS[items.length] || 'md:grid-cols-4'}`}>
      {items.map((c, i) => (
        <button
          key={c._id}
          type="button"
          onClick={() => onSelect(c)}
          className={`group relative overflow-hidden rounded-2xl bg-stone-200 text-left ${feature && i === 0 ? 'col-span-2 row-span-2' : ''}`}
        >
          <img
            src={c.cover_image || '/image-not-found.jpg'}
            alt=""
            loading="lazy"
            className="vc-card-img absolute inset-0 h-full w-full object-cover group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#240024]/85 via-[#240024]/20 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
            <span className={`vc-display block font-semibold leading-tight text-white ${feature && i === 0 ? 'text-[22px] sm:text-[26px]' : 'text-[15px]'}`}>
              {c.name}
            </span>
            <span className="mt-1 block text-[12px] text-white/75">{c.product_count.toLocaleString('vi-VN')} sản phẩm</span>
          </span>
        </button>
      ))}
    </div>
  );
}
