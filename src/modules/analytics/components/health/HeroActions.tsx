import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from 'antd';
import {
  RefreshCw,
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
  title: 'Tên sản phẩm',
  description: 'Mô tả chi tiết',
  images: 'Hình ảnh',
  category_id: 'Ngành hàng',
  categories: 'Ngành hàng',
  price: 'Giá bán',
  tags: 'Từ khoá tìm kiếm',
  materials: 'Chất liệu & thuộc tính',
  variants: 'Phân loại hàng',
};

interface MinimalGuide {
  title: string;
  summary: string;
  tips: string[];
}

const MINIMAL_GUIDES: Record<string, MinimalGuide> = {
  IMAGES_INSUFFICIENT: {
    title: 'Thêm ảnh sản phẩm',
    summary: 'Đăng từ 2–5 ảnh vuông rõ nét giúp khách xem đủ các góc và an tâm bấm mua.',
    tips: [
      'Chụp ảnh cận cảnh đường may, chất vải hoặc tem mác sản phẩm',
      'Ảnh chụp người mẫu mặc thực tế hoặc góc chụp nghiêng 45 độ',
      'Đăng kèm 1 ảnh bảng kích thước (size chart) để khách tự chọn size',
    ],
  },
  TITLE_TOO_SHORT: {
    title: 'Đặt tên sản phẩm dài hơn (Chuẩn tìm kiếm)',
    summary: 'Tên sản phẩm nên từ 40–80 ký tự để khách gõ tìm kiếm là thấy ngay.',
    tips: [
      'Công thức chuẩn sàn: [Tên sản phẩm] + [Chất liệu/Đặc tính] + [Kiểu dáng / Dịp mặc]',
      'Ví dụ: Áo Thun Trơn Cotton 100% Cổ Tròn Form Rộng Unisex',
    ],
  },
  TITLE_EMPTY: {
    title: 'Chưa có tên sản phẩm',
    summary: 'Tên sản phẩm là thông tin bắt buộc để hiển thị khi khách tìm kiếm.',
    tips: ['Nhập tên sản phẩm kèm chất liệu và đặc tính nổi bật nhất.'],
  },
  DESCRIPTION_TOO_SHORT: {
    title: 'Viết thêm mô tả chi tiết',
    summary: 'Mô tả từ 100 từ trở lên giúp khách tự giải đáp thắc mắc mà không cần nhắn hỏi shop.',
    tips: [
      'Nêu rõ bảng số đo kích cỡ (dài áo, ngực, cân nặng phù hợp)',
      'Thành phần chất liệu vải và cảm giác khi mặc/sử dụng',
      'Chính sách đổi trả trong 7 ngày và cam kết hàng đúng mô tả',
    ],
  },
  DESCRIPTION_EMPTY: {
    title: 'Chưa có mô tả sản phẩm',
    summary: 'Khách mua online rất ngại hỏi, hãy ghi rõ kích thước và chất liệu để khách mua luôn.',
    tips: ['Ghi rõ bảng size, chất liệu và hướng dẫn sử dụng/bảo quản.'],
  },
  MISSING_MATERIAL_INFO: {
    title: 'Chưa điền thông tin chất liệu',
    summary: 'Khách mua online luôn muốn biết chất liệu gì trước khi bấm đặt hàng.',
    tips: [
      'Điền rõ loại vải/chất liệu: Cotton 100%, nỉ chân cua, lụa, kaki...',
      'Đặc tính nổi bật: Co giãn 4 chiều, thấm hút mồ hôi, không nhăn xù',
    ],
  },
  MISSING_SIZING_INFO: {
    title: 'Chưa có hướng dẫn chọn size',
    summary: 'Bảng size rõ ràng giúp giảm 50% yêu cầu đổi trả vì khách mặc không vừa.',
    tips: [
      'Ghi bảng size S, M, L, XL kèm chiều cao và cân nặng tương ứng',
      'Hoặc tải 1 ảnh bảng quy đổi kích cỡ vào bộ sưu tập ảnh',
    ],
  },
  MISSING_CARE_INFO: {
    title: 'Chưa có hướng dẫn bảo quản',
    summary: 'Giúp khách dùng bền đẹp và hài lòng để lại đánh giá 5 sao cho shop.',
    tips: ['Ghi rõ cách giặt ủi: giặt máy hay giặt tay, nhiệt độ nước, cách phơi'],
  },
  LOW_IMAGE_RESOLUTION: {
    title: 'Ảnh sản phẩm bị mờ',
    summary: 'Nên dùng ảnh từ 500x500 px trở lên (tốt nhất là 1000x1000 px) để xem sắc nét.',
    tips: ['Tải trực tiếp ảnh gốc từ điện thoại/máy ảnh, tránh ảnh chụp lại màn hình'],
  },
  BLURRY_IMAGE: {
    title: 'Ảnh bị rung hoặc nhoè nét',
    summary: 'Ảnh sắc nét tạo độ uy tín cao và giúp khách cảm nhận được chất lượng vải thật.',
    tips: ['Chụp đủ sáng ban ngày, cố định tay hoặc dùng chân máy'],
  },
  EXTREME_ASPECT_RATIO: {
    title: 'Tỉ lệ ảnh chưa chuẩn khung vuông',
    summary: 'Nên dùng ảnh vuông 1:1 để sản phẩm không bị méo hoặc cắt lệch trên điện thoại.',
    tips: ['Cắt ảnh về khung vuông 1:1 trước khi tải lên, đặt sản phẩm ở chính giữa'],
  },
  MATERIAL_CONTRADICTION: {
    title: 'Thông tin chất liệu chưa đồng nhất',
    summary: 'Tên sản phẩm và mô tả đang ghi 2 chất liệu khác nhau, dễ làm khách hoang mang.',
    tips: ['Thống nhất duy nhất một loại chất liệu chính xác ở cả 2 mục'],
  },
};

