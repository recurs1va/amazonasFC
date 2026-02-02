import { supabase, isSupabaseConfigured } from './supabaseClient';
import { localStorageService } from './localStorageService';
import { Order, Customer, IssuedTicket } from '../types';
import { generateTicketCode } from './issuedTicketService';

/**
 * Item do carrinho para criar pedido
 */
export interface CartItem {
  ticket_id: number;
  ticket_name: string;
  quantity: number;
  unit_price: number;
}

/**
 * Serviço para gerenciamento de pedidos
 */
export class OrderService {
  /**
   * Busca todos os pedidos com relacionamentos
   */
  async getAll(): Promise<Order[]> {
    if (!isSupabaseConfigured || !supabase) {
      const orders = localStorageService.getOrders();
      // Adicionar issued_tickets para cada pedido
      return orders.map((order: any) => ({
        ...order,
        issued_tickets: localStorageService.getIssuedTicketsByOrder(order.order_id)
      }));
    }

    // Buscar pedidos com customers e events
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, customers(*), events(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!orders || orders.length === 0) return [];

    // Buscar issued_tickets para cada pedido
    const ordersWithTickets = await Promise.all(
      orders.map(async (order) => {
        const { data: tickets } = await supabase
          .from('issued_tickets')
          .select('*')
          .eq('order_id', order.order_id);
        
        return {
          ...order,
          issued_tickets: tickets || []
        };
      })
    );

    return ordersWithTickets;
  }

  /**
   * Busca pedidos por evento
   */
  async getByEvent(eventId: number): Promise<Order[]> {
    if (!isSupabaseConfigured || !supabase) {
      const orders = localStorageService.getOrdersByEvent(eventId);
      return orders.map((order: any) => ({
        ...order,
        issued_tickets: localStorageService.getIssuedTicketsByOrder(order.order_id)
      }));
    }

    // Buscar pedidos com customers e events
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, customers(*), events(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!orders || orders.length === 0) return [];

    // Buscar issued_tickets para cada pedido
    const ordersWithTickets = await Promise.all(
      orders.map(async (order) => {
        const { data: tickets } = await supabase
          .from('issued_tickets')
          .select('*')
          .eq('order_id', order.order_id);
        
        return {
          ...order,
          issued_tickets: tickets || []
        };
      })
    );

    return ordersWithTickets;
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
   * Cria um novo pedido com cliente e ingressos individuais
   */
  async create(
    customer: Customer,
    order: Omit<Order, 'id' | 'created_at' | 'customer_id'>,
    cartItems: CartItem[]
  ): Promise<Order> {
    // 1. Buscar cliente existente ou criar novo
    const { customer: customerData } = await this.findOrCreateCustomer(customer);

    // 2. Gerar ingressos individuais a partir do carrinho
    const issuedTickets: Omit<IssuedTicket, 'id' | 'created_at'>[] = [];
    let ticketIndex = 0;
    
    for (const item of cartItems) {
      for (let i = 0; i < item.quantity; i++) {
        issuedTickets.push({
          order_id: order.order_id,
          event_id: order.event_id,
          ticket_id: item.ticket_id,
          ticket_code: generateTicketCode(order.order_id, ticketIndex),
          ticket_name: item.ticket_name,
          unit_price: item.unit_price,
          customer_id: customerData.id,
          customer_name: customerData.name,
          validated_at: null
        });
        ticketIndex++;
      }
    }

    if (!isSupabaseConfigured || !supabase) {
      // Modo localStorage
      const orders = localStorageService.getOrders();
      const newOrder = {
        ...order,
        customer_id: customerData.id,
        created_at: new Date().toISOString(),
        customers: customerData,
        events: localStorageService.getEvents().find((e: any) => e.id === order.event_id)
      };
      localStorageService.saveOrders([...orders, newOrder]);
      
      // Salvar ingressos individuais
      const savedTickets = localStorageService.addIssuedTickets(issuedTickets);
      
      return {
        ...newOrder,
        issued_tickets: savedTickets
      };
    }

    // 3. Criar pedido no Supabase
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{ 
        order_id: order.order_id,
        customer_id: customerData.id,
        event_id: order.event_id,
        total: order.total,
        payment_method: order.payment_method
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. Criar ingressos individuais no Supabase
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('issued_tickets')
      .insert(issuedTickets)
      .select();

    if (ticketsError) throw ticketsError;

    // 5. Buscar pedido completo com issued_tickets
    const { data: fullOrder, error: fullOrderError } = await supabase
      .from('orders')
      .select('*, customers(*), events(*)')
      .eq('id', orderData.id)
      .single();

    if (fullOrderError) throw fullOrderError;

    // Adicionar issued_tickets manualmente
    return {
      ...fullOrder,
      issued_tickets: ticketsData || []
    };
  }
}

export const orderService = new OrderService();
