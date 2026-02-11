import React, { useState, useEffect } from 'react';
import { Screen, Customer, IssuedTicket } from './src/types';
import { LoadingScreen, SuccessMessage } from './src/components/common';
import { useAuth, useEvents, useTickets, useCart } from './src/hooks';
import type { RegisterData } from './src/hooks/useAuth';
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
  const [screen, setScreen] = useState<Screen>('events-list');
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login'); // Controlar login vs registro
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState(false); // Para redirecionar após login
  const [successMsg, setSuccessMsg] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [lastIssuedTickets, setLastIssuedTickets] = useState<IssuedTicket[]>([]);

  // === HOOKS CUSTOMIZADOS ===
  const { user, customerData: authCustomerData, loading: authLoading, login, register, logout, updateCustomer, refreshCustomer } = useAuth();
  const { events, loading: eventsLoading, loadEvents } = useEvents();
  const { tickets, loadTickets } = useTickets();
  const { cart, addToCart, removeFromCart, clearCart, getTotal } = useCart();

  // Debug: Log quando authCustomerData mudar
  useEffect(() => {
    console.log('authCustomerData atualizado:', authCustomerData);
  }, [authCustomerData]);

  // === FUNÇÕES ===
  const handleShowSuccess = (message: string) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLoginClick = async (email: string, password: string) => {
    const result = await login(email, password);
    if (result.success) {
      // Aguardar um pouco para garantir que os dados foram carregados
      await new Promise(resolve => setTimeout(resolve, 300));
      await refreshCustomer();
      
      console.log('Após login, authCustomerData:', authCustomerData);
      
      if (email === 'admin@admin.com') {
        setScreen('admin');
        loadOrders();
        setPendingCheckout(false);
      } else {
        // Se havia checkout pendente, ir para o checkout
        if (pendingCheckout) {
          setScreen('customer');
          setPendingCheckout(false);
        } else {
          setScreen('events-list');
        }
      }
    } else {
      handleShowSuccess(result.message);
    }
  };

  const handleRegisterClick = async (data: RegisterData) => {
    const result = await register(data);
    if (result.success) {
      handleShowSuccess(result.message);
      
      // Aguardar um pouco para garantir que os dados foram carregados
      await new Promise(resolve => setTimeout(resolve, 500));
      await refreshCustomer();
      
      console.log('Após registro, authCustomerData:', authCustomerData);
      
      // Após cadastro, já está logado, então ir para eventos ou checkout
      if (pendingCheckout) {
        setScreen('customer');
        setPendingCheckout(false);
      } else {
        setScreen('events-list');
      }
    } else {
      handleShowSuccess(result.message);
    }
  };

  // Função para tentar fazer checkout (verifica se está logado)
  const handleTryCheckout = () => {
    console.log('handleTryCheckout', { user: !!user, authCustomerData });
    
    if (!user) {
      // Não logado, redirecionar para login
      setPendingCheckout(true);
      setScreen('login');
      return;
    }

    // Verificar se dados do customer estão completos
    const hasCompleteData = authCustomerData && 
                           authCustomerData.name && 
                           authCustomerData.email && 
                           authCustomerData.cpf && 
                           authCustomerData.phone;

    console.log('Dados completos?', hasCompleteData, authCustomerData);

    if (hasCompleteData) {
      // Dados completos, ir direto para pagamento
      console.log('Indo direto para pagamento');
      setScreen('payment');
    } else {
      // Dados incompletos, ir para tela de checkout para preencher
      console.log('Indo para confirmação de dados');
      setScreen('customer');
    }
  };

  const handleLogout = async () => {
    await logout();
    setScreen('events-list');
    clearCart();
    setPendingCheckout(false);
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

  const handleCheckoutSubmit = async (customer: Customer) => {
    // Atualizar dados do customer se houver alterações
    if (user && !user.isAdmin) {
      const updates: Partial<Customer> = {};
      
      if (customer.name !== authCustomerData?.name) updates.name = customer.name;
      if (customer.email !== authCustomerData?.email) updates.email = customer.email;
      if (customer.cpf !== authCustomerData?.cpf) updates.cpf = customer.cpf;
      if (customer.phone !== authCustomerData?.phone) updates.phone = customer.phone;
      
      if (Object.keys(updates).length > 0) {
        console.log('Atualizando dados do customer:', updates);
        await updateCustomer(updates);
        await refreshCustomer();
      }
    }
    
    console.log('handleCheckoutSubmit - Indo para pagamento', { authCustomerData });
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
    console.log('processPayment iniciado', { 
      paymentMethod, 
      hasCustomerData: !!authCustomerData,
      customerData: authCustomerData,
      selectedEventId,
      cart 
    });
    
    // Tentar recarregar dados do customer se não estiverem disponíveis
    if (!authCustomerData && user && !user.isAdmin) {
      console.log('Tentando recarregar dados do customer...');
      await refreshCustomer();
      
      // Aguardar um pouco para o estado atualizar
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (!authCustomerData || !selectedEventId) {
      console.error('Dados faltando após reload:', { 
        authCustomerData, 
        hasAuthCustomerData: !!authCustomerData,
        selectedEventId,
        user
      });
      handleShowSuccess('Erro: dados do cliente ou evento não encontrados. Por favor, complete seu cadastro.');
      // Redirecionar para tela de checkout
      setScreen('customer');
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
        authCustomerData,
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
  if (authLoading || (eventsLoading && screen === 'events-list')) return <LoadingScreen />;

  console.log('Render:', { screen, authCustomerData: !!authCustomerData, selectedEventId, orderId });

  return (
    <div className="min-h-screen text-gray-900">
      {/* Mensagem de Sucesso Global */}
      {successMsg && <SuccessMessage message={successMsg} />}

      {/* TELA DE LOGIN (Temporária - substituir por LoginScreen) */}
      {screen === 'login' && authScreen === 'login' && (
        <LoginScreenTemp 
          onLogin={handleLoginClick} 
          onBack={() => {
            setPendingCheckout(false);
            setScreen('events-list');
          }}
          onGoToRegister={() => setAuthScreen('register')}
          showBackButton={true}
        />
      )}

      {/* TELA DE CADASTRO (Temporária - substituir por RegisterScreen) */}
      {screen === 'login' && authScreen === 'register' && (
        <RegisterScreenTemp 
          onRegister={handleRegisterClick} 
          onBack={() => {
            setPendingCheckout(false);
            setScreen('events-list');
          }}
          onGoToLogin={() => setAuthScreen('login')}
        />
      )}

      {/* LISTA DE EVENTOS (Temporária - substituir por EventsListScreen) */}
      {screen === 'events-list' && (
        <EventsListScreenTemp 
          events={events}
          onSelectEvent={(id) => { setSelectedEventId(id); setScreen('tickets'); }}
          onLogout={handleLogout}
          onLogin={() => setScreen('login')}
          user={user}
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
          onCheckout={handleTryCheckout}
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
          initialCustomerData={authCustomerData}
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
      {screen === 'tickets-print' && authCustomerData && selectedEventId && (
        <TicketsPrintScreen
          orderId={orderId}
          event={events.find(e => e.id === selectedEventId)}
          issuedTickets={lastIssuedTickets}
          customerName={authCustomerData.name}
          customerEmail={authCustomerData.email}
          customerCpf={authCustomerData.cpf}
          total={getTotal(tickets)}
          onGoHome={handleGoHome}
        />
      )}

      {/* SUCESSO */}
      {screen === 'success' && authCustomerData && (
        <SuccessScreen
          orderNumber={orderId}
          total={getTotal(tickets)}
          customerEmail={authCustomerData.email}
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
  onBack?: () => void;
  onGoToRegister?: () => void;
  showBackButton?: boolean;
}

const LoginScreenTemp: React.FC<LoginScreenTempProps> = ({ onLogin, onBack, onGoToRegister, showBackButton = true }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-4 border-yellow-400">
        {showBackButton && onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition"
          >
            <ArrowLeft size={18} /> Voltar aos eventos
          </button>
        )}
        <h1 className="text-3xl font-bold text-center mb-2 flex items-center justify-center gap-2 text-black">
          <TicketIcon size={32} className="text-yellow-500" /> 
          Ingressos Amazonas FC
        </h1>
        <p className="text-center text-gray-600 text-sm mb-8">Entre com sua conta</p>
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
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>
          <button 
            onClick={onGoToRegister}
            className="w-full bg-black text-yellow-400 py-3 rounded-xl font-bold hover:bg-gray-900 transition border-2 border-black"
          >
            Criar uma conta
          </button>
          <p className="text-xs text-center text-gray-400 mt-4">Demo: admin@admin.com / admin</p>
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
  onLogin: () => void;
  user: { name: string; isAdmin: boolean } | null;
}

const EventsListScreenTemp: React.FC<EventsListScreenTempProps> = ({ 
  events, 
  onSelectEvent, 
  onLogout,
  onLogin,
  user
}) => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-black shadow-sm h-16 flex items-center px-4 justify-between sticky top-0 z-10">
        <h2 className="font-bold text-yellow-400 flex items-center gap-2">
          <TicketIcon size={20} /> Eventos
        </h2>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-white text-sm">Olá, {user.name}</span>
              <button 
                onClick={onLogout} 
                className="text-white hover:text-yellow-400 transition"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button 
              onClick={onLogin} 
              className="bg-yellow-400 text-black px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-yellow-500 transition"
            >
              Entrar
            </button>
          )}
        </div>
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

// Tela de Cadastro Temporária
interface RegisterScreenTempProps {
  onRegister: (data: RegisterData) => void;
  onBack?: () => void;
  onGoToLogin?: () => void;
}

const RegisterScreenTemp: React.FC<RegisterScreenTempProps> = ({ onRegister, onBack, onGoToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    // Prevenir múltiplos submits
    if (isSubmitting) {
      console.log('Já está processando registro, ignorando...');
      return;
    }

    // Validar campos obrigatórios
    if (!formData.name || !formData.email || !formData.cpf || !formData.phone || !formData.password || !formData.confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    // Validar senhas
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onRegister({
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      // Limpar formulário após registrar
      setFormData({ name: '', email: '', cpf: '', phone: '', password: '', confirmPassword: '' });
    } catch (err) {
      console.error('Erro ao registrar:', err);
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-4 border-yellow-400">
        {onBack && (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition"
          >
            <ArrowLeft size={18} /> Voltar aos eventos
          </button>
        )}
        <h1 className="text-3xl font-bold text-center mb-2 flex items-center justify-center gap-2 text-black">
          <TicketIcon size={32} className="text-yellow-500" /> 
          Criar Conta
        </h1>
        <p className="text-center text-gray-600 text-sm mb-6">Registre-se para comprar ingressos</p>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nome completo"
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none text-sm"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="E-mail"
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none text-sm"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="CPF"
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none text-sm"
            value={formData.cpf}
            onChange={e => setFormData({ ...formData, cpf: e.target.value })}
            maxLength={14}
          />
          <input
            type="tel"
            placeholder="Telefone"
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none text-sm"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            maxLength={15}
          />
          <input
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none text-sm"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
          <input
            type="password"
            placeholder="Confirme a senha"
            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none text-sm"
            value={formData.confirmPassword}
            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
          />
          <button 
            onClick={handleRegister}
            disabled={isSubmitting}
            className="w-full bg-yellow-400 text-black py-3 rounded-xl font-bold hover:bg-yellow-500 transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Criando conta...' : 'Criar Conta'}
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>
          <button 
            onClick={onGoToLogin}
            className="w-full bg-black text-yellow-400 py-3 rounded-xl font-bold hover:bg-gray-900 transition border-2 border-black"
          >
            Já tenho conta
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
