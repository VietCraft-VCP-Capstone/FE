import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';

/**
 * Ant Design nói cùng ngôn ngữ thị giác với phần còn lại của trang quản trị.
 *
 * Các trang admin khác dùng bộ primitive tự viết trên Tailwind (`adminUi.ts`). Nếu thả antd
 * vào với theme mặc định, màu xanh #1677ff và font của nó sẽ khiến trang này trông như ghép
 * từ một ứng dụng khác. Ở đây ánh xạ token antd sang đúng các giá trị trong `tailwind.config.js`
 * — đổi màu ở một chỗ thì phải đổi cả hai.
 */
export function AdminAntd({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1a6b1a',
          colorSuccess: '#1a6b1a',
          colorError: '#dc2626',
          colorText: '#16211a',
          colorTextSecondary: '#384740',
          colorTextTertiary: '#64748b',
          colorTextDescription: '#64748b',
          colorBorder: '#e8ede8',
          colorBorderSecondary: '#f1f4f1',
          colorBgLayout: '#f8fafb',
          colorFillAlter: '#fafcfa',
          borderRadius: 10,
          borderRadiusLG: 12,
          borderRadiusSM: 8,
          fontFamily: '"Plus Jakarta Sans", Inter, system-ui, -apple-system, sans-serif',
          fontSize: 13.5,
          controlHeight: 34,
          // Bóng nhuốm xanh như shadow-admin-* chứ không phải đen thuần.
          boxShadowTertiary: '0 1px 2px rgba(16, 33, 26, 0.04)',
        },
        components: {
          Table: {
            headerBg: '#fafcfa',
            headerColor: '#64748b',
            headerSplitColor: 'transparent',
            rowHoverBg: '#fafdfa',
            cellPaddingBlock: 12,
          },
          Card: { paddingLG: 18 },
          Statistic: { contentFontSize: 34 },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export default AdminAntd;
