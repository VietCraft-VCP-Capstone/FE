import api from '../../../infrastructure/api/interceptors';

export const ordersService = {
    create: async (orderData: any) => {
        const res = await api.post('/orders', orderData);
        return res.data;
    },
    getByUser: async (status?: string) => {
        const res = await api.get('/orders', {
            params: status && status !== 'all' ? { status } : undefined
        });
        return res.data;
    },
    getById: async (orderId: string) => {
        const res = await api.get(`/orders/${orderId}`);
        return res.data;
    },
    triggerCallback: async (orderId: string, status: 'success' | 'fail') => {
        const res = await api.post(`/orders/callback/${orderId}`, { status });
        return res.data;
    }
};

export default ordersService;
