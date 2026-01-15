import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ValidatedTicket } from '../types';

/**
 * Serviço para validação de ingressos
 */
export class ValidationService {
  /**
   * Busca todos os ingressos validados
   */
  async getAll(): Promise<ValidatedTicket[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { data, error } = await supabase
      .from('validated_tickets')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  /**
   * Valida um ingresso
   */
  async validate(ticketCode: string, eventId: number): Promise<ValidatedTicket> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    // Verifica se o ingresso já foi validado
    const { data: existing } = await supabase
      .from('validated_tickets')
      .select('*')
      .eq('ticket_code', ticketCode)
      .eq('event_id', eventId)
      .single();

    if (existing) {
      throw new Error('Ingresso já foi validado anteriormente');
    }

    // Registra a validação
    const { data, error } = await supabase
      .from('validated_tickets')
      .insert([{
        ticket_code: ticketCode,
        event_id: eventId,
        validated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Verifica se um ingresso já foi validado
   */
  async isValidated(ticketCode: string, eventId: number): Promise<boolean> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { data } = await supabase
      .from('validated_tickets')
      .select('*')
      .eq('ticket_code', ticketCode)
      .eq('event_id', eventId)
      .single();

    return !!data;
  }
}

export const validationService = new ValidationService();
