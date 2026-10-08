import { Routes, Route, Navigate } from 'react-router-dom';
import { SellerLayout } from './SellerLayout';
import { ProductListingPage } from '../../product/pages/ProductListingPage';
import { SellerSettingsPage } from './SellerSettingsPage';
import { ShopOnboardingPage } from './ShopOnboardingPage';
import { CreateProductPage } from './CreateProductPage';
import { SellerDashboard } from './SellerDashboard';
import { SellerOrdersPage } from './SellerOrdersPage';
import { SellerRefundRequestsPage } from './SellerRefundRequestsPage';
import { SellerCatalogPage } from './SellerCatalogPage';
import { SellerFollowedCompetitorsPage } from './SellerFollowedCompetitorsPage';
import { SellerCompetitorDetailPage } from './SellerCompetitorDetailPage';
import { SellerChatPage } from './SellerChatPage';
import { POD_CREATE_ENABLED } from '../featureFlags';

import { SellerDesignsPage } from './SellerDesignsPage';
import { SellerPromotionsPage } from './SellerPromotionsPage';

function SellerPayouts() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-2 animate-fade-in">
      <h2 className="text-2xl font-extrabold text-stone-900 font-jakarta">Payouts</h2>
      <p className="text-sm text-stone-500">Quản lý dòng tiền rút và lịch sử đối soát giao dịch thanh toán ngân hàng.</p>
    </div>
  );
}

interface SellerPortalProps {
  user: any;
  onLogout: () => void;
}

export function SellerPortal({ user, onLogout }: SellerPortalProps) {
  const Stub = ({ t, d }: { t: string; d: string }) => (
    <div className="animate-fade-in"><h2 className="seller-products-title">{t}</h2><p className="seller-role-subtitle">{d}</p></div>
  );
  return (
    <SellerLayout user={user} onLogout={onLogout}>
      {/* Seller Routes */}
      <Routes>
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route
          path="products/new"
          element={POD_CREATE_ENABLED ? <CreateProductPage /> : <Navigate to="/seller/products" replace />}
        />
        <Route path="designs" element={<SellerDesignsPage />} />
        <Route path="products" element={<ProductListingPage />} />
        <Route path="product-listing" element={<ProductListingPage />} />
        <Route path="settings" element={<SellerSettingsPage />} />
        <Route path="onboarding" element={<ShopOnboardingPage />} />
        <Route path="storefront" element={<SellerSettingsPage />} />
        <Route path="orders" element={<SellerOrdersPage />} />
        <Route path="refund-requests" element={<SellerRefundRequestsPage />} />
        <Route path="competitors" element={<SellerFollowedCompetitorsPage />} />
        <Route path="competitors/:id" element={<SellerCompetitorDetailPage />} />
        <Route path="chat" element={<SellerChatPage />} />
        <Route path="payouts" element={<SellerPayouts />} />
        <Route path="catalog" element={<SellerCatalogPage />} />
        <Route path="shipping" element={<Stub t="Vận chuyển" d="Quản lý phương thức và trạng thái giao hàng." />} />
        <Route path="promotions" element={<SellerPromotionsPage />} />
        <Route path="revenue" element={<Stub t="Doanh thu cửa hàng" d="Theo dõi doanh thu và dòng tiền." />} />

        {/* Năm đường dẫn phân tích cũ đều là trang rỗng. Giờ chúng là trang thật trong khu
            "Phân tích & AI", nên chuyển tiếp thay vì để người bán gặp trang trắng. Giữ
            chuyển tiếp để đường dẫn cũ ai đã lưu vẫn dùng được. */}
        <Route path="analytics" element={<Navigate to="/seller/insights/overview" replace />} />
        <Route path="forecast" element={<Navigate to="/seller/insights/forecast" replace />} />
        <Route path="golden-hour" element={<Navigate to="/seller/insights/categories" replace />} />
        <Route path="price-optimize" element={<Navigate to="/seller/insights/pricing" replace />} />
        <Route path="market-share" element={<Navigate to="/seller/insights/competitors" replace />} />
        <Route path="product-status" element={<Navigate to="/seller/insights/listings" replace />} />
        <Route path="*" element={<Navigate to="/seller/dashboard" replace />} />
      </Routes>
    </SellerLayout>
  );
}

