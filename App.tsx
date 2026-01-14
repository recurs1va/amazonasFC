import React, { useState } from 'react';
import { Screen } from './src/types';
import { LoadingScreen, SuccessMessage } from './src/components/common';
import { useAuth, useEvents, useTickets, useCart } from './src/hooks';

// TELAS TEMPORÁRIAS (Remover após criar componentes de tela separados)
import { 
  LogOut, 
  Ticket as TicketIcon, 
  Calendar, 
  ArrowLeft
} from 'lucide-react';

const App: React.FC = () => {
  // === ESTADOS PRINCIPAIS ===
  const [screen, setScreen] = useState<Screen>('login');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // === HOOKS CUSTOMIZADOS ===
  const { user, login, logout } = useAuth();
  const { events, loading: eventsLoading } = useEvents();
  const { tickets } = useTickets();
  const { cart, addToCart, removeFromCart, clearCart, getTotal } = useCart();

  // === FUNÇÕES ===
  const handleShowSuccess = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLoginClick = (email: string, password: string) => {
    login(email, password);
    if (email === 'admin@admin.com') {
      setScreen('admin');
    } else {
      setScreen('events-list');
    }
  };

  const handleLogout = () => {
    logout();
    setScreen('login');
    clearCart();
  };

  // === RENDERIZAÇÃO ===
  if (eventsLoading && screen === 'login') return <LoadingScreen />;

  return (
    <div className="min-h-screen text-gray-900">
      {/* Mensagem de Sucesso Global */}
      {successMsg && <SuccessMessage message={successMsg} />}

      {/* TELA DE LOGIN (Temporária - substituir por LoginScreen) */}
      {screen === 'login' && (
        <LoginScreenTemp onLogin={handleLoginClick} />
      )}

      {/* LISTA DE EVENTOS (Temporária - substituir por EventsListScreen) */}
      {screen === 'events-list' && (
        <EventsListScreenTemp 
          events={events}
          onSelectEvent={(id) => { setSelectedEventId(id); setScreen('tickets'); }}
          onLogout={handleLogout}
        />
      )}

      {/* DETALHE DO EVENTO (Temporária - substituir por EventDetailScreen) */}
      {screen === 'tickets' && selectedEventId && (
        <EventDetailScreenTemp
          eventId={selectedEventId}
          tickets={tickets.filter(t => t.event_id === selectedEventId)}
          cart={cart}
          onAddToCart={addToCart}
          onRemoveFromCart={removeFromCart}
          onBack={() => setScreen('events-list')}
          onCheckout={() => setScreen('customer')}
          cartTotal={getTotal(tickets)}
        />
      )}

      {/* As outras telas serão implementadas em componentes separados */}
      {/* <CheckoutScreen /> */}
      {/* <ConfirmScreen /> */}
      {/* <AdminScreen /> */}
      {/* <ValidationScreen /> */}
    </div>
  );
};

// ============================================
// COMPONENTES TEMPORÁRIOS (MOVER PARA /screens)
// ============================================

// Tela de Login Temporária
interface LoginScreenTempProps {
  onLogin: (email: string, password: string) => void;
}

const LoginScreenTemp: React.FC<LoginScreenTempProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-4 border-yellow-400">
        <h1 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2 text-black">
          <TicketIcon size={32} className="text-yellow-500" /> 
          Ingressos Amazonas FC
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
            onClick={() => onLogin(email, password)}
            className="w-full bg-yellow-400 text-black py-3 rounded-xl font-bold hover:bg-yellow-500 transition"
          >
            Entrar
          </button>
          <p className="text-xs text-center text-gray-400">admin@admin.com / admin</p>
        </div>
      </div>
    </div>
  );
};

// Lista de Eventos Temporária
interface EventsListScreenTempProps {
  events: any[];
  onSelectEvent: (id: number) => void;
  onLogout: () => void;
}

const EventsListScreenTemp: React.FC<EventsListScreenTempProps> = ({ 
  events, 
  onSelectEvent, 
  onLogout 
}) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-black shadow-sm h-16 flex items-center px-4 justify-between sticky top-0 z-10">
        <h2 className="font-bold text-yellow-400 flex items-center gap-2">
          <TicketIcon size={20} /> Eventos
        </h2>
        <button 
          onClick={onLogout} 
          className="text-white hover:text-yellow-400 transition"
        >
          <LogOut size={20} />
        </button>
      </header>
      <main className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-6">
        {events.map(ev => (
          <div 
            key={ev.id} 
            className="bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-yellow-400 hover:shadow-lg transition"
          >
            <div className="h-32 bg-yellow-50 rounded-xl mb-4 flex items-center justify-center text-yellow-400">
              <Calendar size={48} />
            </div>
            <h3 className="font-bold text-lg mb-1">{ev.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{ev.date} • {ev.location}</p>
            <button 
              onClick={() => onSelectEvent(ev.id)}
              className="w-full bg-black text-yellow-400 py-2 rounded-lg font-bold hover:bg-gray-900 transition"
            >
              Comprar
            </button>
          </div>
        ))}
      </main>
    </div>
  );
};

// Detalhe do Evento Temporário
interface EventDetailScreenTempProps {
  eventId: number;
  tickets: any[];
  cart: Record<number, number>;
  onAddToCart: (ticketId: number) => void;
  onRemoveFromCart: (ticketId: number) => void;
  onBack: () => void;
  onCheckout: () => void;
  cartTotal: number;
}

const EventDetailScreenTemp: React.FC<EventDetailScreenTempProps> = ({
  tickets,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onBack,
  onCheckout,
  cartTotal
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-black font-bold mb-6 hover:text-yellow-600 transition"
      >
        <ArrowLeft size={18} /> Voltar
      </button>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {tickets.map(t => (
            <div 
              key={t.id} 
              className="bg-white p-6 rounded-2xl border-2 border-gray-200 flex justify-between items-center"
            >
              <div>
                <h4 className="font-bold">{t.name}</h4>
                <p className="text-xs text-gray-500">{t.desc}</p>
                <p className="text-yellow-600 font-bold mt-1">R$ {t.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onRemoveFromCart(t.id)} 
                  className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 transition"
                >
                  -
                </button>
                <span className="font-bold">{cart[t.id] || 0}</span>
                <button 
                  onClick={() => onAddToCart(t.id)} 
                  className="w-8 h-8 rounded bg-black text-yellow-400 hover:bg-gray-900 transition"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-2xl border-2 border-yellow-400 h-fit sticky top-20">
          <h3 className="font-bold mb-4">Resumo</h3>
          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between font-bold text-xl">
              <span>Total</span>
              <span>R$ {cartTotal.toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={onCheckout}
            className="w-full bg-yellow-400 text-black py-3 rounded-xl font-bold hover:bg-yellow-500 transition"
            disabled={cartTotal === 0}
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
