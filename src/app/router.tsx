import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from '../modules/landing/pages/LandingPage';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { SignupPage } from '../modules/auth/pages/SignupPage';
import { OTPPage } from '../modules/auth/pages/OTPPage';
import { ForgotPasswordPage } from '../modules/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../modules/auth/pages/ResetPasswordPage';
import { AdminPortal } from '../modules/admin/pages/AdminPortal';
import { SellerPortal } from '../modules/seller/pages/SellerPortal';
import { SellerRegisterPage } from '../modules/seller/pages/SellerRegisterPage';
import { BuyerLayout } from '../modules/buyer/pages/BuyerLayout';
import { BuyerDashboard } from '../modules/buyer/pages/BuyerHomePage';
import { BuyerCartPage } from '../modules/buyer/pages/BuyerCartPage';
import { BuyerCheckoutPage } from '../modules/buyer/pages/BuyerCheckoutPage';
import { BuyerProfilePage } from '../modules/buyer/pages/BuyerProfilePage';
import { BuyerFavoritesPage } from '../modules/buyer/pages/BuyerFavoritesPage';
import { BuyerOrdersPage } from '../modules/buyer/pages/BuyerOrdersPage';
import { BuyerOrderDetailPage } from '../modules/buyer/pages/BuyerOrderDetailPage';
import { BuyerProductDetailPage } from '../modules/buyer/pages/BuyerProductDetailPage';
import { BuyerShopPage } from '../modules/buyer/pages/BuyerShopPage';
import { BuyerNotificationsPage } from '../modules/buyer/pages/BuyerNotificationsPage';
import { useAuth } from '../modules/auth/hooks/useAuth';

function RolePortal({ user, onLogout }: { user: any; onLogout: () => void }) {
  const role = user?.role?.toLowerCase();
  if (role === 'admin') return <AdminPortal user={user} onLogout={onLogout} />;
  if (role === 'seller') return <SellerPortal user={user} onLogout={onLogout} />;
  return <BuyerLayout user={user} />;
}

function RequireRole({ user, roles, children }: { user: any; roles: string[]; children: React.ReactNode }) {
  const location = useLocation();
  const role = user?.role?.toLowerCase();

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (!roles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function RequireAuth({ user }: { user: any }) {
  const location = useLocation();

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <BuyerLayout user={user} />;
}

function VerifyRoute() {
  const location = useLocation();
  const next = (location.state as any)?.next as string | undefined;
  const target =
    next && next.startsWith('/') && !next.startsWith('//')
      ? `/login?next=${encodeURIComponent(next)}`
      : '/login';

  return <OTPPage onVerified={() => { window.location.href = target; }} />;
}

export function AppRouter() {
  const { user, loading, login, signup, googleLogin, logout } = useAuth();
  const role = user?.role?.toLowerCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Đang khôi phục phiên...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Trang chủ: khách vãng lai thấy LandingPage, đã đăng nhập thì theo role */}
      <Route
        path="/"
        element={
          user ? (
            role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : role === 'seller' ? (
              <Navigate to="/seller" replace />
            ) : (
              <BuyerLayout user={user} />
            )
          ) : (
            <LandingPage user={user} onLogout={logout} />
          )
        }
      >
        <Route index element={<BuyerDashboard user={user} onLogout={logout} />} />
      </Route>
      <Route element={<BuyerLayout user={user ?? null} />}>
        <Route path="/product/:id" element={<BuyerProductDetailPage />} />
        <Route path="/cart" element={<BuyerCartPage />} />
        <Route path="/shop/:id" element={<BuyerShopPage />} />
      </Route>

      {/* CẦN ĐĂNG NHẬP — tường chắn duy nhất, bắt đầu từ bước thanh toán */}
      <Route element={<RequireAuth user={user} />}>
        <Route path="/checkout" element={<BuyerCheckoutPage />} />
        <Route path="/profile" element={<BuyerProfilePage onLogout={logout} />} />
        <Route path="/favorites" element={<BuyerFavoritesPage />} />
        <Route path="/orders" element={<BuyerOrdersPage />} />
        <Route path="/orders/:id" element={<BuyerOrderDetailPage />} />
        <Route path="/notifications" element={<BuyerNotificationsPage />} />
      </Route>

      <Route path="/login" element={<LoginPage onLogin={login} onGoogleLogin={googleLogin} user={user} />} />
      <Route path="/signup" element={<SignupPage onSignup={signup} onGoogleLogin={googleLogin} user={user} />} />
      <Route path="/verify" element={<VerifyRoute />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/admin/*"
        element={
          <RequireRole user={user} roles={['admin']}>
            <AdminPortal user={user} onLogout={logout} />
          </RequireRole>
        }
      />

      <Route
        path="/seller/register"
        element={
          user ? <SellerRegisterPage /> : <Navigate to="/login?next=%2Fseller%2Fregister" replace />
        }
      />

      <Route
        path="/seller/*"
        element={
          <RequireRole user={user} roles={['seller', 'admin']}>
            <SellerPortal user={user} onLogout={logout} />
          </RequireRole>
        }
      />

      <Route
        path="/portal/*"
        element={user ? <RolePortal user={user} onLogout={logout} /> : <Navigate to="/login" replace />}
      />

      <Route
        path="*"
        element={
          <Navigate to={role === 'admin' ? '/admin' : role === 'seller' ? '/seller' : '/'} replace />
        }
      />
    </Routes>
  );
}
export default AppRouter;
