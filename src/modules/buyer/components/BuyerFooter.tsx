import '../../../shared/components/layouts.css';
import { Globe } from 'lucide-react';

export function BuyerFooter() {
  return (
    <footer className="buyer-footer-block">
      <div className="footer-layout">
        <div className="footer-col brand-col">
          <h2>VietCraft</h2>
          <p>Nền tảng Print-on-Demand hiện đại kết nối nhà sáng tạo Việt.</p>
        </div>
        <div className="footer-col">
          <h3>MUA SẮM</h3>
          <ul>
            <li><a href="#kham-pha">Khám Phá</a></li>
            <li><a href="#qua-tang">Quà Tặng</a></li>
            <li><a href="#the-qua-tang">Thẻ Quà Tặng</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3>BÁN HÀNG</h3>
          <ul>
            <li><a href="#ban-tren-etsytic">Bán hàng trên Etsytic</a></li>
            <li><a href="#dien-dan">Diễn đàn người bán</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3>VỀ CHÚNG TÔI & TRỢ GIÚP</h3>
          <ul>
            <li><a href="#ve-vietcraft">Về VietCraft</a></li>
            <li><a href="#tro-giup">Trung Tâm Trợ Giúp</a></li>
            <li><a href="#bao-mat">Chính Sách Bảo Mật</a></li>
            <li><a href="#dieu-khoan">Điều Khoản Sử Dụng</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom-row">
        <span>© 2026 VietCraft. Đã đăng ký bản quyền.</span>
        <div className="footer-lang flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
          <Globe size={14} />
          <span>VN | VND</span>
        </div>
      </div>
    </footer>
  );
}

export default BuyerFooter;
