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
    },
    getCategories: async () => {
        const res = await api.get('/products/meta/categories');
        return res.data;
    },
    getTags: async () => {
        const res = await api.get('/products/meta/tags');
        return res.data;
    },
    getBlanks: async () => {
        const res = await api.get('/products/meta/blanks');
        return res.data;
    },
    getMyDesigns: async () => {
        const res = await api.get('/designs/mine');
        return res.data;
    },
    uploadDesign: async (file: File, name?: string) => {
        const form = new FormData();
        form.append('file', file);
        if (name) form.append('name', name);
        const res = await api.post('/designs', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data;
    },
    previewMockup: async (blankId: string, designPlacements: any[]) => {
        const res = await api.post('/products/preview-mockup', { blankId, designPlacements });
        return res.data.images as string[];
    }
};
