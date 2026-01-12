
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  Event, 
  Ticket, 
  Customer, 
  Order, 
  Screen, 
  OrderItem,
  ValidatedTicket 
} from './types';
import { 
  LogOut, 
  Ticket as TicketIcon, 
  Calendar, 
  Settings, 
  TrendingUp, 
  CheckCircle, 
  Printer, 
  ArrowLeft,
  Trash2,
  Edit,
  Plus,
  AlertCircle,
  X,
  ScanLine,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Dados de demonstração para quando o Supabase não estiver configurado
const MOCK_EVENTS: Event[] = [
  { id: 1, name: 'Festival de Verão 2025', date: '15/12/2025', location: 'Arena Principal', description: 'O maior festival do ano.' },
  { id: 2, name: 'Workshop Tech', date: '20/10/2025', location: 'Centro de Convenções', description: 'Inovação e tecnologia.' }
];

const MOCK_TICKETS: Ticket[] = [
  { id: 1, event_id: 1, name: 'Pista', price: 150.00, desc: 'Acesso básico' },
  { id: 2, event_id: 1, name: 'VIP', price: 450.00, desc: 'Open bar e visão privilegiada' },
  { id: 3, event_id: 2, name: 'Ingresso Único', price: 80.00, desc: 'Acesso total' }
];

// Função para gerar código único de ingresso
const generateTicketCode = (orderId: string, eventId: number, ticketId: number, itemIndex: number): string => {
  const timestamp = Date.now();
  const baseString = `${orderId}-${eventId}-${ticketId}-${itemIndex}-${timestamp}`;
  // Criar hash simples (em produção, usar biblioteca crypto)
  let hash = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36).toUpperCase();
  return `TKT-${eventId}-${hashStr}-${itemIndex}`;
};

// Função para validar código de ingresso
const parseTicketCode = (code: string): { eventId: number; hash: string; index: number } | null => {
  const match = code.match(/^TKT-(\d+)-([A-Z0-9]+)-(\d+)$/);
  if (!match) return null;
  return {
    eventId: parseInt(match[1]),
    hash: match[2],
    index: parseInt(match[3])
  };
};

// Funções de validação
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

const validateCPF = (cpf: string): boolean => {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false; // CPF com todos os dígitos iguais
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleanCpf[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleanCpf[10])) return false;
  
  return true;
};

const validateName = (name: string): boolean => {
  return name.trim().length >= 3 && /^[a-zA-ZÀ-ÿ\s]+$/.test(name);
};

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
  }
  return cpf;
};

