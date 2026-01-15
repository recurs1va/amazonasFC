# 🎨 Como Criar os Componentes de Tela

## 📋 Telas a Criar

1. ✅ LoginScreen
2. ✅ EventsListScreen  
3. ✅ EventDetailScreen
4. ✅ CheckoutScreen
5. ✅ ConfirmScreen
6. ✅ AdminScreen
7. ✅ ValidationScreen

## 🎯 Template Base para Telas

```tsx
import React, { useState } from 'react';
import { Button, Input } from '@components/common';
import { useEvents } from '@hooks';
import { Event } from '@types';

interface MyScreenProps {
  onNavigate: (screen: string) => void;
  // Outras props necessárias
}

export const MyScreen: React.FC<MyScreenProps> = ({ onNavigate }) => {
  // Estado local da tela
  const [localState, setLocalState] = useState('');
  
  // Hooks
  const { events, loading } = useEvents();
  
  // Handlers
  const handleAction = () => {
    // Lógica
    onNavigate('next-screen');
  };
  
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Conteúdo */}
      </div>
    </div>
  );
};
```

## 📝 Implementação Detalhada

### 1. LoginScreen

**Arquivo:** `src/components/screens/LoginScreen.tsx`

```tsx
import React, { useState } from 'react';
import { Button, Input } from '@components/common';
import { validateEmail } from '@utils';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = 'Email obrigatório';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!password) {
      newErrors.password = 'Senha obrigatória';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎫</div>
          <h1 className="text-3xl font-bold text-yellow-400">AmazonasFC</h1>
          <p className="text-gray-400 mt-2">Sistema de Gestão de Eventos</p>
        </div>

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="seu@email.com"
        />

        <Input
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="********"
        />

        <div className="text-sm text-gray-400 mb-4">
          <p>Demo: admin@admin.com / admin</p>
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={handleSubmit}
        >
          Entrar
        </Button>
      </div>
    </div>
  );
};
```

### 2. EventsListScreen

**Arquivo:** `src/components/screens/EventsListScreen.tsx`

```tsx
import React from 'react';
import { Button, LoadingScreen } from '@components/common';
import { useEvents } from '@hooks';
import { Calendar, MapPin } from 'lucide-react';

interface EventsListScreenProps {
  onSelectEvent: (eventId: number) => void;
  onLogout: () => void;
}

export const EventsListScreen: React.FC<EventsListScreenProps> = ({
  onSelectEvent,
  onLogout
}) => {
  const { events, loading } = useEvents();

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400">Eventos</h1>
          <Button variant="danger" onClick={onLogout}>
            Sair
          </Button>
        </div>

        {/* Lista de Eventos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event.id)}
              className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-2xl font-bold text-yellow-400 mb-3">
                {event.name}
              </h3>
              
              <div className="flex items-center text-gray-300 mb-2">
                <Calendar size={16} className="mr-2" />
                <span>{event.date}</span>
              </div>
              
              <div className="flex items-center text-gray-300">
                <MapPin size={16} className="mr-2" />
                <span>{event.location}</span>
              </div>
              
              {event.description && (
                <p className="text-gray-400 mt-3 text-sm">
                  {event.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Nenhum evento disponível no momento
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 3. EventDetailScreen

**Arquivo:** `src/components/screens/EventDetailScreen.tsx`

```tsx
import React from 'react';
import { Button, LoadingScreen } from '@components/common';
import { useEvents, useTickets, useCart } from '@hooks';
import { formatCurrency } from '@utils';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';

interface EventDetailScreenProps {
  eventId: number;
  onBack: () => void;
  onCheckout: () => void;
}

