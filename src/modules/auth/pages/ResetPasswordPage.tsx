import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const passedEmail = (location.state as any)?.email;
    if (passedEmail) {
      setEmail(passedEmail);
    }
  }, [location]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const sanitizedEmail = email.trim();
    const sanitizedCode = code.trim();

    if (!sanitizedEmail) { setError('Vui lòng nhập email.'); return; }
    if (!sanitizedCode || sanitizedCode.length < 6) { setError('Mã OTP không hợp lệ (yêu cầu đầy đủ 6 số).'); return; }
    if (newPassword.length < 6) { setError('Mật khẩu mới phải ngắn nhất 6 ký tự.'); return; }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }

    setLoading(true);
    try {
      await authService.resetPassword({ email: sanitizedEmail, code: sanitizedCode, newPassword });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
      setLoading(false);
    }
  }, [email, code, newPassword, confirmPassword, navigate]);

  const pill: React.CSSProperties = {
    width: '100%', border: '1.5px solid #e2e0dd', borderRadius: 50,
    padding: '10px 16px', fontSize: 13, boxSizing: 'border-box', outline: 'none',
    background: '#fff', color: '#1c1917',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {success && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#d1fae5',
          border: '1.5px solid #34d399',
          color: '#065f46',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          fontWeight: 600,
        }}>
          <Check size={18} style={{ color: '#059669', flexShrink: 0 }} />
          <span>Đặt lại mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...</span>
        </div>
      )}

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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px 40px', boxSizing: 'border-box', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 20 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 20, fontWeight: 800 }}><span style={{ color: '#007700' }}>Viet</span><span style={{ color: '#330033' }}>Craft</span></span>
            </Link>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#330033', margin: '0 0 4px' }}>Đặt lại mật khẩu</h1>
          <p style={{ fontSize: 13, color: '#78716c', margin: '0 0 18px' }}>
            Điền mã OTP đã gửi đến email và thiết lập mật khẩu mới của bạn.
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 5 }}>Email</label>
              <input type="email" placeholder="nhapemail@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading}
                style={pill} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 5 }}>Mã OTP (6 số)</label>
              <input type="text" placeholder="------" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} disabled={loading}
                style={{ ...pill, letterSpacing: 2, textAlign: 'center', fontWeight: 'bold' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 5 }}>Mật khẩu mới</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={loading}
                  style={{ ...pill, paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: 4, display: 'flex' }}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 5 }}>Xác nhận mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading}
                  style={{ ...pill, paddingRight: 48 }} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: 4, display: 'flex' }}>
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 14px' }}>
                <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                background: '#007700', color: '#fff', border: 'none', borderRadius: 50, padding: '11px', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '8px 0 0'
              }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#78716c', marginTop: 16 }}>
            Hủy và quay lại{' '}<Link to="/login" style={{ color: '#007700', fontWeight: 700, textDecoration: 'none' }}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
