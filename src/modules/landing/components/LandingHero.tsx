interface LandingHeroProps {
  /** Đưa khách tới nội dung thật (lưới sản phẩm), KHÔNG chặn đăng nhập */
  onExplore: () => void;
}

export function LandingHero({ onExplore }: LandingHeroProps) {
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
              src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=600" 
              alt="Ceramics craft" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Middle Circle Image */}
          <div className="absolute left-[4%] top-[22%] w-[48%] aspect-square overflow-hidden rounded-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] border-4 border-white z-30 hover:scale-105 transition-all duration-500 origin-center">
            <img 
              src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=600" 
              alt="Jewelry Ring" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Bottom Right Rounded Corner Image */}
          <div className="absolute right-[4%] bottom-[4%] w-[52%] h-[52%] overflow-hidden rounded-[24px] shadow-lg border-4 border-white z-10 rotate-[6deg] hover:rotate-0 hover:scale-105 transition-all duration-500 origin-center">
            <img 
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=600" 
              alt="Minimal room design" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
