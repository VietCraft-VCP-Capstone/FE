import { ArrowDownRight, ArrowUpRight, Minus, Lightbulb, Sparkles } from 'lucide-react';
import type { IntelKeyword, IntelMaterial } from '../../intelTypes';
import { InsightCard } from '../ui';

function TrendBadge({ value }: { value: IntelKeyword['trend'] }) {
  if (value === 'up') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <ArrowUpRight size={12} className="text-emerald-700" />
        <span>Đang tăng tìm kiếm</span>
      </span>
    );
  }
  if (value === 'down') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        <ArrowDownRight size={12} className="text-amber-700" />
        <span>Đang hạ nhiệt</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-600">
      <Minus size={11} className="text-stone-400" />
      <span>Ổn định quanh năm</span>
    </span>
  );
}

function LiftIndicator({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-stone-400">Đang cập nhật</span>;
  }

  if (value >= 0.25) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          Rất phổ biến (Top bán chạy)
        </span>
        <span className="text-[10px] text-stone-400">Khách gõ tìm kiếm nhiều nhất</span>
      </div>
    );
  }

  if (value > 0) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          Phổ biến
        </span>
        <span className="text-[10px] text-stone-400">Xuất hiện đều đặn trong tìm kiếm</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-600">
        Từ khoá phụ / ngách
      </span>
      <span className="text-[10px] text-stone-400">Ít cạnh tranh hơn</span>
    </div>
  );
}

function MaterialBanner({ material }: { material: IntelMaterial }) {
  const found = material.declared.length ? material.declared : material.detected;

  if (found.length > 0 && material.declared.length === 0) {
    return (
      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 text-xs leading-relaxed text-amber-900 flex items-start gap-2.5">
        <Lightbulb size={15} className="shrink-0 text-amber-700 mt-0.5" />
        <div>
          <span className="font-semibold block">Hệ thống phát hiện chất liệu: {found.join(', ')}</span>
          <p className="m-0 mt-0.5 text-stone-600">
            Bạn có nhắc đến chất liệu trong bài viết nhưng chưa điền vào ô "Chất liệu" ở trang sửa sản phẩm. Hãy điền vào để sản phẩm hiển thị khi người mua lọc tìm kiếm theo chất liệu vải.
          </p>
        </div>
      </div>
    );
  }

  if (found.length > 0) {
    return (
      <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 text-xs leading-relaxed text-emerald-900 flex items-center gap-2">
        <span className="font-semibold">✓ Đã xác nhận chất liệu:</span>
        <span className="font-bold text-stone-800">{found.join(', ')}</span>
      </div>
    );
  }

  return null;
}

export function KeywordPanel({
  keywords,
  material,
  bare = false,
}: {
  keywords: IntelKeyword[];
  material: IntelMaterial;
  bare?: boolean;
}) {
  const cleanKeywords = keywords.filter(k => {
    const term = k.term.trim().toLowerCase();
    if (/^\d+$/.test(term)) return false;
    if (term.length <= 2) return false;
    if (['cổ', 'áo', 'tròn'].includes(term)) return false;
    return true;
  });

  return (
    <InsightCard
      bare={bare}
      title="Từ khoá trong Tên & Mô tả"
      info="Phân tích các từ khoá trong bài đăng của bạn so với nhóm sản phẩm bán chạy nhất cùng ngành hàng."
    >
      <div className="space-y-4">
        <MaterialBanner material={material} />

        {/* Practical SEO Title Formula Box */}
        <div className="p-3.5 rounded-lg border border-stone-200 bg-[#FBFBFA]">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
            <Sparkles size={14} className="text-emerald-700" />
            <span>Công thức đặt Tên sản phẩm chuẩn SEO (Dễ lên top tìm kiếm):</span>
          </div>
          <p className="m-0 mt-1.5 font-mono text-xs text-stone-700 bg-white p-2 rounded border border-stone-200">
            [Tên loại sản phẩm] + [Chất liệu nổi bật] + [Kiểu dáng / Đặc tính] + [Đối tượng / Dịp sử dụng]
          </p>
          <p className="m-0 mt-1.5 text-[11px] text-stone-500">
            💡 Ví dụ: <span className="font-medium text-stone-700">Áo Thun Trơn Cổ Tròn Cotton 100% Form Rộng Unisex Nhiều Màu</span>
          </p>
        </div>

        {/* Intuitive Keyword Table */}
        {cleanKeywords.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-500">
            Chưa tìm thấy từ khoá nổi bật trong tiêu đề. Hãy bổ sung thêm các từ khoá như chất liệu, kiểu dáng vào tên sản phẩm.
          </div>
        ) : (
          <div className="border border-stone-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3.5">Từ khoá nhận diện</th>
                  <th className="py-2.5 px-3.5">Mức độ phổ biến khi tìm kiếm</th>
                  <th className="py-2.5 px-3.5">Xu hướng thị trường</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {cleanKeywords.map((k) => (
                  <tr key={k.term} className="hover:bg-stone-50/70 transition-colors duration-150">
                    <td className="py-3 px-3.5 font-semibold text-stone-900">
                      <div className="flex items-center gap-2">
                        <span>{k.term}</span>
                        {k.in_title ? (
                          <span className="font-normal text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                            Có trong tên
                          </span>
                        ) : (
                          <span className="font-normal text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                            Chỉ có ở mô tả
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <LiftIndicator value={k.lift} />
                    </td>
                    <td className="py-3 px-3.5">
                      <TrendBadge value={k.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InsightCard>
  );
}
