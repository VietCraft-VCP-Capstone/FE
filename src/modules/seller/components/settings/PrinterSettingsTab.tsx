import { useState, useEffect } from 'react';
import { 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Trash2, 
  HelpCircle, 
  Building2,
  PlusCircle
} from 'lucide-react';
import { sellerPrinterService, PrinterPartnerInfo } from '../../services/sellerPrinterService';
import { useToast } from '../../../../shared/components/Toast';

export function PrinterSettingsTab() {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; blanksCount?: number } | null>(null);

  const [printingEmail, setPrintingEmail] = useState('');
  const [printingPassword, setPrintingPassword] = useState('');
  const [connectedPrinters, setConnectedPrinters] = useState<PrinterPartnerInfo[]>([]);

  const [printerData, setPrinterData] = useState<PrinterPartnerInfo>({
    printer_name: '',
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
          printer_name: res.printer.printer_name || '',
          api_url: res.printer.api_url || res.defaultApiUrl || 'http://localhost:8880',
          api_key: res.printer.api_key || '',
          seller_printing_email: res.printer.seller_printing_email,
          is_connected: Boolean(res.printer.is_connected),
          connected_at: res.printer.connected_at,
          auto_approve: Boolean(res.printer.auto_approve),
        });
        if (res.printer.seller_printing_email) {
          setPrintingEmail(res.printer.seller_printing_email);
        }
      }
      if (res.printers && Array.isArray(res.printers)) {
        setConnectedPrinters(res.printers);
      } else if (res.printer?.is_connected) {
        setConnectedPrinters([res.printer]);
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

  const handleFillDemoCredentials = () => {
    setPrintingEmail('seller@vietcraft.vn');
    setPrintingPassword('123456');
    setPrinterData(prev => ({
      ...prev,
      api_url: 'http://localhost:8880',
      api_key: 'psk_live_demo_vietcraft_2026',
      printer_name: 'Xưởng In VietCraft Direct Hub'
    }));
    showToast('Đã điền thông tin tài khoản và Key đối tác mẫu!', 'success');
  };

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!printerData.api_url.trim()) {
      showToast('Vui lòng nhập URL kết nối của xưởng in.', 'error');
      return;
    }
    const apiKey = (printerData.api_key || '').trim();
    if (!apiKey) {
      showToast('Vui lòng nhập API Key do xưởng in cấp cho thỏa thuận của bạn.', 'error');
      return;
    }

    setLoading(true);
    try {
      await sellerPrinterService.connect({
        printer_name: printerData.printer_name.trim(),
        api_url: printerData.api_url.trim(),
        api_key: apiKey,
        printing_email: printingEmail.trim(),
        printing_password: printingPassword,
        auto_approve: printerData.auto_approve,
      });
      await fetchSettings();
      showToast('Đã xác thực và liên kết xưởng in thành công!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || err.message || 'Lỗi khi liên kết xưởng in.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (printerId?: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn ngắt kết nối với xưởng in này không?')) return;
    setLoading(true);
    try {
      const res = await sellerPrinterService.disconnect(printerId);
      if (res.printers) {
        setConnectedPrinters(res.printers);
        if (res.printers.length > 0) {
          setPrinterData(res.printers[0]);
        } else {
          setPrinterData(prev => ({ ...prev, is_connected: false }));
        }
      } else {
        await fetchSettings();
      }
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
      {/* 1. Danh sách các xưởng in đối tác đã liên kết */}
      {connectedPrinters.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900 font-jakarta flex items-center gap-2">
                <Building2 className="text-[#007700]" size={20} />
                Danh sách xưởng in đối tác đã liên kết ({connectedPrinters.length})
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Các xưởng in bạn đã đạt thỏa thuận hợp tác và nhập khóa API Key. Khi tạo sản phẩm POD, bạn có thể chọn phôi in của từng xưởng.
              </p>
            </div>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors flex items-center gap-1.5 self-start md:self-center"
            >
              <ExternalLink size={14} />
              Mở Cổng Xưởng In (Portal)
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedPrinters.map((p) => (
              <div 
                key={p.printer_id || p.api_key} 
                className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white flex flex-col justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Printer size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900 leading-snug">{p.printer_name}</h4>
                        <span className="text-[11px] text-stone-500 font-mono">{p.api_url}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Đã liên kết
                    </span>
                  </div>

                  <div className="text-xs text-stone-600 space-y-1.5 bg-white/90 p-3 rounded-lg border border-stone-100">
                    <div className="flex justify-between items-center text-[11.5px]">
                      <span className="text-stone-400">Tài khoản Seller:</span>
                      <strong className="text-stone-800 font-medium">{p.seller_printing_email || 'Tài khoản Seller POD'}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[11.5px]">
                      <span className="text-stone-400">Khóa API Key:</span>
                      <span className="font-mono text-stone-700 font-semibold text-[11px] bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        {p.api_key ? (p.api_key.slice(0, 12) + '...' + p.api_key.slice(-6)) : 'psk_live_...'}
                      </span>
                    </div>
                    {p.connected_at && (
                      <div className="flex justify-between items-center text-[11px] text-stone-400 pt-0.5 border-t border-stone-100">
                        <span>Thời gian kích hoạt:</span>
                        <span>{new Date(p.connected_at).toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-emerald-100/60">
                  <button
                    type="button"
                    onClick={() => handleDisconnect(p.printer_id || p.api_key)}
                    disabled={loading}
                    className="px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    Ngắt kết nối xưởng này
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Form Cấu hình / Thêm xưởng in */}
      <form onSubmit={handleSaveAndConnect} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
        <div className="border-b border-stone-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-stone-900 font-jakarta flex items-center gap-2">
              <PlusCircle size={18} className="text-[#007700]" />
              {connectedPrinters.length > 0 
                ? 'Liên kết thêm xưởng in mới / Cập nhật thỏa thuận' 
                : 'Xác thực & Liên kết Xưởng in (Printify-Style Workflow)'}
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              Bạn có thể hợp tác với nhiều xưởng in khác nhau. Nhập API Key do từng xưởng cấp để tích hợp phôi và đơn hàng.
            </p>
          </div>
          
          <button
            type="button"
            onClick={handleFillDemoCredentials}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-colors self-start md:self-center flex items-center gap-1.5"
          >
            ⚡ Điền tài khoản Demo mẫu
          </button>
        </div>

        {/* Hướng dẫn quy trình Printify */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-1 text-amber-800">
            <HelpCircle size={14} /> Quy trình thỏa thuận và kết nối:
          </div>
          <p className="text-[11.5px]">
            1. Mở <a href="http://localhost:3001" target="_blank" rel="noreferrer" className="underline font-bold text-[#007700]">Cổng Xưởng In (Port 3001)</a> và đăng nhập/đăng ký tài khoản vai trò <strong>Người Bán (Seller)</strong> (bằng Google hoặc Email).<br/>
            2. Vào tab <strong>"Hợp tác xưởng in"</strong> bên Printing Shop ➔ Chọn xưởng và bấm <strong>"Gửi yêu cầu hợp tác"</strong>.<br/>
            3. Chờ xưởng duyệt. Sau khi xưởng duyệt, bạn sẽ nhận được <strong>API Key</strong> riêng.<br/>
            4. Nhập Email và API Key vào bên dưới để xác thực liên kết. <em>(💡 Nếu bạn đăng nhập bên xưởng bằng Google: Bạn <strong>chỉ cần nhập Email Google & API Key</strong>, để trống ô Mật khẩu).</em>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Email tài khoản Printing Shop */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
              <span>Email tài khoản Cổng Xưởng In <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-normal text-stone-500">(Email Google hoặc Email đã đăng ký)</span>
            </label>
            <input
              type="email"
              required
              value={printingEmail}
              onChange={(e) => setPrintingEmail(e.target.value)}
              placeholder="VD: email_cua_ban@gmail.com"
              className="w-full text-sm border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#007700] focus:ring-1 focus:ring-[#007700]"
            />
          </div>

          {/* Mật khẩu tài khoản Printing Shop */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
              <span>Mật khẩu tài khoản Xưởng In</span>
              <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Để trống nếu dùng Google
              </span>
            </label>
            <input
              type="password"
              value={printingPassword}
              onChange={(e) => setPrintingPassword(e.target.value)}
              placeholder="Để trống nếu đăng nhập bằng Google..."
              className="w-full text-sm border border-stone-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#007700] focus:ring-1 focus:ring-[#007700]"
            />
          </div>

          {/* Tên xưởng */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
              <span>Tên xưởng in đối tác</span>
              <span className="text-[11px] font-normal text-stone-400">Tự nhận diện nếu để trống</span>
            </label>
            <input
              type="text"
              value={printerData.printer_name}
              onChange={(e) => setPrinterData({ ...printerData, printer_name: e.target.value })}
              placeholder="Để trống để hệ thống tự lấy tên xưởng..."
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
          </div>

          {/* API Key */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Khóa API Key xưởng cấp <span className="text-rose-500">*</span> <span className="text-stone-400 font-normal">(Sinh ra khi xưởng in phê duyệt thỏa thuận hợp tác)</span>
            </label>
            <input
              type="text"
              required
              value={printerData.api_key}
              onChange={(e) => setPrinterData({ ...printerData, api_key: e.target.value })}
              placeholder="psk_live_..."
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
                  Ngay khi khách thanh toán thành công (VNPAY/PAYOS), hệ thống sẽ tự động kích hoạt đẩy file và đơn sang xưởng in ngay lập tức.
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
