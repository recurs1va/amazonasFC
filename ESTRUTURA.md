# 📂 Estrutura Completa do Projeto

## 🌲 Árvore de Diretórios

```
amazonasFC/
│
├── 📄 Arquivos de Configuração
│   ├── package.json                    # Dependências e scripts
│   ├── tsconfig.json                   # Configuração TypeScript
│   ├── vite.config.ts                  # Configuração Vite
│   ├── vercel.json                     # Deploy Vercel
│   └── .env                            # Variáveis de ambiente
│
├── 📚 Documentação
│   ├── README.md                       # Documentação principal
│   ├── RESUMO.md                       # Resumo executivo
│   ├── ARQUITETURA.md                  # Guia de arquitetura
│   ├── MIGRACAO.md                     # Guia de migração
│   ├── MELHORES_PRATICAS.md           # Best practices
│   └── INSTALACAO.md                   # Guia de instalação
│
├── 🗄️ Database
│   └── supabase_migration_validated_tickets.sql
│
├── 📱 Aplicação (Raiz)
│   ├── index.html                      # HTML entry point
│   ├── index.tsx                       # React entry point
│   ├── App.tsx                         # Componente principal (a refatorar)
│   └── metadata.json
│
└── 📁 src/                             # Código fonte modular
    │
    ├── 🎨 components/                  # Componentes React
    │   │
    │   ├── common/                     # Componentes reutilizáveis
    │   │   ├── Button.tsx              # Botão com variants
    │   │   ├── Input.tsx               # Input com validação
    │   │   ├── Modal.tsx               # Modal genérico
    │   │   ├── LoadingScreen.tsx       # Tela de loading
    │   │   ├── SuccessMessage.tsx      # Mensagem de sucesso
    │   │   └── index.ts                # Barrel export
    │   │
    │   ├── screens/                    # Telas principais (a criar)
    │   │   ├── LoginScreen.tsx
    │   │   ├── EventsListScreen.tsx
    │   │   ├── AdminScreen.tsx
    │   │   ├── EventDetailScreen.tsx
    │   │   ├── CheckoutScreen.tsx
    │   │   ├── ConfirmScreen.tsx
    │   │   ├── ValidationScreen.tsx
    │   │   └── index.ts
    │   │
    │   └── forms/                      # Formulários (a criar)
    │       ├── EventForm.tsx
    │       ├── TicketForm.tsx
    │       ├── CustomerForm.tsx
    │       └── index.ts
    │
    ├── 🎣 hooks/                       # Custom React Hooks
    │   ├── useAuth.ts                  # Autenticação
    │   ├── useEvents.ts                # Gerenciamento de eventos
    │   ├── useTickets.ts               # Gerenciamento de ingressos
    │   ├── useCart.ts                  # Carrinho de compras
    │   └── index.ts                    # Barrel export
    │
    ├── 🔌 services/                    # Camada de API/Dados
    │   ├── supabaseClient.ts           # Cliente Supabase
    │   ├── eventService.ts             # CRUD de eventos
    │   ├── ticketService.ts            # CRUD de ingressos
    │   ├── orderService.ts             # CRUD de pedidos
    │   ├── validationService.ts        # Validação de ingressos
    │   └── index.ts                    # Barrel export
    │
    ├── 🛠️ utils/                       # Funções auxiliares
    │   ├── validators.ts               # Validações (email, CPF, etc)
    │   ├── formatters.ts               # Formatações (moeda, data, etc)
    │   ├── ticketCode.ts               # Geração de códigos
    │   └── index.ts                    # Barrel export
    │
    ├── 📋 constants/                   # Constantes e configurações
    │   ├── mockData.ts                 # Dados de demonstração
    │   └── config.ts                   # Configurações do app
    │
    ├── 📘 types/                       # TypeScript Types
    │   └── index.ts                    # Interfaces e tipos
    │
    └── 🌐 contexts/                    # React Context (futuro)
        └── AppContext.tsx

```

## 📊 Estatísticas do Projeto

### Arquivos Criados/Organizados

| Categoria | Quantidade | Descrição |
|-----------|------------|-----------|
| **Components** | 5+ | Componentes reutilizáveis |
| **Hooks** | 4 | Custom hooks |
| **Services** | 5 | Camada de API |
| **Utils** | 3 | Funções auxiliares |
| **Constants** | 2 | Configurações |
| **Types** | 1 | Definições TypeScript |
| **Docs** | 5 | Documentação completa |
| **Config** | 3 | Arquivos de configuração |

**Total**: ~28 arquivos modulares

### Linhas de Código

| Tipo | Linhas | Descrição |
|------|--------|-----------|
| **Código** | ~2000+ | TypeScript/TSX |
| **Documentação** | ~1500+ | Markdown |
| **Configuração** | ~100+ | JSON/TS |

**Total**: ~3600+ linhas organizadas

## 🎯 Arquivos por Responsabilidade

