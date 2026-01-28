import { useState, useEffect, useCallback } from 'react';
import { Event } from '../types';
import { eventService } from '../services/eventService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { localStorageService } from '../services/localStorageService';
import { MOCK_EVENTS } from '../constants/mockData';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!isSupabaseConfigured) {
          // Carregar do localStorage ou usar dados mock se estiver vazio
          const localEvents = localStorageService.getEvents();
          if (localEvents.length === 0) {
            localStorageService.saveEvents(MOCK_EVENTS);
            setEvents(MOCK_EVENTS);
          } else {
            setEvents(localEvents);
          }
        } else {
          const data = await eventService.getAll();
          setEvents(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
        console.error('Erro ao carregar eventos:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        // Ao recarregar, apenas carrega do localStorage (não reseta para mocks)
        const localEvents = localStorageService.getEvents();
        setEvents(localEvents);
      } else {
        const data = await eventService.getAll();
        setEvents(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
      console.error('Erro ao carregar eventos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (event: Omit<Event, 'id' | 'created_at'>) => {
    if (!isSupabaseConfigured) {
      const newEvent = localStorageService.addEvent(event);
      setEvents(prev => [...prev, newEvent]);
      return;
    }

    try {
      await eventService.create(event);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento');
      throw err;
    }
  }, [loadEvents]);

  const updateEvent = useCallback(async (id: number, event: Partial<Event>) => {
    if (!isSupabaseConfigured) {
      const updatedEvent = localStorageService.updateEvent(id, event);
      setEvents(prev => prev.map(e => e.id === id ? updatedEvent : e));
      return;
    }

    try {
      await eventService.update(id, event);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar evento');
      throw err;
    }
  }, [loadEvents]);

  const deleteEvent = useCallback(async (id: number) => {
    if (!isSupabaseConfigured) {
      localStorageService.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      return;
    }

    try {
      await eventService.delete(id);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir evento');
      throw err;
    }

  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };
};
