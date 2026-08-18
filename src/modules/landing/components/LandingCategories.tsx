import { ComponentType } from 'react';
import { Shirt, Gem, Image as ImageIcon, Home, Gift, Palette } from 'lucide-react';

interface CategoryItem {
  name: string;
  icon: ComponentType<any>;
}

const categories: CategoryItem[] = [
  { name: 'Thời trang', icon: Shirt },
  { name: 'Phụ Kiện', icon: Gem },
  { name: 'Tranh Ảnh', icon: ImageIcon },
  { name: 'Nhà Cửa', icon: Home },
  { name: 'Quà Tặng', icon: Gift },
  { name: 'Thiết Kế', icon: Palette },
];

export function LandingCategories() {
  return (
    <section className="border-y border-stone-100 py-6 px-6 bg-stone-50/50">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 w-full">
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <button 
              key={i} 
              className="flex items-center justify-center gap-2 bg-white hover:bg-stone-50 border border-stone-200/80 px-4 py-2.5 rounded-full text-stone-700 text-sm font-semibold shadow-sm hover:shadow transition-all group active:scale-95 w-full"
            >
              <Icon className="h-4 w-4 text-stone-500 group-hover:text-[#330033] transition-colors shrink-0" />
              <span className="truncate">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
