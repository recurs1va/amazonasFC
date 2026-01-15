# 🔄 Como Refatorar o App.tsx

## 📊 Situação Atual

O `App.tsx` tem **1406 linhas** com:
- ❌ Toda a lógica de negócio misturada
- ❌ Componentes inline gigantes
- ❌ Funções de validação/formatação duplicadas
- ❌ Múltiplas responsabilidades
- ❌ Difícil de testar e manter

## 🎯 Objetivo

Transformar em **~150 linhas** apenas com:
- ✅ Gerenciamento de rotas/navegação
- ✅ Importação de componentes de tela
- ✅ Estado global mínimo
- ✅ Orquestração de telas

## 📋 Plano de Ação (Passo a Passo)

### ✅ PASSO 1: Atualizar os Imports (FAZER AGORA)

**Remova todos os imports antigos e substitua por:**

```tsx
import React, { useState } from 'react';
import { Screen } from '@types';
import { LoadingScreen } from '@components/common';

// Hooks customizados
import { useAuth, useEvents, useTickets } from '@hooks';

// Componentes de tela (criar depois)
// import { LoginScreen } from '@components/screens/LoginScreen';
// import { EventsListScreen } from '@components/screens/EventsListScreen';
// import { AdminScreen } from '@components/screens/AdminScreen';
// ... outros screens
```

**O que remover:**
```tsx
// ❌ REMOVER estas linhas (já estão nos novos módulos)
import { supabase, isSupabaseConfigured } from './supabaseClient';
// ❌ REMOVER os dados mock (já em @constants/mockData)
const MOCK_EVENTS = [...];
const MOCK_TICKETS = [...];
// ❌ REMOVER todas as funções de validação (já em @utils)
const validateEmail = ...;
const validatePhone = ...;
// ❌ REMOVER todas as funções de formatação (já em @utils)
const formatPhone = ...;
const formatCPF = ...;
// ❌ REMOVER generateTicketCode (já em @utils/ticketCode)
// ❌ REMOVER LoadingScreen (já em @components/common)
```

### ✅ PASSO 2: Simplificar o Estado (FAZER AGORA)

**Substitua todo o estado por:**

```tsx
const App: React.FC = () => {
  // Estado mínimo - apenas navegação
  const [screen, setScreen] = useState<Screen>('login');
  
  // Hooks customizados (já gerenciam seus próprios estados)
  const auth = useAuth();
  const events = useEvents();
  const tickets = useTickets();

  // Estado compartilhado (se necessário)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  
  // Renderização baseada na tela atual
  return (
    <>
      {screen === 'login' && <div>Login temporário</div>}
      {screen === 'events-list' && <div>Lista de eventos</div>}
      {screen === 'admin' && <div>Admin temporário</div>}
    </>
  );
};
```

**O que remover:**
```tsx
// ❌ REMOVER estes estados (agora nos hooks)
const [events, setEvents] = useState<Event[]>([]);
const [tickets, setTickets] = useState<Ticket[]>([]);
const [orders, setOrders] = useState<Order[]>([]);
const [validatedTickets, setValidatedTickets] = useState<ValidatedTicket[]>([]);
const [loading, setLoading] = useState(true);

// ❌ REMOVER todo o useEffect e loadData (agora nos hooks)
const loadData = useCallback(async () => { ... }, []);
useEffect(() => { loadData(); }, [loadData]);

// ❌ REMOVER todas as funções de CRUD (agora nos hooks)
const saveEvent = async () => { ... };
const deleteEvent = async () => { ... };
const saveTicket = async () => { ... };
// etc...
```

## 🏗️ Versão Refatorada Completa do App.tsx

### App.tsx (Versão Final - ~150 linhas)

