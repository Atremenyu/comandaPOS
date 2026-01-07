
export type Category = string;

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
}

export interface CartItem extends Product {
  quantity: number;
  note?: string;
}

export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia';
export type OrderStatus = 'pending' | 'delivered';

export interface Order {
  id: string;
  date: string;
  client: string;
  table: string;
  payment: PaymentMethod;
  status: OrderStatus;
  total: number;
  items: CartItem[];
}

export type ViewState = 'pos' | 'dispatch' | 'history' | 'settings';
