export type SimulatableOrderStatus = 'ORDERED' | 'SHIPPING' | 'DELIVERED';

const nextStatus: Partial<Record<SimulatableOrderStatus, SimulatableOrderStatus>> = {
  ORDERED: 'SHIPPING',
  SHIPPING: 'DELIVERED',
};

const displayStatus: Record<string, SimulatableOrderStatus> = {
  ORDERED: 'ORDERED',
  pending: 'ORDERED',
  paid: 'ORDERED',
  SHIPPING: 'SHIPPING',
  shipping: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  completed: 'DELIVERED',
};

export function getSimulationTarget(orderStatus: string, isSimulationOrder: boolean): SimulatableOrderStatus | undefined {
  if (!isSimulationOrder) return 'SHIPPING';
  const current = displayStatus[orderStatus];
  if (!current) return undefined;
  return nextStatus[current];
}
