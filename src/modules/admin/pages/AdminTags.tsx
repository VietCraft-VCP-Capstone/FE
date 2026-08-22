import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, Check, X } from 'lucide-react';
import { adminService } from '../services/adminService';
import type { Tag } from '../types';

const PRESET_COLORS = [
  '#007700', '#2563eb', '#dc2626', '#9333ea',
  '#ea580c', '#ca8a04', '#0891b2', '#64748b',
  '#84cc16', '#e11d48', '#7c3aed', '#1d4ed8',
];

function TagColorPicker({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  return (
    <div>
      <div className="tag-color-presets">
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            className={`tag-color-swatch ${color === c ? 'selected' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
            title={c}
          />
        ))}
      </div>
      <input
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        className="tag-color-input"
      />
      <input
        type="text"
        value={color}
        onChange={e => onChange(e.target.value)}
        placeholder="#hex"
        className="tag-color-hex"
      />
    </div>
  );
}

function TagRow({ tag, index, onEdit, onDelete }: {
  tag: Tag;
  index: number;
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr>
      <td className="admin-table-stt">{index + 1}</td>
      <td className="admin-table-name">
        <span className="tag-name-with-icon">{tag.name}</span>
      </td>
      <td className="admin-table-muted">{tag.slug}</td>
      <td>
        <span
          className="tag-color-dot"
          style={{ backgroundColor: tag.color }}
          title={tag.color}
        />
        <span className="admin-table-muted">{tag.color}</span>
      </td>
      <td className="admin-table-number">{tag.product_count}</td>
      <td>
        <div className="admin-table-actions">
          <button className="admin-btn admin-btn-sm" onClick={() => onEdit(tag)}>
            <Edit size={14} />
          </button>
          <button
            className="admin-btn admin-btn-sm admin-btn-danger"
            onClick={() => onDelete(tag._id)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function AdminTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [pendingTags, setPendingTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#007700', slug: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      const [data, pending] = await Promise.all([
        adminService.getTags(),
        adminService.getPendingTags(),
      ]);
      setTags(data);
      setPendingTags(pending);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải thẻ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTags(); }, [loadTags]);

  const handleApproveTag = async (id: string) => {
    try { await adminService.approveTag(id); loadTags(); }
    catch (err: any) { setError(err.response?.data?.error || 'Duyệt thất bại'); }
  };
  const handleRejectTag = async (id: string) => {
    if (!window.confirm('Từ chối thẻ này? Thẻ sẽ bị gỡ khỏi mọi sản phẩm.')) return;
    try { await adminService.rejectProposedTag(id); loadTags(); }
    catch (err: any) { setError(err.response?.data?.error || 'Từ chối thất bại'); }
  };

  const openCreateModal = () => {
    setEditingTag(null);
    setFormData({ name: '', color: '#007700', slug: '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color, slug: tag.slug });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (editingTag) {
        await adminService.updateTag(editingTag._id, {
          name: formData.name,
          color: formData.color,
        });
      } else {
        await adminService.createTag({
          name: formData.name,
          color: formData.color,
        });
      }
      setShowModal(false);
      loadTags();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thẻ này?')) return;
    try {
      await adminService.deleteTag(id);
      loadTags();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Xóa thất bại');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title-row">
          <h1 className="admin-page-title">Thẻ & Tags</h1>
          <button className="admin-btn" onClick={openCreateModal}>
            <Plus size={18} /> Thêm thẻ
          </button>
        </div>
        <p className="admin-page-desc">Quản lý thẻ gắn sản phẩm — tạo, chỉnh sửa, gán màu và xóa</p>
      </div>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      {pendingTags.length > 0 && (
        <div className="admin-card pending-tags-card">
          <div className="pending-tags-header">
            <span className="pending-tags-title">🕓 Thẻ chờ duyệt ({pendingTags.length})</span>
            <span className="admin-form-hint">Seller đề xuất — duyệt để công khai, từ chối để gỡ</span>
          </div>
          <div className="pending-tags-list">
            {pendingTags.map(t => (
              <div key={t._id} className="pending-tag-item">
                <span className="pending-tag-name">{t.name}</span>
                <span className="pending-tag-slug">/{t.slug}</span>
                <span className="pending-tag-count">{t.product_count} SP</span>
                <div className="pending-tag-actions">
                  <button className="admin-btn admin-btn-sm" title="Duyệt" onClick={() => handleApproveTag(t._id)}>
                    <Check size={14} />
                  </button>
                  <button className="admin-btn admin-btn-sm admin-btn-danger" title="Từ chối" onClick={() => handleRejectTag(t._id)}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm thẻ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loader"><Loader2 size={32} className="animate-spin" /> Đang tải...</div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên thẻ</th>
                <th>Slug</th>
                <th>Màu sắc</th>
                <th>Số sản phẩm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tags.filter(t =>
                t.name.toLowerCase().includes(search.toLowerCase())
              ).map((tag, i) => (
                <TagRow
                  key={tag._id}
                  tag={tag}
                  index={i}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>

          {tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <div className="admin-empty">
              <p className="admin-empty-text">Chưa có thẻ nào.</p>
              <button className="admin-btn" onClick={openCreateModal}>
                <Plus size={18} /> Tạo thẻ đầu tiên
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingTag ? 'Sửa thẻ' : 'Tạo thẻ mới'}</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Tên thẻ *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Cotton, Vinyl, Handmade..."
                  />
                </div>
                <div className="admin-form-group">
                  <label>Màu sắc</label>
                  <TagColorPicker
                    color={formData.color}
                    onChange={c => setFormData({ ...formData, color: c })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Tự động nếu để trống"
                  />
                  <p className="admin-form-hint">Để trống để tự động tạo từ tên.</p>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                  {editingTag ? 'Cập nhật' : 'Tạo thẻ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
