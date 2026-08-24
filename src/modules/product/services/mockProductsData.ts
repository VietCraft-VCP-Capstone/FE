import { ProductItem, ProductFormData } from '../types/product';

const STORAGE_KEY = 'vietcraft_seller_products_mock';

export const INITIAL_MOCK_PRODUCTS: ProductItem[] = [];

export const CATEGORIES_LIST = [
  'Áo thun (T-Shirt)',
  'Áo Hoodie & Nỉ',
  'Áo Polo',
  'Áo sơ mi & Tank top',
  'Túi Tote & Canvas',
  'Mũ & Nón thêu',
  'Phụ kiện & Quà tặng'
];

export const mockProductService = {
  getAll: (): ProductItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
    }
    return [];
  },

  getById: (id: string): ProductItem | undefined => {
    const list = mockProductService.getAll();
    return list.find(p => p.id === id);
  },

  create: (data: ProductFormData): ProductItem => {
    const list = mockProductService.getAll();
    const newId = `prod_${Date.now()}`;
    const autoSku = data.sku?.trim() || `VC-${data.category.substring(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    
    const newProduct: ProductItem = {
      id: newId,
      sku: autoSku,
      title: data.title,
      category: data.category || 'Áo thun (T-Shirt)',
      price: Number(data.price) || 0,
      stock: Number(data.stock) || 0,
      stockValue: (Number(data.price) || 0) * (Number(data.stock) || 0),
      status: data.status || 'ACTIVE',
      location: data.location || 'Việt Nam',
      rank: Number(data.rank) || 0,
      description: data.description || '',
      thumbnail: data.thumbnail || (data.images && data.images[0]) || '',
      images: data.images || [],
      colors: data.colors || [],
      engagementTrend: [20, 30, 45, 55, 60, 75, 90],
      inventoryTrends: [
        { date: 'T1', stock: Number(data.stock) },
        { date: 'Hiện tại', stock: Number(data.stock) }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedList = [newProduct, ...list];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    return newProduct;
  },

  update: (id: string, data: Partial<ProductFormData>): ProductItem => {
    const list = mockProductService.getAll();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Product with ID ${id} not found`);
    }

    const current = list[index];
    const newPrice = data.price !== undefined ? Number(data.price) : current.price;
    const newStock = data.stock !== undefined ? Number(data.stock) : current.stock;

    const updatedProduct: ProductItem = {
      ...current,
      ...data,
      price: newPrice,
      stock: newStock,
      stockValue: newPrice * newStock,
      updatedAt: new Date().toISOString()
    };

    list[index] = updatedProduct;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return updatedProduct;
  },

  delete: (id: string): void => {
    const list = mockProductService.getAll();
    const filtered = list.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  batchDelete: (ids: string[]): void => {
    const list = mockProductService.getAll();
    const filtered = list.filter(p => !ids.includes(p.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  updateStatus: (ids: string[], status: ProductItem['status']): void => {
    const list = mockProductService.getAll();
    const updated = list.map(p => ids.includes(p.id) ? { ...p, status, updatedAt: new Date().toISOString() } : p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  resetDefaults: (): ProductItem[] => {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
};
