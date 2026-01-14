import { useState, useEffect, useCallback } from 'react';
import { Event } from '../types';
import { eventService } from '../services/eventService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { MOCK_EVENTS } from '../constants/mockData';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        setEvents(MOCK_EVENTS);
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
      const newId = Math.max(...events.map(e => e.id), 0) + 1;
      setEvents([...events, { id: newId, ...event }]);
      return;
    }

    try {
      await eventService.create(event);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento');
      throw err;
    }
  }, [events, loadEvents]);

  const updateEvent = useCallback(async (id: number, event: Partial<Event>) => {
    if (!isSupabaseConfigured) {
      setEvents(events.map(e => e.id === id ? { ...e, ...event } : e));
      return;
    }

    try {
      await eventService.update(id, event);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar evento');
      throw err;
    }
  }, [events, loadEvents]);

  const deleteEvent = useCallback(async (id: number) => {
    if (!isSupabaseConfigured) {
      setEvents(events.filter(e => e.id !== id));
      return;
    }

    try {
      await eventService.delete(id);
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir evento');
      throw err;
    }
  }, [events, loadEvents]);

  useEffect(() => {
    loadEvents();
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
