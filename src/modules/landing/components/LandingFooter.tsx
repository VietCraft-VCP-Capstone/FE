import { FormEvent } from 'react';

interface LandingFooterProps {
  emailSubscription: string;
  setEmailSubscription: (email: string) => void;
  onSubscribe: (e: FormEvent) => void;
}

export function LandingFooter({
  emailSubscription,
  setEmailSubscription,
  onSubscribe,
}: LandingFooterProps) {
  return (
    <footer className="bg-[#2B002B] text-stone-300 pt-16 pb-8 px-6 lg:px-12 text-left font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Phần nội dung chính Footer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pb-12 border-b border-white/10">
          
          {/* Cột 1: Logo & Newsletter - Tăng diện tích chiếm 5/12 cột */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-2">
              <h3 className="text-white text-3xl font-extrabold tracking-tight">
                VietCraft<span className="text-emerald-500">.</span>
              </h3>
            </div>
            
            <p className="text-stone-400 text-sm max-w-sm leading-relaxed">
              Nền tảng thương mại điện tử chuyên biệt về sản phẩm in theo yêu cầu (POD) & thủ công mỹ nghệ Việt Nam.
            </p>
            
            {/* Form đăng ký Newsletter */}
            <div className="pt-2 space-y-2.5">
              <label htmlFor="footer-email" className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Đăng ký bán hàng với AI Analytics
              </label>
              
              <form onSubmit={onSubscribe} className="flex gap-2 max-w-md">
                <div className="relative flex-1">
                  <input 
                    id="footer-email"
                    type="email" 
                    value={emailSubscription}
                    onChange={(e) => setEmailSubscription(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn..." 
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-400 transition-all focus:outline-none focus:border-emerald-500 focus:bg-white/10 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
                >
                  Đăng ký ngay
                </button>
              </form>
            </div>
          </div>

          {/* Cột 2: Danh sách Links - Chiếm 7/12 cột, phân bổ đều 3 cột con */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* Mua sắm */}
            <div className="space-y-4">
              <h4 className="text-white text-xs font-bold tracking-widest uppercase border-b border-white/10 pb-2 inline-block">
                Mua Sắm
              </h4>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors inline-block py-0.5">Thẻ quà tặng</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors inline-block py-0.5">Danh mục nổi bật</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors inline-block py-0.5">Sơ đồ trang</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors inline-block py-0.5">Bài viết & Blog</a></li>
              </ul>
            </div>

            {/* Bán hàng */}
            <div className="space-y-4">
              <h4 className="text-white text-xs font-bold tracking-widest uppercase border-b border-white/10 pb-2 inline-block">
                Bán Hàng
              </h4>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors inline-block py-0.5">Bán hàng cùng VietCraft</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors inline-block py-0.5">Cộng đồng Nhà bán</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors inline-block py-0.5">Diễn đàn thảo luận</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors inline-block py-0.5">Đối tác Tiếp thị (Affiliate)</a></li>
              </ul>
            </div>

            {/* Về chúng tôi */}
            <div className="space-y-4">
              <h4 className="text-white text-xs font-bold tracking-widest uppercase border-b border-white/10 pb-2 inline-block">
                Về VietCraft
              </h4>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors inline-block py-0.5">Giới thiệu VietCraft</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors inline-block py-0.5">Chính sách & Quy định</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors inline-block py-0.5">Nhà đầu tư</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors inline-block py-0.5">Tuyển dụng</a></li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bản quyền & Điều khoản dưới cùng */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-400">
          <p>© 2026 VietCraft Platform. Đã đăng ký bản quyền.</p>
          <div className="flex flex-wrap gap-6 justify-center">
            <a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-white transition-colors">Cài đặt quảng cáo</a>
          </div>
        </div>

      </div>
    </footer>
  );
}