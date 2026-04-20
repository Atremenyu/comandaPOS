
export type Category = string;

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
  note?: string;
  isPersisted?: boolean;
}

export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia';
export type OrderStatus = 'open' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface KitchenTicket {
  id: string;
  order_id: string;
  items: CartItem[];
  status: 'pending' | 'preparing' | 'ready';
  created_at: string;
  started_at?: string;
  ready_at?: string;
  estimated_time?: number;
}

export interface Order {
  id: string;
  created_at: string;
  client: string;
  table: string;
  payment: PaymentMethod;
  status: OrderStatus;
  total: number;
  items: CartItem[];
  apply_loyalty: boolean;
  apply_discount: boolean;
  loyalty_reward?: string;
  discount_amount?: number;
}

export type ViewState = 'pos' | 'dispatch' | 'history' | 'settings';
