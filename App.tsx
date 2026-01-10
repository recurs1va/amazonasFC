import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
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
  Plus
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Sub-components defined outside main App for performance
const LoadingScreen = () => (
  <div className="min-h-screen bg-indigo-600 flex items-center justify-center">
    <div className="text-white text-center">
      <div className="animate-bounce text-6xl mb-4">🎫</div>
      <h2 className="text-2xl font-bold">Carregando Sistema...</h2>
    </div>
  </div>
);

const App: React.FC = () => {
  // Authentication & Navigation
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<{ name: string; isAdmin: boolean } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Data State
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Selection State
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [customer, setCustomer] = useState<Customer>({ name: '', phone: '', email: '', cpf: '' });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [pixCode, setPixCode] = useState('');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Admin UI State
  const [adminTab, setAdminTab] = useState<'events' | 'tickets' | 'reports'>('events');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({});
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [newTicket, setNewTicket] = useState<Partial<Ticket>>({});
  const [reportEventFilter, setReportEventFilter] = useState<string>('all');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: evData } = await supabase.from('events').select('*').order('id', { ascending: false });
      const { data: tiData } = await supabase.from('tickets').select('*');
      const { data: orData } = await supabase.from('orders').select('*, customers(*), events(*), order_items(*)').order('created_at', { ascending: false });

      if (evData) setEvents(evData);
      if (tiData) setTickets(tiData);
      if (orData) setOrders(orData as unknown as Order[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = () => {
    if (email === 'admin@admin.com' && password === 'admin') {
      setUser({ name: 'Administrador', isAdmin: true });
      setScreen('admin');
    } else if (email && password) {
      setUser({ name: email.split('@')[0], isAdmin: false });
      setScreen('events-list');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setScreen('login');
    setCart({});
  };

  const updateCart = (ticketId: number, qty: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (qty <= 0) delete newCart[ticketId];
      else newCart[ticketId] = qty;
      return newCart;
    });
  };

  const getTotal = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const t = tickets.find(x => x.id === parseInt(id));
      // Fix: Ensure that the multiplier and multiplicand are numbers to resolve arithmetic operation type error
      const lineTotal = t ? (Number(t.price) * Number(qty)) : 0;
      return sum + lineTotal;
    }, 0);
  };

  const finalizeOrder = async (method: string) => {
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return;

    try {
      setLoading(true);
      // 1. Insert customer
      const { data: cData, error: cErr } = await supabase.from('customers').insert([customer]).select().single();
      if (cErr) throw cErr;

      const orderIdString = `PED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 2. Create Order
      const { data: oData, error: oErr } = await supabase.from('orders').insert([{
        order_id: orderIdString,
        customer_id: cData.id,
        event_id: event.id,
        total: getTotal(),
        payment_method: method
      }]).select().single();
      if (oErr) throw oErr;

      // 3. Create Items
      const items = Object.entries(cart).map(([id, qty]) => {
        const t = tickets.find(x => x.id === parseInt(id))!;
        return {
          order_id: oData.id,
          ticket_id: t.id,
          ticket_name: t.name,
          quantity: qty,
          unit_price: t.price
        };
      });

      const { error: itemsErr } = await supabase.from('order_items').insert(items);
      if (itemsErr) throw itemsErr;

      // Local state update
      const fullOrder: Order = {
        ...oData,
        customers: cData,
        events: event,
        order_items: items
      };
      setLastOrder(fullOrder);
      await loadData();
      setScreen('success');
    } catch (error) {
      console.error(error);
      alert('Falha ao processar pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (action: () => Promise<void>) => {
    try {
      await action();
      setSuccessMsg('Operação concluída com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Erro na operação.');
    }
  };

  if (loading && screen === 'login') return <LoadingScreen />;

  return (
    <div className="min-h-screen">
      {/* Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <CheckCircle size={20} />
          {successMsg}
        </div>
      )}

      {/* Screen Routing */}
      {screen === 'login' && (
        <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h1 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2 text-indigo-600">
              <TicketIcon size={32} />
              TicketMaster
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
              <div className="text-xs text-center text-slate-400 mt-4">
                Teste Admin: admin@admin.com / admin
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === 'events-list' && (
        <div className="bg-slate-50 min-h-screen pb-12">
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <h2 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                <TicketIcon size={24} />
                Explorar Eventos
              </h2>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 flex items-center gap-1">
                <LogOut size={20} /> Sair
              </button>
            </div>
          </header>
          <main className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                  <div className="h-40 bg-indigo-100 flex items-center justify-center text-indigo-300">
                    <Calendar size={64} />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{event.name}</h3>
                    <p className="text-slate-500 text-sm flex items-center gap-1 mb-1">
                      <Calendar size={14} /> {event.date}
                    </p>
                    <p className="text-slate-500 text-sm mb-4">📍 {event.location}</p>
                    <button 
                      onClick={() => { setSelectedEventId(event.id); setScreen('tickets'); }}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
                    >
                      Ver Ingressos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      )}

      {screen === 'tickets' && (
        <div className="min-h-screen bg-slate-50">
          <div className="bg-white border-b px-4 py-6">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button onClick={() => setScreen('events-list')} className="text-indigo-600 flex items-center gap-1">
                <ArrowLeft size={20} /> Voltar
              </button>
              <h2 className="text-xl font-bold">{events.find(e => e.id === selectedEventId)?.name}</h2>
              <div className="w-20" />
            </div>
          </div>
          <div className="max-w-4xl mx-auto p-4 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              {tickets.filter(t => t.event_id === selectedEventId).map(t => (
                <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg">{t.name}</h4>
                    <p className="text-slate-500 text-sm">{t.desc}</p>
                    <p className="text-indigo-600 font-bold mt-2">R$ {t.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      // Fix: Ensure the current cart value is treated as a number before subtracting to resolve arithmetic operation type error
                      onClick={() => updateCart(t.id, Number(cart[t.id] || 0) - 1)}
                      className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
                    > - </button>
                    <span className="w-6 text-center font-bold">{cart[t.id] || 0}</span>
                    <button 
                      // Fix: Ensure the current cart value is treated as a number before adding to resolve arithmetic operation type error
                      onClick={() => updateCart(t.id, Number(cart[t.id] || 0) + 1)}
                      className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold"
                    > + </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full md:w-80 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit sticky top-24">
              <h3 className="font-bold mb-4">Resumo da Compra</h3>
              <div className="space-y-2 mb-4">
                {Object.entries(cart).map(([id, qty]) => {
                  const t = tickets.find(x => x.id === parseInt(id))!;
                  return (
                    <div key={id} className="flex justify-between text-sm">
                      <span>{qty}x {t.name}</span>
                      <span>R$ {(t.price * qty).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t pt-4 flex justify-between font-bold text-xl text-indigo-600">
                <span>Total</span>
                <span>R$ {getTotal().toFixed(2)}</span>
              </div>
              <button 
                disabled={getTotal() <= 0}
                onClick={() => setScreen('customer')}
                className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'customer' && (
        <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg">
            <button onClick={() => setScreen('tickets')} className="text-indigo-600 mb-6 flex items-center gap-1">
              <ArrowLeft size={16} /> Voltar
            </button>
            <h2 className="text-2xl font-bold mb-6">Seus Dados</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nome Completo</label>
                <input 
                  type="text" className="w-full p-3 border rounded-xl"
                  value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">CPF</label>
                  <input 
                    type="text" className="w-full p-3 border rounded-xl"
                    value={customer.cpf} onChange={e => setCustomer({...customer, cpf: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Telefone</label>
                  <input 
                    type="text" className="w-full p-3 border rounded-xl"
                    value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">E-mail</label>
                <input 
                  type="email" className="w-full p-3 border rounded-xl"
                  value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})}
                />
              </div>
              <button 
                onClick={() => setScreen('payment')}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
              >
                Prosseguir para Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'payment' && (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Método de Pagamento</h2>
            <div className="space-y-3">
              {[
                { id: 'pix', name: 'PIX', icon: '📱' },
                { id: 'credit', name: 'Cartão de Crédito', icon: '💳' },
                { id: 'debit', name: 'Cartão de Débito', icon: '🏧' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPaymentMethod(p.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition ${paymentMethod === p.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="font-bold">{p.name}</span>
                </button>
              ))}
              <button 
                disabled={!paymentMethod}
                onClick={() => {
                  if (paymentMethod === 'pix') {
                    setPixCode('BR.GOV.BCB.PIX.' + Math.random().toString(36).substring(2, 20).toUpperCase());
                    setScreen('pix');
                  } else {
                    finalizeOrder(paymentMethod === 'credit' ? 'Crédito' : 'Débito');
                  }
                }}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-bold mt-4 hover:bg-green-700 transition disabled:opacity-50"
              >
                Confirmar e Pagar
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'pix' && (
        <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Pagamento PIX</h2>
            <p className="text-slate-500 mb-6">Escaneie o QR Code ou copie a chave abaixo</p>
            <div className="bg-slate-100 p-8 rounded-2xl mb-6 flex justify-center">
               <QRCodeSVG value={pixCode} size={180} />
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono break-all text-slate-500 mb-6">
              {pixCode}
            </div>
            <button 
              onClick={() => finalizeOrder('PIX')}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"
            >
              Já realizei o pagamento
            </button>
          </div>
        </div>
      )}

      {screen === 'success' && lastOrder && (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-2xl text-center border-t-8 border-green-500 no-print">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Sucesso!</h1>
            <p className="text-slate-500 mb-8">Seu pedido {lastOrder.order_id} foi confirmado.</p>
            
            <div className="text-left bg-slate-50 p-6 rounded-2xl mb-8">
              <h4 className="font-bold mb-2">Detalhes:</h4>
              <p className="text-sm">Evento: <span className="font-semibold">{lastOrder.events?.name}</span></p>
              <p className="text-sm">Total: <span className="font-semibold">R$ {lastOrder.total.toFixed(2)}</span></p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700"
              >
                <Printer size={20} /> Imprimir Ingressos
              </button>
              <button 
                onClick={() => { setScreen('events-list'); setLastOrder(null); setCart({}); }}
                className="bg-slate-200 text-slate-800 py-4 rounded-xl font-bold hover:bg-slate-300"
              >
                Novo Pedido
              </button>
            </div>
          </div>

          {/* Ticket Print View */}
          <div className="print-only hidden w-full p-8 space-y-8 bg-white">
            {lastOrder.order_items?.map((item) => (
              Array.from({ length: item.quantity }).map((_, i) => (
                <div key={`${item.id}-${i}`} className="border-4 border-dashed border-indigo-200 p-8 rounded-3xl break-after-page relative overflow-hidden bg-white">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Ingresso Oficial</span>
                      <h2 className="text-4xl font-black mt-2 text-indigo-900">{lastOrder.events?.name}</h2>
                      <p className="text-slate-500 font-bold">{lastOrder.events?.date} • {lastOrder.events?.location}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-slate-400 text-xs">Pedido: {lastOrder.order_id}</p>
                       <p className="text-indigo-600 font-black text-2xl uppercase">{item.ticket_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-12 items-center border-y border-slate-100 py-8 mb-8">
                    <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
                      <QRCodeSVG value={`VAL-${lastOrder.order_id}-${i}`} size={160} />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Titular</p>
                        <p className="text-lg font-bold text-slate-800">{lastOrder.customers?.name}</p>
                        <p className="text-slate-500 text-sm">{lastOrder.customers?.cpf}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Preço</p>
                          <p className="text-lg font-bold text-slate-800">R$ {item.unit_price.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Assento/Setor</p>
                          <p className="text-lg font-bold text-slate-800">Livre</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-xl text-center">
                    <p className="text-indigo-700 text-xs font-bold">Apresente este QR Code na entrada. Proibida a revenda.</p>
                  </div>
                </div>
              ))
            ))}
          </div>
        </div>
      )}

      {screen === 'admin' && (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <header className="bg-white border-b px-4 py-4 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
                <Settings size={28} /> Painel Admin
              </h1>
              <div className="flex gap-2">
                <button 
                  onClick={() => setScreen('events-list')} 
                  className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold"
                >
                  Modo Cliente
                </button>
                <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold">
                  Sair
                </button>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto w-full p-6 flex-1 flex flex-col md:flex-row gap-8">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 space-y-2">
              {[
                { id: 'events', name: 'Eventos', icon: <Calendar size={18} /> },
                { id: 'tickets', name: 'Ingressos', icon: <TicketIcon size={18} /> },
                { id: 'reports', name: 'Relatórios', icon: <TrendingUp size={18} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-6">
              {adminTab === 'events' && (
                <div className="bg-white rounded-3xl shadow-sm border p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Gerenciar Eventos</h2>
                    <button 
                      onClick={() => setEditingEvent({ id: 0, name: '', date: '', location: '', description: '' })}
                      className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {events.map(ev => (
                      <div key={ev.id} className="border p-4 rounded-2xl flex justify-between items-center group">
                        <div>
                          <h4 className="font-bold">{ev.name}</h4>
                          <p className="text-sm text-slate-400">{ev.date} • {ev.location}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => setEditingEvent(ev)} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg"><Edit size={18} /></button>
                          <button onClick={() => handleAdminAction(async () => { await supabase.from('events').delete().eq('id', ev.id); })} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {editingEvent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white p-8 rounded-3xl w-full max-w-lg">
                        <h3 className="text-2xl font-bold mb-6">{editingEvent.id === 0 ? 'Novo Evento' : 'Editar Evento'}</h3>
                        <div className="space-y-4">
                          <input placeholder="Nome" className="w-full p-3 border rounded-xl" value={editingEvent.name} onChange={e => setEditingEvent({...editingEvent, name: e.target.value})} />
                          <input placeholder="Data" className="w-full p-3 border rounded-xl" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} />
                          <input placeholder="Local" className="w-full p-3 border rounded-xl" value={editingEvent.location} onChange={e => setEditingEvent({...editingEvent, location: e.target.value})} />
                          <textarea placeholder="Descrição" className="w-full p-3 border rounded-xl" value={editingEvent.description || ''} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} />
                          <div className="flex gap-4 pt-4">
                            <button onClick={() => setEditingEvent(null)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold">Cancelar</button>
                            <button 
                              onClick={() => handleAdminAction(async () => {
                                if (editingEvent.id === 0) {
                                  const { id, ...data } = editingEvent;
                                  await supabase.from('events').insert([data]);
                                } else {
                                  await supabase.from('events').update(editingEvent).eq('id', editingEvent.id);
                                }
                                setEditingEvent(null);
                              })}
                              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold"
                            > Salvar </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {adminTab === 'tickets' && (
                <div className="bg-white rounded-3xl shadow-sm border p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Tipos de Ingressos</h2>
                    <button 
                      onClick={() => setEditingTicket({ id: 0, name: '', price: 0, desc: '', event_id: events[0]?.id || 0 })}
                      className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {tickets.map(t => (
                      <div key={t.id} className="border p-4 rounded-2xl">
                        <div className="flex justify-between mb-2">
                           <h4 className="font-bold">{t.name}</h4>
                           <span className="text-indigo-600 font-bold">R$ {t.price.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">{events.find(e => e.id === t.event_id)?.name}</p>
                        <div className="flex gap-2">
                           <button onClick={() => setEditingTicket(t)} className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-xs font-bold">Editar</button>
                           <button onClick={() => handleAdminAction(async () => { await supabase.from('tickets').delete().eq('id', t.id); })} className="text-red-600 bg-red-50 px-3 py-1 rounded-lg text-xs font-bold">Excluir</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {editingTicket && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white p-8 rounded-3xl w-full max-w-lg">
                        <h3 className="text-2xl font-bold mb-6">{editingTicket.id === 0 ? 'Novo Ingresso' : 'Editar Ingresso'}</h3>
                        <div className="space-y-4">
                          <select 
                            className="w-full p-3 border rounded-xl" 
                            value={editingTicket.event_id}
                            onChange={e => setEditingTicket({...editingTicket, event_id: parseInt(e.target.value)})}
                          >
                            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                          </select>
                          <input placeholder="Nome" className="w-full p-3 border rounded-xl" value={editingTicket.name} onChange={e => setEditingTicket({...editingTicket, name: e.target.value})} />
                          <input type="number" placeholder="Preço" className="w-full p-3 border rounded-xl" value={editingTicket.price} onChange={e => setEditingTicket({...editingTicket, price: parseFloat(e.target.value)})} />
                          <input placeholder="Descrição" className="w-full p-3 border rounded-xl" value={editingTicket.desc || ''} onChange={e => setEditingTicket({...editingTicket, desc: e.target.value})} />
                          <div className="flex gap-4 pt-4">
                            <button onClick={() => setEditingTicket(null)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold">Cancelar</button>
                            <button 
                              onClick={() => handleAdminAction(async () => {
                                if (editingTicket.id === 0) {
                                  const { id, ...data } = editingTicket;
                                  await supabase.from('tickets').insert([data]);
                                } else {
                                  await supabase.from('tickets').update(editingTicket).eq('id', editingTicket.id);
                                }
                                setEditingTicket(null);
                              })}
                              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold"
                            > Salvar </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {adminTab === 'reports' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border shadow-sm">
                      <p className="text-slate-400 text-sm font-bold uppercase">Faturamento Total</p>
                      <h3 className="text-3xl font-black text-green-600">R$ {orders.reduce((s, o) => s + o.total, 0).toFixed(2)}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border shadow-sm">
                      <p className="text-slate-400 text-sm font-bold uppercase">Total Pedidos</p>
                      <h3 className="text-3xl font-black text-indigo-600">{orders.length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border shadow-sm">
                      <p className="text-slate-400 text-sm font-bold uppercase">Conversão</p>
                      <h3 className="text-3xl font-black text-orange-600">High</h3>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border shadow-sm p-8">
                    <h2 className="text-xl font-bold mb-6">Últimos Pedidos</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b text-slate-400 text-sm">
                            <th className="pb-4">ID</th>
                            <th className="pb-4">Cliente</th>
                            <th className="pb-4">Evento</th>
                            <th className="pb-4 text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {orders.slice(0, 10).map(o => (
                            <tr key={o.id} className="border-b last:border-0 hover:bg-slate-50 transition">
                              <td className="py-4 font-mono">{o.order_id}</td>
                              <td className="py-4">{o.customers?.name}</td>
                              <td className="py-4">{o.events?.name}</td>
                              <td className="py-4 text-right font-bold text-green-600">R$ {o.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;