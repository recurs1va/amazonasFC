<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🎫 AmazonasFC - Sistema de Gestão de Eventos e Ingressos

Sistema completo para gerenciamento de eventos, venda de ingressos e validação de acesso.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.90-3ecf8e)](https://supabase.com/)

---

## 🚀 Quick Start

```bash
# 1. Instalar dependências
npm install

# 2. Executar em modo desenvolvimento
npm run dev

# 3. Acessar
http://localhost:3000
```

**Credenciais Admin:** `admin@admin.com` / `admin`

---

## ✨ Funcionalidades

- ✅ CRUD completo de eventos e ingressos
- ✅ Carrinho de compras
- ✅ Múltiplos pagamentos (PIX, Cartão, Dinheiro)
- ✅ Geração de QR Code para ingressos
- ✅ Validação de ingressos por QR Code
- ✅ Painel administrativo com relatórios
- ✅ Modo offline (localStorage) ou online (Supabase)

---

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
src/
├── components/          # Componentes React
│   ├── common/          # Reutilizáveis (Button, Input, Modal)
│   └── screens/         # Telas (Admin, Checkout, Validation...)
├── hooks/               # Custom Hooks (useAuth, useEvents, useTickets, useCart)
├── services/            # Camada de dados (eventService, ticketService, orderService)
├── utils/               # Funções auxiliares (validators, formatters)
├── constants/           # Configurações e dados mock
└── types/               # TypeScript interfaces
```

### Camadas da Aplicação

```
┌─────────────────────────────────────────┐
│          APRESENTAÇÃO (UI)              │
│   Components / Screens                  │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│           LÓGICA (Hooks)                │
│   useAuth, useEvents, useTickets...     │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│          SERVIÇOS (Services)            │
│   eventService, ticketService...        │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│            DADOS                        │
│   Supabase (online) / localStorage      │
└─────────────────────────────────────────┘
```

### Fluxo de Dados

```
Usuário → Componente → Hook → Service → Supabase/localStorage
```

---

## 💾 Modos de Armazenamento

### Modo Local (Desenvolvimento)
- Não configure variáveis de ambiente
- Dados salvos no `localStorage` do navegador
- Dados iniciais mockados automaticamente

### Modo Online (Produção)
Configure no `.env.local`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_KEY=sua-chave-anon
```

---

## 📁 Principais Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `App.tsx` | Componente principal e navegação |
| `src/hooks/useEvents.ts` | Gerenciamento de eventos |
| `src/hooks/useTickets.ts` | Gerenciamento de ingressos |
| `src/hooks/useCart.ts` | Carrinho de compras |
| `src/services/eventService.ts` | CRUD de eventos |
| `src/services/ticketService.ts` | CRUD de ingressos |
| `src/services/orderService.ts` | CRUD de pedidos |
| `src/services/localStorageService.ts` | Armazenamento local |
| `src/components/screens/AdminScreenFull.tsx` | Painel admin completo |

---

## 🎨 Tecnologias

- **React 19** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Supabase** - Backend/Database (opcional)
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **QRCode.react** - QR Code generation

---

## 🔧 Comandos

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

---

## 📚 Padrões de Código

### Nomenclatura
- **Componentes**: PascalCase (`EventCard.tsx`)
- **Hooks**: camelCase com `use` (`useEvents.ts`)
- **Services**: camelCase com `Service` (`eventService.ts`)
- **Utils**: camelCase (`formatCurrency.ts`)

### Exemplo: Criando um Hook
```tsx
import { useState, useCallback } from 'react';
import { eventService } from '../services';

export const useEvents = () => {
  const [events, setEvents] = useState([]);
  
  const loadEvents = useCallback(async () => {
    const data = await eventService.getAll();
    setEvents(data);
  }, []);

  return { events, loadEvents };
};
```

### Exemplo: Criando um Service
```tsx
export class EventService {
  async getAll() { /* ... */ }
  async create(event) { /* ... */ }
  async update(id, event) { /* ... */ }
  async delete(id) { /* ... */ }
}

export const eventService = new EventService();
```

---

## 📄 Licença

Este projeto está sob a licença MIT.

