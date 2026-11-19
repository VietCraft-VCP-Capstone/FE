import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Package,
  ShoppingBag,
  Star,
  Sparkles,
  Clock,
  HelpCircle,
  BarChart3,
} from 'lucide-react';
import { Tooltip } from 'antd';
import { decimal } from '../../format';
import type { SellChance } from '../../healthTypes';
import { useInsight } from '../../hooks/useInsight';
import { InsightBlock } from '../InsightBlock';

const METRIC_META: Record<string, { label: string; icon: any; unit: string }> = {
  days_since_last: { label: 'Số ngày từ đơn hàng gần nhất', icon: Calendar, unit: ' ngày' },
  log_sales_90d: { label: 'Số lượng bán 90 ngày qua', icon: Package, unit: ' món' },
  log_sales_180d: { label: 'Số lượng bán 180 ngày qua', icon: Package, unit: ' món' },
  log_seller_sales: { label: 'Tổng sản phẩm shop đã bán (180 ngày)', icon: Package, unit: ' món' },
  log_seller_listings: { label: 'Số sản phẩm đã có đơn của shop', icon: ShoppingBag, unit: ' sp' },
  log_reviews: { label: 'Số lượng đánh giá nhận được', icon: Star, unit: ' đánh giá' },
  rating: { label: 'Điểm đánh giá sao sản phẩm', icon: Star, unit: ' sao' },
  seller_rating: { label: 'Điểm đánh giá uy tín của shop', icon: Star, unit: ' sao' },
};

const ADVICE_META: Record<string, { label: string; unit: string }> = {
  photos: { label: 'Số lượng ảnh chụp', unit: ' ảnh' },
  description_length: { label: 'Độ dài mô tả', unit: ' ký tự' },
  description_words: { label: 'Số từ trong mô tả', unit: ' từ' },
  tags: { label: 'Số lượng thẻ từ khóa', unit: ' tag' },
  name_length: { label: 'Độ dài tên sản phẩm', unit: ' ký tự' },
  seller_ship_days: { label: 'Thời gian giao hàng', unit: ' ngày' },
};

const ABOUT =
  'Mô hình học từ dữ liệu sàn Olist (Brazil), dự đoán sản phẩm có ít nhất 1 đơn trong 90 ngày tới. Con số là thứ hạng so với sản phẩm cùng nhóm trên VietCraft, không phải xác suất. Chưa kiểm tra độ chính xác trên đơn hàng VietCraft.';

function compareInsight(mine: number | null, peer: number | null, unit = '') {
  if (mine === null || peer === null) return { text: 'Chưa đủ dữ liệu', tone: 'neutral' };
  const m = Number(mine);
  const p = Number(peer);
  const diff = m - p;
  if (diff > 0) return { text: `Cao hơn thị trường (+${decimal(diff, 0)}${unit})`, tone: 'good' };
  if (diff < 0) return { text: `Thấp hơn trung vị ngành (${decimal(diff, 0)}${unit})`, tone: 'warn' };
  return { text: `Ngang bằng mức giữa ngành`, tone: 'neutral' };
}

function NotYet() {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-6 text-center space-y-2">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
        <Clock size={20} />
      </div>
      <h3 className="m-0 text-sm font-bold text-stone-900">Chưa đủ dữ liệu dự báo đơn hàng</h3>
      <p className="m-0 mx-auto max-w-md text-xs text-stone-500 leading-relaxed">
        Mô hình học máy cần tối thiểu dữ liệu giao dịch trong 180 ngày hoặc cần ít nhất 5 sản phẩm cùng phân khúc trên sàn có đơn để đưa ra dự báo đối soát chuẩn xác.
      </p>
    </div>
  );
}

