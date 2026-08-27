import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Các route auth công khai: 401 ở đây nghĩa là "sai mật khẩu / sai mã OTP",
// KHÔNG phải "token hỏng" — không được xoá session hay reload về /login.
const PUBLIC_AUTH_ROUTE = /\/auth\/(login|signup|verify-otp|resend-otp|google|forgot-password|reset-password)\/?$/;

/** Token rác ('undefined'/'null' do lỡ setItem giá trị không phải chuỗi) coi như chưa đăng nhập. */
function readToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') return null;
    return token;
}

/**
 * Có phiên đăng nhập hợp lệ không. Dùng để KHÔNG gọi các API cần auth khi đang là
 * khách vãng lai — gọi rồi dính 401 thì interceptor bên dưới sẽ đá thẳng về /login,
 * biến trang công khai thành tường đăng nhập.
 */
export function isLoggedIn(): boolean {
    return readToken() !== null;
}

/**
 * BE trả lỗi dạng { error: '...' } (một số route kèm { success: false }).
 * Dùng hàm này ở mọi catch để hiện đúng message của BE thay vì câu chung chung.
 */
export function getApiErrorMessage(err: any, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại.'): string {
    const data = err?.response?.data;
    if (data && typeof data.error === 'string' && data.error) return data.error;
    if (data && typeof data.message === 'string' && data.message) return data.message;
    if (typeof data === 'string' && data) return data;
    return fallback;
}

// Request: gắn Bearer token cho MỌI request. Đăng ký ngay tại client để module nào
// import './client' trực tiếp cũng có token — hầu hết route BE giờ đều authenticate.
api.interceptors.request.use((config) => {
    const token = readToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Response: chỉ 401 thật (token sai/hết hạn) mới xoá session. 403 là "đã đăng nhập
// nhưng sai role" — xoá session rồi đá về /login ở đó chỉ tạo vòng lặp redirect,
// nên để trang gọi tự hiển thị lỗi.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = String(error.config?.url || '');
        if (error.response?.status === 401 && !PUBLIC_AUTH_ROUTE.test(url)) {
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
