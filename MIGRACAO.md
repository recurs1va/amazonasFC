# 🔄 Guia de Migração para Nova Arquitetura

## Status da Migração

### ✅ Concluído
- [x] Estrutura de diretórios criada
- [x] Utils extraídos (validators, formatters, ticketCode)
- [x] Constants extraídos (mockData, config)
- [x] Services criados (event, ticket, order, validation)
- [x] Hooks customizados (useAuth, useEvents, useTickets, useCart)
- [x] Componentes comuns (Button, Input, Modal, LoadingScreen)
- [x] Configuração de path aliases no TypeScript e Vite
- [x] Arquivos movidos (types.ts → src/types/, supabaseClient.ts → src/services/)

### 🔄 Em Andamento
- [ ] Refatoração do App.tsx
- [ ] Criação dos componentes de tela (screens)
- [ ] Criação dos componentes de formulário (forms)

### 📋 Pendente
- [ ] Context API para estado global
- [ ] Testes unitários
- [ ] Documentação de componentes

## 📝 Como Usar a Nova Estrutura

### 1. Importações com Path Aliases

```tsx
// ❌ Antes (imports relativos confusos)
import { Event } from '../../types';
import { validateEmail } from '../../utils/validators';

// ✅ Agora (imports limpos e claros)
import { Event } from '@types';
import { validateEmail } from '@utils';
```

### 2. Usando Hooks Customizados

```tsx
// ❌ Antes (lógica no componente)
const [events, setEvents] = useState<Event[]>([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadEvents = async () => {
    setLoading(true);
    const { data } = await supabase.from('events').select('*');
    setEvents(data || []);
    setLoading(false);
  };
  loadEvents();
}, []);

// ✅ Agora (hook centralizado)
const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();
```

### 3. Usando Services Diretamente (se necessário)

```tsx
import { eventService } from '@services';

// Criar evento
const newEvent = await eventService.create({
  name: 'Meu Evento',
  date: '2025-12-31',
  location: 'Local',
  description: 'Descrição'
});

// Atualizar evento
await eventService.update(eventId, { name: 'Novo Nome' });

// Deletar evento
await eventService.delete(eventId);
```

### 4. Usando Componentes Comuns

```tsx
import { Button, Input, Modal } from '@components/common';

function MyForm() {
  return (
    <form>
      <Input 
        label="Email" 
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      
      <Button variant="primary" onClick={handleSubmit}>
        Enviar
      </Button>
    </form>
  );
}
```

### 5. Validação e Formatação

```tsx
import { validateEmail, validateCPF, formatCPF, formatCurrency } from '@utils';

// Validar
if (!validateEmail(email)) {
  setError('Email inválido');
}

// Formatar
const formattedCPF = formatCPF('12345678900'); // 123.456.789-00
const price = formatCurrency(150.50); // R$ 150,50
```

## 🎯 Exemplo: Refatorando uma Tela

### Antes (App.tsx monolítico)
```tsx
// 1400+ linhas em um arquivo
// Toda lógica misturada
// Difícil de manter
```

### Depois (Modular)

#### **LoginScreen.tsx**
```tsx
import React, { useState } from 'react';
import { Input, Button } from '@components/common';
import { useAuth } from '@hooks';

export const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = () => {
    const isAdmin = login(email, password);
    onLogin(isAdmin ? 'admin' : 'events-list');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">Login</h1>
        
        <Input 
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <Input 
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <Button variant="primary" onClick={handleSubmit}>
          Entrar
        </Button>
      </div>
    </div>
  );
};
```

#### **App.tsx (simplificado)**
```tsx
import React, { useState } from 'react';
import { LoginScreen } from '@components/screens/LoginScreen';
import { EventsListScreen } from '@components/screens/EventsListScreen';
import { AdminScreen } from '@components/screens/AdminScreen';
import { LoadingScreen } from '@components/common';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');

  return (
    <>
      {screen === 'login' && <LoginScreen onLogin={setScreen} />}
      {screen === 'events-list' && <EventsListScreen onNavigate={setScreen} />}
      {screen === 'admin' && <AdminScreen onNavigate={setScreen} />}
    </>
  );
}
```

## 🔧 Passos para Continuar a Migração

### Passo 1: Criar Componentes de Tela
```bash
src/components/screens/
├── LoginScreen.tsx
├── EventsListScreen.tsx
├── AdminScreen.tsx
├── EventDetailScreen.tsx
├── CheckoutScreen.tsx
├── ConfirmScreen.tsx
├── ValidationScreen.tsx
└── index.ts
```

### Passo 2: Criar Componentes de Formulário
```bash
src/components/forms/
├── EventForm.tsx
├── TicketForm.tsx
├── CustomerForm.tsx
└── index.ts
```

### Passo 3: Refatorar App.tsx
- Mover lógica de roteamento para componente separado
- Usar apenas hooks para gerenciar estado
- Delegar UI para componentes de tela

### Passo 4: Adicionar Context (opcional)
```tsx
// src/contexts/AppContext.tsx
export const AppProvider = ({ children }) => {
  const auth = useAuth();
  const events = useEvents();
  const tickets = useTickets();
  
  return (
    <AppContext.Provider value={{ auth, events, tickets }}>
      {children}
    </AppContext.Provider>
  );
};
```

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Linhas em App.tsx** | 1400+ | ~100 |
| **Arquivos** | 8 | 40+ |
| **Reutilização** | Baixa | Alta |
| **Testabilidade** | Difícil | Fácil |
| **Manutenção** | Complexa | Simples |
| **Onboarding** | Lento | Rápido |

## 💡 Dicas de Desenvolvimento

### 1. Mantenha Componentes Pequenos
- Máximo 200-300 linhas por componente
- Se passar disso, divida em subcomponentes

### 2. Use Composição
```tsx
// ❌ Componente grande fazendo tudo
<AdminPanel />

// ✅ Composição de componentes menores
<AdminPanel>
  <EventManager />
  <TicketManager />
  <ReportViewer />
</AdminPanel>
```

### 3. Extraia Lógica Complexa
```tsx
// Se houver muita lógica, crie um hook
const useEventManagement = () => {
  // ... lógica complexa
  return { ... };
};
```

### 4. Co-locate Code
- Estilos CSS próximos aos componentes (se usar CSS modules)
- Testes próximos aos arquivos testados
- Tipos específicos podem ficar no mesmo arquivo do componente

## 🚀 Próximos Passos Recomendados

1. **Criar screens básicas** (LoginScreen, EventsListScreen)
2. **Refatorar App.tsx** para usar as novas screens
3. **Testar funcionamento** com a nova estrutura
4. **Criar forms** reutilizáveis
5. **Adicionar Context** se necessário
6. **Implementar testes**

## ❓ FAQ

**P: Preciso migrar tudo de uma vez?**
R: Não! Migre incrementalmente. Comece com uma tela e vá expandindo.

**P: Como importo do Supabase agora?**
R: Use os services: `import { eventService } from '@services'`

**P: E se eu precisar acessar o Supabase diretamente?**
R: `import { supabase } from '@services/supabaseClient'`

**P: Os dados mock ainda funcionam?**
R: Sim! Estão em `@constants/mockData`

**P: Como faço validações agora?**
R: `import { validateEmail, validateCPF } from '@utils'`
