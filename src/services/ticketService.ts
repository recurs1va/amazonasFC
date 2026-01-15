import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Ticket } from '../types';

/**
 * Serviço para gerenciamento de ingressos
 */
export class TicketService {
  /**
   * Busca todos os ingressos
   */
  async getAll(): Promise<Ticket[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca ingressos por evento
   */
  async getByEvent(eventId: number): Promise<Ticket[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Cria um novo ingresso
   */
  async create(ticket: Omit<Ticket, 'id' | 'created_at'>): Promise<Ticket> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert([ticket])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Atualiza um ingresso existente
   */
  async update(id: number, ticket: Partial<Ticket>): Promise<Ticket> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { data, error } = await supabase
      .from('tickets')
      .update(ticket)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Exclui um ingresso
   */
  async delete(id: number): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const ticketService = new TicketService();
