import '../../../shared/components/layouts.css';

export function BuyerFooter() {
  return (
    <footer className="buyer-footer-block">
      <div className="footer-layout">
        <div className="footer-col brand-col">
          <h2>VietCraft</h2>
          <p>Nền tảng Print-on-Demand kết nối nghệ thuật với đời sống của người sáng tạo Việt.</p>
          <p className="copyright">© 2026 VietCraft. Bản quyền thuộc về nghệ nhân Việt Nam.</p>
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
            <li><a href="#ban-tren-vietcraft">Bán hàng trên VietCraft</a></li>
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
    </footer>
  );
}

export default BuyerFooter;
