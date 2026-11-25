import type { SyntheticEvent } from 'react';

interface LandingHeroProps {
  /** Đưa khách tới trang duyệt sản phẩm, KHÔNG chặn đăng nhập */
  onExplore: () => void;
  /** Ảnh sản phẩm thật đang bán chạy; thiếu thì dùng ảnh sản phẩm mẫu của sàn trong /public/images. */
  images: Array<{ src: string; alt: string }>;
}

const FALLBACK_IMAGES = [
  { src: '/images/AoMT.png', alt: 'Áo in theo yêu cầu' },
  { src: '/images/Ly.png', alt: 'Ly in theo yêu cầu' },
  { src: '/images/KhungTranh.png', alt: 'Khung tranh in theo yêu cầu' },
];

export function LandingHero({ onExplore, images }: LandingHeroProps) {
  const pics = [0, 1, 2].map((i) => images[i] || FALLBACK_IMAGES[i]);
  const onImgError = (i: number) => (e: SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.src.endsWith(FALLBACK_IMAGES[i].src)) return;
    e.currentTarget.src = FALLBACK_IMAGES[i].src;
  };
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-stone-50 to-white pt-12 pb-20 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Content */}
        <div className="lg:col-span-6 space-y-6 text-left z-10">
          <h1 className="font-heading text-[#330033] leading-[1.18] tracking-tight">
            <span className="block font-semibold text-3xl sm:text-5xl lg:text-[52px] text-[#330033] mb-1">
              Sản phẩm
            </span>
            <span className="block font-semibold text-3xl sm:text-5xl lg:text-[52px] text-[#007700] mb-3">
              Độc đáo
            </span>
            <span className="block font-medium text-lg sm:text-2xl lg:text-[24px] leading-[1.25] text-[#330033]">
              AI phân tích thị trường
            </span>
          </h1>
          <p className="font-body text-stone-500 text-base sm:text-lg max-w-lg leading-relaxed font-normal pt-4">
            Khám phá các sản phẩm độc đáo từ những shop độc lập tại Việt Nam.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={onExplore}
              className="font-heading bg-[#330033] hover:bg-[#220022] text-white text-sm font-medium px-7 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-97"
            >
              Khám phá ngay
            </button>
            <a 
              href="#shop-noi-bat"
              className="font-body bg-white hover:bg-stone-50 text-stone-800 text-sm font-semibold px-7 py-3.5 rounded-full border border-stone-200 shadow-sm hover:shadow transition-all text-center flex items-center justify-center"
            >
              Xem Shop Nổi Bật
            </a>
          </div>
        </div>

        {/* Right Images (Stacked Creative Design) */}
        <div className="lg:col-span-6 relative flex justify-center items-center min-h-[420px] sm:min-h-[500px]">
          {/* Top Right Curved Rectangle Image */}
          <div className="absolute right-[4%] top-[2%] w-[52%] h-[58%] overflow-hidden rounded-[24px] shadow-lg border-4 border-white z-20 rotate-[-6deg] hover:rotate-0 hover:scale-105 transition-all duration-500 origin-center">
            <img
              src={pics[0].src}
              alt={pics[0].alt}
              onError={onImgError(0)}
              
              className="w-full h-full object-cover bg-stone-100"
            />
          </div>

          {/* Middle Circle Image */}
          <div className="absolute left-[4%] top-[22%] w-[48%] aspect-square overflow-hidden rounded-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] border-4 border-white z-30 hover:scale-105 transition-all duration-500 origin-center">
            <img
              src={pics[1].src}
              alt={pics[1].alt}
              onError={onImgError(1)}
              
              className="w-full h-full object-cover bg-stone-100"
            />
          </div>

          {/* Bottom Right Rounded Corner Image */}
          <div className="absolute right-[4%] bottom-[4%] w-[52%] h-[52%] overflow-hidden rounded-[24px] shadow-lg border-4 border-white z-10 rotate-[6deg] hover:rotate-0 hover:scale-105 transition-all duration-500 origin-center">
            <img
              src={pics[2].src}
              alt={pics[2].alt}
              onError={onImgError(2)}
              
              className="w-full h-full object-cover bg-stone-100"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
