import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { cartService } from '../../order/services/cartService';
import { userService } from '../../user/services/userService';
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
                const normalized: User = {
                    ...parsed,
                    role: parsed.role?.toLowerCase?.() || parsed.role,
                };
                setUser(normalized);
            } catch { localStorage.clear(); }
        }
        setLoading(false);

        // Luôn fetch profile mới nhất từ server để đồng bộ avatar và thông tin người dùng
        if (token) {
            userService.getProfile()
                .then((prof) => {
                    if (prof) {
                        setUser((prev) => {
                            const updated = {
                                ...prev,
                                ...prof,
                                name: prof.full_name || prev?.name,
                                role: prev?.role || (prof as any).role
                            };
                            try {
                                const stored = localStorage.getItem('user');
                                if (stored) {
                                    localStorage.setItem('user', JSON.stringify({ ...JSON.parse(stored), ...updated }));
                                }
                            } catch {}
                            return updated as User;
                        });
                    }
                })
                .catch(() => {});
        }

        const handleUserUpdate = (e: any) => {
            if (e?.detail) {
                setUser((prev) => prev ? { ...prev, ...e.detail } : e.detail);
            }
        };

        window.addEventListener('vietcraft-user-updated', handleUserUpdate);
        return () => window.removeEventListener('vietcraft-user-updated', handleUserUpdate);
    }, []);

    const persistSession = async (data: { token: string; user: User }) => {
        const normalizedUser: User = {
            ...data.user,
            role: data.user.role?.toLowerCase?.() || data.user.role,
        };
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setUser(normalizedUser);

        try {
            await cartService.mergeGuestCart();
        } catch (err) {
            console.error('Không gộp được giỏ hàng khách vào tài khoản', err);
        }

        return normalizedUser;
    };

    const login = async (credentials: any) => {
        const data = await authService.login(credentials);
        return persistSession(data);
    };

    const signup = async (userData: any) => {
        return await authService.signup(userData);
    };

    const googleLogin = async (accessToken: string) => {
        const data = await authService.googleLogin(accessToken);
        return persistSession(data);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return { user, loading, login, signup, googleLogin, logout, isAuthenticated: !!user };
}