function Body({ data }: { data: SellChance }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (data.method === 'cold_start') return <NotYet />;

  const groupName = data.peer_group.type === 'category' ? `ngành "${data.peer_group.name}"` : 'sản phẩm toàn sàn';
  const score = Math.max(0, Math.min(100, data.score));
  const activePct = mounted ? score : 0;
  const advice = data.advice.filter(a => a.current !== null && a.target && ADVICE_META[a.feature]);

  // Rank status tier
  const tierTone = score >= 65 ? 'good' : score >= 35 ? 'mid' : 'low';

  return (
    <div className="space-y-5 animate-slide-up">
      {/* 1. Hero Forecast Banner */}
      <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-br from-white via-stone-50/40 to-emerald-50/20 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#007700]" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Tiềm năng phát sinh đơn hàng (90 ngày tới)
              </span>
              <Tooltip title={ABOUT}>
                <HelpCircle size={13} className="text-stone-400 cursor-help hover:text-stone-700" />
              </Tooltip>
            </div>
            <h3 className="m-0 text-base sm:text-lg font-black tracking-tight text-stone-900 mt-1">
              Khả năng có đơn cao hơn {score}% {groupName}
            </h3>
            <p className="m-0 mt-0.5 text-xs text-stone-500">
              So với {data.peer_group.size} sản phẩm có đơn trong 180 ngày qua.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold border ${
                tierTone === 'good'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : tierTone === 'mid'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <TrendingUp size={12} />
              <span>
                {tierTone === 'good' ? 'Tiềm năng cao' : tierTone === 'mid' ? 'Mức khá ổn' : 'Cần kích cầu'}
              </span>
            </span>
          </div>
        </div>

        {/* Dynamic Percentile Track */}
        <div className="pt-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[11px] font-semibold text-stone-500">Vị thế tương quan:</span>
            <span className="text-xs font-bold text-stone-900 tabular-nums">
              Top {Math.max(1, 100 - score)}% trong nhóm
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-stone-100 relative overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-[#007700] transition-all duration-700 ease-out"
              style={{ width: `${Math.max(4, activePct)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-stone-400 font-medium">
            <span>0% (Thấp)</span>
            <span>50% (Mức giữa nhóm)</span>
            <span>100% (Dẫn đầu)</span>
          </div>
        </div>
      </div>

      {/* 2. Benchmark Comparison Grid (4 Clean Metrics - No text truncation!) */}
      {data.compare.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-stone-500">
              Đối soát các chỉ số vận hành với thị trường
            </h4>
            <span className="text-[11px] text-stone-400">
              So sánh trực tiếp với mức trung vị của nhóm sản phẩm cùng loại
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.compare.map(c => {
              const meta = METRIC_META[c.feature] ?? {
                label: c.feature,
                icon: BarChart3,
                unit: '',
              };
              const Icon = meta.icon;
              const insight = compareInsight(c.value, c.peer_median, meta.unit);

              return (
                <div
                  key={c.feature}
                  className="rounded-xl border border-stone-200/80 bg-white p-3.5 space-y-2 transition-all duration-150 hover:border-stone-300 hover:shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
                      <Icon size={14} />
                    </div>
                    <span className="text-xs font-bold text-stone-900 truncate" title={meta.label}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Gian hàng của bạn</span>
                      <span className="font-black text-stone-900 tabular-nums">
                        {decimal(c.value, 1)}{meta.unit}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-stone-400 block">Trung vị toàn ngành</span>
                      <span className="font-bold text-stone-600 tabular-nums">
                        {decimal(c.peer_median, 1)}{meta.unit}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span
                      className={`text-[11px] font-semibold inline-flex items-center gap-1 ${
                        insight.tone === 'good'
                          ? 'text-emerald-700'
                          : insight.tone === 'warn'
                          ? 'text-amber-800'
                          : 'text-stone-500'
                      }`}
                    >
                      <span>●</span>
                      <span>{insight.text}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Actionable ML Advice Levers if any */}
      {advice.length > 0 && (
        <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#007700]" />
            <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-stone-700">
              Đòn bẩy cải thiện tiềm năng ra đơn
            </h4>
          </div>

          <div className="space-y-2">
            {advice.map(a => {
              const meta = ADVICE_META[a.feature] ?? { label: a.feature, unit: '' };
              const current = a.current ?? 0;
              const target = a.target ?? 1;
              const pct = Math.min(100, Math.round((current / target) * 100));

              return (
                <div
                  key={a.feature}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white border border-stone-200/60 text-xs"
                >
                  <span className="font-bold text-stone-800 min-w-0 truncate">{meta.label}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="h-1.5 w-16 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#007700] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-stone-600 font-medium tabular-nums">
                      {decimal(current, 0)}/{decimal(target, 0)}{meta.unit}
                    </span>
                    {a.gain > 0 && (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-[#007700]">
                        +{Math.round(a.gain * 100)}% theo mô hình
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SellChanceCard({ productId }: { productId: string }) {
  const { state, reload } = useInsight<SellChance>(`/listings/${productId}/health/ml`);
  return (
    <div className="p-1">
      <InsightBlock state={state} onRetry={reload} compact>
        {data => <Body data={data} />}
      </InsightBlock>
    </div>
  );
}
