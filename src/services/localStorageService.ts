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
    const newOrder = {
      ...order,
      order_id: newOrderId,
      customer_id: customer.id,
      created_at: new Date().toISOString(),
      customers: customer,
      order_items: items.map(item => ({
        ...item,
        order_id: newOrderId,
      })),
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

  // LIMPAR DADOS
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const localStorageService = new LocalStorageService();
