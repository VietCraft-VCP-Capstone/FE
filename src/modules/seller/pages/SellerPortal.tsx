import { Routes, Route, Navigate } from 'react-router-dom';
import { SellerLayout } from './SellerLayout';
import { ProductListingPage } from '../../product/pages/ProductListingPage';

function SellerDashboard() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-stone-900 font-jakarta">Dashboard</h2>
        <p className="text-sm text-stone-500 mt-0.5">Thống kê doanh thu, đơn hàng và hiệu suất bán hàng của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Doanh thu tháng</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-stone-900 font-jakarta">45.200.000đ</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">↗ +18.4%</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Đơn hàng mới</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-stone-900 font-jakarta">86 đơn</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">↗ +10.2%</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Sản phẩm khả dụng</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#007700] font-jakarta">12 sản phẩm</span>
            <span className="text-xs font-medium text-stone-500">Hoạt động tốt</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SellerStorefront() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-2 animate-fade-in">
      <h2 className="text-2xl font-extrabold text-stone-900 font-jakarta">Storefront</h2>
      <p className="text-sm text-stone-500">Cấu hình hồ sơ và banner gian hàng thủ công độc bản của bạn.</p>
    </div>
  );
}

function SellerOrders() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-2 animate-fade-in">
      <h2 className="text-2xl font-extrabold text-stone-900 font-jakarta">Orders</h2>
      <p className="text-sm text-stone-500">Danh sách đơn hàng cần đóng gói và chuyển qua đối tác vận chuyển GHN / GHTK.</p>
    </div>
  );
}

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
  return (
    <SellerLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="products" element={<ProductListingPage />} />
        <Route path="product-listing" element={<ProductListingPage />} />
        <Route path="storefront" element={<SellerStorefront />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="analytics" element={<SellerAnalytics />} />
        <Route path="payouts" element={<SellerPayouts />} />
        <Route path="*" element={<Navigate to="products" replace />} />
      </Routes>
    </SellerLayout>
  );
}
