import { FormEvent } from 'react';
import { Link } from 'react-router-dom';

interface LandingFooterProps {
  emailSubscription: string;
  setEmailSubscription: (email: string) => void;
  onSubscribe: (e: FormEvent) => void;
  subscribing: boolean;
}

const linkCls = 'hover:text-emerald-400 transition-colors inline-block py-0.5';

// Chỉ liệt kê trang đã tồn tại trong ứng dụng — không để link "#" chết trên production.
const COLUMNS: Array<{ title: string; links: Array<{ label: string; to: string }> }> = [
  {
    title: 'Mua Sắm',
    links: [
      { label: 'Khám phá sản phẩm', to: '/search' },
      { label: 'Quà tặng', to: '/gifts' },
      { label: 'Bán chạy nhất', to: '/search?sort=best_seller' },
      { label: 'Ưu đãi & Voucher', to: '/vouchers' },
    ],
  },
  {
    title: 'Bán Hàng',
    links: [
      { label: 'Bán hàng cùng VietCraft', to: '/seller/register' },
      { label: 'Kênh Người Bán', to: '/seller' },
    ],
  },
  {
    title: 'Tài Khoản',
    links: [
      { label: 'Đăng nhập', to: '/login' },
      { label: 'Tạo tài khoản', to: '/signup' },
      { label: 'Giỏ hàng', to: '/cart' },
      { label: 'Đơn hàng của tôi', to: '/orders' },
    ],
  },
];

export function LandingFooter({
  emailSubscription,
  setEmailSubscription,
  onSubscribe,
  subscribing,
}: LandingFooterProps) {
  return (
    <footer className="bg-[#2B002B] text-stone-300 pt-16 pb-8 px-6 lg:px-12 text-left font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Phần nội dung chính Footer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pb-12 border-b border-white/10">
          
          {/* Cột 1: Logo & Newsletter - Tăng diện tích chiếm 5/12 cột */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-white text-2xl font-semibold tracking-tight">
                VietCraft<span className="text-emerald-500">.</span>
              </h3>
            </div>
            
            <p className="text-stone-400 text-sm max-w-sm leading-relaxed">
              Sàn thương mại điện tử đa ngành, mua sắm dễ dàng và in theo yêu cầu (POD) tại Việt Nam.
            </p>
            
            {/* Form đăng ký Newsletter */}
            <div className="pt-2 space-y-2.5">
              <label htmlFor="footer-email" className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Nhận tin sản phẩm mới & ưu đãi
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
                    maxLength={254}
                    disabled={subscribing}
                    autoComplete="email"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={subscribing}
                  className="disabled:opacity-60 disabled:cursor-wait bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
                >
                  {subscribing ? 'Đang gửi...' : 'Đăng ký ngay'}
                </button>
              </form>
            </div>
          </div>

          {/* Cột 2: Danh sách Links */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {COLUMNS.map((col) => (
              <div key={col.title} className="space-y-4">
                <h4 className="text-white text-xs font-bold tracking-widest uppercase border-b border-white/10 pb-2 inline-block">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 text-xs text-stone-400">
                  {col.links.map((l) => (
                    <li key={l.to}><Link to={l.to} className={linkCls}>{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bản quyền & Điều khoản dưới cùng */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-400">
          <p>© {new Date().getFullYear()} VietCraft Platform. Đã đăng ký bản quyền.</p>
        </div>

      </div>
    </footer>
  );
}