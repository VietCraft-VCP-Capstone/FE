import api from '../../../infrastructure/api/interceptors';

export const analyticsService = {
    getForecasting: async (history: number[], steps: number = 5) => {
        const res = await api.post('/analytics/forecasting', { history, steps });
        return res.data;
    },
    getHealthScore: async (payload: { seller_id: string, ratings: number[], cancellation_rate: number, orders_volume_history: number[] }) => {
        const res = await api.post('/analytics/health-score', payload);
        return res.data;
    },
    detectAnomalies: async (data: number[], threshold: number = 2.0) => {
        const res = await api.post('/analytics/anomaly', { data, threshold });
        return res.data;
    }
};
