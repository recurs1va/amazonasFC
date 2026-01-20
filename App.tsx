import React, { useState, useEffect } from 'react';
import { Screen, Customer, IssuedTicket } from './src/types';
import { LoadingScreen, SuccessMessage } from './src/components/common';
import { useAuth, useEvents, useTickets, useCart } from './src/hooks';
import { 
  CheckoutScreen,
  PaymentScreen,
  PixScreen,
  CardPaymentScreen,
  SuccessScreen,
  TicketsPrintScreen,
  AdminScreenFull,
  ValidationScreenFull
} from './src/components/screens';
import { orderService, validationService } from './src/services';

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
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [orderId, setOrderId] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [lastIssuedTickets, setLastIssuedTickets] = useState<IssuedTicket[]>([]);

  // === HOOKS CUSTOMIZADOS ===
  const { user, login, logout } = useAuth();
  const { events, loading: eventsLoading, loadEvents } = useEvents();
  const { tickets, loadTickets } = useTickets();
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
      loadOrders();
    } else {
      setScreen('events-list');
    }
  };

  const handleLogout = () => {
    logout();
    setScreen('login');
    clearCart();
  };

  const loadOrders = async () => {
    try {
      const allOrders = await orderService.getAll();
      setOrders(allOrders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  const reloadAllData = async () => {
    await loadOrders();
    await loadEvents();
    await loadTickets();
  };

  // Carregar pedidos ao montar o componente se estiver na tela de admin
  useEffect(() => {
    if (screen === 'admin') {
      loadOrders();
    }
  }, [screen]);

  const handleCheckoutSubmit = (customer: Customer) => {
    setCustomerData(customer);
    setScreen('payment');
  };

  const handlePaymentMethod = (method: 'pix' | 'card') => {
    if (method === 'pix') {
      setScreen('pix');
    } else {
      setScreen('card');
    }
  };

  const handlePixConfirm = async () => {
    await processPayment('pix');
  };

  const handleCardConfirm = async () => {
    await processPayment('card');
  };

  const processPayment = async (paymentMethod: 'pix' | 'card') => {
    console.log('processPayment iniciado', { paymentMethod, customerData, selectedEventId });
    
    if (!customerData || !selectedEventId) {
      console.error('Dados faltando:', { customerData, selectedEventId });
      handleShowSuccess('Erro: dados do cliente ou evento não encontrados');
      return;
    }

    // Gerar orderId imediatamente para garantir que temos um ID
    const newOrderId = `ORD-${Date.now()}`;
    setOrderId(newOrderId);

    try {
      // Preparar itens do carrinho (agrupados por tipo)
      const cartItems = Object.entries(cart)
        .filter(([_, qty]) => (qty as number) > 0)
        .map(([ticketId, qty]) => {
          const ticket = tickets.find(t => t.id === Number(ticketId));
          const quantity = qty as number;
          return {
            ticket_id: Number(ticketId),
            ticket_name: ticket?.name || '',
            quantity: quantity,
            unit_price: ticket?.price || 0
          };
        });

      console.log('Criando pedido...', { cartItems, newOrderId });

      const order = await orderService.create(
        customerData,
        {
          order_id: newOrderId,
          event_id: selectedEventId,
          total: getTotal(tickets),
          payment_method: paymentMethod
        },
        cartItems
      );

      console.log('Pedido criado com sucesso:', order);
      
      // Guardar os ingressos emitidos para exibir na tela de impressão
      setLastIssuedTickets(order.issued_tickets || []);
      
      console.log('Navegando para tickets-print...');
      setScreen('tickets-print');
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      // Mesmo com erro, vamos para a tela de tickets (em produção, tratar melhor)
      console.log('Navegando para tickets-print mesmo com erro...');
      setScreen('tickets-print');
      // handleShowSuccess('Erro ao processar pedido: ' + (error as Error).message);
    }
  };

  const handleDownloadTicket = () => {
    handleShowSuccess('Download de PDF em desenvolvimento');
  };

  const handleGoHome = () => {
    setScreen('events-list');
    setSelectedEventId(null);
    setCustomerData(null);
    setOrderId('');
    clearCart();
  };

  const handleValidateTicket = async (code: string, eventId: number) => {
    try {
      // Buscar detalhes do ingresso pelo código
      const ticketDetails = await validationService.getTicketDetails(code);
      
      if (!ticketDetails) {
        return {
          valid: false,
          message: 'Ingresso não encontrado. Verifique o código e tente novamente.'
        };
      }

      // Verificar se o ingresso é do evento correto
      if (ticketDetails.event_id !== eventId) {
        return {
          valid: false,
          message: 'Este ingresso não é válido para este evento.'
        };
      }

      // Verificar se já foi validado
      if (ticketDetails.validated_at) {
        return {
          valid: false,
          message: 'Este ingresso já foi validado anteriormente!'
        };
      }

      // Validar o ingresso (marca validated_at)
      const validatedTicket = await validationService.validate(code);

      return {
        valid: true,
        message: 'Ingresso validado com sucesso!',
        ticket: {
          customerName: validatedTicket.customer_name || 'N/A',
          ticket_name: validatedTicket.ticket_name,
          orderId: validatedTicket.order_id,
          ticketId: validatedTicket.ticket_id,
          unit_price: validatedTicket.unit_price
        }
      };
    } catch (error) {
      console.error('Erro na validação:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Se o erro for de ingresso já validado, retornar mensagem apropriada
      if (errorMessage.includes('já foi validado')) {
        return {
          valid: false,
          message: 'Este ingresso já foi validado anteriormente!'
        };
      }
      
      return {
        valid: false,
        message: `Erro ao validar: ${errorMessage}`
      };
    }
  };

  // === RENDERIZAÇÃO ===
  if (eventsLoading && screen === 'login') return <LoadingScreen />;

  console.log('Render:', { screen, customerData: !!customerData, selectedEventId, orderId });

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

      {/* CHECKOUT / CADASTRO DO CLIENTE */}
      {screen === 'customer' && (
        <CheckoutScreen
          cart={cart}
          tickets={tickets}
          total={getTotal(tickets)}
          onBack={() => setScreen('tickets')}
          onSubmit={handleCheckoutSubmit}
        />
      )}

      {/* SELEÇÃO DE PAGAMENTO */}
      {screen === 'payment' && (
        <PaymentScreen
          total={getTotal(tickets)}
          onBack={() => setScreen('customer')}
          onSelectMethod={handlePaymentMethod}
        />
      )}

      {/* PAGAMENTO PIX */}
      {screen === 'pix' && (
        <PixScreen
          total={getTotal(tickets)}
          pixCode={`00020126580014br.gov.bcb.pix0136${Date.now()}520400005303986540${getTotal(tickets).toFixed(2)}5802BR5913Amazonas FC6009Manaus62070503***6304${Math.random().toString(36).substring(7)}`}
          onBack={() => setScreen('payment')}
          onConfirm={handlePixConfirm}
        />
      )}

      {/* PAGAMENTO CARTÃO */}
      {screen === 'card' && (
        <CardPaymentScreen
          total={getTotal(tickets)}
          onBack={() => setScreen('payment')}
          onConfirm={handleCardConfirm}
        />
      )}

      {/* IMPRESSÃO DE TICKETS */}
      {screen === 'tickets-print' && customerData && selectedEventId && (
        <TicketsPrintScreen
          orderId={orderId}
          event={events.find(e => e.id === selectedEventId)}
          issuedTickets={lastIssuedTickets}
          customerName={customerData.name}
          customerEmail={customerData.email}
          customerCpf={customerData.cpf}
          total={getTotal(tickets)}
          onGoHome={handleGoHome}
        />
      )}

      {/* SUCESSO */}
      {screen === 'success' && customerData && (
        <SuccessScreen
          orderNumber={orderId}
          total={getTotal(tickets)}
          customerEmail={customerData.email}
          onDownloadTicket={handleDownloadTicket}
          onGoHome={handleGoHome}
        />
      )}

      {/* ADMIN */}
      {screen === 'admin' && (
        <AdminScreenFull
          orders={orders}
          events={events}
          tickets={tickets}
          onLogout={handleLogout}
          onValidateTickets={() => setScreen('validate')}
          onShowSuccess={handleShowSuccess}
          onViewSite={() => setScreen('events-list')}
          onReloadData={reloadAllData}
        />
      )}

      {/* VALIDAÇÃO */}
      {screen === 'validate' && (
        <ValidationScreenFull
          events={events}
          orders={orders}
          onBack={() => setScreen('admin')}
          onLogout={handleLogout}
          onValidate={handleValidateTicket}
        />
      )}
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
