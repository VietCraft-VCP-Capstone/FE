import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SellerLayout } from './SellerLayout';
import { Search, Plus, Trash2, Edit, BarChart3 } from 'lucide-react';
import { productsService } from '../../product/services/productsService';

function SellerDashboard() {
  return (
    <div className="seller-dashboard-panel animate-fade-in">
      <h2 className="seller-role-title">Dashboard</h2>
      <p className="seller-role-subtitle">Thống kê doanh thu, đơn hàng và hiệu suất cửa hàng.</p>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">DOANH THU THÁNG</span>
          <div className="stat-value-row"><span className="stat-number">45,200,000đ</span><span className="stat-trending trend-up">↗ +18.4%</span></div>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">ĐƠN HÀNG MỚI</span>
          <div className="stat-value-row"><span className="stat-number">86</span><span className="stat-trending trend-up">↗ +10.2%</span></div>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">SẢN PHẨM KHẢ DỤNG</span>
          <div className="stat-value-row"><span className="stat-number">12</span><span className="stat-trending">Hoạt động tốt</span></div>
        </div>
      </div>
    </div>
  );
}

function SellerProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadProducts = () => {
    setLoading(true);
    productsService.getAll()
      .then((data) => { setProducts(data); setLoading(false); })
      .catch((err) => { console.error('Failed to load products:', err); setLoading(false); });
  };

  useEffect(() => { loadProducts(); }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? products.map(p => p.id) : []);
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter(x => x !== id));
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá sản phẩm này?')) {
      productsService.delete(id)
        .then(() => { loadProducts(); })
        .catch(err => { alert('Không thể xoá sản phẩm: ' + (err.response?.data?.error || err.message)); });
    }
  };

  return (
    <div className="seller-products-panel animate-fade-in">
      <div className="seller-products-header">
        <div>
          <h2 className="seller-role-title">Products</h2>
          <p className="seller-role-subtitle">Danh mục hàng hoá của bạn.</p>
        </div>
        <button className="seller-btn-add"><Plus size={16} /> Chi tiết sản phẩm mới</button>
      </div>
      <div className="seller-table-controls">
        <div className="search-tags-wrap">
          {search && (
            <div className="search-badge-tag">
              <span>{search}</span><button onClick={() => setSearch('')}>×</button>
            </div>
          )}
          <div className="search-input-field">
            <Search size={14} className="icon-search" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="sort-wrap">
          <span className="sort-label">Sắp xếp theo:</span>
          <select className="sort-select">
            <option>Mới nhất</option><option>Giá tăng dần</option><option>Giá giảm dần</option>
          </select>
        </div>
      </div>
      <div className="seller-table-container">
        {loading ? (
          <div className="p-8 text-center text-stone-500">Đang tải danh sách sản phẩm...</div>
        ) : (
          <table className="seller-data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={products.length > 0 && selectedIds.length === products.length} onChange={handleSelectAll} style={{ width: 16, height: 16 }} />
                </th>
                <th>Sản phẩm</th><th>Danh mục</th><th>Màu sắc</th><th>Trạng thái</th><th style={{ width: 120 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.filter(p => p.title?.toLowerCase().includes(search.toLowerCase())).map((p) => (
                <tr key={p.id} className={selectedIds.includes(p.id) ? 'row-selected' : ''}>
                  <td><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={(e) => handleSelectOne(p.id, e.target.checked)} style={{ width: 16, height: 16 }} /></td>
                  <td>
                    <div className="product-media-cell">
                      <div className="product-thumb">
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover rounded-md" />
                        ) : p.title?.charAt(0)}
                      </div>
                      <div className="product-desc-group">
                        <span className="product-name-title">{p.title}</span>
                        <span className="product-desc-sub text-xs text-stone-500 max-w-[300px] truncate block">{p.description}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="cat-pill">{p.category}</span></td>
                  <td>
                    <div className="colors-cell-row">
                      <span className="color-dot-circle" style={{ backgroundColor: '#5c4033' }} />
                      <span className="color-dot-circle" style={{ backgroundColor: '#ffffff' }} />
                    </div>
                  </td>
                  <td><span className="seller-status-badge active">Active</span></td>
                  <td>
                    <div className="seller-actions-row">
                      <button className="seller-icon-action" title="Xem phân tích"><BarChart3 size={15} /></button>
                      <button className="seller-icon-action" title="Sửa thông tin"><Edit size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} className="seller-icon-action text-rose-500 hover:bg-rose-50" title="Xoá"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="seller-pagination-row">
        <span>Hiển thị 1 - {products.length} của {products.length} kết quả</span>
        <div className="pager-buttons">
          <button className="pager-item hover:bg-stone-100">&lt;</button>
          <button className="pager-item active">1</button>
          <button className="pager-item hover:bg-stone-100">2</button>
          <button className="pager-item hover:bg-stone-100">&gt;</button>
        </div>
      </div>
    </div>
  );
}

function SellerStorefront() {
  return <div className="animate-fade-in"><h2 className="seller-role-title">Storefront</h2><p className="seller-role-subtitle">Cấu hình gian hàng độc bản của bạn.</p></div>;
}
function SellerOrders() {
  return <div className="animate-fade-in"><h2 className="seller-role-title">Orders</h2><p className="seller-role-subtitle">Danh sách đơn hàng cần xử lý đóng gói và vận chuyển.</p></div>;
}
function SellerAnalytics() {
  return <div className="animate-fade-in"><h2 className="seller-role-title">Analytics</h2><p className="seller-role-subtitle">Phân tích chuyên sâu về tình hình kinh doanh, dự báo từ AI.</p></div>;
}
function SellerPayouts() {
  return <div className="animate-fade-in"><h2 className="seller-role-title">Payouts</h2><p className="seller-role-subtitle">Quản lý dòng tiền rút và lịch sử giao dịch thanh toán gửi về ngân hàng.</p></div>;
}
function SellerProductListing() {
  return <div className="animate-fade-in"><h2 className="seller-role-title">Product Listing</h2><p className="seller-role-subtitle">Yêu cầu niêm yết các sản phẩm thủ công lên trang chủ VietCraft.</p></div>;
}

interface SellerPortalProps { user: any; onLogout: () => void; }

export function SellerPortal({ user, onLogout }: SellerPortalProps) {
  return (
    <SellerLayout user={user} onLogout={onLogout}>
      <Routes>
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="storefront" element={<SellerStorefront />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="analytics" element={<SellerAnalytics />} />
        <Route path="payouts" element={<SellerPayouts />} />
        <Route path="product-listing" element={<SellerProductListing />} />
        <Route path="*" element={<Navigate to="products" replace />} />
      </Routes>
    </SellerLayout>
  );
}
