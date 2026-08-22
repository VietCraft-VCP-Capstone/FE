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
import { CartPage } from '../modules/buyer/pages/CartPage';
import { FavoritesPage } from '../modules/buyer/pages/FavoritesPage';
import { useAuth } from '../modules/auth/hooks/useAuth';

function RolePortal({ user, onLogout }: { user: any; onLogout: () => void }) {
  const role = user?.role?.toLowerCase();
  if (role === 'admin') return <AdminPortal user={user} onLogout={onLogout} />;
  if (role === 'seller') return <SellerPortal user={user} onLogout={onLogout} />;
  return <BuyerLayout user={user} onLogout={onLogout} />;
}

export function AppRouter() {
  const { user, login, signup, googleLogin, logout } = useAuth();
  const role = user?.role?.toLowerCase();

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : role === 'seller' ? (
              <Navigate to="/seller" replace />
            ) : (
              <BuyerLayout user={user} onLogout={logout} />
            )
          ) : (
            <LandingPage user={user} onLogout={logout} />
          )
        }
      />
      <Route path="/login" element={<LoginPage onLogin={login} onGoogleLogin={googleLogin} user={user} />} />
      <Route path="/signup" element={<SignupPage onSignup={signup} onGoogleLogin={googleLogin} user={user} />} />
      <Route path="/verify" element={<OTPPage onVerified={() => { window.location.href = '/login'; }} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/cart" element={<CartPage onBackToShop={() => window.location.href = '/'} />} />
      <Route path="/favorites" element={<FavoritesPage />} />

      <Route
        path="/admin/*"
        element={role === 'admin' ? <AdminPortal user={user} onLogout={logout} /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/seller/*"
        element={role === 'seller' ? <SellerPortal user={user} onLogout={logout} /> : <Navigate to="/login" replace />}
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
