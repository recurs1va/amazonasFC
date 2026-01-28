import { Event, Ticket } from '../types';

/**
 * Dados de demonstração para quando o Supabase não estiver configurado
 */
export const MOCK_EVENTS: Event[] = [
  {
    id: 1,
    name: 'Campeonato Amazonense',
    date: '15/12/2025',
    location: 'Arena Principal',
    description: 'O maior campeonato do ano.'
  },
  {
    id: 2,
    name: 'Campeonato Brasileiro',
    date: '20/10/2025',
    location: 'Centro de Convenções',
    description: 'Inovação e tecnologia.'
  }
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 1,
    event_id: 1,
    name: 'Arquibancada',
    price: 150.00,
    desc: 'Acesso básico'
  },
  {
    id: 2,
    event_id: 1,
    name: 'Camarote',
    price: 450.00,
    desc: 'Open bar e visão privilegiada'
  },
  {
    id: 3,
    event_id: 2,
    name: 'Cortesia',
    price: 80.00,
    desc: 'Acesso total'
  }
];
