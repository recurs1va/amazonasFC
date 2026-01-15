# 🏗️ Arquitetura do Projeto - AmazonasFC

## 📁 Estrutura de Diretórios

```
amazonasFC/
├── src/
│   ├── components/         # Componentes React
│   │   ├── common/        # Componentes reutilizáveis
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── SuccessMessage.tsx
│   │   │   └── index.ts
│   │   ├── screens/       # Telas principais (a implementar)
│   │   └── forms/         # Formulários (a implementar)
│   │
│   ├── hooks/             # Custom React Hooks
│   │   ├── useAuth.ts     # Autenticação
│   │   ├── useEvents.ts   # Gerenciamento de eventos
│   │   ├── useTickets.ts  # Gerenciamento de ingressos
│   │   ├── useCart.ts     # Carrinho de compras
│   │   └── index.ts
│   │
│   ├── services/          # Camada de API/Dados
│   │   ├── eventService.ts      # CRUD de eventos
│   │   ├── ticketService.ts     # CRUD de ingressos
│   │   ├── orderService.ts      # CRUD de pedidos
│   │   ├── validationService.ts # Validação de ingressos
│   │   ├── supabaseClient.ts    # Cliente Supabase
│   │   └── index.ts
│   │
│   ├── utils/             # Funções auxiliares
│   │   ├── validators.ts  # Validações (email, CPF, etc)
│   │   ├── formatters.ts  # Formatação (moeda, telefone)
│   │   ├── ticketCode.ts  # Geração de códigos de ingresso
│   │   └── index.ts
│   │
│   ├── constants/         # Constantes e configurações
│   │   ├── mockData.ts    # Dados de demonstração
│   │   └── config.ts      # Configurações do app
│   │
│   ├── types/             # TypeScript types
│   │   └── index.ts       # Interfaces e tipos
│   │
│   └── contexts/          # React Context (futuro)
│
├── App.tsx                # Componente principal
├── index.tsx              # Entry point
├── package.json
└── vite.config.ts
```

## 🎯 Princípios da Arquitetura

### 1. **Separação de Responsabilidades (SoC)**
- **Components**: Apenas UI e interação do usuário
- **Hooks**: Lógica de estado e side effects
- **Services**: Comunicação com APIs/Banco de dados
- **Utils**: Funções puras reutilizáveis

### 2. **Single Responsibility Principle (SRP)**
Cada módulo tem uma única responsabilidade:
- `validators.ts`: Apenas validação
- `formatters.ts`: Apenas formatação
- `eventService.ts`: Apenas operações de eventos

### 3. **DRY (Don't Repeat Yourself)**
- Componentes comuns reutilizáveis (`Button`, `Input`, `Modal`)
- Hooks customizados para lógica compartilhada
- Utilitários centralizados

### 4. **Dependency Injection**
- Services são classes/objetos exportados
- Hooks consomem services
- Components consomem hooks

## 🔄 Fluxo de Dados

```
User Interaction
      ↓
  Component
      ↓
   Custom Hook
      ↓
    Service
      ↓
  Supabase/API
```

## 📦 Camadas da Aplicação

### **Layer 1: UI Components**
- Componentes React puros
- Recebem dados via props
- Emitem eventos via callbacks
- Não contêm lógica de negócio

```tsx
// Exemplo
<Button onClick={handleClick} variant="primary">
  Salvar
</Button>
```

### **Layer 2: Custom Hooks**
- Gerenciam estado local
- Implementam lógica de UI
- Chamam services para operações de dados
- Retornam dados e funções para components

```tsx
// Exemplo
const { events, createEvent, loading } = useEvents();
```

### **Layer 3: Services**
- Classes com métodos para operações CRUD
- Comunicação com Supabase/API
- Tratamento de erros
- Validação de dados de entrada

```tsx
// Exemplo
await eventService.create(newEvent);
```

### **Layer 4: Utilities**
- Funções puras sem side effects
- Validadores, formatadores, helpers
- Podem ser usadas em qualquer camada

```tsx
// Exemplo
const isValid = validateEmail(email);
```

## 🎨 Padrões de Código

### **Nomenclatura**
- **Componentes**: PascalCase (`EventCard`, `LoginScreen`)
- **Hooks**: camelCase com prefixo `use` (`useAuth`, `useEvents`)
- **Services**: camelCase com sufixo `Service` (`eventService`)
- **Utils**: camelCase (`validateEmail`, `formatCurrency`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_ADMIN`)

### **Estrutura de Arquivos**
```tsx
// 1. Imports externos
import React from 'react';
import { useCallback } from 'react';

// 2. Imports internos
import { Event } from '../types';
import { eventService } from '../services';

// 3. Types/Interfaces
interface Props { ... }

// 4. Component/Hook/Service
export const MyComponent = () => { ... }
```

### **Exportações**
- Use arquivos `index.ts` para centralizar exports
- Facilita imports: `import { Button, Input } from './components/common'`

## 🚀 Benefícios da Nova Estrutura

### ✅ **Manutenibilidade**
- Código organizado por responsabilidade
- Fácil localizar e modificar funcionalidades
- Testes mais simples

### ✅ **Escalabilidade**
- Adicionar novas features sem afetar código existente
- Estrutura clara para novos desenvolvedores
- Reutilização de código

### ✅ **Testabilidade**
- Services podem ser testados isoladamente
- Utils são funções puras (fáceis de testar)
- Hooks podem ser testados com `@testing-library/react-hooks`

### ✅ **Performance**
- Imports otimizados
- Code splitting facilitado
- Lazy loading de componentes

## 📋 Próximos Passos

### **Fase 1: Componentes de Tela** (Atual)
- [ ] Extrair telas do App.tsx
- [ ] LoginScreen
- [ ] EventsListScreen
- [ ] AdminScreen
- [ ] CheckoutScreen
- [ ] ValidationScreen

### **Fase 2: Context API**
- [ ] AppContext para estado global
- [ ] Evitar prop drilling

### **Fase 3: Otimizações**
- [ ] React.memo para componentes pesados
- [ ] useMemo/useCallback onde necessário
- [ ] Code splitting com React.lazy

### **Fase 4: Testes**
- [ ] Testes unitários para utils
- [ ] Testes de integração para services
- [ ] Testes de componentes

## 💡 Convenções de Desenvolvimento

### **Commits**
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `refactor:` Refatoração sem mudança de comportamento
- `docs:` Documentação
- `style:` Formatação de código
- `test:` Adição de testes

### **Code Review**
- PRs pequenos e focados
- Descrição clara do que foi feito
- Testes passando
- Sem warnings/erros no console

## 📚 Referências

- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [TypeScript Guidelines](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
