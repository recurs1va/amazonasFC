import { supabase, isSupabaseConfigured } from './supabaseClient';
import { localStorageService } from './localStorageService';
import { IssuedTicket } from '../types';

/**
 * Gera um código único para o ingresso
 * Formato: TKT-{random}-{timestamp}-{checkDigit}
 */
export const generateTicketCode = (orderId: string, index: number): string => {
  // Usar timestamp + random para garantir unicidade
  const timestamp = Date.now().toString(36); // Base36 para ser mais curto
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const indexPart = String(index + 1).padStart(2, '0');
  
  // Combinar tudo
  const basePart = `${random}${timestamp.slice(-4)}${indexPart}`;
  
  // Dígito verificador simples
  const checkDigit = basePart.split('').reduce((sum, char) => {
    const code = char.charCodeAt(0);
    return sum + (code >= 48 && code <= 57 ? parseInt(char) : code);
  }, 0) % 36;
  
  return `TKT-${basePart}-${checkDigit.toString(36).toUpperCase()}`;
};

/**
 * Serviço para gerenciamento de ingressos emitidos
 */
export class IssuedTicketService {
  /**
   * Busca todos os ingressos emitidos
   */
  async getAll(): Promise<IssuedTicket[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.getIssuedTickets();
    }

    const { data, error } = await supabase
      .from('issued_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca ingressos por pedido
   */
  async getByOrderId(orderId: string): Promise<IssuedTicket[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.getIssuedTicketsByOrder(orderId);
    }

    const { data, error } = await supabase
      .from('issued_tickets')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca ingressos por evento
   */
  async getByEventId(eventId: number): Promise<IssuedTicket[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.getIssuedTicketsByEvent(eventId);
    }

    const { data, error } = await supabase
      .from('issued_tickets')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca um ingresso pelo código
   */
  async getByCode(ticketCode: string): Promise<IssuedTicket | null> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.getIssuedTicketByCode(ticketCode);
    }

    const { data, error } = await supabase
      .from('issued_tickets')
      .select('*')
      .eq('ticket_code', ticketCode)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Cria múltiplos ingressos para um pedido
   */
  async createMany(tickets: Omit<IssuedTicket, 'id' | 'created_at'>[]): Promise<IssuedTicket[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.addIssuedTickets(tickets);
    }

    const { data, error } = await supabase
      .from('issued_tickets')
      .insert(tickets)
      .select();

    if (error) throw error;
    return data || [];
  }

  /**
   * Valida um ingresso (marca validated_at)
   */
  async validate(ticketCode: string): Promise<IssuedTicket> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.validateIssuedTicket(ticketCode);
    }

    // Verificar se o ingresso existe
    const ticket = await this.getByCode(ticketCode);
    if (!ticket) {
      throw new Error('Ingresso não encontrado');
    }

    // Verificar se já foi validado
    if (ticket.validated_at) {
      throw new Error('Ingresso já foi validado anteriormente');
    }

    // Marcar como validado
    const { data, error } = await supabase
      .from('issued_tickets')
      .update({ validated_at: new Date().toISOString() })
      .eq('ticket_code', ticketCode)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Verifica se um ingresso já foi validado
   */
  async isValidated(ticketCode: string): Promise<boolean> {
    const ticket = await this.getByCode(ticketCode);
    return ticket?.validated_at !== null && ticket?.validated_at !== undefined;
  }

  /**
   * Busca estatísticas de um evento
   */
  async getEventStats(eventId: number): Promise<{
    totalSold: number;
    totalValidated: number;
    totalRevenue: number;
    byTicketType: { name: string; sold: number; validated: number; revenue: number }[];
  }> {
    const tickets = await this.getByEventId(eventId);

    const totalSold = tickets.length;
    const totalValidated = tickets.filter(t => t.validated_at).length;
    const totalRevenue = tickets.reduce((sum, t) => sum + t.unit_price, 0);

    // Agrupar por tipo de ingresso
    const byType = tickets.reduce((acc, t) => {
      if (!acc[t.ticket_name]) {
        acc[t.ticket_name] = { name: t.ticket_name, sold: 0, validated: 0, revenue: 0 };
      }
      acc[t.ticket_name].sold++;
      acc[t.ticket_name].revenue += t.unit_price;
      if (t.validated_at) {
        acc[t.ticket_name].validated++;
      }
      return acc;
    }, {} as Record<string, { name: string; sold: number; validated: number; revenue: number }>);

    return {
      totalSold,
      totalValidated,
      totalRevenue,
      byTicketType: Object.values(byType)
    };
  }
}

export const issuedTicketService = new IssuedTicketService();
