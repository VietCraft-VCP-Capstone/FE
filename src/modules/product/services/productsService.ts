import api from '../../../infrastructure/api/interceptors';

export const productsService = {
    getAll: async () => {
        const res = await api.get('/products');
        return res.data;
    },
    getFeaturedShops: async () => {
        const res = await api.get('/products/featured-shops');
        return res.data;
    },
    getById: async (id: string) => {
        const res = await api.get(`/products/${id}`);
        return res.data;
    },
    create: async (productData: any) => {
        const res = await api.post('/products', productData);
        return res.data;
    },
    update: async (id: string, productData: any) => {
        const res = await api.put(`/products/${id}`, productData);
        return res.data;
    },
    delete: async (id: string) => {
        const res = await api.delete(`/products/${id}`);
        return res.data;
    }
};
