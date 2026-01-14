# 📚 Melhores Práticas - AmazonasFC

## 🎯 Princípios Fundamentais

### 1. SOLID Principles

#### **S - Single Responsibility**
Cada módulo deve ter uma única razão para mudar.
```tsx
// ❌ Ruim: Componente faz validação, formatação e API
function EventForm() {
  const validateEmail = (email) => { ... }
  const formatDate = (date) => { ... }
  const saveEvent = async () => { 
    await supabase.from('events').insert(...) 
  }
}

// ✅ Bom: Responsabilidades separadas
import { validateEmail } from '@utils/validators';
import { formatDate } from '@utils/formatters';
import { eventService } from '@services';

function EventForm() {
  const handleSubmit = async () => {
    if (validateEmail(email)) {
      await eventService.create(data);
    }
  }
}
```

#### **O - Open/Closed**
Aberto para extensão, fechado para modificação.
```tsx
// ✅ Componente extensível via props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

// Adicione novos variants sem modificar o código existente
```

#### **L - Liskov Substitution**
Subtipos devem ser substituíveis por seus tipos base.
```tsx
// ✅ Todos os services implementam a mesma interface
interface BaseService<T> {
  getAll(): Promise<T[]>;
  create(item: T): Promise<T>;
  update(id: number, item: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}
```

#### **I - Interface Segregation**
Não force interfaces grandes em clientes que não as usam.
```tsx
// ❌ Ruim: Interface muito grande
interface EventManager {
  createEvent();
  updateEvent();
  deleteEvent();
  createTicket();
  updateTicket();
  deleteTicket();
}

// ✅ Bom: Interfaces específicas
interface EventOperations {
  createEvent();
  updateEvent();
  deleteEvent();
}

interface TicketOperations {
  createTicket();
  updateTicket();
  deleteTicket();
}
```

#### **D - Dependency Inversion**
Dependa de abstrações, não de implementações.
```tsx
// ✅ Hook depende da abstração (service), não da implementação
const useEvents = () => {
  // Pode trocar eventService por MockEventService facilmente
  const data = await eventService.getAll();
}
```

### 2. DRY (Don't Repeat Yourself)
```tsx
// ❌ Repetição
function EventCard() {
  return <div className="bg-gray-800 p-4 rounded">...</div>
}
function TicketCard() {
  return <div className="bg-gray-800 p-4 rounded">...</div>
}

// ✅ Componente reutilizável
function Card({ children }) {
  return <div className="bg-gray-800 p-4 rounded">{children}</div>
}
```

### 3. KISS (Keep It Simple, Stupid)
```tsx
// ❌ Complexo demais
const getEventStatus = (event) => {
  return new Date(event.date) > new Date() 
    ? event.tickets_sold === event.tickets_total 
      ? 'sold_out' 
      : 'available'
    : 'past';
}

// ✅ Simples e claro
const isEventPast = (event) => new Date(event.date) <= new Date();
const isEventSoldOut = (event) => event.tickets_sold === event.tickets_total;

const getEventStatus = (event) => {
  if (isEventPast(event)) return 'past';
  if (isEventSoldOut(event)) return 'sold_out';
  return 'available';
}
```

## 🏗️ Padrões de Arquitetura

### 1. Layered Architecture
```
Presentation Layer  → Components (UI)
Business Layer      → Hooks (Logic)
Data Access Layer   → Services (API)
Utilities Layer     → Utils (Helpers)
```

### 2. Repository Pattern
```tsx
// Service atua como repository
class EventService {
  private repository = supabase.from('events');
  
  async getAll() {
    return this.repository.select('*');
  }
}
```

### 3. Custom Hooks Pattern
```tsx
// Encapsule lógica complexa em hooks
const useEventFilters = (events) => {
  const [filters, setFilters] = useState({});
  
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Lógica de filtro complexa
    });
  }, [events, filters]);
  
  return { filteredEvents, filters, setFilters };
};
```

## ⚡ Performance

### 1. Memoization
```tsx
// Use React.memo para componentes puros
export const EventCard = React.memo(({ event }) => {
  return <div>...</div>;
});

// Use useMemo para cálculos pesados
const totalRevenue = useMemo(() => {
  return orders.reduce((sum, order) => sum + order.total, 0);
}, [orders]);

// Use useCallback para funções passadas como props
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

### 2. Code Splitting
```tsx
// Lazy load de componentes pesados
const AdminScreen = lazy(() => import('./screens/AdminScreen'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AdminScreen />
    </Suspense>
  );
}
```

### 3. Virtualization
```tsx
// Para listas grandes, use virtualização
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>{items[index]}</div>
  )}
