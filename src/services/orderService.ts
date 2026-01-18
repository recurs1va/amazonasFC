import { supabase, isSupabaseConfigured } from './supabaseClient';
import { localStorageService } from './localStorageService';
import { Order, Customer, OrderItem } from '../types';

/**
 * Serviço para gerenciamento de pedidos
 */
export class OrderService {
  /**
   * Busca todos os pedidos com relacionamentos
   */
  async getAll(): Promise<Order[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.getOrders();
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(*), events(*), order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca pedidos por evento
   */
  async getByEvent(eventId: number): Promise<Order[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.getOrdersByEvent(eventId);
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(*), events(*), order_items(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Cria um novo pedido com cliente e itens
   */
  async create(
    customer: Customer,
    order: Omit<Order, 'id' | 'created_at' | 'customer_id'>,
    items: OrderItem[]
  ): Promise<Order> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.addOrder(customer, order, items);
    }

    // 1. Criar cliente
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();

    if (customerError) throw customerError;

    // 2. Criar pedido
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{ ...order, customer_id: customerData.id }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 3. Criar itens do pedido
    const itemsWithOrderId = items.map(item => ({
      ...item,
      order_id: orderData.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) throw itemsError;

    // 4. Retornar pedido completo
    const { data: fullOrder, error: fullOrderError } = await supabase
      .from('orders')
      .select('*, customers(*), events(*), order_items(*)')
      .eq('id', orderData.id)
      .single();

    if (fullOrderError) throw fullOrderError;
    return fullOrder;
  }
}

export const orderService = new OrderService();