export const EventDetailScreen: React.FC<EventDetailScreenProps> = ({
  eventId,
  onBack,
  onCheckout
}) => {
  const { events, loading: eventsLoading } = useEvents();
  const { getTicketsByEvent } = useTickets();
  const { cart, updateQuantity, getTotal, getItemCount } = useCart();

  const event = events.find(e => e.id === eventId);
  const tickets = getTicketsByEvent(eventId);

  if (eventsLoading || !event) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button variant="secondary" onClick={onBack} className="mb-6">
          <ArrowLeft className="mr-2" size={20} />
          Voltar
        </Button>

        {/* Evento Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">
            {event.name}
          </h1>
          <p className="text-gray-300 mb-2">📅 {event.date}</p>
          <p className="text-gray-300 mb-4">📍 {event.location}</p>
          {event.description && (
            <p className="text-gray-400">{event.description}</p>
          )}
        </div>

        {/* Ingressos */}
        <h2 className="text-2xl font-bold text-white mb-4">Ingressos</h2>
        <div className="space-y-4 mb-6">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-yellow-400">
                    {ticket.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{ticket.desc}</p>
                  <p className="text-white text-lg font-bold mt-2">
                    {formatCurrency(ticket.price)}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => updateQuantity(ticket.id, (cart[ticket.id] || 0) - 1)}
                    disabled={!cart[ticket.id]}
                  >
                    <Minus size={16} />
                  </Button>
                  
                  <span className="text-white text-xl w-8 text-center">
                    {cart[ticket.id] || 0}
                  </span>
                  
                  <Button
                    variant="primary"
                    onClick={() => updateQuantity(ticket.id, (cart[ticket.id] || 0) + 1)}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carrinho */}
        {getItemCount() > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white text-lg">Total:</span>
              <span className="text-yellow-400 text-2xl font-bold">
                {formatCurrency(getTotal(tickets))}
              </span>
            </div>
            
            <Button
              variant="success"
              className="w-full"
              onClick={onCheckout}
            >
              <ShoppingCart className="mr-2" size={20} />
              Finalizar Compra ({getItemCount()} {getItemCount() === 1 ? 'ingresso' : 'ingressos'})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 4. CheckoutScreen

**Arquivo:** `src/components/screens/CheckoutScreen.tsx`

```tsx
import React, { useState } from 'react';
import { Button, Input } from '@components/common';
import { useCart, useTickets } from '@hooks';
import { formatCurrency, validateEmail, validateCPF, validatePhone, formatCPF, formatPhone } from '@utils';
import { Customer } from '@types';

interface CheckoutScreenProps {
  eventId: number;
  onBack: () => void;
  onConfirm: (customer: Customer, paymentMethod: string) => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  eventId,
  onBack,
  onConfirm
}) => {
  const { cart, getTotal } = useCart();
  const { tickets } = useTickets();
  
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    email: '',
    phone: '',
    cpf: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!customer.name || customer.name.length < 3) {
      newErrors.name = 'Nome completo obrigatório';
    }
    
    if (!validateEmail(customer.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!validatePhone(customer.phone)) {
      newErrors.phone = 'Telefone inválido';
    }
    
    if (!validateCPF(customer.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    
    if (!paymentMethod) {
      newErrors.payment = 'Selecione uma forma de pagamento';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onConfirm(customer, paymentMethod);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="secondary" onClick={onBack} className="mb-6">
          ← Voltar
        </Button>

        <h1 className="text-3xl font-bold text-yellow-400 mb-6">
          Finalizar Compra
        </h1>

        {/* Resumo */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Resumo</h2>
          <div className="space-y-2">
            {Object.entries(cart).map(([ticketId, quantity]) => {
              const ticket = tickets.find(t => t.id === parseInt(ticketId));
              if (!ticket) return null;
              return (
                <div key={ticketId} className="flex justify-between text-gray-300">
                  <span>{ticket.name} x{quantity}</span>
                  <span>{formatCurrency(ticket.price * quantity)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-gray-700 mt-4 pt-4">
            <div className="flex justify-between text-white text-xl font-bold">
              <span>Total:</span>
              <span className="text-yellow-400">{formatCurrency(getTotal(tickets))}</span>
            </div>
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Seus Dados</h2>
          
          <Input
            label="Nome Completo"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            error={errors.name}
          />
          
          <Input
            label="Email"
            type="email"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            error={errors.email}
          />
          
          <Input
            label="Telefone"
            value={formatPhone(customer.phone)}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            error={errors.phone}
            placeholder="(11) 99999-9999"
          />
          
          <Input
            label="CPF"
            value={formatCPF(customer.cpf)}
            onChange={(e) => setCustomer({ ...customer, cpf: e.target.value })}
            error={errors.cpf}
            placeholder="000.000.000-00"
          />
        </div>

        {/* Forma de Pagamento */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Forma de Pagamento</h2>
          
          <div className="space-y-3">
            {['pix', 'card', 'cash'].map(method => (
              <label
                key={method}
                className="flex items-center p-4 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
              >
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <span className="text-white">
                  {method === 'pix' && '💳 PIX'}
                  {method === 'card' && '💰 Cartão de Crédito'}
                  {method === 'cash' && '💵 Dinheiro'}
                </span>
              </label>
            ))}
          </div>
          
          {errors.payment && (
            <p className="text-red-500 text-sm mt-2">{errors.payment}</p>
          )}
        </div>

        <Button
          variant="success"
          className="w-full"
          onClick={handleSubmit}
        >
          Confirmar Pedido
        </Button>
      </div>
    </div>
  );
};
```

## 📁 Estrutura Final

```
src/components/screens/
├── LoginScreen.tsx           ✅ Completo
├── EventsListScreen.tsx      ✅ Completo
├── EventDetailScreen.tsx     ✅ Completo
├── CheckoutScreen.tsx        ✅ Completo
├── ConfirmScreen.tsx         📝 A implementar
├── AdminScreen.tsx           📝 A implementar
├── ValidationScreen.tsx      📝 A implementar
└── index.ts                  📝 Barrel export
```

## ✅ Próximos Passos

1. **Criar os arquivos** acima em `src/components/screens/`
2. **Criar index.ts** para exports
3. **Descomentar imports** no App.tsx
4. **Testar** cada tela individualmente
5. **Criar telas restantes** (Confirm, Admin, Validation)

Quer que eu continue com os outros componentes de tela?
