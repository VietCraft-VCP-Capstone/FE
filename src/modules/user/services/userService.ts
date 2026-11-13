import api from '../../../infrastructure/api/interceptors';

export interface Address {
    _id?: string;
    recipient_name: string;
    phone: string;
    address_detail: string;
    province_id: string;
    district_id: string;
    ward_code: string;
    is_default: boolean;
}

export interface UserProfile {
    _id: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar?: string;
    addresses: Address[];
    notification_settings?: {
        in_app: boolean;
        push: boolean;
        email: boolean;
    };
    rank?: string;
    stats?: {
        ordersCount: number;
        collectionsCount: number;
        followingCount: number;
    };
    role?: string;
    createdAt?: string;
}

export const userService = {
    getProfile: async (): Promise<UserProfile> => {
        const res = await api.get('/users/profile');
        return res.data;
    },

    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
        const res = await api.put('/users/profile', data);
        return res.data;
    },

    addAddress: async (address: Partial<Address>): Promise<Address[]> => {
        const res = await api.post('/users/profile/addresses', address);
        return res.data;
    },

    updateAddress: async (addressId: string, address: Partial<Address>): Promise<Address[]> => {
        const res = await api.put(`/users/profile/addresses/${addressId}`, address);
        return res.data;
    },

    deleteAddress: async (addressId: string): Promise<Address[]> => {
        const res = await api.delete(`/users/profile/addresses/${addressId}`);
        return res.data;
    }
};

export default userService;
