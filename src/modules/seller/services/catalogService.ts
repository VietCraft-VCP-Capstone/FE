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

    async getMyProposals(): Promise<ProposalItem[]> {
        const [catRes, tagRes] = await Promise.all([
            api.get('/categories/my-proposals').catch(() => ({ data: { data: [] } })),
            api.get('/tags/my-proposals').catch(() => ({ data: { data: [] } })),
        ]);
        const cats: any[] = catRes.data?.data || [];
        const tags: any[] = tagRes.data?.data || [];

        const catProposals: ProposalItem[] = cats.map(c => ({
            ...c,
            type: 'category' as const,
        }));
        const tagProposals: ProposalItem[] = tags.map(t => ({
            ...t,
            type: 'tag' as const,
        }));

        return [...catProposals, ...tagProposals].sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    },
};

export interface ProposalItem {
    _id: string;
    name: string;
    slug?: string;
    type: 'category' | 'tag';
    description?: string;
    color?: string;
    product_count?: number;
    status: 'active' | 'pending' | 'banned';
    review_status: 'pending' | 'approved' | 'rejected' | 'banned';
    reject_reason?: string | null;
    rejected_at?: string | null;
    created_at: string;
    updated_at: string;
}

export default catalogService;
