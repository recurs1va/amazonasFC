# ⚡ Guia Rápido de Referência

## 🚀 Comandos Essenciais

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor de desenvolvimento

# Build
npm run build            # Build para produção
npm run preview          # Preview do build

# Utilitários
npm install              # Instalar dependências
```

## 📦 Imports Mais Usados

### Tipos
```tsx
import { Event, Ticket, Order, Customer } from '@types';
```

### Hooks
```tsx
import { useAuth, useEvents, useTickets, useCart } from '@hooks';
```

### Services
```tsx
import { eventService, ticketService, orderService } from '@services';
```

### Utils
```tsx
import { 
  validateEmail, 
  validateCPF, 
  formatCurrency, 
  formatCPF 
} from '@utils';
```

### Components
```tsx
import { Button, Input, Modal, LoadingScreen } from '@components/common';
```

### Constants
```tsx
import { DEFAULT_ADMIN, SCREENS } from '@constants/config';
import { MOCK_EVENTS, MOCK_TICKETS } from '@constants/mockData';
```

## 🎯 Padrões Rápidos

### Criar Componente
```tsx
import React from 'react';
import { Event } from '@types';

interface Props {
  event: Event;
  onClick?: () => void;
}

export const EventCard: React.FC<Props> = ({ event, onClick }) => {
  return (
    <div onClick={onClick}>
      <h3>{event.name}</h3>
      <p>{event.date}</p>
    </div>
  );
};
```

### Criar Hook
```tsx
import { useState, useEffect } from 'react';
import { Event } from '@types';
import { eventService } from '@services';

export const useEventDetail = (id: number) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await eventService.getById(id);
      setEvent(data);
      setLoading(false);
    };
    load();
  }, [id]);

  return { event, loading };
};
```

### Criar Service Method
```tsx
// Em eventService.ts
async getById(id: number): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
```

### Criar Validator
```tsx
// Em utils/validators.ts
export const validateTicketQuantity = (qty: number): boolean => {
  return qty > 0 && qty <= 10;
};
```

### Criar Formatter
```tsx
// Em utils/formatters.ts
export const formatEventDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};
```

## 🔍 Onde Encontrar...

### Preciso validar um campo?
→ `src/utils/validators.ts`

### Preciso formatar um valor?
→ `src/utils/formatters.ts`

### Preciso fazer CRUD de eventos?
→ `src/services/eventService.ts`

### Preciso gerenciar estado de eventos?
→ `src/hooks/useEvents.ts`

### Preciso criar um botão?
→ `src/components/common/Button.tsx`

### Preciso de dados mock?
→ `src/constants/mockData.ts`

### Preciso de tipos TypeScript?
→ `src/types/index.ts`

## 🎨 Exemplos de Uso

### Validar Formulário
```tsx
import { validateEmail, validateCPF } from '@utils';

const validate = () => {
  const errors: Record<string, string> = {};
  
  if (!validateEmail(email)) {
    errors.email = 'Email inválido';
  }
  
  if (!validateCPF(cpf)) {
    errors.cpf = 'CPF inválido';
  }
  
  return Object.keys(errors).length === 0;
};
```

### Usar Hook de Eventos
```tsx
import { useEvents } from '@hooks';

function EventsList() {
  const { events, loading, createEvent, deleteEvent } = useEvents();

  if (loading) return <LoadingScreen />;

  return (
    <div>
      {events.map(event => (
        <EventCard 
          key={event.id} 
          event={event}
          onDelete={() => deleteEvent(event.id)}
        />
      ))}
    </div>
  );
}
```

### Criar Evento
```tsx
import { eventService } from '@services';

const handleCreate = async () => {
  try {
    const newEvent = await eventService.create({
      name: 'Meu Evento',
      date: '2025-12-31',
      location: 'Local',
      description: 'Descrição'
    });
    console.log('Criado:', newEvent);
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

### Formatar Valores
```tsx
import { formatCurrency, formatCPF, formatPhone } from '@utils';

const price = formatCurrency(150.50);      // R$ 150,50
const cpf = formatCPF('12345678900');      // 123.456.789-00
const phone = formatPhone('11999998888');   // (11) 99999-8888
```

## 🐛 Debug Rápido

### Ver dados do Supabase
```tsx
import { supabase } from '@services';

// No console do navegador
const { data } = await supabase.from('events').select('*');
console.log(data);
```

### Ver estado do hook
```tsx
const events = useEvents();
console.log('Estado:', events);
```

### Testar validação
```tsx
import { validateEmail } from '@utils';
console.log(validateEmail('test@test.com')); // true
```

## 🎯 Checklist de Código

Antes de commitar:

- [ ] Código compila sem erros
- [ ] Imports organizados (externos → internos)
- [ ] Sem `console.log` desnecessários
- [ ] Componentes < 200 linhas
- [ ] Funções com JSDoc se complexas
- [ ] Tipos TypeScript definidos
- [ ] Nomes descritivos
- [ ] Formatação consistente

## 📝 Templates Prontos

### Novo Componente de Tela
```tsx
import React from 'react';
import { Button } from '@components/common';

export const MyScreen = () => {
  return (
    <div className="min-h-screen bg-black p-6">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">
        Minha Tela
      </h1>
      
      {/* Conteúdo */}
      
      <Button onClick={() => {}}>
        Ação
      </Button>
    </div>
  );
};
```

### Novo Hook
```tsx
import { useState, useCallback } from 'react';

export const useMyFeature = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const doSomething = useCallback(async () => {
    setLoading(true);
    try {
      // Lógica aqui
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, doSomething };
};
```

### Novo Service Method
```tsx
async myMethod(id: number): Promise<MyType> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabase
    .from('my_table')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
```

## 🚨 Erros Comuns

### ❌ Import circular
```tsx
// Evite: A importa B, B importa A
```

### ❌ Hook chamado condicionalmente
```tsx
// Errado
if (condition) {
  const data = useMyHook();
}

// Correto
const data = useMyHook();
if (condition) {
  // use data
}
```

### ❌ Service usado diretamente no component
```tsx
// Errado
const MyComponent = () => {
  const data = await eventService.getAll();
}

// Correto
const MyComponent = () => {
  const { events } = useEvents();
}
```

### ❌ Lógica de negócio no component
```tsx
// Errado: validação no component
const MyForm = () => {
  const validate = () => { /* lógica complexa */ }
}

// Correto: validação no utils
import { validateForm } from '@utils';
const MyForm = () => {
  const validate = () => validateForm(data);
}
```

## 💡 Dicas de Performance

### Use React.memo para listas
```tsx
export const EventCard = React.memo(({ event }) => {
  return <div>...</div>;
});
```

### Use useMemo para cálculos
```tsx
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price, 0);
}, [items]);
```

### Use useCallback para callbacks
```tsx
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

## 🔗 Links Rápidos

- [Documentação Completa](./ARQUITETURA.md)
- [Guia de Migração](./MIGRACAO.md)
- [Melhores Práticas](./MELHORES_PRATICAS.md)
- [Estrutura do Projeto](./ESTRUTURA.md)
- [Diagrama Visual](./DIAGRAMA.md)

---

**⚡ Mantenha este arquivo aberto para referência rápida!**
