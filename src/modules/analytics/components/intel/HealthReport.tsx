import type { ReactNode } from 'react';
import type { ListingIntel } from '../../intelTypes';
import { HealthChecklist } from './HealthChecklist';
import { HowScored } from './HowScored';
import { PartTabs } from './PartTabs';
import { SeasonPanel } from './SeasonPanel';
import { SummaryBand } from './SummaryBand';

export function HealthReport({ data, productId, datePicker, compact = false }: {
  data: ListingIntel;
  productId?: string;
  datePicker?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      <SummaryBand data={data} compact={compact} />
      <div className={compact ? 'grid gap-4' : 'grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]'}>
        <HealthChecklist data={data} productId={productId} withReviews={Boolean(productId)} />
        <SeasonPanel points={data.score_timeline}>{datePicker}</SeasonPanel>
      </div>
      <PartTabs data={data} productId={productId} />
      <HowScored data={data} />
    </div>
  );
}
