import api from './client';

// Request interceptor: attach JWT + normalize
api.interceptors.request.use((config) => {
    let token = localStorage.getItem('token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Response interceptor: only a genuine 401 (invalid/expired token) clears the
// session. A 403 means "authenticated but insufficient role" — wiping the
// session and bouncing to /login there just creates a redirect loop, so we let
// the calling page surface the error instead.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
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
