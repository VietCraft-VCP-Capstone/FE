import { Outlet, useLocation } from 'react-router-dom';
import { BuyerHeader } from '../components/BuyerHeader';
import { BuyerFooter } from '../components/BuyerFooter';
import { useState, useEffect } from 'react';

interface BuyerLayoutProps {
  user: any;
}

export function BuyerLayout({ user }: BuyerLayoutProps) {
  const location = useLocation();
  // Sync giỏ hàng từ localStorage
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const cartStr = localStorage.getItem('vietcraft_cart');
    if (cartStr) {
      try {
        const items = JSON.parse(cartStr);
        setCartCount(items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0));
        return;
      } catch (e) {}
    }
    setCartCount(0);
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