```tsx
import React, { useState } from 'react';
import { Screen } from '@types';
import { LoadingScreen } from '@components/common';

// Hooks
import { useAuth, useEvents, useTickets } from '@hooks';

// Componentes de Tela (descomente conforme criar)
// import { LoginScreen } from '@components/screens/LoginScreen';
// import { EventsListScreen } from '@components/screens/EventsListScreen';
// import { EventDetailScreen } from '@components/screens/EventDetailScreen';
// import { CheckoutScreen } from '@components/screens/CheckoutScreen';
// import { ConfirmScreen } from '@components/screens/ConfirmScreen';
// import { AdminScreen } from '@components/screens/AdminScreen';
// import { ValidationScreen } from '@components/screens/ValidationScreen';

const App: React.FC = () => {
  // ==================== ESTADO ====================
  const [screen, setScreen] = useState<Screen>('login');
  
  // Hooks customizados
  const auth = useAuth();
  const events = useEvents();
  const tickets = useTickets();

  // Estado de navegação compartilhado
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  // ==================== HANDLERS ====================
  
  const handleLogin = (email: string, password: string) => {
    const isAdmin = auth.login(email, password);
    setScreen(isAdmin ? 'admin' : 'events-list');
  };

  const handleLogout = () => {
    auth.logout();
    setScreen('login');
  };

  const handleSelectEvent = (eventId: number) => {
    setSelectedEventId(eventId);
    setScreen('event-detail');
  };

  const handleCheckout = () => {
    setScreen('checkout');
  };

  const handleOrderConfirmed = (orderId: string) => {
    setLastOrderId(orderId);
    setScreen('confirm');
  };

  const handleBackToEvents = () => {
    setSelectedEventId(null);
    setScreen('events-list');
  };

  const handleBackToAdmin = () => {
    setScreen('admin');
  };

  // ==================== LOADING ====================
  
  if (events.loading || tickets.loading) {
    return <LoadingScreen />;
  }

  // ==================== RENDERIZAÇÃO ====================
  
  return (
    <>
      {/* TELA DE LOGIN */}
      {screen === 'login' && (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
            <h1 className="text-3xl font-bold text-yellow-400 mb-6">Login</h1>
            <p className="text-white">Componente LoginScreen será criado aqui</p>
            <button 
              onClick={() => handleLogin('admin@admin.com', 'admin')}
              className="bg-yellow-500 text-black px-4 py-2 rounded mt-4"
            >
              Login Admin (Temporário)
            </button>
          </div>
        </div>
      )}

      {/* TELA DE LISTA DE EVENTOS */}
      {screen === 'events-list' && (
        <div className="min-h-screen bg-black p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-yellow-400">Eventos</h1>
              <button 
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Sair
              </button>
            </div>
            
            <div className="grid gap-4">
              {events.events.map(event => (
                <div 
                  key={event.id}
                  onClick={() => handleSelectEvent(event.id)}
                  className="bg-gray-800 p-4 rounded cursor-pointer hover:bg-gray-700"
                >
                  <h3 className="text-xl font-bold text-yellow-400">{event.name}</h3>
                  <p className="text-gray-300">{event.date} - {event.location}</p>
                </div>
              ))}
            </div>
            
            <p className="text-white mt-4">
              Componente EventsListScreen será criado aqui
            </p>
          </div>
        </div>
      )}

      {/* TELA DE DETALHES DO EVENTO */}
      {screen === 'event-detail' && selectedEventId && (
        <div className="min-h-screen bg-black p-6">
          <button 
            onClick={handleBackToEvents}
            className="bg-gray-600 text-white px-4 py-2 rounded mb-4"
          >
            ← Voltar
          </button>
          <p className="text-white">Componente EventDetailScreen será criado aqui</p>
        </div>
      )}

      {/* TELA DE CHECKOUT */}
      {screen === 'checkout' && (
        <div className="min-h-screen bg-black p-6">
          <p className="text-white">Componente CheckoutScreen será criado aqui</p>
        </div>
      )}

      {/* TELA DE CONFIRMAÇÃO */}
      {screen === 'confirm' && lastOrderId && (
        <div className="min-h-screen bg-black p-6">
          <p className="text-white">Componente ConfirmScreen será criado aqui</p>
        </div>
      )}

      {/* TELA ADMIN */}
      {screen === 'admin' && auth.isAdmin && (
        <div className="min-h-screen bg-black p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-yellow-400">Painel Admin</h1>
              <button 
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Sair
              </button>
            </div>
            <p className="text-white">Componente AdminScreen será criado aqui</p>
          </div>
        </div>
      )}

      {/* TELA DE VALIDAÇÃO */}
      {screen === 'validate' && (
        <div className="min-h-screen bg-black p-6">
          <button 
            onClick={handleBackToAdmin}
            className="bg-gray-600 text-white px-4 py-2 rounded mb-4"
          >
            ← Voltar
          </button>
          <p className="text-white">Componente ValidationScreen será criado aqui</p>
        </div>
      )}
    </>
  );
};

export default App;
```

## 📝 Checklist de Refatoração

### Fase 1: Limpeza (AGORA)
- [ ] ✅ Atualizar imports para usar path aliases
- [ ] ✅ Remover MOCK_EVENTS e MOCK_TICKETS (já em @constants)
- [ ] ✅ Remover todas as funções de validação (já em @utils)
- [ ] ✅ Remover todas as funções de formatação (já em @utils)
- [ ] ✅ Remover generateTicketCode/parseTicketCode (já em @utils)
- [ ] ✅ Remover LoadingScreen component (já em @components/common)
- [ ] ✅ Remover todo o estado de dados (events, tickets, orders, etc)
- [ ] ✅ Remover loadData e useEffect
- [ ] ✅ Remover todas as funções CRUD (save/delete Event/Ticket)
- [ ] ✅ Simplificar estado para apenas navegação

