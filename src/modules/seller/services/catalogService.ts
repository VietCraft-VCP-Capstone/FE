import api from '../../../infrastructure/api/interceptors';

export interface CatalogCategory {
    _id: string;
    name: string;
    slug?: string;
}

export interface CatalogTag {
    _id: string;
    name: string;
    slug?: string;
    color?: string;
}

export interface CatalogProduct {
    id: string;
    title: string;
    category: string;
    tags: string[];
    price: number;
    stock: number;
    status: string;
    thumbnail?: string;
}

const PRODUCT_SCAN_LIMIT = 300;

export interface CatalogData {
    categories: CatalogCategory[];
    tags: CatalogTag[];
    products: CatalogProduct[];
    totalProducts: number;
    truncated: boolean;
}

export const catalogService = {
    async load(): Promise<CatalogData> {
        const [catRes, tagRes, prodRes] = await Promise.all([
            api.get('/products/meta/categories'),
            api.get('/products/meta/tags'),
            api.get('/products/mine', { params: { limit: PRODUCT_SCAN_LIMIT, page: 1 } }),
        ]);

        const categories: CatalogCategory[] = Array.isArray(catRes.data) ? catRes.data : [];
        const tags: CatalogTag[] = Array.isArray(tagRes.data) ? tagRes.data : [];

        const raw = prodRes.data;
        const items: any[] = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw) ? raw : [];
        const totalProducts = Number(raw?.total ?? items.length) || items.length;

        const products: CatalogProduct[] = items.map((p: any) => ({
            id: String(p.id ?? p._id ?? ''),
            title: p.title || 'Sản phẩm chưa đặt tên',
            category: p.category || '',
            tags: Array.isArray(p.tags) ? p.tags : [],
            price: Number(p.price) || 0,
            stock: Number(p.stock) || 0,
            status: p.status || 'ACTIVE',
            thumbnail: p.thumbnail || p.images?.[0],
        }));

        return {
            categories,
            tags,
            products,
            totalProducts,
            truncated: totalProducts > products.length,
        };
    },

    async proposeCategory(data: { name: string; description?: string; parent_id?: string }): Promise<any> {
        const res = await api.post('/categories/propose', data);
        return res.data;
    },

    async proposeTag(name: string): Promise<any> {
        const res = await api.post('/tags/propose', { name });
        return res.data;
    },
};

export default catalogService;
