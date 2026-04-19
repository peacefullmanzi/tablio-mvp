export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed';

export interface Order {
  id: string;
  restaurantId: string;
  items: CartItem[];
  total: number;
  table_number: string;
  status: OrderStatus;
  created_at: number | Date | unknown; // Unknown allows for Firebase Timestamp compatibility in frontend
}
