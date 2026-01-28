import { supabase, isSupabaseConfigured } from './supabaseClient';
import { localStorageService } from './localStorageService';
import { Event } from '../types';

/**
 * Serviço para gerenciamento de eventos
 */
export class EventService {
  /**
   * Busca todos os eventos
   */
  async getAll(): Promise<Event[]> {
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.getEvents();
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
    if (!isSupabaseConfigured || !supabase) {
      const events = localStorageService.getEvents();
      return events.find(e => e.id === id) || null;
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
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.addEvent(event);
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
    if (!isSupabaseConfigured || !supabase) {
      return localStorageService.updateEvent(id, event);
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
    if (!isSupabaseConfigured || !supabase) {
      localStorageService.deleteEvent(id);
      return;
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const eventService = new EventService();
