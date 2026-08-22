import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const sanitizedEmail = email.trim();
    if (!sanitizedEmail) {
      setError('Vui lòng nhập email.');
      return;
    }
    setLoading(true);
    try {
      await authService.forgotPassword(sanitizedEmail);
      navigate('/reset-password', { state: { email: sanitizedEmail } });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [email, navigate]);

  const pill: React.CSSProperties = {
    width: '100%', border: '1.5px solid #e2e0dd', borderRadius: 50,
    padding: '10px 18px', fontSize: 15, boxSizing: 'border-box', outline: 'none',
    background: '#fff', color: '#1c1917',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Left hero */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }} className="auth-hero-panel">
        <img src="/images/hero-login.png" alt="VietCraft"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,30,0,0.72) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 44, left: 36, right: 36 }}>
          <p style={{ color: '#fff', fontSize: 30, fontWeight: 800, lineHeight: 1.25, margin: '0 0 10px' }}>Biến Ý tưởng thành<br />doanh thu.</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>Nền tảng E-commerce thông minh tích hợp AI. Tối ưu thiết kế, tự động hóa bán hàng.</p>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 40px', boxSizing: 'border-box', background: '#fff', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 480, margin: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 30, fontWeight: 800 }}><span style={{ color: '#007700' }}>Viet</span><span style={{ color: '#330033' }}>Craft</span></span>
            </Link>
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#330033', margin: '0 0 4px' }}>Quên mật khẩu?</h1>
          <p style={{ fontSize: 14, color: '#78716c', margin: '0 0 12px' }}>
            Nhập email tài khoản của bạn để nhận mã xác thực OTP đặt lại mật khẩu.
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 2 }}>Email</label>
              <input type="email" placeholder="nhapemail@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading}
                style={pill} />
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px' }}>
                <AlertCircle size={17} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 15, color: '#dc2626' }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                background: '#007700', color: '#fff', border: 'none', borderRadius: 50, padding: '12px', fontSize: 16, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '8px 0 0'
              }}>
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 15, color: '#78716c', marginTop: 12 }}>
            Quay lại{' '}<Link to="/login" style={{ color: '#007700', fontWeight: 700, textDecoration: 'none' }}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
