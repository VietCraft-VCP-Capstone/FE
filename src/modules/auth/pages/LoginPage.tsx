import React, { useState, useCallback } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';

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
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  let decoded: string;
  try { decoded = decodeURIComponent(raw); } catch { return null; }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
  return decoded;
}

function getRedirectTarget(u: any, nextUrl: string | null): string {
  const role = u?.role?.toLowerCase();
  if (role === 'admin') {
    return (nextUrl && nextUrl.startsWith('/admin')) ? nextUrl : '/admin';
  }
  if (role === 'seller') {
    return (nextUrl && nextUrl.startsWith('/seller')) ? nextUrl : '/seller';
  }
  return nextUrl ?? '/';
}

export function LoginPage({ onLogin, onGoogleLogin, user }: LoginPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = safeNext(searchParams.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  if (user) {
    const target = getRedirectTarget(user, nextUrl);
    return <Navigate to={target} replace />;
  }

  const validateEmail = (val: string): string | undefined => {
    const em = sanitize(val);
    if (!em) return 'Vui lòng nhập địa chỉ email.';
    if (!isValidEmail(em)) return 'Email không đúng định dạng (ví dụ: name@example.com).';
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) return 'Vui lòng nhập mật khẩu.';
    return undefined;
  };

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    const err = validateEmail(email);
    setFieldErrors(prev => ({ ...prev, email: err }));
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    const err = validatePassword(password);
    setFieldErrors(prev => ({ ...prev, password: err }));
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (error) setError('');
    if (touched.email || fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: validateEmail(val) }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (error) setError('');
    if (touched.password || fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: validatePassword(val) }));
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (res) => {
      setLoading(true);
      setError('');
      try {
        const loggedUser = await onGoogleLogin(res.access_token);
        const target = getRedirectTarget(loggedUser, nextUrl);
        navigate(target, { replace: true });
      } catch (err: any) {
        setError(getApiErrorMessage(err, 'Đăng nhập Google không thành công. Vui lòng thử lại.'));
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Đăng nhập Google thất bại hoặc đã bị người dùng hủy.'),
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTouched({ email: true, password: true });
    
    const em = sanitize(email);
    const pw = password;
    const errors: { email?: string; password?: string } = {};
    const emErr = validateEmail(em);
    const pwErr = validatePassword(pw);

    if (emErr) errors.email = emErr;
    if (pwErr) errors.password = pwErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Vui lòng kiểm tra lại thông tin đăng nhập.');
      return;
    }

    setFieldErrors({});

    const rl = getRateLimit(em);
    if (rl.lockedUntil && Date.now() < rl.lockedUntil) {
      const waitMin = Math.ceil((rl.lockedUntil - Date.now()) / 60000);
      setError(`Tài khoản tạm khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau ${waitMin} phút.`);
      return;
    }

    setLoading(true);
    try {
      await onLogin({ email: em, password: pw });
      setRateLimit(em, { attempts: 0 });
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      const target = getRedirectTarget(storedUser, nextUrl);
      navigate(target, { replace: true });
    } catch (err: any) {
      const errData = err?.response?.data;
      const code = errData?.code;

      if (code === 'USER_NOT_VERIFIED') {
        setError('Tài khoản chưa được kích hoạt. Đang chuyển hướng bạn đến trang xác thực mã OTP...');
        setTimeout(() => {
          navigate('/verify', { state: { email: em }, replace: true });
        }, 2000);
      } else if (code === 'ACCOUNT_LOCKED') {
        setError(errData.error || 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      } else if (code === 'USER_NOT_FOUND') {
        setError(errData.error || 'Email hoặc mật khẩu không chính xác.');
      } else if (code === 'INVALID_PASSWORD') {
        const attempts = (rl.attempts || 0) + 1;
        if (attempts >= MAX_ATTEMPTS) {
          setRateLimit(em, { attempts, lockedUntil: Date.now() + LOCKOUT_MS });
          setError('Bạn đã nhập sai mật khẩu 5 lần. Tài khoản tạm thời bị khóa trong 15 phút.');
        } else {
          setRateLimit(em, { attempts });
          const remaining = MAX_ATTEMPTS - attempts;
          setError(`Mật khẩu không chính xác. Bạn còn ${remaining} lần thử trước khi bị tạm khóa.`);
        }
      } else {
        setError(getApiErrorMessage(err, 'Đăng nhập không thành công. Vui lòng thử lại.'));
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, onLogin, navigate, nextUrl]);

  const getInputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    border: `1.5px solid ${hasError ? '#ef4444' : '#e2e0dd'}`,
    borderRadius: 50,
    padding: '10px 18px',
    fontSize: 15,
    boxSizing: 'border-box',
    outline: 'none',
    background: '#fff',
    color: '#1c1917',
    transition: 'border-color 0.2s',
  });

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
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#330033', margin: '0 0 4px' }}>Chào mừng trở lại!</h1>
          <p style={{ fontSize: 15, color: '#78716c', margin: '0 0 12px' }}>Đăng nhập để bắt đầu trải nghiệm mua sắm của bạn.</p>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label htmlFor="lg-email" style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 4 }}>Email</label>
              <input
                id="lg-email"
                type="email"
                autoComplete="email"
                placeholder="nhapemail@example.com"
                value={email}
                onChange={e => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                disabled={loading}
                style={getInputStyle(!!fieldErrors.email)}
              />
              {fieldErrors.email && (
                <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 0 12px' }}>{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="lg-pw" style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 4 }}>Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="lg-pw"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  onBlur={handlePasswordBlur}
                  disabled={loading}
                  style={{ ...getInputStyle(!!fieldErrors.password), paddingRight: 55 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: 4, display: 'flex' }}
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 0 12px' }}>{fieldErrors.password}</p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: '#57534e', cursor: 'pointer' }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: '#007700', width: 18, height: 18 }} />
                Ghi nhớ tài khoản
              </label>
              <Link to="/forgot-password" style={{ fontSize: 15, color: '#007700', fontWeight: 600, textDecoration: 'none' }}>Quên mật khẩu?</Link>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px' }}>
                <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 14, color: '#dc2626', lineHeight: 1.45 }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ background: '#007700', color: '#fff', border: 'none', borderRadius: 50, padding: '12px', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e7e5e4' }} /><span style={{ fontSize: 14, color: '#a8a29e' }}>Hoặc</span><div style={{ flex: 1, height: 1, background: '#e7e5e4' }} />
          </div>

          <button type="button" onClick={() => googleLogin()} disabled={loading}
            style={{ width: '100%', background: '#fff', border: '1.5px solid #e2e0dd', borderRadius: 50, padding: '10px 18px', fontSize: 15, fontWeight: 600, color: '#1c1917', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <GoogleIcon /> Đăng nhập với Google
          </button>

          <p style={{ textAlign: 'center', fontSize: 15, color: '#78716c', marginTop: 14 }}>
            Chưa có tài khoản?{' '}<Link to={nextUrl ? `/signup?next=${encodeURIComponent(nextUrl)}` : '/signup'} style={{ color: '#007700', fontWeight: 700, textDecoration: 'none' }}>Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
