import { Outlet, useLocation } from 'react-router-dom';
import { BuyerHeader } from '../components/BuyerHeader';
import { BuyerFooter } from '../components/BuyerFooter';
import { useState, useEffect } from 'react';
import { cartService } from '../../order/services/cartService';

interface BuyerLayoutProps {
  user: any;
}

export function BuyerLayout({ user }: BuyerLayoutProps) {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // 1. Fetch initial cart count from backend DB
    cartService.getCart()
      .then(cart => {
        const total = cart?.items?.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0) || 0;
        setCartCount(total);
      })
      // cartService tự phân nhánh giỏ server / giỏ khách nên không còn nhánh dự phòng
      // đọc thẳng localStorage ở đây nữa.
      .catch(() => setCartCount(0));

    // 2. Listen to custom event cart updates
    const handleCartUpdate = (e: any) => {
      setCartCount(e.detail.count || 0);
    };
    window.addEventListener('vietcraft-cart-updated', handleCartUpdate);

    return () => {
      window.removeEventListener('vietcraft-cart-updated', handleCartUpdate);
    };
  }, []);

  return (
    <div className="buyer-dashboard-page">
      {/* Header */}
      <BuyerHeader user={user} cartCount={cartCount} search={search} setSearch={setSearch} />

      {/* Main Content Area */}
      <main className="buyer-main-content">
        <Outlet context={{ cartCount, setCartCount, search }} />
      </main>

      {/* Footer */}
      {!location.pathname.startsWith('/product') && <BuyerFooter />}
    </div>
  );
}

export default BuyerLayout;
