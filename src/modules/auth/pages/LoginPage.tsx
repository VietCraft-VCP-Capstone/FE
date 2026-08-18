import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

interface LoginPageProps {
  onLogin: (creds: { email: string; password: string }) => Promise<any>;
  onGoogleLogin: (credential: string) => Promise<any>;
  user: any;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
function getRateLimit(email: string) {
  try {
    const rl = JSON.parse(sessionStorage.getItem('vc_rl') || '{}');
    return rl[email] || { attempts: 0 };
  } catch {
    return { attempts: 0 };
  }
}
function setRateLimit(email: string, s: any) {
  try {
    const rl = JSON.parse(sessionStorage.getItem('vc_rl') || '{}');
    rl[email] = s;
    sessionStorage.setItem('vc_rl', JSON.stringify(rl));
  } catch {}
}
function sanitize(v: string) { return v.replace(/<[^>]*>/g, '').trim(); }
function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export function LoginPage({ onLogin, onGoogleLogin, user }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    const target = user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller' : '/';
    navigate(target, { replace: true });
    return null;
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (res) => {
      setLoading(true); setError('');
      try {
        const loggedUser = await onGoogleLogin(res.access_token);
        const target = loggedUser?.role === 'admin' ? '/admin' : loggedUser?.role === 'seller' ? '/seller' : '/';
        navigate(target, { replace: true });
      }
      catch { setError('Đăng nhập Google thất bại.'); }
      finally { setLoading(false); }
    },
    onError: () => setError('Đăng nhập Google thất bại.'),
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const em = sanitize(email); const pw = sanitize(password);
    if (!isValidEmail(em)) { setError('Email không hợp lệ.'); return; }
    if (pw.length < 6) { setError('Mật khẩu quá ngắn.'); return; }

    const rl = getRateLimit(em);
    if (rl.lockedUntil && Date.now() < rl.lockedUntil) {
      setError(`Tài khoản tạm khóa. Thử lại sau ${Math.ceil((rl.lockedUntil - Date.now()) / 60000)} phút.`); return;
    }

    setLoading(true);
    try {
      await onLogin({ email: em, password: pw });
      setRateLimit(em, { attempts: 0 });
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      const target = storedUser?.role === 'admin' ? '/admin' : storedUser?.role === 'seller' ? '/seller' : '/';
      navigate(target, { replace: true });
    } catch (err: any) {
      const errData = err?.response?.data;
      if (errData?.code === 'USER_NOT_FOUND') {
        setError(errData.error || 'Email hoặc mật khẩu không đúng.');
      } else {
        const attempts = (rl.attempts || 0) + 1;
        if (attempts >= MAX_ATTEMPTS) {
          setRateLimit(em, { attempts, lockedUntil: Date.now() + LOCKOUT_MS });
          setError('Tài khoản tạm khóa 15 phút.');
        } else {
          setRateLimit(em, { attempts });
          setError(`${errData?.error || 'Sai email hoặc mật khẩu.'} (Còn ${MAX_ATTEMPTS - attempts} lần)`);
        }
      }
    } finally { setLoading(false); }
  }, [email, password, onLogin, navigate]);

  const pill: React.CSSProperties = {
    width: '100%', border: '1.5px solid #e2e0dd', borderRadius: 50,
    padding: '10px 16px', fontSize: 13, boxSizing: 'border-box', outline: 'none',
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px 40px', boxSizing: 'border-box', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 20 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 20, fontWeight: 800 }}><span style={{ color: '#007700' }}>Viet</span><span style={{ color: '#330033' }}>Craft</span></span>
            </Link>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#330033', margin: '0 0 4px' }}>Chào mừng trở lại!</h1>
          <p style={{ fontSize: 13, color: '#78716c', margin: '0 0 18px' }}>Đăng nhập để bắt đầu trải nghiệm mua sắm của bạn.</p>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 5 }}>Email</label>
              <input id="lg-email" type="email" autoComplete="email" placeholder="nhapemail@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} style={pill} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 5 }}>Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input id="lg-pw" type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required disabled={loading}
                  style={{ ...pill, paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: 4, display: 'flex' }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#57534e', cursor: 'pointer' }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: '#007700', width: 16, height: 16 }} />
                Ghi nhớ tài khoản
              </label>
              <Link to="/forgot-password" style={{ fontSize: 13, color: '#007700', fontWeight: 600, textDecoration: 'none' }}>Quên mật khẩu?</Link>
            </div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 14px' }}>
                <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ background: '#007700', color: '#fff', border: 'none', borderRadius: 50, padding: '11px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e7e5e4' }} /><span style={{ fontSize: 12, color: '#a8a29e' }}>Hoặc</span><div style={{ flex: 1, height: 1, background: '#e7e5e4' }} />
          </div>

          <button type="button" onClick={() => googleLogin()} disabled={loading}
            style={{ width: '100%', background: '#fff', border: '1.5px solid #e2e0dd', borderRadius: 50, padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#1c1917', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <GoogleIcon /> Đăng nhập với Google
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#78716c', marginTop: 16 }}>
            Chưa có tài khoản?{' '}<Link to="/signup" style={{ color: '#007700', fontWeight: 700, textDecoration: 'none' }}>Đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