### 🎨 Camada de Apresentação (UI)
```
components/
├── common/Button.tsx           → Botões estilizados
├── common/Input.tsx            → Inputs com validação
├── common/Modal.tsx            → Modais
├── common/LoadingScreen.tsx    → Loading state
└── common/SuccessMessage.tsx   → Feedback visual
```

### 🧠 Camada de Lógica (Business Logic)
```
hooks/
├── useAuth.ts         → Login/Logout/Permissões
├── useEvents.ts       → CRUD + Estado de eventos
├── useTickets.ts      → CRUD + Estado de ingressos
└── useCart.ts         → Lógica do carrinho
```

### 💾 Camada de Dados (Data Access)
```
services/
├── supabaseClient.ts      → Conexão com Supabase
├── eventService.ts        → API de eventos
├── ticketService.ts       → API de ingressos
├── orderService.ts        → API de pedidos
└── validationService.ts   → API de validação
```

### 🔧 Camada de Utilitários (Helpers)
```
utils/
├── validators.ts    → validateEmail, validateCPF, etc
├── formatters.ts    → formatCurrency, formatDate, etc
└── ticketCode.ts    → generateTicketCode, parseTicketCode
```

### 📦 Dados e Configurações
```
constants/
├── mockData.ts     → MOCK_EVENTS, MOCK_TICKETS
└── config.ts       → DEFAULT_ADMIN, SCREENS, etc

types/
└── index.ts        → Event, Ticket, Order, Customer, etc
```

## 📈 Crescimento Planejado

### Próximas Adições

#### Fase 1: Componentes de Tela
```
components/screens/
├── LoginScreen.tsx          → Tela de login
├── EventsListScreen.tsx     → Lista de eventos
├── AdminScreen.tsx          → Painel admin
├── EventDetailScreen.tsx    → Detalhes do evento
├── CheckoutScreen.tsx       → Finalização
├── ConfirmScreen.tsx        → Confirmação
└── ValidationScreen.tsx     → Validação de ingresso
```

#### Fase 2: Formulários
```
components/forms/
├── EventForm.tsx            → Form criar/editar evento
├── TicketForm.tsx           → Form criar/editar ingresso
└── CustomerForm.tsx         → Form dados do cliente
```

#### Fase 3: Context
```
contexts/
├── AppContext.tsx           → Estado global
├── AuthContext.tsx          → Contexto de autenticação
└── CartContext.tsx          → Contexto do carrinho
```

#### Fase 4: Testes
```
__tests__/
├── utils/
│   ├── validators.test.ts
│   └── formatters.test.ts
├── services/
│   └── eventService.test.ts
└── hooks/
    └── useAuth.test.ts
```

## 🔍 Como Navegar

### Para Implementar Nova Feature

1. **UI**: Crie componente em `components/`
2. **Lógica**: Crie hook em `hooks/`
3. **API**: Adicione método em `services/`
4. **Utils**: Se precisar, adicione em `utils/`

### Para Modificar Feature Existente

1. **Busque** o componente/hook/service relevante
2. **Modifique** apenas o que é necessário
3. **Teste** as mudanças
4. **Documente** se necessário

### Para Adicionar Validação

1. Vá para `utils/validators.ts`
2. Adicione função `validateX`
3. Exporte no `utils/index.ts`
4. Use: `import { validateX } from '@utils'`

### Para Adicionar Formatação

1. Vá para `utils/formatters.ts`
2. Adicione função `formatX`
3. Exporte no `utils/index.ts`
4. Use: `import { formatX } from '@utils'`

## 🎓 Padrão de Importação

### Imports Externos (3rd party)
```tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@supabase/supabase-js';
```

### Imports Internos (com aliases)
```tsx
import { Event, Ticket } from '@types';
import { validateEmail, formatCurrency } from '@utils';
import { eventService } from '@services';
import { useAuth, useEvents } from '@hooks';
import { Button, Input } from '@components/common';
```

### Imports Relativos (apenas quando próximo)
```tsx
import { ComponenteLocal } from './ComponenteLocal';
```

## 🚀 Path Aliases Configurados

```json
{
  "@/*": "./src/*",
  "@components/*": "./src/components/*",
  "@hooks/*": "./src/hooks/*",
  "@services/*": "./src/services/*",
  "@utils/*": "./src/utils/*",
  "@constants/*": "./src/constants/*",
  "@types/*": "./src/types/*"
}
```

## 📚 Documentação por Nível

### Iniciante
1. Comece com [RESUMO.md](./RESUMO.md)
2. Veja exemplos em [MIGRACAO.md](./MIGRACAO.md)

### Intermediário
1. Leia [ARQUITETURA.md](./ARQUITETURA.md)
2. Siga [MELHORES_PRATICAS.md](./MELHORES_PRATICAS.md)

### Avançado
1. Explore o código em `src/`
2. Contribua com melhorias

---

**Última Atualização**: Janeiro 2026  
**Versão da Estrutura**: 1.0.0  
**Status**: ✅ Implementado e Documentado
