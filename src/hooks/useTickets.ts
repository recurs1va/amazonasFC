import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '../types';
import { ticketService } from '../services/ticketService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { localStorageService } from '../services/localStorageService';
import { MOCK_TICKETS } from '../constants/mockData';

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!isSupabaseConfigured) {
          // Carregar do localStorage ou usar dados mock se estiver vazio
          const localTickets = localStorageService.getTickets();
          if (localTickets.length === 0) {
            localStorageService.saveTickets(MOCK_TICKETS);
            setTickets(MOCK_TICKETS);
          } else {
            setTickets(localTickets);
          }
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
    };

    loadTickets();
  }, []);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        // Ao recarregar, apenas carrega do localStorage (não reseta para mocks)
        const localTickets = localStorageService.getTickets();
        setTickets(localTickets);
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
      const newTicket = localStorageService.addTicket(ticket);
      setTickets(prev => [...prev, newTicket]);
      return;
    }

    try {
      await ticketService.create(ticket);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar ingresso');
      throw err;
    }
  }, [loadTickets]);

  const updateTicket = useCallback(async (id: number, ticket: Partial<Ticket>) => {
    if (!isSupabaseConfigured) {
      const updatedTicket = localStorageService.updateTicket(id, ticket);
      setTickets(prev => prev.map(t => t.id === id ? updatedTicket : t));
      return;
    }

    try {
      await ticketService.update(id, ticket);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar ingresso');
      throw err;
    }
  }, [loadTickets]);

  const deleteTicket = useCallback(async (id: number) => {
    if (!isSupabaseConfigured) {
      localStorageService.deleteTicket(id);
      setTickets(prev => prev.filter(t => t.id !== id));
      return;
    }

    try {
      await ticketService.delete(id);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir ingresso');
      throw err;
    }
  }, [loadTickets]);

  const getTicketsByEvent = useCallback((eventId: number) => {
    return tickets.filter(t => t.event_id === eventId);
  }, [tickets]);

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
