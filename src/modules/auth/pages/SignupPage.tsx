import React, { useState, useCallback } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { getApiErrorMessage } from '../../../infrastructure/api/interceptors';

interface SignupPageProps {
  onSignup: (data: { name: string; email: string; password: string }) => Promise<any>;
  onGoogleLogin?: (credential: string) => Promise<any>;
  user: any;
}

function sanitize(v: string) { return v.replace(/<[^>]*>/g, '').trim(); }
function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function pwStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const SC = ['#e5e7eb', '#f87171', '#fb923c', '#facc15', '#22c55e'];
const SL = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];

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

export function SignupPage({ onSignup, onGoogleLogin, user }: SignupPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = safeNext(searchParams.get('next'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<{
    name?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
    terms?: boolean;
  }>({});
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  if (user) {
    const target = getRedirectTarget(user, nextUrl);
    return <Navigate to={target} replace />;
  }

  const strength = pwStrength(password);

  const validateName = (val: string): string | undefined => {
    const n = sanitize(val);
    if (!n) return 'Vui lòng nhập họ và tên.';
    if (n.length < 2) return 'Họ và tên phải có ít nhất 2 ký tự.';
    return undefined;
  };

  const validateEmail = (val: string): string | undefined => {
    const em = sanitize(val);
    if (!em) return 'Vui lòng nhập địa chỉ email.';
    if (!isValidEmail(em)) return 'Email không đúng định dạng (ví dụ: name@example.com).';
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) return 'Vui lòng tạo mật khẩu.';
    if (val.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
    return undefined;
  };

  const validateConfirmPassword = (val: string, currentPw: string): string | undefined => {
    if (!val) return 'Vui lòng xác nhận lại mật khẩu.';
    if (val !== currentPw) return 'Mật khẩu xác nhận không khớp.';
    return undefined;
  };

  const validateTerms = (checked: boolean): string | undefined => {
    if (!checked) return 'Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.';
    return undefined;
  };

  const handleNameBlur = () => {
    setTouched(prev => ({ ...prev, name: true }));
    setFieldErrors(prev => ({ ...prev, name: validateName(name) }));
  };

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    setFieldErrors(prev => ({ ...prev, email: validateEmail(email) }));
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    setFieldErrors(prev => ({ ...prev, password: validatePassword(password) }));
  };

  const handleConfirmPasswordBlur = () => {
    setTouched(prev => ({ ...prev, confirmPassword: true }));
    setFieldErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, password) }));
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (error) setError('');
    if (touched.name || fieldErrors.name) {
      setFieldErrors(prev => ({ ...prev, name: validateName(val) }));
    }
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
    if ((touched.confirmPassword || fieldErrors.confirmPassword) && confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, val) }));
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (error) setError('');
    if (touched.confirmPassword || fieldErrors.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(val, password) }));
    }
  };

  const handleTermsChange = (checked: boolean) => {
    setTerms(checked);
    if (error) setError('');
    if (touched.terms || fieldErrors.terms) {
      setFieldErrors(prev => ({ ...prev, terms: validateTerms(checked) }));
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (res) => {
      if (!onGoogleLogin) return;
      setLoading(true);
      setError('');
      try {
        const loggedUser = await onGoogleLogin(res.access_token);
        const target = getRedirectTarget(loggedUser, nextUrl);
        navigate(target, { replace: true });
      } catch (err: any) {
        setError(getApiErrorMessage(err, 'Đăng ký bằng Google không thành công. Vui lòng thử lại.'));
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Đăng ký bằng Google không thành công hoặc đã bị người dùng hủy.'),
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, password: true, confirmPassword: true, terms: true });

    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword, password);
    const termsErr = validateTerms(terms);

    if (nameErr) errors.name = nameErr;
    if (emailErr) errors.email = emailErr;
    if (passwordErr) errors.password = passwordErr;
    if (confirmPasswordErr) errors.confirmPassword = confirmPasswordErr;
    if (termsErr) errors.terms = termsErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Vui lòng kiểm tra lại các thông tin đăng ký bên dưới.');
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const n = sanitize(name);
      const em = sanitize(email);
      await onSignup({ name: n, email: em, password });
      navigate('/verify', { state: { email: em, next: nextUrl }, replace: true });
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Đăng ký tài khoản không thành công. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [name, email, password, confirmPassword, terms, onSignup, navigate, nextUrl]);

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
        <img src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&q=80&w=900" alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,30,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 44, left: 36, right: 36 }}>
          <p style={{ color: '#fff', fontSize: 32, fontWeight: 800, lineHeight: 1.2, margin: '0 0 10px' }}>Tìm kiếm mảnh ghép<br />độc đáo.</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>Tham gia VietCraft để mua sắm hàng ngàn sản phẩm cá nhân hóa, lưu lại các thiết kế yêu thích và ủng hộ nhà sáng tạo Việt.</p>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px 40px', boxSizing: 'border-box', background: '#fff', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 480, margin: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 30, fontWeight: 800 }}><span style={{ color: '#007700' }}>Viet</span><span style={{ color: '#330033' }}>Craft</span></span>
            </Link>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#330033', margin: '0 0 4px' }}>Tạo tài khoản</h1>
          <p style={{ fontSize: 14, color: '#78716c', margin: '0 0 12px' }}>Đăng ký miễn phí để bắt đầu trải nghiệm mua sắm tuyệt vời.</p>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label htmlFor="su-name" style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 3 }}>Họ và tên</label>
              <input
                id="su-name"
                type="text"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                onBlur={handleNameBlur}
                disabled={loading}
                style={getInputStyle(!!fieldErrors.name)}
              />
              {fieldErrors.name && (
                <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 0 12px' }}>{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="su-email" style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 3 }}>Email</label>
              <input
                id="su-email"
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
              <label htmlFor="su-pw" style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 3 }}>Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="su-pw"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  onBlur={handlePasswordBlur}
                  disabled={loading}
                  style={{ ...getInputStyle(!!fieldErrors.password), paddingRight: 55 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', display: 'flex', padding: 4 }}
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 0 12px' }}>{fieldErrors.password}</p>
              )}
              {password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                    {[1, 2, 3, 4].map(l => (
                      <div key={l} style={{ flex: 1, height: 4, borderRadius: 4, background: strength >= l ? SC[strength] : '#e5e7eb', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 13, color: '#78716c' }}>Độ mạnh: <b style={{ color: SC[strength] }}>{SL[strength]}</b></span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="su-cpw" style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 3 }}>Xác nhận mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="su-cpw"
                  type={showConfirmPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => handleConfirmPasswordChange(e.target.value)}
                  onBlur={handleConfirmPasswordBlur}
                  disabled={loading}
                  style={{ ...getInputStyle(!!fieldErrors.confirmPassword), paddingRight: 55 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(v => !v)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', display: 'flex', padding: 4 }}
                  aria-label={showConfirmPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 0 12px' }}>{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#57534e', cursor: 'pointer', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={e => handleTermsChange(e.target.checked)}
                  disabled={loading}
                  style={{ accentColor: '#007700', width: 18, height: 18, flexShrink: 0, marginTop: 1 }}
                />
                <span>Tôi đồng ý với <strong style={{ color: '#330033' }}>Điều khoản dịch vụ</strong> và <strong style={{ color: '#007700' }}>Chính sách bảo mật</strong> của VietCraft.</span>
              </label>
              {fieldErrors.terms && (
                <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 0 28px' }}>{fieldErrors.terms}</p>
              )}
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginTop: 2 }}>
                <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 14, color: '#dc2626', lineHeight: 1.45 }}>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ background: '#007700', color: '#fff', border: 'none', borderRadius: 50, padding: '12px', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
            </button>
          </form>

          {onGoogleLogin && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#e7e5e4' }} /><span style={{ fontSize: 14, color: '#a8a29e' }}>Hoặc</span><div style={{ flex: 1, height: 1, background: '#e7e5e4' }} />
              </div>

              <button type="button" onClick={() => googleLogin()} disabled={loading}
                style={{ width: '100%', background: '#fff', border: '1.5px solid #e2e0dd', borderRadius: 50, padding: '10px 18px', fontSize: 15, fontWeight: 600, color: '#1c1917', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <GoogleIcon /> Đăng ký nhanh với Google
              </button>
            </>
          )}

          <p style={{ textAlign: 'center', fontSize: 15, color: '#78716c', marginTop: 14 }}>
            Đã có tài khoản?{' '}<Link to={nextUrl ? `/login?next=${encodeURIComponent(nextUrl)}` : '/login'} style={{ color: '#007700', fontWeight: 700, textDecoration: 'none' }}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
