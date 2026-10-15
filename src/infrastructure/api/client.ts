import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8080/api' : '/api'),
    headers: {
        'Content-Type': 'application/json'
    }
});

const PUBLIC_AUTH_ROUTE = /\/auth\/(login|signup|verify-otp|resend-otp|google|forgot-password|reset-password)\/?$/;
function readToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') return null;
    return token;
}

export function isLoggedIn(): boolean {
    return readToken() !== null;
}

export function getApiErrorMessage(err: any, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại.'): string {
    const data = err?.response?.data;
    // Lỗi validate của BE: { error: 'Dữ liệu không hợp lệ', errors: [...] } — lý do thật nằm trong errors.
    const details = Array.isArray(data?.errors) ? data.errors.filter((e: unknown) => typeof e === 'string' && e) : [];
    if (details.length) return `${typeof data.error === 'string' && data.error ? data.error + ': ' : ''}${details.join('; ')}`;
    if (data && typeof data.error === 'string' && data.error) return data.error;
    if (data && typeof data.message === 'string' && data.message) return data.message;
    if (typeof data === 'string' && data) return data;
    return fallback;
}

api.interceptors.request.use((config) => {
    const token = readToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = String(error.config?.url || '');
        // Chỉ coi là hết phiên khi request có gửi token; khách vãng lai gặp 401 ở một
        // request phụ (vd. mã giảm giá trên trang shop) thì không bị đẩy sang trang đăng nhập.
        const sentToken = Boolean(error.config?.headers?.Authorization);
        if (error.response?.status === 401 && sentToken && !PUBLIC_AUTH_ROUTE.test(url)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
