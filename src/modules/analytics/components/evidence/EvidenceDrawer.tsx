import React from 'react';
import { Drawer } from 'antd';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  HelpCircle,
  Layers,
  Scale,
  ShieldCheck,
  TrendingDown,
  X,
} from 'lucide-react';
import type { Evidence } from '../../types/evidence';
import { ConfidenceBadge } from './ConfidenceBadge';

interface Props {
  evidence: Evidence | null;
  open: boolean;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<Props> = ({ evidence, open, onClose }) => {
  if (!evidence) return null;

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between pr-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#007700]" />
            <span className="font-bold text-stone-900 text-base">
              Con số này từ đâu ra?
            </span>
          </div>
          <ConfidenceBadge level={evidence.confidence} />
        </div>
      }
      placement="right"
      width={560}
      open={open}
      onClose={onClose}
      destroyOnClose
      closeIcon={<X size={18} className="text-stone-500" />}
      styles={{
        header: { borderBottom: '1px solid #e7e5e4', padding: '16px 20px' },
        body: { padding: '20px', background: '#fafaf9' },
      }}
    >
      <div className="space-y-4">
        {/* Lời hứa minh bạch */}
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 leading-relaxed">
          <strong>Cam kết minh bạch của VietCraft:</strong> Mọi con số seller nhìn thấy đều có nguồn gốc rõ ràng, công thức tính có thể tự kiểm tra, và nói thẳng các rủi ro có thể làm số liệu bị lệch.
        </div>

        {/* 11 Mục cố định */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-5 text-sm">
          {/* Mục 1 */}
          <div className="space-y-1 border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <HelpCircle size={16} className="text-stone-500" />
              <span>1. Con số này là gì?</span>
            </div>
            <p className="text-stone-700 pl-6 text-xs sm:text-sm">{evidence.definition}</p>
          </div>

          {/* Mục 2 */}
          <div className="space-y-1 border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <Database size={16} className="text-stone-500" />
              <span>2. Lấy từ đâu?</span>
            </div>
            <div className="pl-6 space-y-1 text-xs sm:text-sm">
              <div className="flex flex-wrap gap-1.5 pt-1">
                {evidence.sources.map((src, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-800"
                  >
                    {src}
                  </span>
                ))}
              </div>
              <p className="text-stone-600 text-xs mt-1">{evidence.howObtained}</p>
            </div>
          </div>

          {/* Mục 3 */}
          <div className="space-y-1 border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <Layers size={16} className="text-stone-500" />
              <span>3. Đã loại bỏ những gì?</span>
            </div>
            <p className="text-stone-700 pl-6 text-xs sm:text-sm">
              {evidence.excluded || 'Đã loại trừ đơn hàng bị hủy, trả hàng, giao không thành công và các ngày sản phẩm bị hết hàng.'}
            </p>
          </div>

          {/* Mục 4 */}
          <div className="space-y-1 border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <Calendar size={16} className="text-stone-500" />
              <span>4. Trong khoảng thời gian nào, bao nhiêu đơn?</span>
            </div>
            <div className="pl-6 text-xs sm:text-sm space-y-0.5 text-stone-700">
              <p>
                <strong>Khoảng thời gian:</strong> {evidence.period[0]} đến {evidence.period[1]}
              </p>
              <p>
                <strong>Cỡ mẫu (n):</strong> {evidence.n.toLocaleString('vi-VN')} đơn hàng thực tế
              </p>
            </div>
          </div>

          {/* Mục 5 */}
          <div className="space-y-1 border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <Scale size={16} className="text-stone-500" />
              <span>5. Tính như thế nào?</span>
            </div>
            <div className="pl-6 text-xs sm:text-sm text-stone-700 space-y-1">
              <div className="rounded-lg bg-stone-50 p-2.5 font-mono text-xs text-stone-800 border border-stone-200/80">
                {evidence.formula}
              </div>
            </div>
          </div>

          {/* Mục 6 */}
          {evidence.interval && (
            <div className="space-y-1 border-b border-stone-100 pb-3.5">
              <div className="flex items-center gap-2 font-semibold text-stone-900">
                <TrendingDown size={16} className="text-stone-500" />
                <span>6. Dao động trong khoảng nào?</span>
              </div>
              <div className="pl-6 text-xs sm:text-sm text-stone-700">
                <p>
                  Ước tính từ <strong>{evidence.interval.low.toLocaleString('vi-VN')}</strong> đến{' '}
                  <strong>{evidence.interval.high.toLocaleString('vi-VN')}</strong>.
                </p>
                <p className="text-stone-500 text-xs mt-0.5">
                  (Trong 10 lần, khoảng dao động này chứa số thật khoảng{' '}
                  {Math.round(evidence.interval.coverage * 10)} lần)
                </p>
              </div>
            </div>
          )}

          {/* Mục 7 */}
          <div className="space-y-1 border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <CheckCircle2 size={16} className="text-[#007700]" />
              <span>7. Độ tin cậy:</span>
              <ConfidenceBadge level={evidence.confidence} />
            </div>
            <p className="text-stone-700 pl-6 text-xs sm:text-sm">{evidence.confidenceReason}</p>
          </div>

          {/* Mục 8 */}
          {evidence.comparison && (
            <div className="space-y-1 border-b border-stone-100 pb-3.5">
              <div className="flex items-center gap-2 font-semibold text-stone-900">
                <Scale size={16} className="text-stone-500" />
                <span>8. So với gì?</span>
              </div>
              <p className="text-stone-700 pl-6 text-xs sm:text-sm">{evidence.comparison}</p>
            </div>
          )}

          {/* Mục 9 */}
          <div className="space-y-1 border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>9. Có thể sai vì sao?</span>
            </div>
            <ul className="pl-6 list-disc list-inside text-xs sm:text-sm text-stone-700 space-y-1">
              {evidence.mayBeWrongBecause.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>

          {/* Mục 10 */}
          <div className="space-y-1 border-b border-stone-100 pb-3.5">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <Calendar size={16} className="text-stone-500" />
              <span>10. Cập nhật khi nào, bản mô hình nào?</span>
            </div>
            <p className="text-stone-700 pl-6 text-xs sm:text-sm">
              Cập nhật ngày <strong>{evidence.updatedAt}</strong>
              {evidence.modelVersion && ` · Phiên bản: ${evidence.modelVersion}`}
            </p>
          </div>

          {/* Mục 11 */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <FileSpreadsheet size={16} className="text-stone-500" />
              <span>11. Xem dữ liệu gốc</span>
            </div>
            <div className="pl-6 pt-1">
              {evidence.rawDataUrl ? (
                <a
                  href={evidence.rawDataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007700] hover:underline"
                >
                  <FileSpreadsheet size={14} />
                  <span>Tải danh sách đơn hàng đã tổng hợp ẩn danh (CSV)</span>
                </a>
              ) : (
                <span className="text-xs text-stone-500">
                  Dữ liệu sàn được tổng hợp ẩn danh (k ≥ 10 shop) để bảo vệ quyền riêng tư kinh doanh.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
