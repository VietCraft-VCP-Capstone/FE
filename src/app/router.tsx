import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../modules/landing/pages/LandingPage';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { SignupPage } from '../modules/auth/pages/SignupPage';
import { OTPPage } from '../modules/auth/pages/OTPPage';
import { ForgotPasswordPage } from '../modules/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../modules/auth/pages/ResetPasswordPage';
import { AdminPortal } from '../modules/admin/pages/AdminPortal';
import { SellerPortal } from '../modules/seller/pages/SellerPortal';
import { BuyerLayout } from '../modules/buyer/pages/BuyerLayout';
import { BuyerDashboard } from '../modules/buyer/pages/BuyerHomePage';
import { BuyerCartPage } from '../modules/buyer/pages/BuyerCartPage';
import { BuyerCheckoutPage } from '../modules/buyer/pages/BuyerCheckoutPage';
import { BuyerProfilePage } from '../modules/buyer/pages/BuyerProfilePage';
import { BuyerFavoritesPage } from '../modules/buyer/pages/BuyerFavoritesPage';
import { BuyerOrdersPage } from '../modules/buyer/pages/BuyerOrdersPage';
import { BuyerOrderDetailPage } from '../modules/buyer/pages/BuyerOrderDetailPage';
import { BuyerProductDetailPage } from '../modules/buyer/pages/BuyerProductDetailPage';
import { useAuth } from '../modules/auth/hooks/useAuth';

function RolePortal({ user, onLogout }: { user: any; onLogout: () => void }) {
  const role = user?.role?.toLowerCase();
  if (role === 'admin') return <AdminPortal user={user} onLogout={onLogout} />;
  if (role === 'seller') return <SellerPortal user={user} onLogout={onLogout} />;
  return <BuyerLayout user={user} />;
}

export function AppRouter() {
  const { user, login, signup, googleLogin, logout } = useAuth();
  const role = user?.role?.toLowerCase();

  return (
    <Routes>
      {/* Route Trang chủ hoặc Dashboard người mua */}
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
        <Route path="product/:id" element={<BuyerProductDetailPage />} />
      </Route>

      {/* Các route yêu cầu quyền Buyer */}
      <Route
        element={
          user && role === 'buyer' ? (
            <BuyerLayout user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/cart" element={<BuyerCartPage />} />
        <Route path="/checkout" element={<BuyerCheckoutPage />} />
        <Route path="/profile" element={<BuyerProfilePage onLogout={logout} />} />
        <Route path="/favorites" element={<BuyerFavoritesPage />} />
        <Route path="/orders" element={<BuyerOrdersPage />} />
        <Route path="/orders/:id" element={<BuyerOrderDetailPage />} />
        <Route path="/product/:id" element={<BuyerProductDetailPage />} />
      </Route>

      <Route path="/login" element={<LoginPage onLogin={login} onGoogleLogin={googleLogin} user={user} />} />
      <Route path="/signup" element={<SignupPage onSignup={signup} onGoogleLogin={googleLogin} user={user} />} />
      <Route path="/verify" element={<OTPPage onVerified={() => { window.location.href = '/login'; }} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/admin/*"
        element={role === 'admin' ? <AdminPortal user={user} onLogout={logout} /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/seller/*"
        element={<SellerPortal user={user || { name: 'Chủ xưởng Bát Tràng', email: 'seller@vietcraft.vn', role: 'seller' }} onLogout={logout} />}
      />

      <Route
        path="/portal/*"
        element={user ? <RolePortal user={user} onLogout={logout} /> : <Navigate to="/login" replace />}
      />

      <Route
        path="*"
        element={
          user
            ? <Navigate to={role === 'admin' ? '/admin' : role === 'seller' ? '/seller' : '/'} replace />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}
export default AppRouter;
