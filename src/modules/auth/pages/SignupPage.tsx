import React, { useState, useCallback } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

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



/** Đường quay lại sau đăng ký, lấy từ `?next=`. Chỉ nhận path nội bộ (chặn open redirect). */
function safeNext(raw: string | null): string | null {
  if (!raw) return null;
  let decoded: string;
  try { decoded = decodeURIComponent(raw); } catch { return null; }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
  return decoded;
}

export function SignupPage({ onSignup, user }: SignupPageProps) {
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
  const [loading, setLoading] = useState(false);

  if (user) {
    const target = nextUrl ?? (user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller' : '/');
    return <Navigate to={target} replace />;
  }

  const strength = pwStrength(password);


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const n = sanitize(name), em = sanitize(email), pw = sanitize(password);
    if (n.length < 2) { setError('Họ tên phải có ít nhất 2 ký tự.'); return; }
    if (!isValidEmail(em)) { setError('Email không hợp lệ.'); return; }
    if (pw.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự.'); return; }
    if (pw !== confirmPassword) { setError('Mật khẩu xác nhận không khớp.'); return; }
    if (!terms) { setError('Bạn cần đồng ý với điều khoản.'); return; }
    setLoading(true);
    try {
      await onSignup({ name: n, email: em, password: pw });
      navigate('/verify', { state: { email: em, next: nextUrl }, replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Đăng ký thất bại.');
    } finally { setLoading(false); }
  }, [name, email, password, confirmPassword, terms, onSignup, navigate]);

  const pill: React.CSSProperties = {
    width: '100%', border: '1.5px solid #e2e0dd', borderRadius: 50,
    padding: '10px 18px', fontSize: 15, boxSizing: 'border-box', outline: 'none', background: '#fff', color: '#1c1917',
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
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 2 }}>Họ và tên</label>
              <input type="text" autoComplete="name" placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} required disabled={loading} style={pill} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 2 }}>Email</label>
              <input type="email" autoComplete="email" placeholder="nhapemail@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} style={pill} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 2 }}>Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
                  value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} style={{ ...pill, paddingRight: 55 }} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', display: 'flex', padding: 4 }}>
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                    {[1,2,3,4].map(l => <div key={l} style={{ flex: 1, height: 4, borderRadius: 4, background: strength >= l ? SC[strength] : '#e5e7eb', transition: 'background 0.3s' }} />)}
                  </div>
                  <span style={{ fontSize: 14, color: '#78716c' }}>Độ mạnh: <b>{SL[strength]}</b></span>
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: '#44403c', marginBottom: 2 }}>Xác nhận mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPw ? 'text' : 'password'} placeholder="••••••••"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={loading} style={{ ...pill, paddingRight: 55 }} />
                <button type="button" onClick={() => setShowConfirmPw(v => !v)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', display: 'flex', padding: 4 }}>
                  {showConfirmPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: '#57534e', cursor: 'pointer' }}>
              <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} disabled={loading} style={{ accentColor: '#007700', width: 18, height: 18, flexShrink: 0, marginTop: 1 }} />
              <span>Tôi đồng ý với <strong style={{ color: '#330033' }}>Điều khoản dịch vụ</strong> và <strong style={{ color: '#007700' }}>Chính sách bảo mật</strong> của VietCraft.</span>
            </label>
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px' }}>
                <AlertCircle size={17} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 15, color: '#dc2626' }}>{error}</span>
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ background: '#007700', color: '#fff', border: 'none', borderRadius: 50, padding: '12px', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 15, color: '#78716c', marginTop: 12 }}>
            Đã có tài khoản?{' '}<Link to={nextUrl ? `/login?next=${encodeURIComponent(nextUrl)}` : '/login'} style={{ color: '#007700', fontWeight: 700, textDecoration: 'none' }}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