### Fase 2: Hooks (AGORA)
- [ ] ✅ Importar useAuth, useEvents, useTickets
- [ ] ✅ Usar hooks ao invés de estado local
- [ ] ✅ Remover lógica de autenticação inline
- [ ] ✅ Remover lógica de CRUD inline

### Fase 3: Telas Temporárias (AGORA)
- [ ] ✅ Criar renderização condicional por screen
- [ ] ✅ Criar versões temporárias de cada tela
- [ ] ✅ Testar navegação básica
- [ ] ✅ Verificar que hooks funcionam

### Fase 4: Componentes de Tela (DEPOIS)
- [ ] 📝 Criar LoginScreen.tsx
- [ ] 📝 Criar EventsListScreen.tsx
- [ ] 📝 Criar EventDetailScreen.tsx
- [ ] 📝 Criar CheckoutScreen.tsx
- [ ] 📝 Criar ConfirmScreen.tsx
- [ ] 📝 Criar AdminScreen.tsx
- [ ] 📝 Criar ValidationScreen.tsx

### Fase 5: Substituição (DEPOIS)
- [ ] 📝 Substituir telas temporárias por componentes reais
- [ ] 📝 Remover código inline
- [ ] 📝 Testar tudo funciona
- [ ] 📝 Fazer code review

## 🎯 Comparação: Antes vs Depois

### Antes (App.tsx Atual - 1406 linhas)
```tsx
const App = () => {
  // 50+ linhas de estado
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  // ... muito mais

  // 100+ linhas de funções de validação
  const validateEmail = () => { ... };
  const validateCPF = () => { ... };
  // ... muito mais

  // 200+ linhas de funções CRUD
  const saveEvent = async () => { ... };
  const deleteEvent = async () => { ... };
  // ... muito mais

  // 1000+ linhas de JSX inline
  return (
    <div>
      {screen === 'login' && (
        <div>{/* 200 linhas de form */}</div>
      )}
      {screen === 'admin' && (
        <div>{/* 500 linhas de admin panel */}</div>
      )}
      // ... muito mais
    </div>
  );
};
```

### Depois (App.tsx Refatorado - ~150 linhas)
```tsx
const App = () => {
  // Estado mínimo
  const [screen, setScreen] = useState('login');
  
  // Hooks (lógica encapsulada)
  const auth = useAuth();
  const events = useEvents();
  
  // Handlers simples
  const handleLogin = (email, password) => {
    auth.login(email, password);
    setScreen('events-list');
  };
  
  // Renderização limpa
  return (
    <>
      {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
      {screen === 'events-list' && <EventsListScreen />}
      {screen === 'admin' && <AdminScreen />}
    </>
  );
};
```

## ⚠️ Avisos Importantes

### ❌ NÃO Faça:
- Não refatore tudo de uma vez
- Não delete o App.tsx original sem backup
- Não teste em produção

### ✅ FAÇA:
- Refatore incrementalmente
- Faça backup do App.tsx original
- Teste cada mudança
- Commit após cada fase

## 🔄 Ordem Recomendada de Execução

### 1️⃣ **AGORA**: Preparar App.tsx
```bash
# Fazer backup
cp App.tsx App.tsx.backup

# Editar App.tsx seguindo os passos 1 e 2 acima
# Testar que compila
npm run dev
```

### 2️⃣ **DEPOIS**: Criar Telas
```bash
# Criar cada componente de tela
# Começar com LoginScreen
# Testar individualmente
```

### 3️⃣ **POR ÚLTIMO**: Finalizar
```bash
# Substituir telas temporárias
# Remover código comentado
# Fazer testes completos
# Commit final
```

## 📊 Resultado Esperado

**Antes da refatoração:**
- App.tsx: 1406 linhas
- 1 arquivo
- Tudo misturado

**Depois da refatoração:**
- App.tsx: ~150 linhas (apenas navegação)
- LoginScreen.tsx: ~100 linhas
- EventsListScreen.tsx: ~150 linhas
- AdminScreen.tsx: ~200 linhas
- EventDetailScreen.tsx: ~150 linhas
- CheckoutScreen.tsx: ~150 linhas
- ConfirmScreen.tsx: ~100 linhas
- ValidationScreen.tsx: ~100 linhas

**Total: ~1100 linhas distribuídas em 8 arquivos organizados**

## 🎓 Próximo Documento a Consultar

Depois de refatorar o App.tsx, veja:
- [CRIAR_SCREENS.md](./CRIAR_SCREENS.md) - Como criar cada tela (próximo passo)
- [GUIA_RAPIDO.md](./GUIA_RAPIDO.md) - Templates e exemplos

---

**🚀 Comece pela Fase 1 (Limpeza) e siga passo a passo!**