</FixedSizeList>
```

## 🔒 Segurança

### 1. Validação de Entrada
```tsx
// SEMPRE valide dados do usuário
const handleSubmit = async (data) => {
  if (!validateEmail(data.email)) {
    throw new Error('Email inválido');
  }
  if (!validateCPF(data.cpf)) {
    throw new Error('CPF inválido');
  }
  await saveCustomer(data);
};
```

### 2. Sanitização
```tsx
// Sanitize inputs antes de exibir
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }) => {
  const clean = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
};
```

### 3. Autenticação
```tsx
// Proteja rotas sensíveis
const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, isAdmin } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" />;
  
  return children;
};
```

## 🧪 Testabilidade

### 1. Funções Puras
```tsx
// ✅ Testável: Função pura
export const calculateTotal = (items: CartItem[]) => {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
};

// Teste simples
expect(calculateTotal([{ price: 10, qty: 2 }])).toBe(20);
```

### 2. Dependency Injection
```tsx
// ✅ Testável: Injete dependências
export const useOrders = (orderService = defaultOrderService) => {
  // Pode passar mock no teste
};
```

### 3. Separação de Concerns
```tsx
// ✅ Lógica separada é fácil de testar
// utils/validators.test.ts
test('validateEmail returns true for valid email', () => {
  expect(validateEmail('test@test.com')).toBe(true);
});
```

## 📝 Convenções de Código

### 1. Nomenclatura
```tsx
// Componentes: PascalCase
const EventCard = () => {};

// Hooks: camelCase + use
const useAuth = () => {};

// Funções: camelCase
const calculateTotal = () => {};

// Constantes: UPPER_SNAKE_CASE
const MAX_TICKETS = 100;

// Interfaces: PascalCase + I (opcional)
interface Event {}
```

### 2. Estrutura de Arquivo
```tsx
// 1. Imports
import React from 'react';
import { Event } from '@types';

// 2. Types/Interfaces
interface Props {
  event: Event;
}

// 3. Componente/Hook
export const EventCard: React.FC<Props> = ({ event }) => {
  return <div>...</div>;
};

// 4. Exports auxiliares (se houver)
export { ... };
```

### 3. Comentários
```tsx
/**
 * Calcula o total de um pedido
 * @param items - Itens do pedido
 * @returns Total em reais
 */
export const calculateTotal = (items: OrderItem[]): number => {
  // Implementação
};
```

## 🎨 UI/UX

### 1. Feedback Visual
```tsx
// Sempre dê feedback ao usuário
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await saveData();
    showSuccessMessage('Salvo com sucesso!');
  } catch (error) {
    showErrorMessage('Erro ao salvar');
  } finally {
    setLoading(false);
  }
};
```

### 2. Acessibilidade
```tsx
// Use labels semânticos
<button aria-label="Fechar modal">
  <X />
</button>

// Use roles apropriados
<div role="alert">{errorMessage}</div>

// Navegação por teclado
<input onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
```

### 3. Estados de Loading
```tsx
// Mostre loading states
{loading ? <Spinner /> : <Content />}

// Skeleton screens para melhor UX
{loading ? <ContentSkeleton /> : <Content />}
```

## 🚀 Deploy e Build

### 1. Environment Variables
```env
# .env.local (não commitar)
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_KEY=your-key
```

```tsx
// Acesse com segurança
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
```

### 2. Build Optimization
```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 3. Error Boundaries
```tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    console.error('Error:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorScreen />;
    }
    return this.props.children;
  }
}
```

## 📊 Monitoramento

### 1. Logging
```tsx
// Use logging estruturado
const logger = {
  info: (message, data) => console.log('[INFO]', message, data),
  error: (message, error) => console.error('[ERROR]', message, error),
};

logger.info('User logged in', { userId: user.id });
```

### 2. Error Tracking
```tsx
// Integre com serviço de tracking (ex: Sentry)
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

## ✅ Checklist Antes de Commitar

- [ ] Código compila sem erros
- [ ] Sem warnings no console
- [ ] Formatação consistente
- [ ] Imports organizados
- [ ] Componentes documentados
- [ ] Funções têm JSDoc
- [ ] Testes passando (se houver)
- [ ] Sem console.logs desnecessários
- [ ] Performance verificada
- [ ] Acessibilidade OK
