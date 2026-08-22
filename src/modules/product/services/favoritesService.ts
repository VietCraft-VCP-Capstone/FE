import api from '../../../infrastructure/api/interceptors';

export const favoritesService = {
  getFavorites: async () => {
    const res = await api.get('/favorites');
    return res.data?.data || res.data;
  },
  toggleFavorite: async (productId: string) => {
    const res = await api.post(`/favorites/toggle`, { productId });
    return res.data;
  },
  addFavorite: async (productId: string) => {
    const res = await api.post(`/favorites/${productId}`);
    return res.data?.data || res.data;
  },
  removeFavorite: async (productId: string) => {
    const res = await api.delete(`/favorites/${productId}`);
    return res.data?.data || res.data;
  }
};
