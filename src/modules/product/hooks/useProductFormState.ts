import { useState, useEffect } from 'react';
import { ProductItem, ProductFormData, CatalogOption } from '../types/product';
import { productsService } from '../services/productsService';
import { netFromGross } from '../../../shared/utils/commission';

const EMPTY_FORM: ProductFormData = {
  title: '',
  category: '',
  categoryId: '',
  tagIds: [],
  materials: [],
  price: 0,
  stock: 10,
  sku: '',
  location: '',
  rank: 0,
  status: 'ACTIVE',
  description: '',
  thumbnail: '',
  images: [],
  colors: [{ name: 'Gỗ sồi tự nhiên', hex: '#5C4033' }],
  sizes: [],
  material: ''
};

function formFromProduct(product: ProductItem): ProductFormData {
  const rawImages = product.images && product.images.length > 0
    ? [...product.images]
    : (product.thumbnail ? [product.thumbnail] : []);
  const activeThumb = product.thumbnail || rawImages[0] || '';
  let orderedImages = [...rawImages];
  if (activeThumb && orderedImages.includes(activeThumb)) {
    orderedImages = [activeThumb, ...orderedImages.filter(img => img !== activeThumb)];
  }

  return {
    title: product.title || '',
    category: product.category || '',
    categoryId: '',
    tagIds: [],
    materials: product.materials ? [...product.materials] : [],
    price: product.price || 0,
    stock: product.stock !== undefined ? product.stock : 10,
    sku: product.sku || '',
    location: product.location || '',
    rank: product.rank || 0,
    status: product.status || 'ACTIVE',
    description: product.description || '',
    thumbnail: activeThumb,
    images: orderedImages,
    colors: product.colors && product.colors.length > 0 ? product.colors : [],
    sizes: product.sizes && product.sizes.length > 0
      ? product.sizes
      : Array.from(new Set((product.variants || []).map(v => v.size).filter(Boolean))) as string[],
    material: product.variants?.[0]?.material || (product as any).material || ''
  };
}

function newProductForm(): ProductFormData {
  return {
    title: '',
    category: '',
    categoryId: '',
    tagIds: [],
    materials: [],
    price: 0,
    stock: 50,
    sku: '',
    location: '',
    rank: 1,
    status: 'ACTIVE',
    description: '',
    thumbnail: '',
    images: [],
    colors: [
      { name: 'Đen', hex: '#1C1C1C' },
      { name: 'Trắng', hex: '#FFFFFF' }
    ],
    sizes: [],
    material: ''
  };
}

export function useProductFormState(isOpen: boolean, product?: ProductItem | null) {
  const [categories, setCategories] = useState<CatalogOption[]>([]);
  const [tags, setTags] = useState<CatalogOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSettled, setCatalogSettled] = useState(false);
  const [catalogError, setCatalogError] = useState('');

  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM);
  const [newTagNames, setNewTagNames] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [commissionPercent, setCommissionPercent] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCatalogSettled(false);
      return;
    }
    let alive = true;
    setCatalogLoading(true);
    setCatalogError('');
    Promise.all([productsService.getCategories(), productsService.getTags()])
      .then(([c, t]) => {
        if (!alive) return;
        setCategories(Array.isArray(c) ? c : []);
        setTags(Array.isArray(t) ? t : []);
      })
      .catch(() => {
        if (alive) setCatalogError('Không tải được danh mục và thẻ. Đóng modal rồi thử lại.');
      })
      .finally(() => {
        if (!alive) return;
        setCatalogLoading(false);
        setCatalogSettled(true);
      });
    return () => { alive = false; };
  }, [isOpen]);

  useEffect(() => {
    setFormData(product ? formFromProduct(product) : newProductForm());
    setNewTagNames([]);
    setErrors({});
  }, [product, isOpen]);

  useEffect(() => {
    if (!product || categories.length === 0) return;
    const key = (x?: string) => (x || '').trim().toLowerCase();
    const matchedCategory = categories.find(c => key(c.name) === key(product.category));
    const matchedTagIds = (product.tags || [])
      .map(name => tags.find(t => key(t.name) === key(name))?._id)
      .filter((id): id is string => Boolean(id));
    setFormData(prev => ({
      ...prev,
      categoryId: matchedCategory?._id || '',
      tagIds: matchedTagIds,
    }));
  }, [product, categories, tags]);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    productsService
      .getCommissionPercent(formData.categoryId, 'READY_TO_SHIP')
      .then(p => alive && setCommissionPercent(p))
      .catch(() => alive && setCommissionPercent(null));
    return () => { alive = false; };
  }, [isOpen, formData.categoryId]);

  useEffect(() => {
    if (!product || commissionPercent === null) return;
    setFormData(prev => ({ ...prev, price: netFromGross(product.price || 0, commissionPercent) }));
  }, [product, commissionPercent]);

  const toggleTag = (id: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter(t => t !== id)
        : [...prev.tagIds, id],
    }));
  };

  const addTag = (name: string) => {
    const key = name.toLowerCase();
    const matched = tags.find(t => t.name.toLowerCase() === key);
    if (matched) {
      setFormData(prev => (prev.tagIds.includes(matched._id) ? prev : { ...prev, tagIds: [...prev.tagIds, matched._id] }));
    } else {
      setNewTagNames(prev => (prev.some(t => t.toLowerCase() === key) ? prev : [...prev, name]));
    }
  };

  const removeNewTag = (name: string) => setNewTagNames(prev => prev.filter(t => t !== name));

  const categoryCreated = async (name: string) => {
    const c = await productsService.getCategories();
    if (!Array.isArray(c)) return;
    setCategories(c);
    const created = c.find(it => (it.name || '').toLowerCase() === name.toLowerCase());
    if (created) setFormData(prev => ({ ...prev, categoryId: created._id, category: created.name }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'Vui lòng nhập tên sản phẩm';
    if (!formData.categoryId) errs.category = 'Vui lòng chọn danh mục';
    if (formData.tagIds.length === 0 && newTagNames.length === 0) errs.tags = 'Vui lòng chọn hoặc đề xuất ít nhất 1 thẻ';
    if (formData.price <= 0) errs.price = 'Giá bán phải lớn hơn 0';
    if (formData.stock < 0) errs.stock = 'Tồn kho không được âm';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildSubmitData = (): ProductFormData => {
    let finalImages = [...formData.images];
    const targetCover = formData.thumbnail || finalImages[0] || '';
    if (targetCover && finalImages.includes(targetCover)) {
      finalImages = [targetCover, ...finalImages.filter(img => img !== targetCover)];
    }
    return { ...formData, newTagNames, images: finalImages, thumbnail: targetCover };
  };

  return {
    formData,
    setFormData,
    errors,
    categories,
    tags,
    catalogLoading,
    catalogSettled,
    catalogError,
    commissionPercent,
    toggleTag,
    newTagNames,
    addTag,
    removeNewTag,
    categoryCreated,
    validate,
    buildSubmitData,
  };
}
