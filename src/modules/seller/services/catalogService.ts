import api from '../../../infrastructure/api/interceptors';

/**
 * Dữ liệu cho trang "Danh mục sản phẩm" của seller.
 *
 * Cố ý KHÔNG đi qua productsService: trang này chỉ đọc, và giữ nó độc lập để
 * thay đổi ở luồng tạo/sửa sản phẩm không kéo theo trang danh mục.
 *
 * Danh mục và thẻ đều do admin quản lý — seller chỉ xem, không tạo/sửa/xoá.
 * Route /api/categories và /api/tags yêu cầu role admin, nên ở đây dùng hai
 * endpoint đọc công khai dành riêng cho form seller.
 */

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

// Trang này cần TOÀN BỘ hàng của seller để đếm theo danh mục, không phải 6 dòng
// đầu như bảng quản lý. Trần đặt cao thay vì lặp phân trang; vượt trần thì phần
// dôi ra bị bỏ, nên trả kèm cờ để giao diện nói thật với người dùng.
const PRODUCT_SCAN_LIMIT = 300;

export interface CatalogData {
    categories: CatalogCategory[];
    tags: CatalogTag[];
    products: CatalogProduct[];
    /** Tổng số hàng thật của seller (có thể lớn hơn products.length). */
    totalProducts: number;
    /** true khi tổng vượt PRODUCT_SCAN_LIMIT — số liệu chỉ tính trên phần đã tải. */
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
};

export default catalogService;
