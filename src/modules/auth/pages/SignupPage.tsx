import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

interface SignupPageProps {
  onSignup: (data: { name: string; email: string; password: string }) => Promise<any>;
  onGoogleLogin: (credential: string) => Promise<any>;
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
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export function SignupPage({ onSignup, onGoogleLogin, user }: SignupPageProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    const target = user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller' : '/';
    navigate(target, { replace: true });
    return null;
  }

  const strength = pwStrength(password);

  const googleLogin = useGoogleLogin({
    onSuccess: async (res) => {
      setLoading(true); setError('');
      try {
        const loggedUser = await onGoogleLogin(res.access_token);
        const target = loggedUser?.role === 'admin' ? '/admin' : loggedUser?.role === 'seller' ? '/seller' : '/';
        navigate(target, { replace: true });
      }
      catch { setError('Đăng ký Google thất bại.'); }
      finally { setLoading(false); }
    },
    onError: () => setError('Đăng ký Google thất bại.'),
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const n = sanitize(name), em = sanitize(email), pw = sanitize(password);
    if (n.length < 2) { setError('Họ tên phải có ít nhất 2 ký tự.'); return; }
    if (!isValidEmail(em)) { setError('Email không hợp lệ.'); return; }
    if (pw.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự.'); return; }
    if (!terms) { setError('Bạn cần đồng ý với điều khoản.'); return; }
    setLoading(true);
    try {
      await onSignup({ name: n, email: em, password: pw });
      navigate('/verify', { state: { email: em }, replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Đăng ký thất bại.');
    } finally { setLoading(false); }
  }, [name, email, password, terms, onSignup, navigate]);

  const pill: React.CSSProperties = {
    width: '100%', border: '1.5px solid #e2e0dd', borderRadius: 50,
    padding: '10px 16px', fontSize: 13, boxSizing: 'border-box', outline: 'none', background: '#fff', color: '#1c1917',
  };

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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px 40px', boxSizing: 'border-box', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 18 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 20, fontWeight: 800 }}><span style={{ color: '#007700' }}>Viet</span><span style={{ color: '#330033' }}>Craft</span></span>
            </Link>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#330033', margin: '0 0 4px' }}>Tạo tài khoản</h1>
          <p style={{ fontSize: 13, color: '#78716c', margin: '0 0 16px' }}>Đăng ký miễn phí để bắt đầu trải nghiệm mua sắm tuyệt vời.</p>

          <button type="button" onClick={() => googleLogin()} disabled={loading}
            style={{ width: '100%', background: '#fff', border: '1.5px solid #e2e0dd', borderRadius: 50, padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#1c1917', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
            <GoogleIcon /> Đăng ký với Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#e7e5e4' }} /><span style={{ fontSize: 12, color: '#a8a29e' }}>Hoặc đăng ký bằng email</span><div style={{ flex: 1, height: 1, background: '#e7e5e4' }} />
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 4 }}>Họ và tên</label>
              <input type="text" autoComplete="name" placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} required disabled={loading} style={pill} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 4 }}>Email</label>
              <input type="email" autoComplete="email" placeholder="nhapemail@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} style={pill} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#44403c', marginBottom: 4 }}>Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
                  value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} style={{ ...pill, paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', display: 'flex' }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                    {[1,2,3,4].map(l => <div key={l} style={{ flex: 1, height: 4, borderRadius: 4, background: strength >= l ? SC[strength] : '#e5e7eb', transition: 'background 0.3s' }} />)}
                  </div>
                  <span style={{ fontSize: 12, color: '#78716c' }}>Độ mạnh: <b>{SL[strength]}</b></span>
                </div>
              )}
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#57534e', cursor: 'pointer' }}>
              <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} disabled={loading} style={{ accentColor: '#007700', width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
              <span>Tôi đồng ý với <strong style={{ color: '#330033' }}>Điều khoản dịch vụ</strong> và <strong style={{ color: '#007700' }}>Chính sách bảo mật</strong> của VietCraft.</span>
            </label>
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 14px' }}>
                <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ background: '#007700', color: '#fff', border: 'none', borderRadius: 50, padding: '11px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#78716c', marginTop: 12 }}>
            Đã có tài khoản?{' '}<Link to="/login" style={{ color: '#007700', fontWeight: 700, textDecoration: 'none' }}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
