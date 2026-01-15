import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Event } from '../types';

/**
 * Serviço para gerenciamento de eventos
 */
export class EventService {
  /**
   * Busca todos os eventos
   */
  async getAll(): Promise<Event[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca um evento por ID
   */
  async getById(id: number): Promise<Event | null> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Cria um novo evento
   */
  async create(event: Omit<Event, 'id' | 'created_at'>): Promise<Event> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Atualiza um evento existente
   */
  async update(id: number, event: Partial<Event>): Promise<Event> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { data, error } = await supabase
      .from('events')
      .update(event)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Exclui um evento
   */
  async delete(id: number): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado');
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const eventService = new EventService();
