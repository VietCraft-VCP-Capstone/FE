import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit, Trash2, Eye, EyeOff, Loader2,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { Category } from '../types';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildCategoryTree(categories: Category[], parentId: string | null = null, level: number = 0): (Category & { _level: number; children?: Category[] })[] {
  return categories
    // Root categories have no parent_id (undefined from the API); normalize to null
    // so they match parentId=null instead of being silently filtered out.
    .filter(c => (c.parent_id ?? null) === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(c => ({
      ...c,
      _level: level,
      children: buildCategoryTree(categories, c._id, level + 1),
    }));
}

function CategoryNode({ category, onEdit, onDelete, onToggle }: {
  category: Category & { _level: number; children?: Category[] };
  onEdit: (cat: Category & { _level: number; children?: Category[] }) => void;
  onDelete: (id: string) => void;
  onToggle: (cat: Category) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  const cat = category as Category & { _level: number; children?: Category[] };

  return (
    <div className="category-tree-node" style={{ paddingLeft: `${cat._level * 24}px` }}>
      <div className="category-tree-row">
        {hasChildren ? (
          <span className="category-tree-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        ) : (
          <span className="category-tree-spacer" />
        )}
        <span className="category-tree-icon">
          {cat.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
        </span>
        <span className="category-tree-name">{cat.name}</span>
        <span className="category-tree-slug">/{cat.slug}</span>
        <span className={`category-tree-status ${cat.is_active ? 'active' : 'inactive'}`}>
          {cat.is_active ? 'Hoạt động' : 'Ẩn'}
        </span>
        <div className="category-tree-actions">
          <button className="admin-btn admin-btn-sm" onClick={() => onEdit(cat)} title="Sửa">
            <Edit size={14} />
          </button>
          <button
            className="admin-btn admin-btn-sm admin-btn-danger"
            onClick={() => onDelete(cat._id)}
            title="Xóa"
          >
            <Trash2 size={14} />
          </button>
          <button
            className="admin-btn admin-btn-sm"
            onClick={() => onToggle(cat)}
            title={cat.is_active ? 'Ẩn danh mục' : 'Hiển thị danh mục'}
          >
            {cat.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div className="category-tree-children">
          {cat.children!.map(child => (
            <CategoryNode
              key={child._id}
              category={child as any}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [treeCategories, setTreeCategories] = useState<(Category & { _level: number; children?: Category[] })[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '', parent_id: '', sort_order: 0, is_active: true });
  const [slugPreview, setSlugPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getCategoryTree();
      setCategories(data);
      setTreeCategories(buildCategoryTree(data));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: '', parent_id: '', sort_order: categories.length, is_active: true });
    setSlugPreview('');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (cat: Category & { _level: number; children?: Category[] }) => {
    const original = categories.find(c => c._id === cat._id) || cat;
    setEditingCategory(original as Category);
    setFormData({
      name: original.name,
      description: original.description || '',
      icon: original.icon || '',
      parent_id: original.parent_id || '',
      sort_order: original.sort_order,
      is_active: original.is_active,
    });
    setSlugPreview(original.slug);
    setError('');
    setShowModal(true);
  };

  const handleSlugChange = (name: string) => {
    if (!name.trim()) {
      setSlugPreview('');
      return;
    }
    setSlugPreview(generateSlug(name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory._id, {
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          parent_id: formData.parent_id || undefined,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
        });
      } else {
        await adminService.createCategory({
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          parent_id: formData.parent_id || undefined,
          sort_order: formData.sort_order,
          slug: slugPreview,
          is_active: formData.is_active,
        });
      }
      setShowModal(false);
      loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    try {
      await adminService.updateCategory(cat._id, { is_active: !cat.is_active });
      loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Cập nhật thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await adminService.deleteCategory(id);
      loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Xóa thất bại');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title-row">
          <h1 className="admin-page-title">Danh Mục</h1>
          <button className="admin-btn" onClick={openCreateModal}>
            <Plus size={18} /> Thêm danh mục
          </button>
        </div>
        <p className="admin-page-desc">Quản lý danh mục sản phẩm — tạo, sửa, xóa và phân cấp</p>
      </div>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loader"><Loader2 size={32} className="animate-spin" /> Đang tải...</div>
      ) : (
        <div className="admin-card">
          <div className="category-tree-container">
            {treeCategories.length === 0 ? (
              <div className="admin-empty">
                <p className="admin-empty-text">Chưa có danh mục nào.</p>
                <button className="admin-btn" onClick={openCreateModal}>
                  <Plus size={18} /> Tạo danh mục đầu tiên
                </button>
              </div>
            ) : (
              treeCategories.map(cat => (
                <CategoryNode
                  key={cat._id}
                  category={cat}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onToggle={handleToggleStatus}
                />
              ))
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingCategory ? 'Sửa danh mục' : 'Tạo danh mục mới'}</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Tên danh mục *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => {
                      setFormData({ ...formData, name: e.target.value });
                      handleSlugChange(e.target.value);
                    }}
                    placeholder="Ví dụ: Áo thun, Gốm sứ..."
                  />
                </div>
                <div className="admin-form-group">
                  <label>Slug</label>
                  <input
                    type="text"
                    value={slugPreview}
                    readOnly
                    className="admin-form-readonly"
                  />
                  <p className="admin-form-hint">Tự động tạo từ tên. Bạn có thể chỉnh sửa thủ công.</p>
                </div>
                <div className="admin-form-group">
                  <label>Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả ngắn về danh mục..."
                  />
                </div>
                <div className="admin-form-group">
                  <label>Icon (classes)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Ví dụ: tag, users, settings"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Danh mục cha</label>
                  <select
                    value={formData.parent_id}
                    onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                  >
                    <option value="">— Không có (danh mục gốc) —</option>
                    {categories
                      .filter(c => c._id !== editingCategory?._id)
                      .map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div className="admin-form-checkbox">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label htmlFor="isActive">Hoạt động</label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                  {editingCategory ? 'Cập nhật' : 'Tạo danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
