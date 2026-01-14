import React, { useState } from 'react';
import { Screen } from '@types';
import { LoadingScreen, SuccessMessage } from '@components/common';
import { useAuth, useEvents, useTickets, useCart } from '@hooks';

// IMPORTAR TELAS (a serem criadas)
// import { LoginScreen } from '@components/screens/LoginScreen';
// import { EventsListScreen } from '@components/screens/EventsListScreen';
// import { EventDetailScreen } from '@components/screens/EventDetailScreen';
// import { CheckoutScreen } from '@components/screens/CheckoutScreen';
// import { ConfirmScreen } from '@components/screens/ConfirmScreen';
// import { AdminScreen } from '@components/screens/AdminScreen';
// import { ValidationScreen } from '@components/screens/ValidationScreen';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('login');
  const { user, login, logout } = useAuth();
  const { events, loading: eventsLoading } = useEvents();
  const { tickets } = useTickets();
  const { cart, addToCart, removeFromCart, clearCart, getCartTotal } = useCart();
  
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleShowSuccess = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (eventsLoading && screen === 'login') return <LoadingScreen />;

  return (
    <div className="min-h-screen text-gray-900">
      {successMsg && <SuccessMessage message={successMsg} />}

      {screen === 'login' && (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-4 border-yellow-400">
            <h1 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2 text-black">
              <TicketIcon size={32} className="text-yellow-500" /> Ingressos Amazonas FC
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
