import type { ReactNode } from 'react';
import { AlertTriangle, Scale, Sparkles, Store, User } from 'lucide-react';
import type { DisputeAuditProfile } from '../services/returnService';
import { reputationTier } from '../../../shared/utils/reputationTier';

const box = 'rounded-xl bg-stone-50/70 p-3.5 border border-stone-200/80 space-y-1.5';

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex justify-between text-stone-600"><span>{label}</span>{children}</div>
);

export function DisputeAuditCard({ profile }: { profile: DisputeAuditProfile }) {
  const { shop, buyer } = profile;
  const tier = reputationTier(shop?.reputation_tier);

  return (
    <div className="my-3 rounded-2xl border border-stone-200 bg-white p-4 text-xs sm:text-sm shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
        <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
          <Scale size={17} className="text-emerald-800" /> Hồ Sơ Đối Soát Tranh Chấp & Căn Cứ Phân Xử
        </h3>
        {shop && (
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tier.badge}`}>
            Phân cấp Shop: {shop.reputation_tier === 'RESTRICTED' ? 'Hạn Chế / Nguy Cơ Cao' : tier.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={box}>
          <p className="font-semibold text-stone-900 flex items-center gap-1.5">
            <Store size={15} className="text-stone-700" /> Người bán: {shop?.shop_name || 'Gian hàng'}
          </p>
          <Row label="Điểm Uy Tín (SRS):"><strong className="text-emerald-700 font-jakarta">{shop?.reputation_score ?? 80} / 100</strong></Row>
          <Row label="Chuỗi đơn:"><span>{shop?.clean_streak_orders ?? 0} / 10 đơn</span></Row>
          <Row label="Khiếu nại trong 30 ngày:">
            <span className={shop && shop.dispute_count_30d > 2 ? 'text-rose-600 font-bold' : ''}>{shop?.dispute_count_30d ?? 0} đơn</span>
          </Row>
          <Row label="Điểm phạt tích lũy:"><span className="text-stone-500">{shop?.penalty_points_30d ?? 0} điểm</span></Row>
        </div>

        <div className={box}>
          <p className="font-semibold text-stone-900 flex items-center gap-1.5">
            <User size={15} className="text-stone-700" /> Khách mua hàng
          </p>
          <Row label="Đơn giao thành công:"><strong>{buyer.total_delivered_orders} đơn</strong></Row>
          <Row label="Yêu cầu đổi/hoàn:"><span>{buyer.total_return_requests} lần</span></Row>
          <Row label="Tỷ lệ hoàn trả:">
            <span className={buyer.is_flagged_for_abuse ? 'text-rose-600 font-bold' : ''}>{buyer.dispute_rate_pct}%</span>
          </Row>
          {buyer.is_flagged_for_abuse && (
            <p className="mt-1 rounded bg-rose-50 p-2 text-xs text-rose-700 font-medium flex items-center gap-1.5">
              <AlertTriangle size={14} className="shrink-0 text-rose-600" />
              <span>
                {buyer.total_delivered_orders === 0
                  ? 'Cảnh báo: Khách chưa có đơn hoàn tất nhưng đã mở nhiều yêu cầu đổi/hoàn trả.'
                  : 'Cảnh báo: Khách có tỷ lệ hoàn trả bất thường (>25%).'}
              </span>
            </p>
          )}
        </div>
      </div>

      {shop?.recommendation && (
        <div className="mt-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-3 text-xs text-emerald-950 flex items-start gap-2">
          <Sparkles size={16} className="text-emerald-700 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Gợi ý phân xử hệ thống: </span>
            <span>{shop.recommendation}</span>
          </div>
        </div>
      )}
    </div>
  );
}
