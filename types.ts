
export interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string | null;
  created_at?: string;
}

export interface Ticket {
  id: number;
  event_id: number;
  name: string;
  price: number;
  desc: string | null;
  created_at?: string;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  email: string;
  cpf: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  ticket_id: number;
  ticket_name: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id?: number;
  order_id: string;
  customer_id?: number;
  event_id: number;
  total: number;
  payment_method: string;
  created_at?: string;
  customers?: Customer;
  events?: Event;
  order_items?: OrderItem[];
}

export interface Database {
  public: {
    Tables: {
      events: {
        Row: Event;
        Insert: Omit<Event, 'id'>;
        Update: Partial<Omit<Event, 'id'>>;
      };
      tickets: {
        Row: Ticket;
        Insert: Omit<Ticket, 'id'>;
        Update: Partial<Omit<Ticket, 'id'>>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id'>;
        Update: Partial<Omit<Customer, 'id'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id'>;
        Update: Partial<Omit<Order, 'id'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id'>;
        Update: Partial<Omit<OrderItem, 'id'>>;
      };
    };
  };
}

export type Screen = 'login' | 'events-list' | 'tickets' | 'customer' | 'payment' | 'pix' | 'success' | 'admin';
