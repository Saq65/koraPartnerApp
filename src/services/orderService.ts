export interface OrderItem {
  id: string;
  status: 'pending' | 'in_progress' | 'completed';
  customerName: string;
}

export async function fetchOrders(): Promise<OrderItem[]> {
  return [];
}

export async function fetchOrderById(orderId: string): Promise<OrderItem | null> {
  return null;
}
