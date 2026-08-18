import api from '../../../infrastructure/api/interceptors';

export const authService = {
    login: async (credentials: any) => {
        const res = await api.post('/auth/login', credentials);
        return res.data;
    },
    signup: async (userData: any) => {
        const res = await api.post('/auth/signup', userData);
        return res.data;
    },
    verifyOtp: async (email: string, code: string) => {
        const res = await api.post('/auth/verify-otp', { email, code });
        return res.data;
    },
    resendOtp: async (email: string) => {
        const res = await api.post('/auth/resend-otp', { email });
        return res.data;
    },
    googleLogin: async (accessToken: string) => {
        const res = await api.post('/auth/google', { accessToken });
        return res.data;
    },
    forgotPassword: async (email: string) => {
        const res = await api.post('/auth/forgot-password', { email });
        return res.data;
    },
    resetPassword: async (payload: any) => {
        const res = await api.post('/auth/reset-password', payload);
        return res.data;
    },
    getUsers: async () => {
        const res = await api.get('/auth/users');
        return res.data;
    },
    toggleUserLock: async (userId: string) => {
        const res = await api.patch(`/auth/users/${userId}/toggle-lock`);
        return res.data;
    },
};
