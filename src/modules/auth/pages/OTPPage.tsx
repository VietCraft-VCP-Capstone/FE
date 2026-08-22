import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2, Check } from 'lucide-react';
import { authService } from '../services/authService';

interface OTPPageProps {
  onVerified: (user: any) => void;
}

const OTP_LEN = 6;
const RESEND_CD = 60;

export function OTPPage({ onVerified }: OTPPageProps) {
  const location = useLocation();
  const email = ((location.state as any)?.email || '') as string;
  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_CD);
  const [resent, setResent] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const handleChange = useCallback((i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[i] = d; setDigits(next); setError('');
    if (d && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
  }, [digits]);

  const handleKeyDown = useCallback((i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }, [digits]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    const next = Array(OTP_LEN).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    refs.current[Math.min(pasted.length, OTP_LEN - 1)]?.focus();
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < OTP_LEN) { setError('Vui lòng nhập đủ 6 chữ số.'); return; }
    if (!email) { setError('Không tìm thấy email. Vui lòng đăng ký lại.'); return; }
    setLoading(true);
    try {
      const data = await authService.verifyOtp(email, code);
      setSuccess(true);
      setTimeout(() => {
        onVerified(data.user);
      }, 2500);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
      setLoading(false);
    }
  }, [digits, email, onVerified]);

  const handleResend = useCallback(async () => {
    if (!email || countdown > 0) return;
    try {
      await authService.resendOtp(email);
      setDigits(Array(OTP_LEN).fill(''));
      setCountdown(RESEND_CD); setResent(true); setError('');
      refs.current[0]?.focus();
      setTimeout(() => setResent(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Không gửi được mã OTP.');
    }
  }, [email, countdown]);

  const maskedEmail = email
    ? email.replace(/^(.)(.+?)(@.+)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.min(b.length, 4))}${c}`)
    : 'email của bạn';

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
          <span>Xác thực OTP thành công! Đang chuyển hướng về trang đăng nhập...</span>
        </div>
      )}
      {/* Left hero */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }} className="auth-hero-panel">
        <img src="/images/hero-otp.jpg" alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 44, left: 36, right: 36 }}>
          <p style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Bảo mật & An toàn.</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0, lineHeight: 1.6 }}>Chúng tôi luôn đặt sự bảo mật tài khoản của bạn lên hàng đầu bằng hệ thống xác thực mã OTP tiêu chuẩn.</p>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 40px', boxSizing: 'border-box', background: '#fff', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 480, margin: 'auto' }}>
          <div style={{ marginBottom: 20 }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 23, fontWeight: 800 }}><span style={{ color: '#007700' }}>Viet</span><span style={{ color: '#330033' }}>Craft</span></span>
            </Link>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#330033', margin: '0 0 8px', textAlign: 'left' }}>Nhập mã xác thực</h1>
          <p style={{ fontSize: 15, color: '#78716c', margin: '0 0 20px', lineHeight: 1.6, textAlign: 'left' }}>
            Vui lòng nhập mã OTP gồm 6 chữ số đã được gửi đến địa chỉ email <strong style={{ color: '#1c1917' }}>{maskedEmail}</strong>.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20, justifyContent: 'flex-start' }}>
              {digits.map((d, i) => (
                <input key={i} ref={el => { refs.current[i] = el; }} type="text" inputMode="numeric"
                  pattern="\d" maxLength={1} value={d}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={loading}
                  aria-label={`Chữ số ${i + 1}`}
                  style={{
                    width: '53px', height: '64px', textAlign: 'center', fontSize: 25, fontWeight: 700,
                    border: `1.5px solid ${d ? '#007700' : '#d1d5db'}`,
                    borderRadius: 8, outline: 'none', background: '#fff',
                    color: '#007700', cursor: 'text', opacity: loading ? 0.6 : 1,
                    transition: 'border-color 0.2s',
                  }}
                />
              ))}
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: 15, margin: '0 0 12px', textAlign: 'left' }}>{error}</p>}
            {resent && <p style={{ color: '#007700', fontSize: 15, margin: '0 0 12px', textAlign: 'left' }}>✓ Đã gửi lại mã OTP vào email.</p>}

            <button type="submit" disabled={loading}
              style={{ width: '100%', background: '#007700', color: '#fff', border: 'none', borderRadius: 50, padding: '12px', fontSize: 17, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Đang xác nhận...' : 'Xác nhận'}
            </button>

            <p style={{ textAlign: 'left', fontSize: 15, color: '#78716c', margin: '0 0 12px' }}>
              Không nhận được mã?{' '}
              {countdown > 0
                ? <span style={{ color: '#007700', fontWeight: 700 }}>Gửi lại mã ({countdown}s)</span>
                : <button type="button" onClick={handleResend} style={{ background: 'none', border: 'none', color: '#007700', fontWeight: 700, cursor: 'pointer', fontSize: 15, padding: 0 }}>Gửi lại mã</button>
              }
            </p>
          </form>

          <div style={{ borderTop: '1px solid #e7e5e4', paddingTop: 16, marginTop: 16, textAlign: 'left' }}>
            <Link to="/login" style={{ fontSize: 15, color: '#78716c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span>← Quay lại</span>
              <span style={{ color: '#007700', fontWeight: 700 }}>Đăng nhập</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OTPPage;
