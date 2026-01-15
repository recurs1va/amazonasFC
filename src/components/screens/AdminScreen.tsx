import React, { useState } from 'react';
import { LogOut, BarChart3, Users, Ticket as TicketIcon, Calendar } from 'lucide-react';
import { Button } from '../common';

interface AdminScreenProps {
  orders: any[];
  events: any[];
  onLogout: () => void;
  onValidateTickets: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  orders = [],
  events = [],
  onLogout,
  onValidateTickets
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'events'>('overview');

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalTickets = orders.reduce((sum, order) => {
    return sum + (order.order_items?.reduce((s: number, item: any) => s + item.quantity, 0) || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <BarChart3 size={28} />
            Painel Admin
          </h1>
          <div className="flex gap-3">
            <Button onClick={onValidateTickets} variant="secondary">
              <TicketIcon size={18} />
              Validar Ingressos
            </Button>
            <button 
              onClick={onLogout} 
              className="text-white hover:text-yellow-400 transition px-4"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'orders', label: 'Pedidos', icon: TicketIcon },
              { id: 'events', label: 'Eventos', icon: Calendar }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-yellow-400 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border-2 border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 font-medium">Receita Total</h3>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 size={20} className="text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  R$ {totalRevenue.toFixed(2)}
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-2 border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 font-medium">Ingressos Vendidos</h3>
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <TicketIcon size={20} className="text-yellow-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{totalTickets}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-2 border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-500 font-medium">Total de Pedidos</h3>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users size={20} className="text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold">{orders.length}</p>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-2xl border-2 border-gray-200">
              <h2 className="text-xl font-bold mb-4">Pedidos Recentes</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">ID</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Cliente</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Evento</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2 text-sm font-mono">{order.order_id?.slice(0, 8)}</td>
                        <td className="py-3 px-2 text-sm">{order.customers?.name || 'N/A'}</td>
                        <td className="py-3 px-2 text-sm">{order.events?.name || 'N/A'}</td>
                        <td className="py-3 px-2 text-sm text-right font-bold">
                          R$ {order.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white p-6 rounded-2xl border-2 border-gray-200">
            <h2 className="text-xl font-bold mb-4">Todos os Pedidos</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">ID</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Data</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Cliente</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Evento</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Pagamento</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 text-sm font-mono">{order.order_id?.slice(0, 8)}</td>
                      <td className="py-3 px-2 text-sm">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-2 text-sm">{order.customers?.name || 'N/A'}</td>
                      <td className="py-3 px-2 text-sm">{order.events?.name || 'N/A'}</td>
                      <td className="py-3 px-2 text-sm capitalize">{order.payment_method}</td>
                      <td className="py-3 px-2 text-sm text-right font-bold">
                        R$ {order.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="grid md:grid-cols-2 gap-6">
            {events.map(event => (
              <div key={event.id} className="bg-white p-6 rounded-2xl border-2 border-gray-200">
                <h3 className="font-bold text-xl mb-2">{event.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {event.date} • {event.location}
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ingressos vendidos:</span>
                    <span className="font-bold">
                      {orders
                        .filter(o => o.event_id === event.id)
                        .reduce((sum, o) => sum + (o.order_items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Receita:</span>
                    <span className="font-bold text-green-600">
                      R$ {orders
                        .filter(o => o.event_id === event.id)
                        .reduce((sum, o) => sum + o.total, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
