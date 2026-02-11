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
   * OTIMIZADO: Usa função do banco de dados para melhor performance
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

    console.log('[orderService.getAll] Buscando pedidos no Supabase...');

    // TESTE: Verificar contagens
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count: ticketsCount } = await supabase
      .from('issued_tickets')
      .select('*', { count: 'exact', head: true });
    
    console.log('[orderService.getAll] Contagem direta:', {
      orders: ordersCount,
      issued_tickets: ticketsCount
    });

    // OPÇÃO 1: Tentar usar a função otimizada do banco (melhor performance)
    try {
      const { data: ordersFromFunction, error: functionError } = await supabase
        .rpc('get_orders_complete');

      if (!functionError && ordersFromFunction && ordersFromFunction.length > 0) {
        console.log(`[orderService.getAll] ✅ Usando função otimizada: ${ordersFromFunction.length} pedidos`);
        
        // Buscar issued_tickets separadamente (ainda necessário)
        const { data: allTickets } = await supabase
          .from('issued_tickets')
          .select('*')
          .order('created_at', { ascending: true });

        // Mapear tickets por order_id
        const ticketsByOrderId = new Map<string, any[]>();
        if (allTickets) {
          allTickets.forEach(ticket => {
            if (!ticketsByOrderId.has(ticket.order_id)) {
              ticketsByOrderId.set(ticket.order_id, []);
            }
            ticketsByOrderId.get(ticket.order_id)!.push(ticket);
          });
        }

        // Adicionar issued_tickets aos pedidos
        const ordersWithTickets = ordersFromFunction.map((order: any) => ({
          ...order,
          issued_tickets: ticketsByOrderId.get(order.order_id) || []
        }));

        console.log('[orderService.getAll] Pedidos com tickets mapeados');
        return ordersWithTickets;
      }
    } catch (err) {
      console.warn('[orderService.getAll] Função get_orders_complete não disponível, usando fallback');
    }

    // OPÇÃO 2: Fallback - JOIN automático via FK (se função não existir)
    console.log('[orderService.getAll] Usando fallback (JOIN automático)');
    
    /**
     * Retrieves all orders with their associated customer, event, and issued_tickets data using automatic JOINs.
     * @returns {Promise<Order[]>} An array of complete orders with all relationships loaded.
     */
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, customers(*), events(*), issued_tickets(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[orderService.getAll] Erro ao buscar pedidos:', error);
      throw error;
    }
    
    if (!orders || orders.length === 0) {
      console.log('[orderService.getAll] Nenhum pedido encontrado');
      return [];
    }

    console.log(`[orderService.getAll] ${orders.length} pedidos encontrados com JOINs automáticos`);
    return orders;
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

    // Buscar pedidos com JOINs automáticos via FK
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, customers(*), events(*), issued_tickets(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return orders || [];
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
    console.log('[orderService] Gerando códigos de ingressos...');
    const issuedTickets: Omit<IssuedTicket, 'id' | 'created_at'>[] = [];
    const usedCodes = new Set<string>(); // Evitar duplicatas na mesma compra
    let ticketIndex = 0;
    
    for (const item of cartItems) {
      for (let i = 0; i < item.quantity; i++) {
        // Gerar código único
        let ticketCode: string;
        let attempts = 0;
        do {
          ticketCode = generateTicketCode(order.order_id, ticketIndex);
          attempts++;
          if (attempts > 10) {
            // Adicionar timestamp extra para garantir unicidade
            ticketCode = `${ticketCode}-${Date.now().toString(36)}`;
            break;
          }
        } while (usedCodes.has(ticketCode));
        
        usedCodes.add(ticketCode);
        console.log(`[orderService] Código gerado: ${ticketCode}`);
        
        issuedTickets.push({
          order_id: order.order_id,
          event_id: order.event_id,
          ticket_id: item.ticket_id,
          ticket_code: ticketCode,
          ticket_name: item.ticket_name,
          unit_price: item.unit_price,
          customer_id: customerData.id,
          customer_name: customerData.name,
          validated_at: null
        });
        ticketIndex++;
      }
    }
    
    console.log(`[orderService] Total de ${issuedTickets.length} ingressos gerados`);

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
    console.log('[orderService.create] Criando pedido no Supabase:', order.order_id);
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

    if (orderError) {
      console.error('[orderService.create] Erro ao criar pedido:', orderError);
      throw orderError;
    }
    
    console.log('[orderService.create] Pedido criado com sucesso, ID:', orderData.id);

    // 4. Criar ingressos individuais no Supabase
    console.log(`[orderService.create] Inserindo ${issuedTickets.length} issued_tickets...`);
    console.log('[orderService.create] Primeiro ticket:', issuedTickets[0]);
    
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('issued_tickets')
      .insert(issuedTickets)
      .select();

    if (ticketsError) {
      console.error('[orderService.create] Erro ao criar issued_tickets:', ticketsError);
      // Se for erro de código duplicado, tentar novamente com novos códigos
      if (ticketsError.code === '23505') {
        console.warn('Código duplicado detectado, regenerando códigos...');
        
        // Regenerar todos os códigos com timestamp adicional
        const retriedTickets = issuedTickets.map((ticket, idx) => ({
          ...ticket,
          ticket_code: `${generateTicketCode(order.order_id, idx)}-${Date.now().toString(36)}`
        }));
        
        const { data: retriedData, error: retryError } = await supabase
          .from('issued_tickets')
          .insert(retriedTickets)
          .select();
        
        if (retryError) {
          // Se falhar novamente, deletar o pedido e lançar erro
          await supabase.from('orders').delete().eq('id', orderData.id);
          throw new Error(`Erro ao gerar ingressos: ${retryError.message}`);
        }
        
        // Usar os tickets da retry
        const fullOrder = {
          ...orderData,
          issued_tickets: retriedData || []
        };
        return fullOrder as any;
      }
      
      // Outro erro - deletar pedido e lançar
      await supabase.from('orders').delete().eq('id', orderData.id);
      throw ticketsError;
    }

    console.log(`[orderService.create] ${ticketsData?.length || 0} issued_tickets criados com sucesso`);
    console.log('[orderService.create] IDs dos tickets:', ticketsData?.map(t => t.ticket_code).join(', '));

    // 5. Buscar dados relacionados separadamente (evita RLS)
    const { data: customerInfo } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerData.id)
      .single();

    const { data: eventInfo } = await supabase
      .from('events')
      .select('*')
      .eq('id', order.event_id)
      .single();

    // Montar pedido completo
    const resultOrder = {
      ...orderData,
      customers: customerInfo,
      events: eventInfo,
      issued_tickets: ticketsData || []
    };
    
    console.log('[orderService.create] Pedido completo com', resultOrder.issued_tickets?.length, 'ingressos');
    return resultOrder;
  }
}

export const orderService = new OrderService();
