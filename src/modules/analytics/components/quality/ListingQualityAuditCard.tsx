import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { analyticsApi } from '../../services/analyticsApi';
import { editLink } from '../HealthParts';
import type { QualityAuditData } from '../../qualityTypes';

interface Props {
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

export function ListingQualityAuditCard({ productId }: Props) {
  const [data, setData] = useState<QualityAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rechecking, setRechecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});

  const loadAudit = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsApi.listingQuality(productId);
      if (res?.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Không thể tải kết quả kiểm toán chất lượng.');
    } finally {
      setLoading(false);
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
      setError(null);
      const res = await analyticsApi.listingQualityRecheck(productId);
      if (res?.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi kiểm tra lại chất lượng.');
    } finally {
      setRechecking(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-20 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const issues = data.issues || [];
  const openIssues = issues.filter(i => i.status === 'open');

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Chất lượng tin đăng
          </span>
          {openIssues.length === 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-[#007700]">
              <CheckCircle2 size={12} />
              Đạt chuẩn
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              {openIssues.length} cần hoàn thiện
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={rechecking}
          onClick={handleRecheck}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors disabled:opacity-50 cursor-pointer"
          title="Kiểm tra lại sau khi bạn cập nhật sản phẩm"
        >
          <RefreshCw size={12} className={rechecking ? 'animate-spin' : ''} />
          <span>{rechecking ? 'Đang kiểm tra...' : 'Kiểm tra lại'}</span>
        </button>
      </div>

      <div className="mt-2 divide-y divide-stone-100">
        {openIssues.length === 0 ? (
          <div className="py-3 text-xs text-stone-500 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#007700]" />
            <span>Tin đăng đầy đủ thông tin, hình ảnh và đạt chuẩn hiển thị.</span>
          </div>
        ) : (
          openIssues.map((issue) => {
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
              <div key={issue.id} className="py-3 first:pt-2 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
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

                    <p className="m-0 text-xs text-stone-500 leading-relaxed">
                      {guide.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => toggleExpand(issue.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-stone-500 hover:text-stone-800 rounded hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      <span className="text-[11px]">{isExpanded ? 'Đóng' : 'Gợi ý'}</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    <Link
                      to={editLink(productId, issue.field)}
                      className="inline-flex items-center gap-1 rounded bg-[#007700] hover:bg-[#005B00] px-2.5 py-1 text-xs font-semibold text-white no-underline transition-colors"
                    >
                      <span>Sửa</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2.5 rounded-lg bg-stone-50/70 p-3 text-xs text-stone-600 space-y-1.5 border border-stone-100">
                    <span className="font-semibold text-stone-700 block text-[11px] uppercase tracking-wider">
                      Gợi ý bổ sung:
                    </span>
                    <ul className="m-0 list-disc pl-4 space-y-1">
                      {guide.tips.map((tip, idx) => (
                        <li key={idx} className="leading-snug text-stone-600">
                          {tip}
                        </li>
                      ))}
                    </ul>
                    <span className="block pt-1 text-[11px] text-stone-400">
                      Sau khi cập nhật trên trang sửa, bấm "Kiểm tra lại" để ghi nhận đạt chuẩn.
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
