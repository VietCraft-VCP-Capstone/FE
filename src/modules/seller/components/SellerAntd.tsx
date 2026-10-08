import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';

/**
 * Ant Design theo ngôn ngữ thị giác của khu người bán.
 *
 * Khu người bán dựng bằng Tailwind với nền stone và #007700 là màu nhấn duy nhất (xem
 * SellerOrdersUi). Thả antd vào với theme mặc định thì nút xanh #1677ff và font của nó
 * sẽ lệch hẳn; ở đây ánh xạ token antd sang đúng các giá trị đó. Đổi màu thương hiệu thì
 * đổi cả hai nơi.
 */
export function SellerAntd({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#007700',
          colorSuccess: '#007700',
          colorWarning: '#b45309',
          colorError: '#b91c1c',
          colorLink: '#007700',
          colorText: '#1c1917',
          colorTextSecondary: '#57534e',
          colorTextTertiary: '#78716c',
          colorTextDescription: '#78716c',
          colorBorder: '#e7e5e4',
          colorBorderSecondary: '#f5f5f4',
          colorBgLayout: '#fafaf9',
          colorFillAlter: '#fafaf9',
          borderRadius: 8,
          borderRadiusLG: 16,
          borderRadiusSM: 6,
          fontFamily: '"Plus Jakarta Sans", Inter, system-ui, -apple-system, sans-serif',
          fontSize: 13.5,
          controlHeight: 36,
          // Bóng nhuộm tông stone, không đen thuần.
          boxShadowTertiary: '0 1px 2px rgba(41, 37, 36, 0.04)',
        },
        components: {
          Table: {
            headerBg: '#ffffff',
            headerColor: '#78716c',
            headerSplitColor: 'transparent',
            rowHoverBg: '#fafaf9',
            cellPaddingBlock: 14,
          },
          Drawer: { footerPaddingBlock: 14, footerPaddingInline: 20 },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export default SellerAntd;
