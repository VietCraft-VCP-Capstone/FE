import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { cartService } from '../../order/services/cartService';
import { User } from '../types';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            try {
                const parsed = JSON.parse(storedUser);
                // Normalize role to lowercase if stored from old session
                const normalized: User = {
                    ...parsed,
                    role: parsed.role?.toLowerCase?.() || parsed.role,
                };
                setUser(normalized);
            } catch { localStorage.clear(); }
        }
        setLoading(false);
    }, []);

    const persistSession = async (data: { token: string; user: User }) => {
        const normalizedUser: User = {
            ...data.user,
            role: data.user.role?.toLowerCase?.() || data.user.role,
        };
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setUser(normalizedUser);

        // Gộp giỏ khách vãng lai (localStorage) vào giỏ server.
        // BẮT BUỘC chạy SAU khi token đã nằm trong localStorage: mergeGuestCart gọi
        // POST /cart/items và cần Bearer token, thiếu token sẽ dính 401 rồi bị
        // interceptor đá về /login ngay giữa lúc đang đăng nhập.
        // Gộp hỏng thì chỉ log — KHÔNG được làm hỏng việc đăng nhập.
        try {
            await cartService.mergeGuestCart();
        } catch (err) {
            console.error('Không gộp được giỏ hàng khách vào tài khoản', err);
        }

        return normalizedUser;
    };

    const login = async (credentials: any) => {
        setLoading(true);
        try {
            const data = await authService.login(credentials);
            return persistSession(data);
        } finally { setLoading(false); }
    };

    const signup = async (userData: any) => {
        setLoading(true);
        try {
            return await authService.signup(userData);
        } finally { setLoading(false); }
    };

    const googleLogin = async (accessToken: string) => {
        setLoading(true);
        try {
            const data = await authService.googleLogin(accessToken);
            return persistSession(data);
        } finally { setLoading(false); }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return { user, loading, login, signup, googleLogin, logout, isAuthenticated: !!user };
}
