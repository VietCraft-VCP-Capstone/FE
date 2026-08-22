import api from '../../../infrastructure/api/interceptors';

export const promotionService = {
    getAll: async () => {
        const res = await api.get('/promotions');
        return res.data;
    }
};

export default promotionService;
