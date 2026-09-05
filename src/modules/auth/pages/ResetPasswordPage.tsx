import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { authService } from '../services/authService';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const sanitizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const sanitizedCode = useMemo(() => code.trim(), [code]);

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sanitizedEmail || !sanitizedCode || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    if (sanitizedCode.length !== 6) {
      setError('Mã OTP phải có đúng 6 chữ số.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

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
    padding: '10px 18px', fontSize: 15, boxSizing: 'border-box', outline: 'none',
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 40px', boxSizing: 'border-box', background: '#fff', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 480, margin: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 30, fontWeight: 800 }}><span style={{ color: '#007700' }}>Viet</span><span style={{ color: '#330033' }}>Craft</span></span>
            </Link>
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#330033', margin: '0 0 4px' }}>Đặt lại mật khẩu</h1>
          <p style={{ fontSize: 14, color: '#78716c', margin: '0 0 12px' }}>
            Điền mã OTP đã gửi đến email và thiết lập mật khẩu mới của bạn.
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 2 }}>Email</label>
              <input type="email" placeholder="nhapemail@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading}
                style={pill} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 2 }}>Mã OTP (6 số)</label>
              <input type="text" placeholder="------" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} disabled={loading}
                style={{ ...pill, letterSpacing: 2, textAlign: 'center', fontWeight: 'bold' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 2 }}>Mật khẩu mới</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={loading}
                  style={{ ...pill, paddingRight: 55 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: 4, display: 'flex' }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 2 }}>Xác nhận mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading}
                  style={{ ...pill, paddingRight: 55 }} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: 4, display: 'flex' }}>
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
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
              {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 15, color: '#78716c', marginTop: 12 }}>
            Hủy và quay lại{' '}<Link to="/login" style={{ color: '#007700', fontWeight: 700, textDecoration: 'none' }}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}


