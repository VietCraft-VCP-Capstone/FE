import { Sparkles, ArrowRight } from 'lucide-react';

interface LandingCollectionsProps {
  /** Mở nội dung bộ sưu tập. Chưa có trang bộ sưu tập riêng nên tạm dẫn về lưới sản phẩm. */
  onAction?: () => void;
}

export function LandingCollections({ onAction }: LandingCollectionsProps) {
  const handleAction = () => onAction?.();
  return (
    <section className="py-20 px-6 bg-stone-50/40 border-t border-stone-100">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <h2 className="text-3xl font-extrabold text-[#330033] text-left tracking-tight">
          Bộ Sưu Tập Tuyển Chọn
        </h2>

        {/* Grid Layout matching mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Big Collection Card */}
          <div 
            onClick={handleAction}
            className="lg:col-span-8 relative rounded-3xl overflow-hidden aspect-[16/9] lg:aspect-auto lg:h-[480px] shadow-md hover:shadow-lg transition-shadow group cursor-pointer"
          >
            <img 
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1000" 
              alt="Lối Sống Tối Giản" 
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 flex flex-col justify-end p-8 sm:p-12 text-left">
              <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-1">Collection</span>
              <h3 className="text-white text-2xl sm:text-3xl font-bold mb-2">Lối Sống Tối Giản</h3>
              <p className="text-white/80 text-xs sm:text-sm max-w-md font-light leading-relaxed">
                Clean lines, natural textures, and purposeful design for a serene home environment.
              </p>
            </div>
          </div>

          {/* Right Stacked Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Top Mini Card */}
            <div 
              onClick={handleAction}
              className="relative rounded-3xl overflow-hidden h-[228px] shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
            >
              <img 
                src="https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&q=80&w=600" 
                alt="Nét Đẹp Thủ Công" 
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#330033]/90 via-[#330033]/25 to-black/10 flex flex-col justify-end p-6 text-left">
                <h4 className="text-white text-lg font-bold">Nét Đẹp Thủ Công</h4>
                <p className="text-white/70 text-xs font-light">Handcrafted to perfection</p>
              </div>
            </div>

            {/* Bottom Plum Matrix Tech Block */}
            <div className="bg-[#330033] rounded-3xl h-[228px] p-8 flex flex-col justify-between text-left relative overflow-hidden group shadow-md">
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,119,0,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(0,119,0,0.15)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
              
              <div>
                <div className="h-8 w-8 rounded-lg bg-[#007700]/10 border border-[#007700]/20 flex items-center justify-center text-[#007700] mb-4 animate-pulse">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-white text-lg font-bold mb-1">Không Gian Sáng Tạo</h4>
                <p className="text-white/60 text-xs font-light max-w-[240px] leading-relaxed">
                  Use AI to generate custom design concepts
                </p>
              </div>

              <button 
                onClick={handleAction}
                className="bg-white hover:bg-stone-100 text-[#330033] text-xs font-bold py-2.5 px-5 rounded-full self-start transition-all flex items-center gap-1 active:scale-95 group-hover:shadow"
              >
                <span>Start Creating</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
