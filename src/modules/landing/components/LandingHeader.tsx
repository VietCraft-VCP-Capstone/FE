import { useState, useEffect } from 'react';
import { Search, Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cartService } from '../../order/services/cartService';
import { SearchPopover } from '../../buyer/components/SearchPopover';
import { useSearchSuggest } from '../../buyer/hooks/useSearchSuggest';

interface LandingHeaderProps {
  user: any;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onLogin: () => void;
  onLogout: () => void;
  onSignup: () => void;
  onHome: () => void;
  onDashboard: (name: string) => void;
}

export function LandingHeader({
  user,
  searchQuery,
  setSearchQuery,
  onLogin,
  onLogout,
  onSignup,
  onHome,
  onDashboard,
}: LandingHeaderProps) {
  const [cartCount, setCartCount] = useState<number>(0);
  const searchBox = useSearchSuggest(searchQuery, setSearchQuery);

  useEffect(() => {
    cartService.getCart()
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          const totalQty = data.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
          setCartCount(totalQty);
        }
      })
      .catch(() => {});

    const handleCartUpdate = (e: any) => {
      if (e.detail && typeof e.detail.count === 'number') {
        setCartCount(e.detail.count);
      }
    };

    window.addEventListener('vietcraft-cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('vietcraft-cart-updated', handleCartUpdate);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-100 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo */}
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={onHome}>
          <span className="text-2xl font-bold select-none">
            <span className="text-[#007700]">Viet</span>
            <span className="text-[#330033]">Craft</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 font-semibold text-stone-700">
          <a href="#kham-pha" className="hover:text-[#007700] transition-colors">Khám phá</a>
          <a href="#qua-tang" className="hover:text-[#007700] transition-colors">Quà tặng</a>
          <span className="cursor-pointer hover:text-[#007700] transition-colors" onClick={onSignup}>Đăng ký</span>
          <a href="#xu-huong" className="hover:text-[#007700] transition-colors">Xu hướng</a>
          <Link to="/seller/register" className="text-[#007700] hover:text-[#005B00] font-bold transition-colors">
            Kênh Người Bán
          </Link>
        </nav>

        <div className="flex-1 max-w-lg min-w-[160px] relative group" ref={searchBox.containerRef}>
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-[#007700] transition-colors cursor-pointer"
            onClick={() => searchBox.onExecuteSearch()}
          />
          <input
            type="text"
            placeholder="Tìm kiếm thiết kế, nghệ thuật, quà tặng..."
            {...searchBox.inputProps}
            className="w-full bg-stone-50 border border-stone-200 focus:border-[#007700] focus:bg-white rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none transition-all shadow-inner"
          />
          <SearchPopover {...searchBox.popoverProps} />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <Link to="/favorites" className="p-2 text-stone-600 hover:text-[#007700] hover:bg-stone-50 rounded-full transition-all" title="Yêu thích">
            <Heart className="h-5.5 w-5.5" />
          </Link>
          <Link to="/cart" className="p-2 text-stone-600 hover:text-[#007700] hover:bg-stone-50 rounded-full transition-all relative" title="Giỏ hàng">
            <ShoppingCart className="h-5.5 w-5.5" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-[#007700] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>
          
          {user ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onDashboard(user.name)}
                className="bg-[#007700] hover:bg-[#006000] text-white text-sm font-semibold px-5 py-2 rounded-full transition-all shadow-sm"
              >
                Bảng điều khiển ({user.name})
              </button>
              <button
                onClick={onLogout}
                className="text-stone-500 hover:text-rose-600 text-sm font-medium px-2 py-1"
              >
                Thoát
              </button>
            </div>
          ) : (
            <button 
              onClick={onLogin}
              className="bg-[#007700] hover:bg-[#006000] text-white text-sm font-semibold px-5 py-2 rounded-full transition-all shadow-sm active:scale-95"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
