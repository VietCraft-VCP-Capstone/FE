import { Routes, Route, Navigate } from 'react-router-dom';
import { SellerLayout } from './SellerLayout';
import { ProductListingPage } from '../../product/pages/ProductListingPage';
import { SellerSettingsPage } from './SellerSettingsPage';
import { ShopOnboardingPage } from './ShopOnboardingPage';
import { CreateProductPage } from './CreateProductPage';
import { SellerCatalogPage } from './SellerCatalogPage';
import { SellerDashboard } from './SellerDashboard';
import { SellerOrdersPage } from './SellerOrdersPage';
import { SellerRefundRequestsPage } from './SellerRefundRequestsPage';
import { SellerChatPage } from './SellerChatPage';
import { POD_CREATE_ENABLED } from '../featureFlags';

import { SellerDesignsPage } from './SellerDesignsPage';
import { SellerPromotionsPage } from './SellerPromotionsPage';

function SellerAnalytics() {

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-2 animate-fade-in">
      <h2 className="text-2xl font-extrabold text-stone-900 font-jakarta">Analytics</h2>
      <p className="text-sm text-stone-500">Phân tích chuyên sâu về tình hình kinh doanh, doanh số và xu hướng thị trường.</p>
    </div>
  );
}

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
        <Route path="chat" element={<SellerChatPage />} />
        <Route path="analytics" element={<SellerAnalytics />} />
        <Route path="payouts" element={<SellerPayouts />} />
        <Route path="catalog" element={<SellerCatalogPage />} />
        <Route path="shipping" element={<Stub t="Vận chuyển" d="Quản lý phương thức và trạng thái giao hàng." />} />
        <Route path="promotions" element={<SellerPromotionsPage />} />
        <Route path="revenue" element={<Stub t="Doanh thu cửa hàng" d="Theo dõi doanh thu và dòng tiền." />} />

        <Route path="product-status" element={<Stub t="Trạng thái sản phẩm" d="Tình trạng duyệt và hiển thị sản phẩm." />} />
        <Route path="forecast" element={<Stub t="Dự báo nhu cầu" d="Dự báo nhu cầu thị trường từ AI." />} />
        <Route path="golden-hour" element={<Stub t="Danh mục & giờ vàng" d="Khung giờ vàng để đẩy sản phẩm." />} />
        <Route path="price-optimize" element={<Stub t="Tối ưu giá bán" d="Gợi ý giá bán tối ưu theo thị trường." />} />
        <Route path="market-share" element={<Stub t="Thị phần & đối thủ" d="Phân tích thị phần và đối thủ cạnh tranh." />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </SellerLayout>
  );
}

