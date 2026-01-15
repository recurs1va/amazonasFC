import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  TrendingUp,
  ScanLine
} from 'lucide-react';
import { Button } from '../common';
import { Event, Ticket, Order } from '../../types';
import { eventService, ticketService } from '../../services';

interface AdminScreenFullProps {
  orders: Order[];
  events: Event[];
  tickets: Ticket[];
  onLogout: () => void;
  onValidateTickets: () => void;
  onShowSuccess: (message: string) => void;
  onViewSite: () => void;
  onReloadData: () => void;
}

type AdminTab = 'events' | 'tickets' | 'reports';

export const AdminScreenFull: React.FC<AdminScreenFullProps> = ({
  orders,
  events,
  tickets,
  onLogout,
  onValidateTickets,
  onShowSuccess,
  onViewSite,
  onReloadData
}) => {
  // === ESTADOS ===
  const [adminTab, setAdminTab] = useState<AdminTab>('events');
  
  // Modais
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  
  // Edição
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  
  // Formulários
  const [eventForm, setEventForm] = useState<Partial<Event>>({});
  const [ticketForm, setTicketForm] = useState<Partial<Ticket>>({});
  
  // Filtros de relatórios
  const [reportFilterEvent, setReportFilterEvent] = useState<'all' | number>('all');
  const [reportFilterTicket, setReportFilterTicket] = useState<string>('all');

  // === FUNÇÕES DE EVENTOS ===
  const openEventModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setEventForm(event);
    } else {
      setEditingEvent(null);
      setEventForm({});
    }
    setShowEventModal(true);
  };

  const saveEvent = async () => {
    if (!eventForm.name || !eventForm.date || !eventForm.location) {
      onShowSuccess('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingEvent) {
        await eventService.update(editingEvent.id, eventForm);
        onShowSuccess('Evento atualizado com sucesso!');
      } else {
        await eventService.create(eventForm as Omit<Event, 'id' | 'created_at'>);
        onShowSuccess('Evento criado com sucesso!');
      }
      setShowEventModal(false);
      setEventForm({});
      setEditingEvent(null);
      onReloadData();
    } catch (error) {
      onShowSuccess('Erro ao salvar evento');
      console.error(error);
    }
  };

  const deleteEvent = async (eventId: number) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    
    try {
      await eventService.delete(eventId);
      onShowSuccess('Evento excluído com sucesso!');
      onReloadData();
    } catch (error) {
      onShowSuccess('Erro ao excluir evento');
      console.error(error);
    }
  };

  // === FUNÇÕES DE INGRESSOS ===
  const openTicketModal = (ticket?: Ticket) => {
    if (ticket) {
      setEditingTicket(ticket);
      setTicketForm(ticket);
    } else {
      setEditingTicket(null);
      setTicketForm({});
    }
    setShowTicketModal(true);
  };

  const saveTicket = async () => {
    if (!ticketForm.event_id || !ticketForm.name || !ticketForm.price) {
      onShowSuccess('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingTicket) {
        await ticketService.update(editingTicket.id, ticketForm);
        onShowSuccess('Ingresso atualizado com sucesso!');
      } else {
        await ticketService.create(ticketForm as Omit<Ticket, 'id' | 'created_at'>);
        onShowSuccess('Ingresso criado com sucesso!');
      }
      setShowTicketModal(false);
      setTicketForm({});
      setEditingTicket(null);
      onReloadData();
    } catch (error) {
      onShowSuccess('Erro ao salvar ingresso');
      console.error(error);
    }
  };

  const deleteTicket = async (ticketId: number) => {
    if (!confirm('Tem certeza que deseja excluir este ingresso?')) return;
    
    try {
      await ticketService.delete(ticketId);
      onShowSuccess('Ingresso excluído com sucesso!');
      onReloadData();
    } catch (error) {
      onShowSuccess('Erro ao excluir ingresso');
      console.error(error);
    }
  };

  // === CÁLCULOS DE RELATÓRIOS ===
  const filteredOrders = reportFilterEvent === 'all' 
    ? orders 
    : orders.filter(o => o.event_id === reportFilterEvent);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = filteredOrders.length;

  let totalTicketsSold = 0;
  const ticketBreakdown: Record<string, { quantity: number; revenue: number }> = {};

  filteredOrders.forEach(order => {
    order.order_items?.forEach(item => {
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

  const filteredRevenue = reportFilterTicket === 'all' 
    ? totalRevenue 
    : Object.values(ticketBreakdown).reduce((sum, t) => sum + t.revenue, 0);

  const uniqueTicketTypes = [...new Set(
    orders.flatMap(o => o.order_items?.map(i => i.ticket_name) || [])
  )];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black border-b border-yellow-400 h-16 flex items-center px-6 justify-between sticky top-0 z-10">
        <h1 className="font-bold text-yellow-400 flex items-center gap-2">
          <Settings size={20} /> Admin
        </h1>
        <div className="flex gap-4">
          <button 
            onClick={onViewSite} 
            className="text-white font-bold text-sm hover:text-yellow-400 transition"
          >
            Ver Site
          </button>
          <button 
            onClick={onLogout} 
            className="text-red-500 hover:text-red-400"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-48 space-y-2">
          {[
            { id: 'events' as AdminTab, label: 'Eventos' },
            { id: 'tickets' as AdminTab, label: 'Ingressos' },
            { id: 'reports' as AdminTab, label: 'Relatórios' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setAdminTab(tab.id)} 
              className={`w-full text-left px-4 py-2 rounded-lg font-bold ${
                adminTab === tab.id 
                  ? 'bg-black text-yellow-400' 
                  : 'hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button 
            onClick={onValidateTickets} 
            className="w-full text-left px-4 py-2 rounded-lg font-bold bg-yellow-400 hover:bg-yellow-500 flex items-center gap-2"
          >
            <ScanLine size={18} /> Validar Ingresso
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm">
          {/* ABA DE EVENTOS */}
          {adminTab === 'events' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Gerenciar Eventos</h2>
                <button 
                  onClick={() => openEventModal()} 
                  className="bg-yellow-400 text-black p-2 rounded-full hover:bg-yellow-500 transition"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-3">
                {events.map(ev => (
                  <div 
                    key={ev.id} 
                    className="p-4 border-2 border-gray-200 rounded-xl flex justify-between items-center hover:border-yellow-400 transition"
                  >
                    <div>
                      <p className="font-bold">{ev.name}</p>
                      <p className="text-xs text-gray-500">{ev.date} • {ev.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEventModal(ev)} 
                        className="p-2 text-black hover:bg-yellow-100 rounded-lg transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => deleteEvent(ev.id)} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-gray-400 text-center py-8">Nenhum evento cadastrado</p>
                )}
              </div>
            </div>
          )}

          {/* ABA DE INGRESSOS */}
          {adminTab === 'tickets' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Gerenciar Ingressos</h2>
                <button 
                  onClick={() => openTicketModal()} 
                  className="bg-yellow-400 text-black p-2 rounded-full hover:bg-yellow-500 transition"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-3">
                {tickets.map(t => {
                  const event = events.find(e => e.id === t.event_id);
                  return (
                    <div 
                      key={t.id} 
                      className="p-4 border-2 border-gray-200 rounded-xl flex justify-between items-center hover:border-yellow-400 transition"
                    >
                      <div>
                        <p className="font-bold">{t.name}</p>
                        <p className="text-xs text-gray-500">
                          {event?.name || 'Evento não encontrado'} • R$ {t.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openTicketModal(t)} 
                          className="p-2 text-black hover:bg-yellow-100 rounded-lg transition"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteTicket(t.id)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {tickets.length === 0 && (
                  <p className="text-gray-400 text-center py-8">Nenhum ingresso cadastrado</p>
                )}
              </div>
            </div>
          )}

          {/* ABA DE RELATÓRIOS */}
          {adminTab === 'reports' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Relatórios de Vendas</h2>
              
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-100 rounded-xl">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Filtrar por Evento
                  </label>
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
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Filtrar por Tipo de Ingresso
                  </label>
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
                <div className="mb-8">
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
                            <td className="p-4 text-right font-bold text-yellow-600">
                              R$ {data.revenue.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-yellow-100 font-bold">
                        <tr className="border-t">
                          <td className="p-4">Total</td>
                          <td className="p-4 text-right">{totalTicketsSold}</td>
                          <td className="p-4 text-right text-yellow-700">
                            R$ {filteredRevenue.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Histórico de pedidos */}
              {filteredOrders.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Histórico de Pedidos</h3>
                  <div className="space-y-3">
                    {filteredOrders.slice(0, 10).map(order => (
                      <div 
                        key={order.order_id} 
                        className="p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-400 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-black">{order.order_id}</p>
                            <p className="text-sm text-gray-500">{order.events?.name}</p>
                            <p className="text-xs text-gray-400">
                              {order.customers?.name} • {order.payment_method}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-yellow-600">
                              R$ {order.total.toFixed(2)}
                            </p>
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
          )}
        </div>
      </div>

      {/* Modal de Evento */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-yellow-400">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
              </h3>
              <button 
                onClick={() => setShowEventModal(false)} 
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Nome do Evento *
                </label>
                <input 
                  type="text" 
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" 
                  value={eventForm.name || ''} 
                  onChange={e => setEventForm({...eventForm, name: e.target.value})}
                  placeholder="Ex: Festival de Verão 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Data *
                </label>
                <input 
                  type="text" 
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" 
                  value={eventForm.date || ''} 
                  onChange={e => setEventForm({...eventForm, date: e.target.value})}
                  placeholder="Ex: 15/12/2025"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Local *
                </label>
                <input 
                  type="text" 
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" 
                  value={eventForm.location || ''} 
                  onChange={e => setEventForm({...eventForm, location: e.target.value})}
                  placeholder="Ex: Arena Principal"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea 
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none resize-none" 
                  rows={3}
                  value={eventForm.description || ''} 
                  onChange={e => setEventForm({...eventForm, description: e.target.value})}
                  placeholder="Descrição do evento..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowEventModal(false)} 
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveEvent} 
                  className="flex-1 py-3 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-500 transition"
                >
                  Salvar
                </button>
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
              <h3 className="text-xl font-bold">
                {editingTicket ? 'Editar Ingresso' : 'Novo Ingresso'}
              </h3>
              <button 
                onClick={() => setShowTicketModal(false)} 
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Evento *
                </label>
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
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Nome do Ingresso *
                </label>
                <input 
                  type="text" 
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none" 
                  value={ticketForm.name || ''} 
                  onChange={e => setTicketForm({...ticketForm, name: e.target.value})}
                  placeholder="Ex: VIP, Pista, Camarote"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Preço (R$) *
                </label>
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
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea 
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none resize-none" 
                  rows={3}
                  value={ticketForm.desc || ''} 
                  onChange={e => setTicketForm({...ticketForm, desc: e.target.value})}
                  placeholder="Descrição do ingresso..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowTicketModal(false)} 
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveTicket} 
                  className="flex-1 py-3 bg-yellow-400 text-black rounded-xl font-bold hover:bg-yellow-500 transition"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
