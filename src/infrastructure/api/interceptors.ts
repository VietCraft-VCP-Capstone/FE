// Giữ nguyên đường import cũ. Interceptor (Bearer token + xử lý 401) nay đăng ký
// ngay trong client.ts, nên module import './client' trực tiếp cũng được bảo vệ.
import api, { getApiErrorMessage, isLoggedIn } from './client';

export { getApiErrorMessage, isLoggedIn };
export default api;
