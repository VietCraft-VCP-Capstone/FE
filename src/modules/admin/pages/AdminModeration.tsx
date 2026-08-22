import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, Loader2, AlertCircle, EyeOff, RotateCcw, PackageCheck
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { ModerateProduct, ModerationStats } from '../types';

type Filter = 'PUBLISHED' | 'UNPUBLISHED' | 'ALL';

export function AdminModeration() {
  const [stats, setStats] = useState<ModerationStats>({ published: 0, unpublished: 0, draft: 0, total: 0 });
  const [products, setProducts] = useState<ModerateProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [filter, setFilter] = useState<Filter>('PUBLISHED');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [reasonFor, setReasonFor] = useState<ModerateProduct | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const status = filter === 'ALL' ? undefined : filter;
      const [productsData, statsData] = await Promise.all([
        adminService.getProducts(status, page, limit),
        adminService.getModerationStats(),
      ]);
      setProducts(productsData.products);
      setTotal(productsData.total);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [page, filter, limit]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [filter]);

  const confirmUnpublish = async () => {
    if (!reasonFor) return;
    setProcessing(reasonFor.id);
    try {
      await adminService.unpublishProduct(reasonFor.id, reason || undefined);
      setSuccess(`Đã gỡ: "${reasonFor.title}"`);
      setError('');
      setReason('');
      setReasonFor(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gỡ sản phẩm thất bại');
    } finally {
      setProcessing(null);
    }
  };

  const handleRepublish = async (product: ModerateProduct) => {
    setProcessing(product.id);
    try {
      await adminService.republishProduct(product.id);
      setSuccess(`Đã khôi phục: "${product.title}"`);
      setError('');
      loadData();
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.errors ? `Không thể khôi phục: ${data.errors.join('; ')}` : (data?.error || 'Khôi phục thất bại'));
    } finally {
      setProcessing(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div className="admin-page-title-row">
          <h1 className="admin-page-title">Kiểm Duyệt Sản Phẩm</h1>
        </div>
        <p className="admin-page-desc">Post-moderation — sản phẩm được publish ngay; gỡ sản phẩm vi phạm hoặc khôi phục khi hợp lệ</p>
      </div>

      <div className="moderation-stats-bar">
        <div className="moderation-stat moderation-stat-approved">
          <PackageCheck size={24} />
          <div className="moderation-stat-info">
            <span className="moderation-stat-number">{stats.published}</span>
            <span className="moderation-stat-label">Đang bán</span>
          </div>
        </div>
        <div className="moderation-stat moderation-stat-rejected">
          <EyeOff size={24} />
          <div className="moderation-stat-info">
            <span className="moderation-stat-number">{stats.unpublished}</span>
            <span className="moderation-stat-label">Đã gỡ</span>
          </div>
        </div>
        <div className="moderation-stat moderation-stat-pending">
          <CheckCircle2 size={24} />
          <div className="moderation-stat-info">
            <span className="moderation-stat-number">{stats.total}</span>
            <span className="moderation-stat-label">Tổng sản phẩm</span>
          </div>
        </div>
      </div>

      <div className="admin-toolbar">
        {(['PUBLISHED', 'UNPUBLISHED', 'ALL'] as Filter[]).map(f => (
          <button
            key={f}
            className={`admin-btn ${filter === f ? '' : 'admin-btn-ghost'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'PUBLISHED' ? 'Đang bán' : f === 'UNPUBLISHED' ? 'Đã gỡ' : 'Tất cả'}
          </button>
        ))}
      </div>

      {error && <div className="admin-alert admin-alert-error"><AlertCircle size={16} /> {error}</div>}
      {success && <div className="admin-alert admin-alert-success"><CheckCircle2 size={16} /> {success}</div>}

      <div className="admin-card">
        {loading ? (
          <div className="admin-loader"><Loader2 size={32} className="animate-spin" /> Đang tải...</div>
        ) : products.length === 0 ? (
          <div className="admin-empty">
            <PackageCheck size={48} />
            <p className="admin-empty-text">Không có sản phẩm nào.</p>
          </div>
        ) : (
          <>
            <table className="admin-table admin-table-moderation">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sản phẩm</th>
                  <th>Shop</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td className="admin-table-stt">{product.id.substring(0, 8)}...</td>
                    <td>
                      <div className="moderation-product-cell">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.title} className="moderation-product-thumb" />
                        ) : (
                          <div className="moderation-product-thumb-placeholder"><PackageCheck size={20} /></div>
                        )}
                        <div className="moderation-product-info">
                          <span className="moderation-product-title">{product.title}</span>
                          <span className="moderation-product-desc">
                            {product.description.substring(0, 90)}{product.description.length > 90 ? '...' : ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="moderation-shop-cell">
                        <span className="moderation-shop-name">{product.shop_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`category-tree-status ${product.status === 'PUBLISHED' ? 'active' : 'inactive'}`}>
                        {product.status === 'PUBLISHED' ? 'Đang bán' : product.status === 'UNPUBLISHED' ? 'Đã gỡ' : 'Nháp'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        {product.status === 'PUBLISHED' ? (
                          <button
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => { setReasonFor(product); setReason(''); }}
                            disabled={processing === product.id}
                            title="Gỡ khỏi marketplace"
                          >
                            {processing === product.id ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
                            Gỡ
                          </button>
                        ) : (
                          <button
                            className="admin-btn admin-btn-sm"
                            onClick={() => handleRepublish(product)}
                            disabled={processing === product.id}
                            title="Khôi phục sản phẩm"
                          >
                            {processing === product.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                            Khôi phục
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="admin-pagination">
                <button className="admin-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trang trước</button>
                <span className="admin-pagination-info">Trang {page} / {totalPages} ({total} sản phẩm)</span>
                <button className="admin-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Trang sau</button>
              </div>
            )}
          </>
        )}
      </div>

      {reasonFor && (
        <div className="admin-modal-overlay" onClick={() => setReasonFor(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Gỡ sản phẩm — {reasonFor.title}</h2>
              <button className="admin-modal-close" onClick={() => setReasonFor(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-form-hint" style={{ marginBottom: 12 }}>
                Sản phẩm sẽ bị gỡ khỏi marketplace. Người bán nhận được thông báo kèm lý do.
              </p>
              <div className="admin-form-group">
                <label>Lý do gỡ (tùy chọn)</label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Vi phạm chính sách nội dung, hình ảnh không phù hợp..."
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn" onClick={() => setReasonFor(null)}>Hủy</button>
              <button
                className="admin-btn admin-btn-primary admin-btn-danger"
                onClick={confirmUnpublish}
                disabled={processing === reasonFor.id}
              >
                {processing === reasonFor.id ? <Loader2 size={16} className="animate-spin" /> : <EyeOff size={16} />}
                Xác nhận gỡ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
