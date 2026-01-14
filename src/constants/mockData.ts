import { Event, Ticket } from '../types';

/**
 * Dados de demonstração para quando o Supabase não estiver configurado
 */
export const MOCK_EVENTS: Event[] = [
  {
    id: 1,
    name: 'Festival de Verão 2025',
    date: '15/12/2025',
    location: 'Arena Principal',
    description: 'O maior festival do ano.'
  },
  {
    id: 2,
    name: 'Workshop Tech',
    date: '20/10/2025',
    location: 'Centro de Convenções',
    description: 'Inovação e tecnologia.'
  }
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 1,
    event_id: 1,
    name: 'Pista',
    price: 150.00,
    desc: 'Acesso básico'
  },
  {
    id: 2,
    event_id: 1,
    name: 'VIP',
    price: 450.00,
    desc: 'Open bar e visão privilegiada'
  },
  {
    id: 3,
    event_id: 2,
    name: 'Ingresso Único',
    price: 80.00,
    desc: 'Acesso total'
  }
];
