import { useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Eye, TrendingUp, AlertTriangle, Activity, RefreshCw } from 'lucide-react';

export function AnalyticsDashboard() {
  const [historyInput, setHistoryInput] = useState('120,135,150,142,168,185,190,175,210,230,225,250');
  const [forecastSteps, setForecastSteps] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forecastData, setForecastData] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  const handleRunForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const historyArr = historyInput.split(',').map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v));
      if (historyArr.length === 0) throw new Error('Xem lại chuỗi số đầu vào (ví dụ: 12,24,35)');

      const fcResult = await analyticsService.getForecasting(historyArr, forecastSteps);

      const chartPoints = historyArr.map((val, idx) => ({
        name: `T-${historyArr.length - 1 - idx}`,
        giatrí: val,
        dựbáo: null as number | null
      }));

      if (chartPoints.length > 0) {
        chartPoints[chartPoints.length - 1].dựbáo = historyArr[historyArr.length - 1];
      }

      fcResult.predictions.forEach((val: number, idx: number) => {
        chartPoints.push({ name: `F+${idx + 1}`, giatrí: null as any, dựbáo: Math.round(val * 100) / 100 });
      });

      setForecastData(chartPoints);

      const hsResult = await analyticsService.getHealthScore({
        seller_id: 'seller_1',
        ratings: [4.5, 4.8, 5.0, 4.2, 5.0],
        cancellation_rate: 0.04,
        orders_volume_history: historyArr
      });
      setHealthScore(hsResult);

      const anomalyResult = await analyticsService.detectAnomalies(historyArr, 1.5);
      setAnomalies(anomalyResult.anomalies);

    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối với API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl glass-panel">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2 text-slate-100">
            <Activity className="h-6 w-6 text-amber-500 animate-pulse" />
            <span>Trung tâm Phân tích AI Analytics</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Dự báo doanh số bằng mô hình học sâu (LSTM) & Đánh giá sức khỏe gian hàng
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-panel border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-amber-500 text-base">Cấu hình tham số</h3>
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
              Dữ liệu lịch sử (cách nhau bằng dấu phẩy)
            </label>
            <textarea
              value={historyInput}
              onChange={(e) => setHistoryInput(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
              placeholder="e.g. 100, 120, 115, 130"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
              Số bước dự báo tiếp theo
            </label>
            <input
              type="number"
              value={forecastSteps}
              onChange={(e) => setForecastSteps(parseInt(e.target.value) || 5)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-amber-500 text-slate-200 text-sm"
              min={1}
              max={12}
            />
          </div>

          <button
            onClick={handleRunForecast}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold p-3.5 rounded-xl transition-all disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <TrendingUp className="h-5 w-5" />}
            <span>Chạy mô hình phân tích</span>
          </button>

          {error && (
            <div className="p-3 bg-red-500/15 border border-red-700/35 rounded-xl flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel border border-slate-800 rounded-2xl p-5 flex items-center space-x-4">
              <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Chỉ số sức khỏe</span>
                <p className="text-2xl font-bold mt-0.5 text-slate-100">
                  {healthScore ? `${healthScore.health_score} / 100` : '--'}
                </p>
                {healthScore && (
                  <span className={`text-xs capitalize ${healthScore.trend_direction === 'upward' ? 'text-emerald-500' : 'text-slate-400'}`}>
                    Xu hướng: {healthScore.trend_direction}
                  </span>
                )}
              </div>
            </div>

            <div className="glass-panel border border-slate-800 rounded-2xl p-5 flex items-center space-x-4">
              <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Bất thường phát hiện</span>
                <p className="text-2xl font-bold mt-0.5 text-slate-100">
                  {anomalies.filter(a => a.is_anomaly).length}
                </p>
                <span className="text-xs text-slate-400">
                  Tổng mẫu kiểm tra: {anomalies.length || '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel border border-slate-800 rounded-2xl p-6 h-96">
            <h3 className="font-semibold text-slate-300 text-sm mb-4">Biểu đồ dự báo chuỗi thời gian (Actual vs LSTM Forecast)</h3>
            <div className="w-full h-80">
              {forecastData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="giatrí" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} name="Doanh số thực tế" />
                    <Line type="monotone" dataKey="dựbáo" stroke="#f43f5e" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4 }} name="Dự báo LSTM" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-400">
                  <TrendingUp className="h-10 w-10 text-slate-600 mb-2" />
                  <p className="text-sm">Chưa có dữ liệu đồ thị. Nhấn nút phân tích để hiển thị.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
