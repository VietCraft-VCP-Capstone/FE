import api from '../../../infrastructure/api/interceptors';

export type CouponDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'FLASH_SALE' | 'BUNDLE';
export type CouponApplicableScope = 'ALL' | 'SPECIFIC_PRODUCTS';

export interface SelectableProduct {
    id: string;
    title: string;
    image?: string;
    price: number;
    stock?: number;
    shop_name?: string;
    status?: string;
}

export interface CouponDTO {
    id: string;
    code: string;
    title: string;
    description?: string;
    discount_type: CouponDiscountType;
    discount_value: number;
    min_order_value?: number;
    max_discount_amount?: number;
    usage_limit?: number;
    used_count: number;
    applicable_scope?: CouponApplicableScope;
    applicable_product_ids?: string[];
    applicable_products_count?: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_platform?: boolean;
    shop_id?: string | null;
    shop_name?: string;
    shop_logo?: string;
    is_eligible?: boolean;
    min_order_diff?: number;
    scope_message?: string;
    created_at?: string;
}

export interface ApplyCouponPayload {
    code: string;
    subtotal: number;
    shippingFee?: number;
    shopId?: string;
    productId?: string;
    items?: Array<{ productId: string; price: number; quantity: number }>;
}

export interface ApplyCouponResponse {
    valid: boolean;
    discount: number;
    target: 'PRODUCT' | 'SHIPPING';
    message?: string;
    coupon?: {
        id: string;
        code: string;
        title: string;
        description?: string;
        discount_type: CouponDiscountType;
        discount_value: number;
        min_order_value?: number;
        max_discount_amount?: number;
        applicable_scope?: CouponApplicableScope;
        applicable_product_ids?: string[];
        shop_id?: string | null;
        is_platform: boolean;
    };
}

export interface CreateCouponPayload {
    code: string;
    title: string;
    description?: string;
    discount_type: CouponDiscountType;
    discount_value: number;
    min_order_value?: number;
    max_discount_amount?: number;
    usage_limit?: number;
    applicable_scope?: CouponApplicableScope;
    applicable_product_ids?: string[];
    start_date: string;
    end_date: string;
    shop_id?: string | null;
}

export const promotionService = {
    // Công khai & Khách mua
    getAll: async (): Promise<CouponDTO[]> => {
        const res = await api.get('/promotions');
        return res.data;
    },

    getAvailableCoupons: async (params?: { shopId?: string; productId?: string; subtotal?: number; items?: string }): Promise<CouponDTO[]> => {
        const res = await api.get('/promotions/available', { params });
        return res.data;
    },

    applyCoupon: async (payload: ApplyCouponPayload): Promise<ApplyCouponResponse> => {
        const res = await api.post('/promotions/apply', payload);
        return res.data;
    },

    // Kênh Người Bán (Seller)
    getSellerCoupons: async (): Promise<CouponDTO[]> => {
        const res = await api.get('/seller/promotions');
        return res.data;
    },

    getSellerSelectableProducts: async (): Promise<SelectableProduct[]> => {
        const res = await api.get('/seller/promotions/selectable-products');
        return res.data;
    },

    createSellerCoupon: async (data: CreateCouponPayload): Promise<CouponDTO> => {
        const res = await api.post('/seller/promotions', data);
        return res.data;
    },

    toggleSellerCoupon: async (couponId: string): Promise<CouponDTO> => {
        const res = await api.patch(`/seller/promotions/${couponId}/toggle`);
        return res.data;
    },

    deleteSellerCoupon: async (couponId: string): Promise<{ success: boolean }> => {
        const res = await api.delete(`/seller/promotions/${couponId}`);
        return res.data;
    },

    // Quản trị viên Sàn (Admin)
    getAdminCoupons: async (): Promise<CouponDTO[]> => {
        const res = await api.get('/admin/promotions');
        return res.data;
    },

    getAdminSelectableProducts: async (): Promise<SelectableProduct[]> => {
        const res = await api.get('/admin/promotions/selectable-products');
        return res.data;
    },

    createAdminCoupon: async (data: CreateCouponPayload): Promise<CouponDTO> => {
        const res = await api.post('/admin/promotions', data);
        return res.data;
    },

    toggleAdminCoupon: async (couponId: string): Promise<CouponDTO> => {
        const res = await api.patch(`/admin/promotions/${couponId}/toggle`);
        return res.data;
    },

    deleteAdminCoupon: async (couponId: string): Promise<{ success: boolean }> => {
        const res = await api.delete(`/admin/promotions/${couponId}`);
        return res.data;
    }
};

export default promotionService;

