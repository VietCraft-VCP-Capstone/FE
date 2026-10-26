import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from 'antd';
import {
  RefreshCw,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { analyticsApi } from '../../services/analyticsApi';
import { visibleTodos } from './visibleTodos';
import { editLink } from '../HealthParts';
import { plainText } from '../../format';
import type { ListingHealth } from '../../healthTypes';
import type { QualityAuditData } from '../../qualityTypes';

interface HeroActionsProps {
  data: ListingHealth;
  productId: string;
}

const FIELD_NAMES: Record<string, string> = {
  title: 'Tiêu đề',
  description: 'Mô tả',
  images: 'Hình ảnh',
  category_id: 'Danh mục',
  categories: 'Danh mục',
  price: 'Giá bán',
  tags: 'Từ khoá',
  materials: 'Chất liệu',
  variants: 'Phân loại',
};

interface MinimalGuide {
  title: string;
  summary: string;
  tips: string[];
}

const MINIMAL_GUIDES: Record<string, MinimalGuide> = {
  IMAGES_INSUFFICIENT: {
    title: 'Cần bổ sung thêm ảnh',
    summary: 'Tin đăng có từ 2–5 ảnh giúp người mua dễ hình dung và tăng tỷ lệ đặt hàng.',
    tips: [
      'Ảnh cận cảnh bề mặt chất liệu vải, đường may hoặc nhãn mác',
      'Ảnh người mẫu mặc thực tế hoặc chụp góc nghiêng 45°',
      'Ảnh bảng quy đổi kích cỡ (size chart) để khách tự chọn size',
    ],
  },
  TITLE_TOO_SHORT: {
    title: 'Tiêu đề quá ngắn',
    summary: 'Nên đặt từ 40–80 ký tự để khách dễ tìm thấy sản phẩm trên sàn.',
    tips: [
      'Công thức chuẩn: [Tên sản phẩm] + [Chất liệu] + [Kiểu dáng / Dịp sử dụng]',
      'Ví dụ: Áo Thun Trơn Cotton 100% Cổ Tròn Form Regular Unisex',
    ],
  },
  TITLE_EMPTY: {
    title: 'Chưa có tiêu đề',
    summary: 'Tiêu đề là thông tin bắt buộc để sản phẩm xuất hiện trong tìm kiếm.',
    tips: ['Nhập tên sản phẩm kèm chất liệu và đặc tính nổi bật.'],
  },
  DESCRIPTION_TOO_SHORT: {
    title: 'Mô tả quá ngắn',
    summary: 'Nên viết từ 100 từ trở lên để giải đáp thắc mắc cho người mua.',
    tips: [
      'Nêu rõ bảng số đo kích cỡ (dài áo, ngực, cân nặng phù hợp)',
      'Thành phần chất liệu vải và cảm giác khi mặc',
      'Hướng dẫn giặt ủi và chính sách đổi trả của shop',
    ],
  },
  DESCRIPTION_EMPTY: {
    title: 'Chưa có mô tả',
    summary: 'Bổ sung thông số kích thước và chất liệu để khách an tâm đặt hàng.',
    tips: ['Giới thiệu kích cỡ, chất liệu và cách bảo quản sản phẩm.'],
  },
  MISSING_MATERIAL_INFO: {
    title: 'Chưa nêu chất liệu',
    summary: 'Khách hàng luôn quan tâm thành phần vải trước khi bấm mua.',
    tips: [
      'Ghi rõ loại vải: Cotton 100%, nỉ chân cua, linen thô,...',
      'Đặc tính: Thấm hút mồ hôi, co giãn 2 chiều hay 4 chiều',
    ],
  },
  MISSING_SIZING_INFO: {
    title: 'Thiếu hướng dẫn chọn size',
    summary: 'Bảng size rõ ràng giúp giảm 50% yêu cầu đổi trả vì mặc không vừa.',
    tips: [
      'Ghi bảng size S, M, L, XL kèm chiều cao và cân nặng tương ứng',
      'Hoặc tải 1 ảnh bảng size vào bộ sưu tập ảnh',
    ],
  },
  MISSING_CARE_INFO: {
    title: 'Thiếu hướng dẫn bảo quản',
    summary: 'Giúp khách giặt đúng cách để giữ hình in bền và đánh giá 5 sao.',
    tips: ['Giặt mặt trái, nước thường, không ủi trực tiếp lên hình in'],
  },
  LOW_IMAGE_RESOLUTION: {
    title: 'Ảnh mờ hoặc độ phân giải thấp',
    summary: 'Ảnh tối thiểu 500x500 px (tốt nhất 1000x1000 px) để xem rõ nét.',
    tips: ['Tải trực tiếp ảnh gốc từ máy ảnh/điện thoại, tránh ảnh chụp màn hình'],
  },
  BLURRY_IMAGE: {
    title: 'Ảnh bị rung hoặc lệch nét',
    summary: 'Ảnh sắc nét giúp khách hàng cảm nhận được chất lượng vải thật.',
    tips: ['Chụp đủ sáng ban ngày, cố định tay hoặc dùng chân máy'],
  },
  EXTREME_ASPECT_RATIO: {
    title: 'Tỉ lệ ảnh chưa chuẩn',
    summary: 'Nên dùng ảnh vuông 1:1 để không bị cắt méo trên điện thoại.',
    tips: ['Cắt cúp ảnh về khung vuông 1:1, sản phẩm nằm ở chính giữa'],
  },
  MATERIAL_CONTRADICTION: {
    title: 'Chất liệu không đồng nhất',
    summary: 'Tiêu đề và mô tả đang nhắc đến các loại chất liệu khác nhau.',
    tips: ['Thống nhất duy nhất một loại chất liệu chính xác ở cả 2 mục'],
  },
};

export function HeroActions({ data, productId }: HeroActionsProps) {
  const [activeTab, setActiveTab] = useState<'priority' | 'audit'>('priority');
  const [auditData, setAuditData] = useState<QualityAuditData | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});

  const todos = visibleTodos(data);
  const urgent = data.warnings.filter(w => w.type === 'warning');
  const actionable = todos.filter(t => t.field !== null && t.code !== 'review');
  const reviewTodo = todos.find(t => t.code === 'review');
  const totalImpact = Math.round(todos.reduce((sum, item) => sum + item.impact, 0));

  const loadAudit = async () => {
    try {
      setAuditLoading(true);
      const res = await analyticsApi.listingQuality(productId);
      if (res?.data) {
        setAuditData(res.data);
      }
    } catch {
      // silently handle
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadAudit();
    }
  }, [productId]);

  const handleRecheck = async () => {
    try {
      setRechecking(true);
      const res = await analyticsApi.listingQualityRecheck(productId);
      if (res?.data) {
        setAuditData(res.data);
      }
    } catch {
      // silently handle
    } finally {
      setRechecking(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openIssues = (auditData?.issues || []).filter(i => i.status === 'open');

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Minimalist Top Tabs */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveTab('priority')}
              className={`text-xs font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 cursor-pointer ${
                activeTab === 'priority'
                  ? 'text-stone-900 border-stone-900'
                  : 'text-stone-400 border-transparent hover:text-stone-600'
              }`}
            >
              Việc nên làm ({actionable.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`text-xs font-bold uppercase tracking-wider transition-colors pb-1 border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'text-stone-900 border-stone-900'
                  : 'text-stone-400 border-transparent hover:text-stone-600'
              }`}
            >
              <span>Kiểm toán tin đăng</span>
              {openIssues.length > 0 ? (
                <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                  {openIssues.length}
                </span>
              ) : (
                <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                  ✓
                </span>
              )}
            </button>
          </div>

          <div>
            {activeTab === 'priority' ? (
              totalImpact > 0 ? (
                <Tooltip title="Tổng số điểm có thể tăng thêm sau khi hoàn thành các mục">
                  <span className="cursor-help font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    +{totalImpact} điểm tiềm năng
                  </span>
                </Tooltip>
              ) : null
            ) : (
              <button
                type="button"
                disabled={rechecking}
                onClick={handleRecheck}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 cursor-pointer disabled:opacity-50 transition-colors"
                title="Kiểm tra lại sau khi bạn cập nhật sản phẩm"
              >
                <RefreshCw size={11} className={rechecking ? 'animate-spin' : ''} />
                <span>{rechecking ? 'Đang duyệt...' : 'Duyệt lại ⟳'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Priority Actions */}
        {activeTab === 'priority' && (
          <div className="mt-2">
            {urgent.length > 0 && (
              <div className="space-y-2 mb-2">
                {urgent.map(item => (
                  <div
                    key={item.message}
                    className="flex items-center justify-between gap-3 py-2 px-3 border-l-2 border-rose-500 bg-rose-50/50 text-xs text-rose-900"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle size={13} className="shrink-0 text-rose-600" />
                      <span className="font-medium truncate">{plainText(item.message)}</span>
                    </div>
                    {item.field && (
                      <Link
                        to={editLink(productId, item.field)}
                        className="shrink-0 font-semibold text-rose-700 hover:text-rose-900 text-xs no-underline inline-flex items-center gap-0.5"
                      >
                        <span>Sửa ngay</span>
                        <ArrowRight size={11} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            {actionable.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500">
                <CheckCircle2 size={18} className="text-[#007700] mx-auto mb-1.5" />
                <span className="font-semibold text-stone-800 block">Tuyệt vời! Tin đăng đã đạt chuẩn tối ưu</span>
                <span className="text-[11px] text-stone-400 mt-0.5 block">
                  Không còn việc nào cần sửa gấp. Hãy duy trì cập nhật giá và tồn kho định kỳ.
                </span>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {actionable.slice(0, 3).map((item, idx) => {
                  const label = item.code === 'tags'
                    ? item.message.replace('tag', 'thẻ từ khoá (tag)')
                    : plainText(item.message);

                  return (
                    <div
                      key={item.code ?? item.message}
                      className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-3">
                        <span className="font-mono text-[11px] font-semibold text-stone-400 shrink-0">
                          0{idx + 1}
                        </span>
                        <span className="text-xs font-medium text-stone-800 truncate">
                          {label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Tooltip title="Điểm cộng dự kiến sau khi sửa xong">
                          <span className="cursor-help font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            +{Math.round(item.impact)}đ
                          </span>
                        </Tooltip>

                        <Link
                          to={editLink(productId, item.field)}
                          className="text-xs font-semibold text-stone-800 hover:text-emerald-700 transition-colors no-underline inline-flex items-center gap-0.5"
                        >
                          <span>Sửa</span>
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {reviewTodo && (
              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-start gap-2 text-[11px] text-stone-500">
                <Sparkles size={13} className="shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong className="text-stone-700">Mẹo sản phẩm mới:</strong> Kèm thiệp cảm ơn khi giao hàng để mời khách đánh giá 5★ (+{Math.round(reviewTodo.impact)} điểm).
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Quality Audit */}
        {activeTab === 'audit' && (
          <div className="mt-2">
            {auditLoading ? (
              <div className="space-y-2 py-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-stone-100" />
              </div>
            ) : openIssues.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500">
                <CheckCircle2 size={18} className="text-[#007700] mx-auto mb-1.5" />
                <span className="font-semibold text-stone-800 block">Tin đăng đạt chuẩn kiểm toán</span>
                <span className="text-[11px] text-stone-400 mt-0.5 block">
                  Hình ảnh, tiêu đề, mô tả và chất liệu đều đạt chuẩn hiển thị trên sàn.
                </span>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {openIssues.map((issue) => {
                  const isExpanded = Boolean(expandedIssues[issue.id]);
                  const guide = MINIMAL_GUIDES[issue.code] || {
                    title: issue.message,
                    summary: issue.recommendation.message,
                    tips: [issue.recommendation.verification],
                  };

                  const isImages = issue.code === 'IMAGES_INSUFFICIENT';
                  const count = issue.evidence?.observed_count ?? 1;
                  const minCount = issue.evidence?.expected_min_count ?? 2;

                  return (
                    <div key={issue.id} className="py-2.5 first:pt-1 last:pb-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-stone-900">
                              {guide.title}
                            </span>
                            {isImages && (
                              <span className="rounded bg-stone-100 px-1.5 py-0.2 font-mono text-[10px] text-stone-600">
                                {count}/{minCount} ảnh
                              </span>
                            )}
                            <span className="text-[11px] text-stone-400">
                              · {FIELD_NAMES[issue.field] || issue.field}
                            </span>
                          </div>

                          <p className="m-0 text-xs text-stone-500 leading-snug">
                            {guide.summary}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={() => toggleExpand(issue.id)}
                            className="text-[11px] text-stone-400 hover:text-stone-700 cursor-pointer"
                          >
                            {isExpanded ? 'Đóng' : 'Gợi ý'}
                          </button>

                          <Link
                            to={editLink(productId, issue.field)}
                            className="text-xs font-semibold text-stone-800 hover:text-emerald-700 transition-colors no-underline inline-flex items-center gap-0.5"
                          >
                            <span>Sửa</span>
                            <ArrowRight size={11} />
                          </Link>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 pl-3 border-l-2 border-stone-200 text-xs text-stone-600 space-y-1">
                          {guide.tips.map((tip, idx) => (
                            <p key={idx} className="m-0 leading-relaxed text-stone-600">
                              • {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
        <span>💡 Sau khi lưu thay đổi trên sản phẩm, điểm số và kết quả duyệt sẽ cập nhật lại.</span>
      </div>
    </div>
  );
}
