import { supabase, isSupabaseConfigured } from './supabaseClient';
import { localStorageService } from './localStorageService';
import { IssuedTicket } from '../types';

/**
 * Serviço para validação de ingressos
 * Agora usa a tabela issued_tickets (campo validated_at)
 */
export class ValidationService {
  /**
   * Busca todos os ingressos validados
   */
  async getAllValidated(): Promise<IssuedTicket[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.getIssuedTickets()
        .filter((t: any) => t.validated_at !== null);
    }

    const { data, error } = await supabase
      .from('issued_tickets')
      .select('*')
      .not('validated_at', 'is', null)
      .order('validated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca ingressos validados por evento
   */
  async getValidatedByEvent(eventId: number): Promise<IssuedTicket[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.getIssuedTicketsByEvent(eventId)
        .filter((t: any) => t.validated_at !== null);
    }

    const { data, error } = await supabase
      .from('issued_tickets')
      .select('*')
      .eq('event_id', eventId)
      .not('validated_at', 'is', null)
      .order('validated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Valida um ingresso (atualiza validated_at)
   */
  async validate(ticketCode: string): Promise<IssuedTicket> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.validateIssuedTicket(ticketCode);
    }

    // Verificar se o ingresso existe
    const { data: ticket, error: findError } = await supabase
      .from('issued_tickets')
      .select('*')
      .eq('ticket_code', ticketCode)
      .maybeSingle();

    if (findError) throw findError;
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
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.isIssuedTicketValidated(ticketCode);
    }

    const { data } = await supabase
      .from('issued_tickets')
      .select('validated_at')
      .eq('ticket_code', ticketCode)
      .maybeSingle();

    return data?.validated_at !== null && data?.validated_at !== undefined;
  }

  /**
   * Obtém detalhes de um ingresso pelo código
   */
  async getTicketDetails(ticketCode: string): Promise<IssuedTicket | null> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.getIssuedTicketByCode(ticketCode);
    }

    const { data } = await supabase
      .from('issued_tickets')
      .select('*')
      .eq('ticket_code', ticketCode)
      .maybeSingle();

    return data;
  }

  /**
   * Estatísticas de validação por evento
   */
  async getEventStats(eventId: number): Promise<{
    totalSold: number;
    totalValidated: number;
    percentValidated: number;
  }> {
    if (!isSupabaseConfigured || !supabase) {
      const tickets = localStorageService.getIssuedTicketsByEvent(eventId);
      const totalSold = tickets.length;
      const totalValidated = tickets.filter((t: any) => t.validated_at).length;
      return {
        totalSold,
        totalValidated,
        percentValidated: totalSold > 0 ? Math.round((totalValidated / totalSold) * 100) : 0
      };
    }

    const { data: tickets } = await supabase
      .from('issued_tickets')
      .select('validated_at')
      .eq('event_id', eventId);

    const totalSold = tickets?.length || 0;
    const totalValidated = tickets?.filter(t => t.validated_at).length || 0;

    return {
      totalSold,
      totalValidated,
      percentValidated: totalSold > 0 ? Math.round((totalValidated / totalSold) * 100) : 0
    };
  }
}

export const validationService = new ValidationService();