const LoadingScreen = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-white text-center">
      <div className="animate-bounce text-6xl mb-4">🎫</div>
      <h2 className="text-2xl font-bold text-yellow-400">Carregando Sistema...</h2>
    </div>
  </div>
);

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<{ name: string; isAdmin: boolean } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [validatedTickets, setValidatedTickets] = useState<ValidatedTicket[]>([]);
  
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '', cpf: '' });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [pixCode, setPixCode] = useState('');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const [adminTab, setAdminTab] = useState<'events' | 'tickets' | 'reports'>('events');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Estados para validação de ingressos
  const [validateEventId, setValidateEventId] = useState<number | null>(null);
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string; ticket?: any } | null>(null);
  
  // Estados para modais de criação/edição
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [eventForm, setEventForm] = useState<Partial<Event>>({ name: '', date: '', location: '', description: '' });
  const [ticketForm, setTicketForm] = useState<Partial<Ticket>>({ event_id: 0, name: '', price: 0, desc: '' });

  // Estados para filtros de relatório
  const [reportFilterEvent, setReportFilterEvent] = useState<number | 'all'>('all');
  const [reportFilterTicket, setReportFilterTicket] = useState<string | 'all'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      // Modo Demonstração
      setEvents(MOCK_EVENTS);
      setTickets(MOCK_TICKETS);
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const { data: evData } = await supabase.from('events').select('*').order('id', { ascending: false });
      const { data: tiData } = await supabase.from('tickets').select('*');
      const { data: orData } = await supabase.from('orders').select('*, customers(*), events(*), order_items(*)').order('created_at', { ascending: false });
      const { data: valData } = await supabase.from('validated_tickets').select('*');

      if (evData) setEvents(evData);
      if (tiData) setTickets(tiData);
      if (valData) setValidatedTickets(valData);
      if (orData) setOrders(orData as any);
    } catch (error) {
      console.error('Erro ao carregar do Supabase:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Funções para gerenciar EVENTOS
  const openEventModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({ name: event.name, date: event.date, location: event.location, description: event.description || '' });
    } else {
      setEditingEvent(null);
      setEventForm({ name: '', date: '', location: '', description: '' });
    }
    setShowEventModal(true);
  };

  const saveEvent = async () => {
    if (!eventForm.name || !eventForm.date || !eventForm.location) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (isSupabaseConfigured) {
      try {
        setLoading(true);
        if (editingEvent) {
          await supabase.from('events').update({
            name: eventForm.name,
            date: eventForm.date,
            location: eventForm.location,
            description: eventForm.description
          }).eq('id', editingEvent.id);
        } else {
          await supabase.from('events').insert([{
            name: eventForm.name,
            date: eventForm.date,
            location: eventForm.location,
            description: eventForm.description
          }]);
        }
        await loadData();
        setSuccessMsg(editingEvent ? 'Evento atualizado!' : 'Evento criado!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
        console.error('Erro ao salvar evento:', error);
        alert('Erro ao salvar evento');
      } finally {
        setLoading(false);
      }
    } else {
      // Modo demonstração
      if (editingEvent) {
        setEvents(events.map(ev => ev.id === editingEvent.id ? { ...ev, ...eventForm } as Event : ev));
      } else {
        const newId = Math.max(...events.map(e => e.id), 0) + 1;
        setEvents([...events, { id: newId, ...eventForm } as Event]);
      }
      setSuccessMsg(editingEvent ? 'Evento atualizado!' : 'Evento criado!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setShowEventModal(false);
  };

  const deleteEvent = async (eventId: number) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;

    if (isSupabaseConfigured) {
      try {
        setLoading(true);
        // Primeiro excluir os ingressos do evento
        await supabase.from('tickets').delete().eq('event_id', eventId);
        // Depois excluir o evento
        await supabase.from('events').delete().eq('id', eventId);
        await loadData();
        setSuccessMsg('Evento excluído!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
        console.error('Erro ao excluir evento:', error);
        alert('Erro ao excluir evento');
      } finally {
        setLoading(false);
      }
    } else {
      // Modo demonstração
      setEvents(events.filter(ev => ev.id !== eventId));
      setTickets(tickets.filter(t => t.event_id !== eventId));
      setSuccessMsg('Evento excluído!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Funções para gerenciar INGRESSOS
  const openTicketModal = (ticket?: Ticket) => {
    if (ticket) {
      setEditingTicket(ticket);
      setTicketForm({ event_id: ticket.event_id, name: ticket.name, price: ticket.price, desc: ticket.desc || '' });
    } else {
      setEditingTicket(null);
      setTicketForm({ event_id: events[0]?.id || 0, name: '', price: 0, desc: '' });
    }
    setShowTicketModal(true);
  };

  const saveTicket = async () => {
    if (!ticketForm.name || !ticketForm.event_id || ticketForm.price === undefined) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (isSupabaseConfigured) {
      try {
        setLoading(true);
        if (editingTicket) {
          await supabase.from('tickets').update({
            event_id: ticketForm.event_id,
            name: ticketForm.name,
            price: ticketForm.price,
            desc: ticketForm.desc
          }).eq('id', editingTicket.id);
        } else {
          await supabase.from('tickets').insert([{
            event_id: ticketForm.event_id,
            name: ticketForm.name,
            price: ticketForm.price,
            desc: ticketForm.desc
          }]);
        }
        await loadData();
        setSuccessMsg(editingTicket ? 'Ingresso atualizado!' : 'Ingresso criado!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
        console.error('Erro ao salvar ingresso:', error);
        alert('Erro ao salvar ingresso');
      } finally {
        setLoading(false);
      }
    } else {
      // Modo demonstração
      if (editingTicket) {
        setTickets(tickets.map(t => t.id === editingTicket.id ? { ...t, ...ticketForm } as Ticket : t));
      } else {
        const newId = Math.max(...tickets.map(t => t.id), 0) + 1;
        setTickets([...tickets, { id: newId, ...ticketForm } as Ticket]);
      }
      setSuccessMsg(editingTicket ? 'Ingresso atualizado!' : 'Ingresso criado!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setShowTicketModal(false);
  };

  const deleteTicket = async (ticketId: number) => {
    if (!confirm('Tem certeza que deseja excluir este ingresso?')) return;

    if (isSupabaseConfigured) {
      try {
        setLoading(true);
        await supabase.from('tickets').delete().eq('id', ticketId);
        await loadData();
        setSuccessMsg('Ingresso excluído!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
        console.error('Erro ao excluir ingresso:', error);
        alert('Erro ao excluir ingresso');
      } finally {
        setLoading(false);
      }
    } else {
      // Modo demonstração
      setTickets(tickets.filter(t => t.id !== ticketId));
      setSuccessMsg('Ingresso excluído!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleLogin = () => {
    if (email === 'admin@admin.com' && password === 'admin') {
      setUser({ name: 'Administrador', isAdmin: true });
      setScreen('admin');
    } else {
      setUser({ name: email.split('@')[0] || 'Usuário', isAdmin: false });
      setScreen('events-list');
    }
  };

  const finalizeOrder = async (method: string) => {
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;

    const total = Object.entries(cart).reduce((sum, [id, qty]) => {
      const t = tickets.find(x => x.id === parseInt(id));
      return sum + (t ? t.price * qty : 0);
    }, 0);

    const orderIdString = `PED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const orderItems: OrderItem[] = Object.entries(cart).map(([id, qty]) => {
      const t = tickets.find(x => x.id === parseInt(id))!;
      return { ticket_id: t.id, ticket_name: t.name, quantity: qty, unit_price: t.price };
    });

    const newOrder: Order = {
      order_id: orderIdString,
      event_id: event.id,
      total,
      payment_method: method,
      customers: customer,
      events: event,
      order_items: orderItems,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        setLoading(true);
        const { data: cData } = await (supabase.from('customers') as any).insert([customer]).select().single();
        const { data: oData } = await (supabase.from('orders') as any).insert([{
          order_id: orderIdString,
          customer_id: cData.id,
          event_id: event.id,
          total,
          payment_method: method
        }]).select().single();
        await (supabase.from('order_items') as any).insert(orderItems.map(i => ({...i, order_id: oData.id})));
        await loadData();
      } catch (e) {
        console.error(e);
      }
    } else {
      setOrders([newOrder, ...orders]);
    }

    setLastOrder(newOrder);
    setScreen('success');
    setLoading(false);
  };

  const validateCustomerData = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!validateName(customer.name)) {
      errors.name = 'Nome deve ter pelo menos 3 caracteres e conter apenas letras';
    }
    
    if (!validateEmail(customer.email)) {
      errors.email = 'Digite um e-mail válido';
    }
    
    if (!validatePhone(customer.phone)) {
      errors.phone = 'Digite um telefone válido (ex: (11) 99999-9999)';
    }
    
    if (!validateCPF(customer.cpf)) {
      errors.cpf = 'Digite um CPF válido';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCustomerInputChange = (field: keyof Customer, value: string) => {
    let formattedValue = value;
    
    if (field === 'phone') {
      formattedValue = formatPhone(value);
    } else if (field === 'cpf') {
      formattedValue = formatCPF(value);
    }
    
    setCustomer({ ...customer, [field]: formattedValue });
    
    // Limpar erro do campo quando usuário digitar
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  const validateTicket = async () => {
    setValidationResult(null);
    
    if (!validateEventId) {
      setValidationResult({ valid: false, message: 'Selecione um evento primeiro' });
      return;
    }
    
    if (!ticketCodeInput.trim()) {
      setValidationResult({ valid: false, message: 'Digite o código do ingresso' });
      return;
    }
    
    // Parse do código
    const parsed = parseTicketCode(ticketCodeInput.trim());
    if (!parsed) {
      setValidationResult({ valid: false, message: 'Código de ingresso inválido' });
      return;
    }
    
    // Verificar se o evento corresponde
    if (parsed.eventId !== validateEventId) {
      const wrongEvent = events.find(e => e.id === parsed.eventId);
      setValidationResult({ 
        valid: false, 
        message: `Este ingresso é para o evento "${wrongEvent?.name || 'Desconhecido'}"` 
      });
      return;
    }
    
    // Verificar se já foi validado
    const alreadyValidated = validatedTickets.find(v => v.ticket_code === ticketCodeInput.trim());
    if (alreadyValidated) {
      setValidationResult({ 
        valid: false, 
        message: `Ingresso já validado em ${new Date(alreadyValidated.validated_at || '').toLocaleString('pt-BR')}` 
      });
      return;
    }
    
    // Buscar pedido correspondente
    const relatedOrder = orders.find(o => {
      if (o.event_id !== validateEventId) return false;
      // Verificar se existe um item com índice correspondente
      return o.order_items && o.order_items.length > parsed.index;
    });
    
    if (!relatedOrder) {
      setValidationResult({ valid: false, message: 'Ingresso não encontrado no sistema' });
      return;
    }
    
    const ticketItem = relatedOrder.order_items![parsed.index];
    
    // Validar com sucesso
    const validatedTicket: ValidatedTicket = {
      ticket_code: ticketCodeInput.trim(),
      order_id: relatedOrder.order_id,
      event_id: validateEventId,
      ticket_id: ticketItem.ticket_id,
      customer_name: relatedOrder.customers?.name || '',
      validated_at: new Date().toISOString()
    };
    
    if (isSupabaseConfigured) {
      try {
        await supabase.from('validated_tickets').insert([validatedTicket]);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    } else {
      setValidatedTickets([validatedTicket, ...validatedTickets]);
    }
    
    setValidationResult({ 
      valid: true, 
      message: 'Ingresso válido!',
      ticket: {
        ...ticketItem,
        customerName: relatedOrder.customers?.name,
        orderId: relatedOrder.order_id
      }
    });
    
    setTicketCodeInput('');
  };

  if (loading && screen === 'login') return <LoadingScreen />;

  return (
    <div className="min-h-screen text-gray-900">
      {/* Banner de Modo Demo */}
      {!isSupabaseConfigured && screen !== 'login' && (
        <div className="bg-yellow-400 text-black text-xs py-1 px-4 text-center font-bold flex items-center justify-center gap-2 no-print">
          <AlertCircle size={12} /> MODO DE DEMONSTRAÇÃO (Sem Supabase)
        </div>
      )}

      {successMsg && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <CheckCircle size={20} /> {successMsg}
        </div>
      )}

      {screen === 'login' && (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-4 border-yellow-400">
            <h1 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2 text-black">
              <TicketIcon size={32} className="text-yellow-500" /> Ingresso Amazonas
            </h1>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="E-mail"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Senha"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button 
                onClick={handleLogin}
                className="w-full bg-yellow-400 text-black py-3 rounded-xl font-bold hover:bg-yellow-500 transition"
              >
                Entrar
              </button>
              <p className="text-xs text-center text-gray-400">admin@admin.com / admin</p>
            </div>
          </div>
        </div>
      )}

      {screen === 'events-list' && (
        <div className="bg-gray-50 min-h-screen">
          <header className="bg-black shadow-sm h-16 flex items-center px-4 justify-between sticky top-0 z-10">
            <h2 className="font-bold text-yellow-400 flex items-center gap-2"><TicketIcon size={20} /> Eventos</h2>
            <button onClick={() => setScreen('login')} className="text-white hover:text-yellow-400 transition"><LogOut size={20} /></button>
          </header>
          <main className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-6">
            {events.map(ev => (
              <div key={ev.id} className="bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-yellow-400 hover:shadow-lg transition">
                <div className="h-32 bg-yellow-50 rounded-xl mb-4 flex items-center justify-center text-yellow-400"><Calendar size={48} /></div>
                <h3 className="font-bold text-lg mb-1">{ev.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{ev.date} • {ev.location}</p>
                <button 
                  onClick={() => { setSelectedEventId(ev.id); setScreen('tickets'); }}
                  className="w-full bg-black text-yellow-400 py-2 rounded-lg font-bold hover:bg-gray-900 transition"
                > Comprar </button>
              </div>
            ))}
          </main>
        </div>
      )}

      {screen === 'tickets' && (
        <div className="max-w-4xl mx-auto p-6">
          <button onClick={() => setScreen('events-list')} className="flex items-center gap-2 text-black font-bold mb-6 hover:text-yellow-600 transition"><ArrowLeft size={18} /> Voltar</button>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {tickets.filter(t => t.event_id === selectedEventId).map(t => (
                <div key={t.id} className="bg-white p-6 rounded-2xl border-2 border-gray-200 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{t.name}</h4>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                    <p className="text-yellow-600 font-bold mt-1">R$ {t.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCart({...cart, [t.id]: Math.max(0, (cart[t.id] || 0) - 1)})} className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 transition">-</button>
                    <span className="font-bold">{cart[t.id] || 0}</span>
                    <button onClick={() => setCart({...cart, [t.id]: (cart[t.id] || 0) + 1})} className="w-8 h-8 rounded bg-black text-yellow-400 hover:bg-gray-900 transition">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-2xl border-2 border-yellow-400 h-fit sticky top-20">
              <h3 className="font-bold mb-4">Resumo</h3>
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span>R$ {Object.entries(cart).reduce((s, [id, q]) => s + (tickets.find(x => x.id === Number(id))?.price || 0) * q, 0).toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={() => setScreen('customer')}
                className="w-full bg-yellow-400 text-black py-3 rounded-xl font-bold hover:bg-yellow-500 transition"
              > Finalizar </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'customer' && (
        <div className="max-w-md mx-auto p-6 mt-12 bg-white rounded-2xl shadow-xl border-2 border-yellow-400">
          <h2 className="text-2xl font-bold mb-6">Seus Dados</h2>
          <div className="space-y-4">
            <div>
              <input 
                placeholder="Nome Completo" 
                className={`w-full p-3 border-2 rounded-xl outline-none transition ${
                  validationErrors.name 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:border-yellow-400'
                }`}
                value={customer.name} 
                onChange={e => handleCustomerInputChange('name', e.target.value)}
              />
              {validationErrors.name && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {validationErrors.name}
                </p>
              )}
            </div>
            
            <div>
              <input 
                placeholder="CPF (000.000.000-00)" 
                className={`w-full p-3 border-2 rounded-xl outline-none transition ${
                  validationErrors.cpf 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:border-yellow-400'
                }`}
                value={customer.cpf} 
                onChange={e => handleCustomerInputChange('cpf', e.target.value)}
                maxLength={14}
              />
              {validationErrors.cpf && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {validationErrors.cpf}
                </p>
              )}
            </div>
            
            <div>
              <input 
                placeholder="Telefone (11) 99999-9999" 
                className={`w-full p-3 border-2 rounded-xl outline-none transition ${
                  validationErrors.phone 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:border-yellow-400'
                }`}
                value={customer.phone} 
                onChange={e => handleCustomerInputChange('phone', e.target.value)}
                maxLength={15}
              />
              {validationErrors.phone && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {validationErrors.phone}
                </p>
              )}
            </div>
            
            <div>
              <input 
                placeholder="E-mail" 
                type="email"
                className={`w-full p-3 border-2 rounded-xl outline-none transition ${
                  validationErrors.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:border-yellow-400'
                }`}
                value={customer.email} 
                onChange={e => handleCustomerInputChange('email', e.target.value)}
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {validationErrors.email}
                </p>
              )}
            </div>
            
            <button 
              onClick={() => {
                if (validateCustomerData()) {
                  setScreen('payment');
                }
              }} 
              className="w-full bg-yellow-400 text-black py-3 rounded-xl font-bold hover:bg-yellow-500 transition"
            >
              Ir para Pagamento
            </button>
          </div>
        </div>
      )}

      {screen === 'payment' && (
        <div className="max-w-md mx-auto p-6 mt-12 bg-white rounded-2xl shadow-xl border-2 border-yellow-400">
          <h2 className="text-xl font-bold mb-6 text-center">Forma de Pagamento</h2>
          <div className="space-y-3">
            {['PIX', 'Cartão de Crédito', 'Boleto'].map(m => (
              <button 
                key={m} 
                onClick={() => { setPaymentMethod(m); if(m === 'PIX') { setPixCode('PIX'+Math.random()); setScreen('pix'); } else { finalizeOrder(m); } }}
                className="w-full p-4 border-2 rounded-xl text-left font-bold hover:border-yellow-400 hover:bg-yellow-50 transition"
              > {m} </button>
            ))}
          </div>
        </div>
      )}

      {screen === 'pix' && (
        <div className="max-w-md mx-auto p-6 mt-12 bg-white rounded-2xl shadow-xl border-2 border-yellow-400 text-center">
          <h2 className="text-xl font-bold mb-4">Pagamento PIX</h2>
          <div className="bg-yellow-50 p-6 rounded-2xl mb-4 flex justify-center">
            <QRCodeSVG value={pixCode} size={150} />
          </div>
          <button onClick={() => finalizeOrder('PIX')} className="w-full bg-yellow-400 text-black py-3 rounded-xl font-bold hover:bg-yellow-500 transition">Confirmei o Pagamento</button>
        </div>
      )}

      {screen === 'success' && lastOrder && (
        <div className="max-w-2xl mx-auto p-6 mt-12 text-center">
          <div className="no-print">
            <CheckCircle size={64} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Compra Concluída!</h2>
            <p className="text-gray-500 mb-8">Pedido: {lastOrder.order_id}</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => window.print()} className="bg-black text-yellow-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-900 transition"><Printer size={18} /> Imprimir</button>
              <button onClick={() => {setScreen('events-list'); setCart({});}} className="bg-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition">Início</button>
            </div>
          </div>
          
          <div className="print-only hidden mt-8">
            {lastOrder.order_items?.map((item, idx) => {
              const ticketCode = generateTicketCode(lastOrder.order_id, lastOrder.event_id, item.ticket_id, idx);
              return (
                <div key={idx} className="border-4 border-dashed border-yellow-400 p-8 rounded-3xl mb-8 text-left bg-white relative">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h3 className="text-2xl font-black text-black uppercase">{lastOrder.events?.name}</h3>
                        <p className="font-bold text-gray-500">{lastOrder.events?.date}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs text-gray-400">TIPO</p>
                        <p className="font-black text-yellow-600">{item.ticket_name}</p>
                     </div>
                  </div>
                  <div className="flex gap-8 items-center border-t border-yellow-400 pt-6">
                     <div className="text-center">
                       <QRCodeSVG value={ticketCode} size={100} />
                       <p className="text-xs text-gray-400 mt-2 font-mono">{ticketCode}</p>
                     </div>
                     <div>
                        <p className="text-xs text-gray-400 uppercase">Titular</p>
                        <p className="font-bold">{lastOrder.customers?.name}</p>
                        <p className="text-gray-500 text-sm">{lastOrder.customers?.cpf}</p>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {screen === 'admin' && (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-black border-b border-yellow-400 h-16 flex items-center px-6 justify-between sticky top-0 z-10">
            <h1 className="font-bold text-yellow-400 flex items-center gap-2"><Settings size={20} /> Admin</h1>
            <div className="flex gap-4">
              <button onClick={() => setScreen('events-list')} className="text-white font-bold text-sm hover:text-yellow-400 transition">Ver Site</button>
              <button onClick={() => setScreen('login')} className="text-red-500 hover:text-red-400"><LogOut size={20} /></button>
            </div>
          </header>
          <div className="max-w-7xl mx-auto p-6 flex flex-col md:flex-row gap-8">
             <div className="w-full md:w-48 space-y-2">
                {['events', 'tickets', 'reports'].map(t => (
                  <button 
                    key={t} onClick={() => setAdminTab(t as any)} 
                    className={`w-full text-left px-4 py-2 rounded-lg font-bold capitalize ${adminTab === t ? 'bg-black text-yellow-400' : 'hover:bg-gray-200'}`}
                  > {t === 'events' ? 'Eventos' : t === 'tickets' ? 'Ingressos' : 'Relatórios'} </button>
                ))}
                <button 
                  onClick={() => setScreen('validate')} 
                  className="w-full text-left px-4 py-2 rounded-lg font-bold bg-yellow-400 hover:bg-yellow-500 flex items-center gap-2"
                >
                  <ScanLine size={18} /> Validar Ingresso
                </button>
             </div>
             <div className="flex-1 bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm">
                {adminTab === 'events' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">Gerenciar Eventos</h2>
                      <button onClick={() => openEventModal()} className="bg-yellow-400 text-black p-2 rounded-full hover:bg-yellow-500 transition"><Plus size={20} /></button>
                    </div>
                    <div className="space-y-3">
                      {events.map(ev => (
                        <div key={ev.id} className="p-4 border-2 border-gray-200 rounded-xl flex justify-between items-center hover:border-yellow-400 transition">
                          <div><p className="font-bold">{ev.name}</p><p className="text-xs text-gray-500">{ev.date} • {ev.location}</p></div>
                          <div className="flex gap-2">
                            <button onClick={() => openEventModal(ev)} className="p-2 text-black hover:bg-yellow-100 rounded-lg transition"><Edit size={16} /></button>
                            <button onClick={() => deleteEvent(ev.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                      {events.length === 0 && <p className="text-gray-400 text-center py-8">Nenhum evento cadastrado</p>}
                    </div>
                  </div>
                )}
                {adminTab === 'tickets' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">Gerenciar Ingressos</h2>
                      <button onClick={() => openTicketModal()} className="bg-yellow-400 text-black p-2 rounded-full hover:bg-yellow-500 transition"><Plus size={20} /></button>
                    </div>
                    <div className="space-y-3">
                      {tickets.map(t => {
                        const event = events.find(e => e.id === t.event_id);
                        return (
                          <div key={t.id} className="p-4 border-2 border-gray-200 rounded-xl flex justify-between items-center hover:border-yellow-400 transition">
                            <div>
                              <p className="font-bold">{t.name}</p>
                              <p className="text-xs text-gray-500">{event?.name || 'Evento não encontrado'} • R$ {t.price.toFixed(2)}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openTicketModal(t)} className="p-2 text-black hover:bg-yellow-100 rounded-lg transition"><Edit size={16} /></button>
                              <button onClick={() => deleteTicket(t.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        );
                      })}
                      {tickets.length === 0 && <p className="text-gray-400 text-center py-8">Nenhum ingresso cadastrado</p>}
                    </div>
                  </div>
                )}
                {adminTab === 'reports' && (() => {
                  // Filtrar pedidos por evento
                  const filteredOrders = reportFilterEvent === 'all' 
                    ? orders 
                    : orders.filter(o => o.event_id === reportFilterEvent);

                  // Calcular métricas considerando filtros
                  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
                  const totalOrders = filteredOrders.length;

                  // Calcular quantidade de ingressos vendidos
                  let totalTicketsSold = 0;
                  const ticketBreakdown: Record<string, { quantity: number; revenue: number }> = {};

                  filteredOrders.forEach(order => {
                    order.order_items?.forEach(item => {
                      // Aplicar filtro de tipo de ingresso
                      if (reportFilterTicket === 'all' || item.ticket_name === reportFilterTicket) {
                        totalTicketsSold += item.quantity;
                        if (!ticketBreakdown[item.ticket_name]) {
                          ticketBreakdown[item.ticket_name] = { quantity: 0, revenue: 0 };
                        }
                        ticketBreakdown[item.ticket_name].quantity += item.quantity;
                        ticketBreakdown[item.ticket_name].revenue += item.quantity * item.unit_price;
                      }
                    });
                  });

                  // Calcular receita filtrada por tipo de ingresso
                  const filteredRevenue = reportFilterTicket === 'all' 
                    ? totalRevenue 
                    : Object.values(ticketBreakdown).reduce((sum, t) => sum + t.revenue, 0);

                  // Obter tipos únicos de ingressos para o filtro
                  const uniqueTicketTypes = [...new Set(
                    orders.flatMap(o => o.order_items?.map(i => i.ticket_name) || [])
                  )];

                  return (
                    <div>
                      <h2 className="text-xl font-bold mb-6">Relatórios de Vendas</h2>
                      
                      {/* Filtros */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-100 rounded-xl">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Filtrar por Evento</label>
                          <select 
                            className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
                            value={reportFilterEvent}
                            onChange={e => setReportFilterEvent(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                          >
                            <option value="all">Todos os eventos</option>
                            {events.map(ev => (
                              <option key={ev.id} value={ev.id}>{ev.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Filtrar por Tipo de Ingresso</label>
                          <select 
                            className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
                            value={reportFilterTicket}
                            onChange={e => setReportFilterTicket(e.target.value)}
                          >
                            <option value="all">Todos os tipos</option>
                            {uniqueTicketTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Cards de métricas */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-400">
                          <p className="text-xs font-bold text-yellow-700 uppercase">Receita Total</p>
                          <h4 className="text-2xl font-black">R$ {filteredRevenue.toFixed(2)}</h4>
                        </div>
                        <div className="p-6 bg-gray-100 rounded-2xl border-2 border-gray-300">
                          <p className="text-xs font-bold text-gray-600 uppercase">Pedidos</p>
                          <h4 className="text-2xl font-black">{totalOrders}</h4>
                        </div>
                        <div className="p-6 bg-black rounded-2xl border-2 border-yellow-400">
                          <p className="text-xs font-bold text-yellow-400 uppercase">Ingressos Vendidos</p>
                          <h4 className="text-2xl font-black text-white">{totalTicketsSold}</h4>
                        </div>
                      </div>

                      {/* Detalhamento por tipo de ingresso */}
                      {Object.keys(ticketBreakdown).length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold mb-4">Detalhamento por Tipo de Ingresso</h3>
                          <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-black text-white">
                                <tr>
                                  <th className="text-left p-4 text-sm font-bold">Tipo</th>
                                  <th className="text-right p-4 text-sm font-bold">Quantidade</th>
                                  <th className="text-right p-4 text-sm font-bold">Receita</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(ticketBreakdown).map(([name, data]) => (
                                  <tr key={name} className="border-t hover:bg-yellow-50">
                                    <td className="p-4 font-medium">{name}</td>
                                    <td className="p-4 text-right">{data.quantity}</td>
                                    <td className="p-4 text-right font-bold text-yellow-600">R$ {data.revenue.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-yellow-100 font-bold">
                                <tr className="border-t">
                                  <td className="p-4">Total</td>
                                  <td className="p-4 text-right">{totalTicketsSold}</td>
                                  <td className="p-4 text-right text-yellow-700">R$ {filteredRevenue.toFixed(2)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Histórico de pedidos */}
                      {filteredOrders.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-lg font-bold mb-4">Histórico de Pedidos</h3>
                          <div className="space-y-3">
                            {filteredOrders.slice(0, 10).map(order => (
                              <div key={order.order_id} className="p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-400 transition">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold text-black">{order.order_id}</p>
                                    <p className="text-sm text-gray-500">{order.events?.name}</p>
                                    <p className="text-xs text-gray-400">{order.customers?.name} • {order.payment_method}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-yellow-600">R$ {order.total.toFixed(2)}</p>
                                    <p className="text-xs text-gray-400">
                                      {order.order_items?.reduce((sum, i) => sum + i.quantity, 0)} ingresso(s)
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {filteredOrders.length > 10 && (
                              <p className="text-center text-gray-400 text-sm py-2">
                                Mostrando 10 de {filteredOrders.length} pedidos
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {filteredOrders.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                          <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                          <p>Nenhuma venda encontrada com os filtros selecionados</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
             </div>
          </div>

          {/* Modal de Evento */}
          {showEventModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-yellow-400">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">{editingEvent ? 'Editar Evento' : 'Novo Evento'}</h3>
                  <button onClick={() => setShowEventModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Evento *</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" 
                      value={eventForm.name || ''} 
                      onChange={e => setEventForm({...eventForm, name: e.target.value})}
                      placeholder="Ex: Festival de Verão 2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Data *</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" 
                      value={eventForm.date || ''} 
                      onChange={e => setEventForm({...eventForm, date: e.target.value})}
                      placeholder="Ex: 15/12/2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Local *</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" 
                      value={eventForm.location || ''} 
                      onChange={e => setEventForm({...eventForm, location: e.target.value})}
                      placeholder="Ex: Arena Principal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                    <textarea 
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none resize-none" 
                      rows={3}
                      value={eventForm.description || ''} 
                      onChange={e => setEventForm({...eventForm, description: e.target.value})}
                      placeholder="Descrição do evento..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setShowEventModal(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={saveEvent} className="flex-1 py-3 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-500 transition">Salvar</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Ingresso */}
          {showTicketModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-yellow-400">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">{editingTicket ? 'Editar Ingresso' : 'Novo Ingresso'}</h3>
                  <button onClick={() => setShowTicketModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Evento *</label>
                    <select 
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none bg-white" 
                      value={ticketForm.event_id || ''} 
                      onChange={e => setTicketForm({...ticketForm, event_id: parseInt(e.target.value)})}
                    >
                      <option value="">Selecione um evento</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Ingresso *</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" 
                      value={ticketForm.name || ''} 
                      onChange={e => setTicketForm({...ticketForm, name: e.target.value})}
                      placeholder="Ex: VIP, Pista, Camarote"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Preço (R$) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" 
                      value={ticketForm.price || ''} 
                      onChange={e => setTicketForm({...ticketForm, price: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
                    <textarea 
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none resize-none" 
                      rows={3}
                      value={ticketForm.desc || ''} 
                      onChange={e => setTicketForm({...ticketForm, desc: e.target.value})}
                      placeholder="Descrição do ingresso..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setShowTicketModal(false)} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={saveTicket} className="flex-1 py-3 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-500 transition">Salvar</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {screen === 'validate' && (
        <div className="min-h-screen bg-gray-50">
          <header className="bg-black border-b border-yellow-400 h-16 flex items-center px-6 justify-between sticky top-0 z-10">
            <h1 className="font-bold text-yellow-400 flex items-center gap-2"><ScanLine size={20} /> Validação de Ingressos</h1>
            <div className="flex gap-4">
              <button onClick={() => { setScreen('admin'); setValidationResult(null); setTicketCodeInput(''); }} className="text-white font-bold text-sm hover:text-yellow-400 transition flex items-center gap-2">
                <ArrowLeft size={16} /> Voltar ao Admin
              </button>
              <button onClick={() => setScreen('login')} className="text-red-500 hover:text-red-400"><LogOut size={20} /></button>
            </div>
          </header>
          
          <div className="max-w-2xl mx-auto p-6 mt-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-yellow-400">
              <h2 className="text-2xl font-bold mb-6 text-center">Validar Ingresso</h2>
              
              {/* Seleção de Evento */}
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2 text-gray-700">Selecione o Evento</label>
                <select 
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 outline-none"
                  value={validateEventId || ''}
                  onChange={(e) => {
                    setValidateEventId(e.target.value ? parseInt(e.target.value) : null);
                    setValidationResult(null);
                  }}
                >
                  <option value="">Selecione um evento...</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name} - {event.date}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input do Código */}
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2 text-gray-700">Código do Ingresso</label>
                <div className="flex gap-3">
                  <input 
                    type="text"
                    placeholder="TKT-XXX-XXXX-X"
                    className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-yellow-400 outline-none uppercase font-mono"
                    value={ticketCodeInput}
                    onChange={(e) => {
                      setTicketCodeInput(e.target.value.toUpperCase());
                      setValidationResult(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        validateTicket();
                      }
                    }}
                  />
                  <button 
                    onClick={validateTicket}
                    className="px-8 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-500 transition flex items-center gap-2"
                    disabled={!validateEventId || !ticketCodeInput.trim()}
                  >
                    <ScanLine size={20} /> Validar
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Digite ou escaneie o código QR do ingresso
                </p>
              </div>

              {/* Resultado da Validação */}
              {validationResult && (
                <div className={`p-6 rounded-xl border-2 ${
                  validationResult.valid 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-500'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {validationResult.valid ? (
                      <CheckCircle2 size={32} className="text-green-600" />
                    ) : (
                      <XCircle size={32} className="text-red-600" />
                    )}
                    <div>
                      <h3 className={`text-xl font-bold ${
                        validationResult.valid ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {validationResult.valid ? 'Ingresso Válido!' : 'Ingresso Inválido'}
                      </h3>
                      <p className={validationResult.valid ? 'text-green-600' : 'text-red-600'}>
                        {validationResult.message}
                      </p>
                    </div>
                  </div>
                  
                  {validationResult.valid && validationResult.ticket && (
                    <div className="mt-4 pt-4 border-t border-green-300">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600 font-semibold">Titular:</p>
                          <p className="font-bold">{validationResult.ticket.customerName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-semibold">Tipo de Ingresso:</p>
                          <p className="font-bold">{validationResult.ticket.ticket_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-semibold">Pedido:</p>
                          <p className="font-bold font-mono">{validationResult.ticket.orderId}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-semibold">Valor:</p>
                          <p className="font-bold text-green-600">R$ {validationResult.ticket.unit_price.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Estatísticas */}
              {validateEventId && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="font-bold mb-3 text-gray-700">Estatísticas do Evento</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Ingressos Vendidos</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {orders
                          .filter(o => o.event_id === validateEventId)
                          .reduce((sum, o) => sum + (o.order_items?.reduce((s, i) => s + i.quantity, 0) || 0), 0)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Ingressos Validados</p>
                      <p className="text-2xl font-bold text-green-600">
                        {validatedTickets.filter(v => v.event_id === validateEventId).length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Validações Recentes */}
            {validateEventId && validatedTickets.filter(v => v.event_id === validateEventId).length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 mt-6 border-2 border-gray-200">
                <h3 className="font-bold mb-4 text-gray-700">Validações Recentes</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {validatedTickets
                    .filter(v => v.event_id === validateEventId)
                    .slice(0, 10)
                    .map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <p className="font-bold text-sm">{v.customer_name}</p>
                          <p className="text-xs text-gray-500 font-mono">{v.ticket_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(v.validated_at || '').toLocaleString('pt-BR')}
                          </p>
                          <CheckCircle2 size={16} className="text-green-600 ml-auto mt-1" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
