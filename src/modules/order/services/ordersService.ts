import api from '../../../infrastructure/api/interceptors';

export const ordersService = {
    create: async (orderData: any) => {
        const res = await api.post('/orders', orderData);
        return res.data;
    },
    getByUser: async () => {
        const res = await api.get('/orders');
        return res.data;
    },
    triggerCallback: async (orderId: string, status: 'success' | 'fail') => {
        const res = await api.post(`/orders/callback/${orderId}`, { status });
        return res.data;
    }
};
