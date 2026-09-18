import api from '../../infrastructure/api/client';

export interface UploadResponse {
    success: boolean;
    url: string;
    publicId?: string;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
    storage: 'cloudinary' | 'local';
}

export const uploadService = {
    /**
     * Tải lên một ảnh đơn (chung cho logo, banner, sản phẩm, thiết kế)
     */
    uploadImage: async (
        file: File,
        folder: 'avatars' | 'shops' | 'designs' | 'products' | 'general' = 'general'
    ): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post<UploadResponse>(`/upload/image?folder=${folder}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    /**
     * Tải lên ảnh đại diện cá nhân (tự động căn vuông, nhận diện khuôn mặt)
     */
    uploadAvatar: async (file: File): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post<UploadResponse>('/upload/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    /**
     * Tải lên nhiều ảnh cùng lúc (tối đa 10 ảnh)
     */
    uploadMultiple: async (
        files: File[],
        folder: 'shops' | 'designs' | 'products' | 'general' = 'products'
    ): Promise<{ success: boolean; count: number; images: UploadResponse[] }> => {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        const res = await api.post(`/upload/multiple?folder=${folder}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    /**
     * Xóa ảnh theo publicId hoặc URL
     */
    deleteImage: async (identifier: string): Promise<{ success: boolean; message: string }> => {
        const res = await api.delete('/upload', {
            data: { publicId: identifier, url: identifier }
        });
        return res.data;
    }
};

export default uploadService;
