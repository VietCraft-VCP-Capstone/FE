import { useState, useEffect } from 'react';
import { 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Sliders, 
  Trash2,
  HelpCircle,
  Clock
} from 'lucide-react';
import { sellerPrinterService, PrinterPartnerInfo } from '../../services/sellerPrinterService';
import { useToast } from '../../../../shared/components/Toast';

export function PrinterSettingsTab() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; blanksCount?: number } | null>(null);

  const [printerData, setPrinterData] = useState<PrinterPartnerInfo>({
    printer_name: 'VietCraft Print Workshop',
    api_url: 'http://localhost:8880',
    api_key: '',
    is_connected: false,
    auto_approve: false,
  });

  const { showToast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setInitialLoading(true);
    try {
      const res = await sellerPrinterService.getSettings();
      if (res.printer) {
        setPrinterData({
          printer_name: res.printer.printer_name || 'VietCraft Print Workshop',
          api_url: res.printer.api_url || res.defaultApiUrl || 'http://localhost:8880',
          api_key: res.printer.api_key || '',
          is_connected: Boolean(res.printer.is_connected),
          connected_at: res.printer.connected_at,
          auto_approve: Boolean(res.printer.auto_approve),
        });
      }
    } catch (err: any) {
      console.error('Lỗi khi tải cấu hình xưởng in:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!printerData.api_url.trim()) {
      showToast('Vui lòng nhập API URL của xưởng in.', 'error');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await sellerPrinterService.testConnection(printerData.api_url, printerData.api_key);
      setTestResult(result);
      if (result.success) {
        showToast('Kiểm tra kết nối xưởng in thành công!', 'success');
      } else {
        showToast('Không thể kết nối đến xưởng in.', 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Lỗi khi gọi API kiểm tra kết nối.'
      });
      showToast('Kiểm tra kết nối thất bại.', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerData.printer_name.trim()) {
      showToast('Vui lòng nhập tên xưởng in đối tác.', 'error');
      return;
    }
    if (!printerData.api_url.trim()) {
      showToast('Vui lòng nhập URL kết nối của xưởng in.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await sellerPrinterService.connect({
        printer_name: printerData.printer_name.trim(),
        api_url: printerData.api_url.trim(),
        api_key: printerData.api_key?.trim() || undefined,
        auto_approve: printerData.auto_approve,
      });
      setPrinterData({
        ...printerData,
        is_connected: true,
        connected_at: res.printer.connected_at,
      });
      showToast('Đã lưu và liên kết xưởng in thành công!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || 'Lỗi khi liên kết xưởng in.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn ngắt kết nối với xưởng in này không?')) return;
    setLoading(true);
    try {
      await sellerPrinterService.disconnect();
      setPrinterData(prev => ({ ...prev, is_connected: false }));
      showToast('Đã ngắt kết nối xưởng in.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || 'Lỗi khi ngắt kết nối.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-12 text-center text-stone-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#007700]" />
        Đang tải thông tin kết nối xưởng in...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Trạng thái kết nối Banner Card */}
      <div className={`p-6 rounded-2xl border transition-all shadow-sm ${
        printerData.is_connected
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-200'
          : 'bg-stone-50 border-stone-200'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              printerData.is_connected ? 'bg-emerald-600 text-white shadow-md' : 'bg-stone-200 text-stone-600'
            }`}>
              <Printer size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-stone-900 font-jakarta">
                  {printerData.printer_name}
                </h3>
                {printerData.is_connected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đã liên kết
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Chưa kết nối
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-1 flex items-center gap-2 flex-wrap">
                <span>URL: <strong className="text-stone-800 font-mono">{printerData.api_url}</strong></span>
                {printerData.is_connected && printerData.connected_at && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-stone-400" />
                      Kết nối lúc {new Date(printerData.connected_at).toLocaleString('vi-VN')}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            {printerData.is_connected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} />
                Ngắt kết nối
              </button>
            ) : (
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={14} />
                Mở Cổng Xưởng In (Portal)
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 2. Form Cấu hình Xưởng in */}
      <form onSubmit={handleSaveAndConnect} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-stone-100 pb-4">
          <h4 className="text-base font-bold text-stone-900 font-jakarta flex items-center gap-2">
            <Sliders size={18} className="text-[#007700]" />
            Thông số kết nối Hệ thống Xưởng in (Printing System)
          </h4>
          <p className="text-xs text-stone-500 mt-1">
            Khai báo URL API và chứng thực để VietCraft đồng bộ danh mục phôi in và tự động bắn đơn sang xưởng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tên xưởng */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Tên xưởng in đối tác <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={printerData.printer_name}
              onChange={(e) => setPrinterData({ ...printerData, printer_name: e.target.value })}
              placeholder="VD: VietCraft Print Workshop Sài Gòn"
              className="w-full text-sm border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#007700] focus:ring-1 focus:ring-[#007700]"
            />
          </div>

          {/* Endpoint API */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              API Endpoint Xưởng In (Base URL) <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              value={printerData.api_url}
              onChange={(e) => setPrinterData({ ...printerData, api_url: e.target.value })}
              placeholder="http://localhost:8880"
              className="w-full text-sm font-mono border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#007700] focus:ring-1 focus:ring-[#007700]"
            />
            <span className="text-[11px] text-stone-400 mt-1 block">
              Mặc định hệ thống xưởng in local: <code>http://localhost:8880</code>
            </span>
          </div>

          {/* API Key (Tùy chọn) */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Khóa API bí mật (X-API-Key / Token) <span className="text-stone-400 font-normal">(Không bắt buộc với môi trường thử nghiệm)</span>
            </label>
            <input
              type="password"
              value={printerData.api_key}
              onChange={(e) => setPrinterData({ ...printerData, api_key: e.target.value })}
              placeholder="Nhập khóa API do xưởng in cấp cho tài khoản đối tác của bạn"
              className="w-full text-sm font-mono border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#007700] focus:ring-1 focus:ring-[#007700]"
            />
          </div>
        </div>

        {/* 3. Chế độ duyệt đơn hàng (Approval Policy) */}
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[#007700]" />
              Quy trình Duyệt đơn in ấn (Order Dispatch Workflow)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Chế độ 1: Duyệt thủ công */}
            <label 
              onClick={() => setPrinterData({ ...printerData, auto_approve: false })}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                !printerData.auto_approve
                  ? 'bg-emerald-50/50 border-[#007700] ring-1 ring-[#007700]'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <input
                type="radio"
                name="approve_mode"
                checked={!printerData.auto_approve}
                onChange={() => setPrinterData({ ...printerData, auto_approve: false })}
                className="mt-1 text-[#007700] focus:ring-[#007700]"
              />
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  Duyệt thủ công (Khuyên dùng)
                </span>
                <span className="text-[11.5px] text-stone-500 mt-0.5 block leading-relaxed">
                  Khi khách đặt hàng, đơn sẽ chuyển vào mục <strong>"Chờ duyệt"</strong>. Người bán kiểm tra độ sắc nét file in, bấm <strong>"Duyệt đơn"</strong> mới bắn dữ liệu sang xưởng.
                </span>
              </div>
            </label>

            {/* Chế độ 2: Tự động đẩy đơn */}
            <label 
              onClick={() => setPrinterData({ ...printerData, auto_approve: true })}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                printerData.auto_approve
                  ? 'bg-emerald-50/50 border-[#007700] ring-1 ring-[#007700]'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              }`}
            >
              <input
                type="radio"
                name="approve_mode"
                checked={printerData.auto_approve}
                onChange={() => setPrinterData({ ...printerData, auto_approve: true })}
                className="mt-1 text-[#007700] focus:ring-[#007700]"
              />
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  Tự động chuyển xưởng (Auto-dispatch)
                </span>
                <span className="text-[11.5px] text-stone-500 mt-0.5 block leading-relaxed">
                  Ngay khi khách thanh toán thành công (VNPAY/MOMO), hệ thống sẽ tự động kích hoạt đẩy file và đơn sang xưởng in ngay lập tức.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Test Connection Alert Box */}
        {testResult && (
          <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
            testResult.success 
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}>
            {testResult.success ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="font-bold block mb-0.5">
                {testResult.success ? 'Phản hồi từ Xưởng In:' : 'Lỗi kết nối:'}
              </strong>
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        {/* Buttons Action */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || loading}
            className="px-4 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Radio size={14} className={testing ? 'animate-pulse text-amber-600' : 'text-stone-500'} />
            {testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối (Ping Test)'}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#007700] hover:bg-[#005B00] rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Lưu & Kích hoạt Liên kết
          </button>
        </div>
      </form>

      {/* 4. Hướng dẫn Luồng Tích hợp */}
      <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-950">
          <HelpCircle size={16} className="text-amber-700" />
          Quy trình Vận hành In ấn & Logistics liên thông:
        </div>
        <ol className="list-decimal list-inside space-y-1 text-amber-800/90 pl-1 leading-relaxed">
          <li><strong>Khách đặt hàng:</strong> Đơn vào danh sách đơn của bạn với trạng thái <em>Chờ duyệt</em>.</li>
          <li><strong>Người bán duyệt đơn:</strong> Bấm <em>"Duyệt đơn"</em> trong Quản lý đơn để đẩy file in sắc nét sang Cổng Xưởng In.</li>
          <li><strong>Xưởng tiếp nhận & sản xuất:</strong> Thợ in bấm <em>"Duyệt in"</em> và <em>"Đóng gói"</em>, hệ thống tự động báo tiến độ về cho bạn và khách hàng.</li>
          <li><strong>Giao hàng:</strong> Xưởng ủy quyền giao vận qua GHN/GHTK, mã vận đơn được cập nhật trực tiếp vào đơn hàng VietCraft.</li>
        </ol>
      </div>
    </div>
  );
}

export default PrinterSettingsTab;
