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
   * Busca cliente pelo CPF no Supabase
   */
  async findCustomerByCpf(cpf: string): Promise<Customer | null> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.findCustomerByCpf(cpf);
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    
    // Busca por CPF com e sem formatação
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`cpf.eq.${cpf},cpf.eq.${cleanCpf}`);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  }

  /**
   * Busca ou cria cliente - retorna existente se CPF já cadastrado
   */
  async findOrCreateCustomer(customerData: Customer): Promise<{ customer: Customer; isExisting: boolean }> {
    // Limpar CPF (remover formatação) antes de salvar
    const cleanCustomerData = {
      ...customerData,
      cpf: customerData.cpf.replace(/\D/g, '')
    };

    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.findOrCreateCustomer(cleanCustomerData);
    }

    // Verificar se cliente já existe pelo CPF
    const existingCustomer = await this.findCustomerByCpf(cleanCustomerData.cpf);

    if (existingCustomer) {
      // Atualiza dados do cliente existente
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({
          name: customerData.name || existingCustomer.name,
          phone: customerData.phone || existingCustomer.phone,
          email: customerData.email || existingCustomer.email
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { customer: updatedCustomer, isExisting: true };
    }

    // Criar novo cliente
    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert([cleanCustomerData])
      .select()
      .single();

    if (insertError) throw insertError;
    return { customer: newCustomer, isExisting: false };
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

    // 1. Buscar cliente existente ou criar novo
    const { customer: customerData } = await this.findOrCreateCustomer(customer);

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
