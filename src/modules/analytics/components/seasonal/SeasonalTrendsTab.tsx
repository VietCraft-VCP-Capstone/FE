import { Link } from 'react-router-dom';
import { ChevronRight, Database, FileSpreadsheet } from 'lucide-react';
import type { CampaignRadar, SeasonalCampaign, SeasonalForecast } from '../../types';
import { StlDecompositionChart } from '../charts/StlDecompositionChart';
import { SeasonalRadar } from './SeasonalRadar';

interface SeasonalTrendsTabProps {
  decomposition: SeasonalForecast['decomposition'];
  primaryKeyword?: string;
  activeCamp: SeasonalCampaign;
  radar: CampaignRadar;
}

export function SeasonalTrendsTab({
  decomposition,
  primaryKeyword,
  activeCamp,
  radar,
}: SeasonalTrendsTabProps) {
  const campName = activeCamp.name?.replace(/Lễ Hội |Mùa /gi, '') || 'Chiến dịch';

  return (
    <div className="space-y-6 pt-2">
      {/* Phân rã chuỗi thời gian Google Trends STL */}
      {decomposition ? (
        <div className="space-y-2">
          <StlDecompositionChart
            decomposition={decomposition}
            keyword={primaryKeyword || activeCamp.name || 'Xu hướng mùa vụ'}
          />
          <div className="flex items-center gap-2 px-2 text-[11px] text-stone-500">
            <Database size={13} className="text-emerald-700 shrink-0" />
            <span>
              <strong>Căn cứ thuật toán:</strong> Mô hình phân rã LOESS (STL Decomposition) 52 tuần trích xuất từ dữ liệu tìm kiếm Google Trends Việt Nam. Sóng định kỳ (Seasonal) tách biệt hoàn toàn với xu hướng nền dài hạn (Trend).
            </span>
          </div>
        </div>
      ) : null}

      {/* 2 Cột: Radar biểu đồ mạng nhện + Từ khóa ngách đại diện */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* 6 Cột: Radar tiềm năng 5 trục */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 lg:col-span-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="border-b border-stone-100 pb-3 mb-2 flex items-center justify-between">
              <div>
                <h4 className="m-0 text-sm font-bold text-stone-900">Radar tiềm năng mùa vụ</h4>
                <p className="mb-0 mt-0.5 text-xs text-stone-500">
                  5 trục đối sánh số liệu thực tế so với mặt bằng ngày thường
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#EAF0E2] px-2.5 py-0.5 text-xs font-bold text-[#005B00]">
                Điểm: {radar.overall_score || 81}/100
              </span>
            </div>

            <div className="py-2">
              <SeasonalRadar
                radar={radar}
                campaignName={campName}
              />
            </div>
          </div>
        </div>

        {/* 6 Cột: Bảng minh chứng & Từ khóa ngách */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 lg:col-span-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="border-b border-stone-100 pb-3 mb-3">
              <div className="flex items-center gap-1.5 font-bold text-sm text-stone-900">
                <FileSpreadsheet size={16} className="text-[#007700]" />
                <h4>Bằng chứng nguồn dữ liệu (Data Provenance)</h4>
              </div>
              <p className="mb-0 mt-0.5 text-xs text-stone-500">
                Mọi con số đều được tính toán từ dữ liệu sàn thật, không dùng số liệu giả lập
              </p>
            </div>

            {/* Bảng tóm tắt nguồn cho từng trục */}
            <div className="space-y-2 text-xs">
              {radar.data_provenance?.map((p, idx) => (
                <div key={idx} className="rounded-lg border border-stone-200/80 bg-stone-50/60 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800">{p.axis}</span>
                    <span className="font-semibold text-emerald-800">
                      {p.score}đ <span className="text-stone-400 font-normal">/ nền {p.benchmark}đ</span>
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-stone-600">
                    <span className="font-semibold text-stone-500">Nguồn:</span> {p.source}
                  </div>
                </div>
              ))}
            </div>

            {/* Danh sách từ khóa ngách đại diện */}
            <div className="mt-4 pt-3 border-t border-stone-100">
              <span className="text-xs font-bold text-stone-800 block mb-2">
                Từ khóa ngách có đà tăng trưởng cao nhất:
              </span>
              <div className="flex flex-wrap gap-2">
                {activeCamp.search_keywords?.map((kw, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-800 border border-stone-200"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Link
            to="/seller/insights/radar"
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-100 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-200 transition"
          >
            Mở trang Radar xu hướng toàn ngành <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
