import type { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { SellerAntd } from '../../../seller/components/SellerAntd';

export function HealthTheme({ children }: { children: ReactNode }) {
  return (
    <SellerAntd>
      <ConfigProvider theme={{ token: { fontFamily: 'Inter, sans-serif', borderRadiusLG: 8, borderRadius: 6 }, components: { Card: { headerFontSize: 15 } } }}>
        {children}
      </ConfigProvider>
    </SellerAntd>
  );
}