type FilterType = 'all' | 'urgent' | 'seo';

export function HeroActions({ data, productId }: HeroActionsProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [auditData, setAuditData] = useState<QualityAuditData | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});

  const todos = visibleTodos(data);
  const urgentWarnings = data.warnings.filter(w => w.type === 'warning');
  const actionableTodos = todos.filter(t => t.field !== null && t.code !== 'review');
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
    } finally {
      setRechecking(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAuditIssues = (auditData?.issues || []).filter(i => i.status === 'open');

  const urgentCount = urgentWarnings.length + openAuditIssues.length;
  const seoCount = actionableTodos.length;
  const totalCount = urgentCount + seoCount;

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Top Header: Simple Friendly Filters & Recheck CTA */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`text-xs font-semibold px-2.5 py-1 rounded transition-all duration-150 active:scale-95 cursor-pointer ${
                filter === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Tất cả ({totalCount})
            </button>

            {urgentCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter('urgent')}
                className={`text-xs font-semibold px-2.5 py-1 rounded transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1 ${
                  filter === 'urgent'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <span>Cần sửa gấp</span>
                <span className="font-mono text-[10px] font-bold">({urgentCount})</span>
              </button>
            )}

            {seoCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter('seo')}
                className={`text-xs font-semibold px-2.5 py-1 rounded transition-all duration-150 active:scale-95 cursor-pointer flex items-center gap-1 ${
                  filter === 'seo'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <span>Gợi ý tăng đơn</span>
                <span className="font-mono text-[10px] font-bold">({seoCount})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {totalImpact > 0 && (
              <Tooltip title="Tổng số điểm shop có thể nhận thêm sau khi hoàn thành các mục">
                <span className="cursor-help font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded transition-transform hover:scale-105">
                  +{totalImpact} điểm
                </span>
              </Tooltip>
            )}

            <button
              type="button"
              disabled={rechecking}
              onClick={handleRecheck}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer disabled:opacity-50 transition-all duration-150 active:scale-95 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded"
              title="Bấm để kiểm tra lại sau khi shop vừa chỉnh sửa sản phẩm"
            >
              <RefreshCw size={11} className={`transition-transform duration-500 ${rechecking ? 'animate-spin text-stone-700' : 'text-stone-500 group-hover:rotate-180'}`} />
              <span>{rechecking ? 'Đang duyệt...' : 'Kiểm tra lại'}</span>
            </button>
          </div>
        </div>

        {/* Action Items List */}
        <div className="mt-2">
          {auditLoading ? (
            <div className="space-y-2 py-3 animate-pulse">
              <div className="h-4 w-3/4 rounded bg-stone-100" />
              <div className="h-4 w-1/2 rounded bg-stone-100" />
            </div>
          ) : totalCount === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500 animate-slide-up">
              <CheckCircle2 size={20} className="text-emerald-600 mx-auto mb-1.5" />
              <span className="font-bold text-stone-800 block">Tin đăng đã đạt chuẩn tối ưu!</span>
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                Không còn mục nào cần sửa. Hãy duy trì cập nhật giá và tồn kho định kỳ.
              </span>
            </div>
          ) : (
            <div key={filter} className="divide-y divide-stone-100 animate-slide-down">
              {/* 1. Urgent Warnings */}
              {(filter === 'all' || filter === 'urgent') &&
                urgentWarnings.map((item) => (
                  <div
                    key={item.message}
                    className="group -mx-2 px-2 py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 rounded hover:bg-stone-50/70 transition-all duration-150"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 shrink-0">
                        Cần sửa
                      </span>
                      <span className="text-xs font-medium text-stone-800 truncate">
                        {plainText(item.message)}
                      </span>
                    </div>

                    {item.field && (
                      <Link
                        to={editLink(productId, item.field)}
                        className="text-xs font-semibold text-rose-700 hover:text-rose-900 transition-colors no-underline inline-flex items-center gap-0.5 shrink-0"
                      >
                        <span>Sửa ngay</span>
                        <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform duration-150" />
                      </Link>
                    )}
                  </div>
                ))}

              {/* 2. Quality Audit Issues (Missing photos, short title, etc.) */}
              {(filter === 'all' || filter === 'urgent') &&
                openAuditIssues.map((issue) => {
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
                    <div
                      key={issue.id}
                      className="group -mx-2 px-2 py-2.5 first:pt-1 last:pb-1 rounded hover:bg-stone-50/70 transition-all duration-150"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 shrink-0">
                              Cần sửa
                            </span>
                            <span className="font-semibold text-stone-900">
                              {guide.title}
                            </span>
                            {isImages && (
                              <span className="rounded bg-stone-100 px-1.5 py-0.2 font-mono text-[10px] text-stone-600">
                                Hiện có {count}/{minCount} ảnh
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
                            className="text-[11px] text-stone-400 hover:text-stone-700 active:scale-95 transition-all duration-150 cursor-pointer"
                          >
                            {isExpanded ? 'Thu gọn' : 'Xem mẹo'}
                          </button>

                          <Link
                            to={editLink(productId, issue.field)}
                            className="text-xs font-semibold text-stone-900 hover:text-emerald-700 transition-colors no-underline inline-flex items-center gap-0.5"
                          >
                            <span>Sửa ngay</span>
                            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform duration-150" />
                          </Link>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 pl-3 border-l-2 border-stone-200 text-xs text-stone-600 space-y-1 animate-expand">
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

              {/* 3. SEO & Conversion Optimization Todos */}
              {(filter === 'all' || filter === 'seo') &&
                actionableTodos.slice(0, 4).map((item) => {
                  const label = item.code === 'tags'
                    ? item.message.replace('tag', 'thẻ từ khoá tìm kiếm')
                    : plainText(item.message);

                  return (
                    <div
                      key={item.code ?? item.message}
                      className="group -mx-2 px-2 flex items-center justify-between py-2.5 first:pt-1 last:pb-1 rounded hover:bg-stone-50/70 transition-all duration-150"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-3">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-mono shrink-0 transition-transform group-hover:scale-105">
                          +{Math.round(item.impact)}đ
                        </span>
                        <span className="text-xs font-medium text-stone-800 truncate">
                          {label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={editLink(productId, item.field)}
                          className="text-xs font-semibold text-stone-800 hover:text-emerald-700 transition-colors no-underline inline-flex items-center gap-0.5"
                        >
                          <span>Sửa</span>
                          <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform duration-150" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Practical E-commerce Tip for New Products */}
          {reviewTodo && (
            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-start gap-2 text-[11px] text-stone-500">
              <Sparkles size={13} className="shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong className="text-stone-700">Mẹo ra đơn đầu tiên:</strong> Đính kèm một card nhỏ hướng dẫn đổi trả kèm mã giảm giá cho đơn sau để khách hài lòng và để lại đánh giá 5★ (+{Math.round(reviewTodo.impact)} điểm).
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
        <span>💡 Sau khi chỉnh sửa sản phẩm và bấm Lưu, bấm nút "Kiểm tra lại" ở góc trên để hệ thống chấm lại điểm ngay.</span>
      </div>
    </div>
  );
}
