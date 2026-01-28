
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

/**
 * Ingresso emitido individualmente
 * Cada compra gera N registros (1 por ingresso)
 */
export interface IssuedTicket {
  id?: number;
  order_id: string;
  event_id: number;
  ticket_id: number;
  ticket_code: string;        // Código único (TKT-XXX-XXXX-X)
  ticket_name: string;
  unit_price: number;
  customer_id?: number;
  customer_name?: string;
  validated_at?: string | null;  // NULL = não validado
  created_at?: string;
}

/**
 * @deprecated Use IssuedTicket instead
 */
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
  issued_tickets?: IssuedTicket[];  // Novo: ingressos individuais
  order_items?: OrderItem[];        // @deprecated - manter para compatibilidade
}

export interface Database {
  public: {
    Tables: {
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at'>;
        Update: Partial<Omit<Event, 'id' | 'created_at'>>;
      };
      tickets: {
        Row: Ticket;
        Insert: Omit<Ticket, 'id' | 'created_at'>;
        Update: Partial<Omit<Ticket, 'id' | 'created_at'>>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id'>;
        Update: Partial<Omit<Customer, 'id'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at'>>;
      };
      issued_tickets: {
        Row: IssuedTicket;
        Insert: Omit<IssuedTicket, 'id' | 'created_at'>;
        Update: Partial<IssuedTicket>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id'>;
        Update: Partial<Omit<OrderItem, 'id'>>;
      };
      validated_tickets: {
        Row: ValidatedTicket;
        Insert: Omit<ValidatedTicket, 'id' | 'created_at' | 'validated_at'>;
        Update: Partial<Omit<ValidatedTicket, 'id' | 'created_at' | 'validated_at'>>;
      };
    };
  };
}

/**
 * @deprecated Use IssuedTicket with validated_at field instead
 */
export interface ValidatedTicket {
  id?: number;
  ticket_code: string;
  order_id: string;
  event_id: number;
  ticket_id: number;
  customer_name: string;
  validated_at?: string;
  created_at?: string;
}

export type Screen = 'login' | 'events-list' | 'tickets' | 'customer' | 'payment' | 'pix' | 'card' | 'tickets-print' | 'success' | 'admin' | 'validate';
