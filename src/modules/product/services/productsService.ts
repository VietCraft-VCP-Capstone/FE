import api from '../../../infrastructure/api/interceptors';

// ponytail: mockup lưu path tương đối /uploads/... trên BE (8080), FE chạy 3000.
// Ghép origin ngay tại API boundary → mọi nơi đọc p.images (bảng, drawer) hiển thị đúng.
const ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const absImg = (u: any) => (typeof u === 'string' && u && !u.startsWith('http') ? ORIGIN + u : u);
const resolveImages = (p: any) => (p && Array.isArray(p.images) ? { ...p, images: p.images.map(absImg) } : p);

export const productsService = {
    getAll: async () => {
        const res = await api.get('/products');
        return Array.isArray(res.data) ? res.data.map(resolveImages) : res.data;
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
