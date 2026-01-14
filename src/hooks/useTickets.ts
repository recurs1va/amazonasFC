import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '../types';
import { ticketService } from '../services/ticketService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { MOCK_TICKETS } from '../constants/mockData';

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        setTickets(MOCK_TICKETS);
      } else {
        const data = await ticketService.getAll();
        setTickets(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ingressos');
      console.error('Erro ao carregar ingressos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (ticket: Omit<Ticket, 'id' | 'created_at'>) => {
    if (!isSupabaseConfigured) {
      const newId = Math.max(...tickets.map(t => t.id), 0) + 1;
      setTickets([...tickets, { id: newId, ...ticket }]);
      return;
    }

    try {
      await ticketService.create(ticket);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar ingresso');
      throw err;
    }
  }, [tickets, loadTickets]);

  const updateTicket = useCallback(async (id: number, ticket: Partial<Ticket>) => {
    if (!isSupabaseConfigured) {
      setTickets(tickets.map(t => t.id === id ? { ...t, ...ticket } : t));
      return;
    }

    try {
      await ticketService.update(id, ticket);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar ingresso');
      throw err;
    }
  }, [tickets, loadTickets]);

  const deleteTicket = useCallback(async (id: number) => {
    if (!isSupabaseConfigured) {
      setTickets(tickets.filter(t => t.id !== id));
      return;
    }

    try {
      await ticketService.delete(id);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir ingresso');
      throw err;
    }
  }, [tickets, loadTickets]);

  const getTicketsByEvent = useCallback((eventId: number) => {
    return tickets.filter(t => t.event_id === eventId);
  }, [tickets]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  return {
    tickets,
    loading,
    error,
    loadTickets,
    createTicket,
    updateTicket,
    deleteTicket,
    getTicketsByEvent
  };
};
