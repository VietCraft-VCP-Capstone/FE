import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
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

    const persistSession = (data: { token: string; user: User }) => {
        const normalizedUser: User = {
            ...data.user,
            role: data.user.role?.toLowerCase?.() || data.user.role,
        };
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setUser(normalizedUser);
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
