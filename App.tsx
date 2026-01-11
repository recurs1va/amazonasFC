
import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  Event, 
  Ticket, 
  Customer, 
  Order, 
  Screen, 
  OrderItem 
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
  X
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

const LoadingScreen = () => (
  <div className="min-h-screen bg-indigo-600 flex items-center justify-center">
    <div className="text-white text-center">
      <div className="animate-bounce text-6xl mb-4">🎫</div>
      <h2 className="text-2xl font-bold">Carregando Sistema...</h2>
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
  
  // Estados para modais de criação/edição
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [eventForm, setEventForm] = useState<Partial<Event>>({ name: '', date: '', location: '', description: '' });
  const [ticketForm, setTicketForm] = useState<Partial<Ticket>>({ event_id: 0, name: '', price: 0, desc: '' });

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

      if (evData) setEvents(evData);
      if (tiData) setTickets(tiData);
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

  if (loading && screen === 'login') return <LoadingScreen />;

  return (
    <div className="min-h-screen text-slate-900">
      {/* Banner de Modo Demo */}
      {!isSupabaseConfigured && screen !== 'login' && (
        <div className="bg-amber-100 text-amber-800 text-xs py-1 px-4 text-center font-bold flex items-center justify-center gap-2 no-print">
          <AlertCircle size={12} /> MODO DE DEMONSTRAÇÃO (Sem Supabase)
        </div>
      )}

      {successMsg && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <CheckCircle size={20} /> {successMsg}
        </div>
      )}

      {screen === 'login' && (
        <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h1 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2 text-indigo-600">
              <TicketIcon size={32} /> Ingresso Amazonas
            </h1>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="E-mail"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Senha"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button 
                onClick={handleLogin}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
              >
                Entrar
              </button>
              <p className="text-xs text-center text-slate-400">admin@admin.com / admin</p>
            </div>
          </div>
        </div>
      )}

      {screen === 'events-list' && (
        <div className="bg-slate-50 min-h-screen">
          <header className="bg-white shadow-sm h-16 flex items-center px-4 justify-between sticky top-0 z-10">
            <h2 className="font-bold text-indigo-600 flex items-center gap-2"><TicketIcon size={20} /> Eventos</h2>
            <button onClick={() => setScreen('login')} className="text-slate-500"><LogOut size={20} /></button>
          </header>
          <main className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-6">
            {events.map(ev => (
              <div key={ev.id} className="bg-white p-6 rounded-2xl border hover:shadow-lg transition">
                <div className="h-32 bg-indigo-50 rounded-xl mb-4 flex items-center justify-center text-indigo-200"><Calendar size={48} /></div>
                <h3 className="font-bold text-lg mb-1">{ev.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{ev.date} • {ev.location}</p>
                <button 
                  onClick={() => { setSelectedEventId(ev.id); setScreen('tickets'); }}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold"
                > Comprar </button>
              </div>
            ))}
          </main>
        </div>
      )}

      {screen === 'tickets' && (
        <div className="max-w-4xl mx-auto p-6">
          <button onClick={() => setScreen('events-list')} className="flex items-center gap-2 text-indigo-600 mb-6"><ArrowLeft size={18} /> Voltar</button>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {tickets.filter(t => t.event_id === selectedEventId).map(t => (
                <div key={t.id} className="bg-white p-6 rounded-2xl border flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{t.name}</h4>
                    <p className="text-xs text-slate-500">{t.desc}</p>
                    <p className="text-indigo-600 font-bold mt-1">R$ {t.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCart({...cart, [t.id]: Math.max(0, (cart[t.id] || 0) - 1)})} className="w-8 h-8 rounded bg-slate-100">-</button>
                    <span className="font-bold">{cart[t.id] || 0}</span>
                    <button onClick={() => setCart({...cart, [t.id]: (cart[t.id] || 0) + 1})} className="w-8 h-8 rounded bg-indigo-600 text-white">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-2xl border h-fit sticky top-20">
              <h3 className="font-bold mb-4">Resumo</h3>
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span>R$ {Object.entries(cart).reduce((s, [id, q]) => s + (tickets.find(x => x.id === Number(id))?.price || 0) * q, 0).toFixed(2)}</span>
                </div>
              </div>
              <button 
                onClick={() => setScreen('customer')}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold"
              > Finalizar </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'customer' && (
        <div className="max-w-md mx-auto p-6 mt-12 bg-white rounded-2xl shadow-xl border">
          <h2 className="text-2xl font-bold mb-6">Seus Dados</h2>
          <div className="space-y-4">
            <input placeholder="Nome Completo" className="w-full p-3 border rounded-xl" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} />
            <input placeholder="CPF" className="w-full p-3 border rounded-xl" value={customer.cpf} onChange={e => setCustomer({...customer, cpf: e.target.value})} />
            <input placeholder="E-mail" className="w-full p-3 border rounded-xl" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
            <button onClick={() => setScreen('payment')} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Ir para Pagamento</button>
          </div>
        </div>
      )}

      {screen === 'payment' && (
        <div className="max-w-md mx-auto p-6 mt-12 bg-white rounded-2xl shadow-xl border">
          <h2 className="text-xl font-bold mb-6 text-center">Forma de Pagamento</h2>
          <div className="space-y-3">
            {['PIX', 'Cartão de Crédito', 'Boleto'].map(m => (
              <button 
                key={m} 
                onClick={() => { setPaymentMethod(m); if(m === 'PIX') { setPixCode('PIX'+Math.random()); setScreen('pix'); } else { finalizeOrder(m); } }}
                className="w-full p-4 border-2 rounded-xl text-left font-bold hover:border-indigo-600 transition"
              > {m} </button>
            ))}
          </div>
        </div>
      )}

      {screen === 'pix' && (
        <div className="max-w-md mx-auto p-6 mt-12 bg-white rounded-2xl shadow-xl border text-center">
          <h2 className="text-xl font-bold mb-4">Pagamento PIX</h2>
          <div className="bg-slate-50 p-6 rounded-2xl mb-4 flex justify-center">
            <QRCodeSVG value={pixCode} size={150} />
          </div>
          <button onClick={() => finalizeOrder('PIX')} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Confirmei o Pagamento</button>
        </div>
      )}

      {screen === 'success' && lastOrder && (
        <div className="max-w-2xl mx-auto p-6 mt-12 text-center">
          <div className="no-print">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Compra Concluída!</h2>
            <p className="text-slate-500 mb-8">Pedido: {lastOrder.order_id}</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Printer size={18} /> Imprimir</button>
              <button onClick={() => {setScreen('events-list'); setCart({});}} className="bg-slate-200 px-6 py-3 rounded-xl font-bold">Início</button>
            </div>
          </div>
          
          <div className="print-only hidden mt-8">
            {lastOrder.order_items?.map((item, idx) => (
              <div key={idx} className="border-4 border-dashed p-8 rounded-3xl mb-8 text-left bg-white relative">
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h3 className="text-2xl font-black text-indigo-900 uppercase">{lastOrder.events?.name}</h3>
                      <p className="font-bold text-slate-500">{lastOrder.events?.date}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs text-slate-400">TIPO</p>
                      <p className="font-black text-indigo-600">{item.ticket_name}</p>
                   </div>
                </div>
                <div className="flex gap-8 items-center border-t pt-6">
                   <QRCodeSVG value={lastOrder.order_id + idx} size={100} />
                   <div>
                      <p className="text-xs text-slate-400 uppercase">Titular</p>
                      <p className="font-bold">{lastOrder.customers?.name}</p>
                      <p className="text-slate-500 text-sm">{lastOrder.customers?.cpf}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === 'admin' && (
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white border-b h-16 flex items-center px-6 justify-between sticky top-0 z-10">
            <h1 className="font-bold text-indigo-600 flex items-center gap-2"><Settings size={20} /> Admin</h1>
            <div className="flex gap-4">
              <button onClick={() => setScreen('events-list')} className="text-indigo-600 font-bold text-sm">Ver Site</button>
              <button onClick={() => setScreen('login')} className="text-red-500"><LogOut size={20} /></button>
            </div>
          </header>
          <div className="max-w-7xl mx-auto p-6 flex flex-col md:flex-row gap-8">
             <div className="w-full md:w-48 space-y-2">
                {['events', 'tickets', 'reports'].map(t => (
                  <button 
                    key={t} onClick={() => setAdminTab(t as any)} 
                    className={`w-full text-left px-4 py-2 rounded-lg font-bold capitalize ${adminTab === t ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200'}`}
                  > {t === 'events' ? 'Eventos' : t === 'tickets' ? 'Ingressos' : 'Relatórios'} </button>
                ))}
             </div>
             <div className="flex-1 bg-white rounded-2xl border p-8 shadow-sm">
                {adminTab === 'events' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">Gerenciar Eventos</h2>
                      <button onClick={() => openEventModal()} className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition"><Plus size={20} /></button>
                    </div>
                    <div className="space-y-3">
                      {events.map(ev => (
                        <div key={ev.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-slate-50 transition">
                          <div><p className="font-bold">{ev.name}</p><p className="text-xs text-slate-500">{ev.date} • {ev.location}</p></div>
                          <div className="flex gap-2">
                            <button onClick={() => openEventModal(ev)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit size={16} /></button>
                            <button onClick={() => deleteEvent(ev.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                      {events.length === 0 && <p className="text-slate-400 text-center py-8">Nenhum evento cadastrado</p>}
                    </div>
                  </div>
                )}
                {adminTab === 'tickets' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">Gerenciar Ingressos</h2>
                      <button onClick={() => openTicketModal()} className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition"><Plus size={20} /></button>
                    </div>
                    <div className="space-y-3">
                      {tickets.map(t => {
                        const event = events.find(e => e.id === t.event_id);
                        return (
                          <div key={t.id} className="p-4 border rounded-xl flex justify-between items-center hover:bg-slate-50 transition">
                            <div>
                              <p className="font-bold">{t.name}</p>
                              <p className="text-xs text-slate-500">{event?.name || 'Evento não encontrado'} • R$ {t.price.toFixed(2)}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openTicketModal(t)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit size={16} /></button>
                              <button onClick={() => deleteTicket(t.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        );
                      })}
                      {tickets.length === 0 && <p className="text-slate-400 text-center py-8">Nenhum ingresso cadastrado</p>}
                    </div>
                  </div>
                )}
                {adminTab === 'reports' && (
                  <div className="grid grid-cols-3 gap-6">
                    <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                      <p className="text-xs font-bold text-green-600 uppercase">Receita Total</p>
                      <h4 className="text-2xl font-black">R$ {orders.reduce((s,o) => s+o.total, 0).toFixed(2)}</h4>
                    </div>
                    <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-600 uppercase">Vendas</p>
                      <h4 className="text-2xl font-black">{orders.length}</h4>
                    </div>
                  </div>
                )}
             </div>
          </div>

          {/* Modal de Evento */}
          {showEventModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">{editingEvent ? 'Editar Evento' : 'Novo Evento'}</h3>
                  <button onClick={() => setShowEventModal(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Evento *</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={eventForm.name || ''} 
                      onChange={e => setEventForm({...eventForm, name: e.target.value})}
                      placeholder="Ex: Festival de Verão 2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Data *</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={eventForm.date || ''} 
                      onChange={e => setEventForm({...eventForm, date: e.target.value})}
                      placeholder="Ex: 15/12/2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Local *</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={eventForm.location || ''} 
                      onChange={e => setEventForm({...eventForm, location: e.target.value})}
                      placeholder="Ex: Arena Principal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                    <textarea 
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                      rows={3}
                      value={eventForm.description || ''} 
                      onChange={e => setEventForm({...eventForm, description: e.target.value})}
                      placeholder="Descrição do evento..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setShowEventModal(false)} className="flex-1 py-3 border rounded-xl font-bold hover:bg-slate-50 transition">Cancelar</button>
                    <button onClick={saveEvent} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">Salvar</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Ingresso */}
          {showTicketModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">{editingTicket ? 'Editar Ingresso' : 'Novo Ingresso'}</h3>
                  <button onClick={() => setShowTicketModal(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Evento *</label>
                    <select 
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white" 
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
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nome do Ingresso *</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={ticketForm.name || ''} 
                      onChange={e => setTicketForm({...ticketForm, name: e.target.value})}
                      placeholder="Ex: VIP, Pista, Camarote"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Preço (R$) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={ticketForm.price || ''} 
                      onChange={e => setTicketForm({...ticketForm, price: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                    <textarea 
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                      rows={3}
                      value={ticketForm.desc || ''} 
                      onChange={e => setTicketForm({...ticketForm, desc: e.target.value})}
                      placeholder="Descrição do ingresso..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setShowTicketModal(false)} className="flex-1 py-3 border rounded-xl font-bold hover:bg-slate-50 transition">Cancelar</button>
                    <button onClick={saveTicket} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">Salvar</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
