/**
 * Serviço para armazenamento local de dados
 * Utilizado quando o Supabase não está configurado
 */

const STORAGE_KEYS = {
  EVENTS: 'amazonasFC_events',
  TICKETS: 'amazonasFC_tickets',
  ORDERS: 'amazonasFC_orders',
  CUSTOMERS: 'amazonasFC_customers',
  VALIDATED_TICKETS: 'amazonasFC_validated_tickets',
  ISSUED_TICKETS: 'amazonasFC_issued_tickets',
};

export class LocalStorageService {
  /**
   * Salva dados no localStorage
   */
  private save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }

  /**
   * Carrega dados do localStorage
   */
  private load<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      return defaultValue;
    }
  }

  // EVENTOS
  getEvents(): any[] {
    return this.load(STORAGE_KEYS.EVENTS, []);
  }

  saveEvents(events: any[]): void {
    this.save(STORAGE_KEYS.EVENTS, events);
  }

  addEvent(event: any): any {
    const events = this.getEvents();
    const newId = Math.max(...events.map((e: any) => e.id), 0) + 1;
    const newEvent = { ...event, id: newId, created_at: new Date().toISOString() };
    this.saveEvents([...events, newEvent]);
    return newEvent;
  }

  updateEvent(id: number, event: any): any {
    const events = this.getEvents();
    const updatedEvents = events.map((e: any) => 
      Number(e.id) === Number(id) ? { ...e, ...event } : e
    );
    this.saveEvents(updatedEvents);
    return updatedEvents.find((e: any) => Number(e.id) === Number(id));
  }

  deleteEvent(id: number): void {
    console.log('deleteEvent chamado com id:', id, 'tipo:', typeof id);
    const events = this.getEvents();
    console.log('Eventos antes de deletar:', events);
    const filtered = events.filter((e: any) => {
      const match = Number(e.id) !== Number(id);
      console.log(`Comparando e.id=${e.id} (${typeof e.id}) com id=${id} (${typeof id}): manter=${match}`);
      return match;
    });
    console.log('Eventos após filtrar:', filtered);
    this.saveEvents(filtered);
  }

  // INGRESSOS
  getTickets(): any[] {
    return this.load(STORAGE_KEYS.TICKETS, []);
  }

  saveTickets(tickets: any[]): void {
    this.save(STORAGE_KEYS.TICKETS, tickets);
  }

  addTicket(ticket: any): any {
    const tickets = this.getTickets();
    const newId = Math.max(...tickets.map((t: any) => t.id), 0) + 1;
    const newTicket = { ...ticket, id: newId, created_at: new Date().toISOString() };
    this.saveTickets([...tickets, newTicket]);
    return newTicket;
  }

  updateTicket(id: number, ticket: any): any {
    const tickets = this.getTickets();
    const updatedTickets = tickets.map((t: any) => 
      Number(t.id) === Number(id) ? { ...t, ...ticket } : t
    );
    this.saveTickets(updatedTickets);
    return updatedTickets.find((t: any) => Number(t.id) === Number(id));
  }

  deleteTicket(id: number): void {
    const tickets = this.getTickets();
    this.saveTickets(tickets.filter((t: any) => Number(t.id) !== Number(id)));
  }

  // CLIENTES
  getCustomers(): any[] {
    return this.load(STORAGE_KEYS.CUSTOMERS, []);
  }

  saveCustomers(customers: any[]): void {
    this.save(STORAGE_KEYS.CUSTOMERS, customers);
  }

  /**
   * Busca cliente pelo CPF (remove formatação para comparar)
   */
  findCustomerByCpf(cpf: string): any | null {
    const cleanCpf = cpf.replace(/\D/g, '');
    const customers = this.getCustomers();
    return customers.find((c: any) => c.cpf.replace(/\D/g, '') === cleanCpf) || null;
  }

  /**
   * Busca ou cria cliente - retorna existente se CPF já cadastrado
   */
  findOrCreateCustomer(customerData: any): { customer: any; isExisting: boolean } {
    // Limpar CPF (remover formatação) antes de salvar
    const cleanCustomerData = {
      ...customerData,
      cpf: customerData.cpf.replace(/\D/g, '')
    };

    const existingCustomer = this.findCustomerByCpf(cleanCustomerData.cpf);
    
    if (existingCustomer) {
      // Atualiza dados do cliente existente se necessário
      const updatedCustomer = {
        ...existingCustomer,
        name: cleanCustomerData.name || existingCustomer.name,
        phone: cleanCustomerData.phone || existingCustomer.phone,
        email: cleanCustomerData.email || existingCustomer.email
      };
      this.updateCustomer(existingCustomer.id, updatedCustomer);
      return { customer: updatedCustomer, isExisting: true };
    }
    
    const newCustomer = this.addCustomer(cleanCustomerData);
    return { customer: newCustomer, isExisting: false };
  }

  updateCustomer(id: number, customer: any): any {
    const customers = this.getCustomers();
    const updatedCustomers = customers.map((c: any) => 
      Number(c.id) === Number(id) ? { ...c, ...customer } : c
    );
    this.saveCustomers(updatedCustomers);
    return updatedCustomers.find((c: any) => Number(c.id) === Number(id));
  }

  addCustomer(customer: any): any {
    const customers = this.getCustomers();
    const newId = Math.max(...customers.map((c: any) => c.id), 0) + 1;
    const newCustomer = { ...customer, id: newId, created_at: new Date().toISOString() };
    this.saveCustomers([...customers, newCustomer]);
    return newCustomer;
  }

  // PEDIDOS
  getOrders(): any[] {
    return this.load(STORAGE_KEYS.ORDERS, []);
  }

  saveOrders(orders: any[]): void {
    this.save(STORAGE_KEYS.ORDERS, orders);
  }

  addOrder(customerData: any, order: any, items: any[]): any {
    // Buscar cliente existente ou criar novo
    const { customer } = this.findOrCreateCustomer(customerData);

    // Criar pedido
    const orders = this.getOrders();
    const newOrderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Gerar issued_tickets a partir dos itens do carrinho
    const issuedTickets: any[] = [];
    let ticketIndex = 0;
    
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        const ticketCode = this.generateTicketCode(newOrderId, ticketIndex);
        issuedTickets.push({
          order_id: newOrderId,
          event_id: order.event_id,
          ticket_id: item.ticket_id,
          ticket_code: ticketCode,
          ticket_name: item.ticket_name,
          unit_price: item.unit_price,
          customer_id: customer.id,
          customer_name: customer.name,
          validated_at: null
        });
        ticketIndex++;
      }
    });
    
    // Salvar issued_tickets
    this.addIssuedTickets(issuedTickets);
    
    const newOrder = {
      ...order,
      order_id: newOrderId,
      customer_id: customer.id,
      created_at: new Date().toISOString(),
      customers: customer,
      issued_tickets: issuedTickets,
    };

    // Adicionar relacionamento com evento
    const events = this.getEvents();
    const event = events.find((e: any) => e.id === order.event_id);
    if (event) {
      newOrder.events = event;
    }

    this.saveOrders([...orders, newOrder]);
    return newOrder;
  }
  
  /**
   * Gera um código único para o ingresso
   */
  private generateTicketCode(orderId: string, index: number): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const indexPart = String(index + 1).padStart(2, '0');
    
    const basePart = `${random}${timestamp.slice(-4)}${indexPart}`;
    
    const checkDigit = basePart.split('').reduce((sum, char) => {
      const code = char.charCodeAt(0);
      return sum + (code >= 48 && code <= 57 ? parseInt(char) : code);
    }, 0) % 36;
    
    return `TKT-${basePart}-${checkDigit.toString(36).toUpperCase()}`;
  }

  getOrdersByEvent(eventId: number): any[] {
    return this.getOrders().filter((o: any) => o.event_id === eventId);
  }

  // INGRESSOS VALIDADOS
  getValidatedTickets(): any[] {
    return this.load(STORAGE_KEYS.VALIDATED_TICKETS, []);
  }

  saveValidatedTickets(validatedTickets: any[]): void {
    this.save(STORAGE_KEYS.VALIDATED_TICKETS, validatedTickets);
  }

  addValidatedTicket(ticketData: any): any {
    const validatedTickets = this.getValidatedTickets();
    const newValidation = {
      ...ticketData,
      validated_at: new Date().toISOString(),
    };
    this.saveValidatedTickets([...validatedTickets, newValidation]);
    return newValidation;
  }

  isTicketValidated(ticketCode: string): boolean {
    const validatedTickets = this.getValidatedTickets();
    return validatedTickets.some((v: any) => v.ticket_code === ticketCode);
  }

  // ==========================================
  // ISSUED TICKETS (Ingressos Individuais)
  // ==========================================

  getIssuedTickets(): any[] {
    return this.load(STORAGE_KEYS.ISSUED_TICKETS, []);
  }

  saveIssuedTickets(tickets: any[]): void {
    this.save(STORAGE_KEYS.ISSUED_TICKETS, tickets);
  }

  getIssuedTicketsByOrder(orderId: string): any[] {
    return this.getIssuedTickets().filter((t: any) => t.order_id === orderId);
  }

  getIssuedTicketsByEvent(eventId: number): any[] {
    return this.getIssuedTickets().filter((t: any) => t.event_id === eventId);
  }

  getIssuedTicketByCode(ticketCode: string): any | null {
    return this.getIssuedTickets().find((t: any) => t.ticket_code === ticketCode) || null;
  }

  addIssuedTickets(tickets: any[]): any[] {
    const existingTickets = this.getIssuedTickets();
    const newTickets = tickets.map((t, index) => ({
      ...t,
      id: Math.max(...existingTickets.map((et: any) => et.id || 0), 0) + index + 1,
      created_at: new Date().toISOString(),
    }));
    this.saveIssuedTickets([...existingTickets, ...newTickets]);
    return newTickets;
  }

  validateIssuedTicket(ticketCode: string): any {
    const tickets = this.getIssuedTickets();
    const ticketIndex = tickets.findIndex((t: any) => t.ticket_code === ticketCode);
    
    if (ticketIndex === -1) {
      throw new Error('Ingresso não encontrado');
    }
    
    if (tickets[ticketIndex].validated_at) {
      throw new Error('Ingresso já foi validado anteriormente');
    }
    
    tickets[ticketIndex].validated_at = new Date().toISOString();
    this.saveIssuedTickets(tickets);
    return tickets[ticketIndex];
  }

  isIssuedTicketValidated(ticketCode: string): boolean {
    const ticket = this.getIssuedTicketByCode(ticketCode);
    return ticket?.validated_at !== null && ticket?.validated_at !== undefined;
  }

  // LIMPAR DADOS
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const localStorageService = new LocalStorageService();
