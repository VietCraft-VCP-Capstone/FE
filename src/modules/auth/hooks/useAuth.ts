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
            try { setUser(JSON.parse(storedUser)); } catch { localStorage.clear(); }
        }
        setLoading(false);
    }, []);

    const persistSession = (data: { token: string; user: User }) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
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
