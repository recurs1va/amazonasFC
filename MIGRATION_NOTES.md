# 📋 Notas de Migração - Amazonas FC Ticketmaster

## ✅ Migração Completa para `issued_tickets`

**Data:** 10/02/2026

### 🎯 Objetivo
Migração completa do sistema antigo baseado em `order_items` para a nova estrutura baseada em `issued_tickets`, onde cada ingresso é rastreado individualmente.

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### 1. **events** - Eventos/Jogos
- `id` - ID único
- `name` - Nome do evento
- `date` - Data (formato DD/MM/YYYY)
- `location` - Local do evento
- `description` - Descrição opcional
- `created_at` - Data de criação

#### 2. **tickets** - Tipos de Ingresso
- `id` - ID único
- `event_id` - FK para events
- `name` - Nome do tipo (ex: Arquibancada, Camarote)
- `price` - Preço unitário
- `desc` - Descrição
- `created_at` - Data de criação

#### 3. **customers** - Clientes
- `id` - ID único
- `name` - Nome completo
- `email` - E-mail
- `phone` - Telefone
- `cpf` - CPF (sem formatação no banco)
- `auth_user_id` - FK para auth.users (Supabase Auth)
- `created_at` - Data de criação

#### 4. **orders** - Pedidos
- `id` - ID sequencial
- `order_id` - ID único do pedido (ex: ORD-1738530461234)
- `customer_id` - FK para customers
- `event_id` - FK para events
- `total` - Valor total do pedido
- `payment_method` - Método de pagamento (pix, cartao, dinheiro)
- `created_at` - Data de criação

#### 5. **issued_tickets** - Ingressos Individuais ⭐
**Tabela principal para rastreamento de ingressos**

- `id` - ID único (BIGSERIAL)
- `order_id` - ID do pedido (TEXT) - relação lógica com orders.order_id
- `event_id` - FK para events
- `ticket_id` - FK para tickets
- `ticket_code` - Código único do ingresso (ex: TKT-A1B2-3456-C)
- `ticket_name` - Nome do tipo de ingresso
- `unit_price` - Preço pago
- `customer_id` - FK para customers
- `customer_name` - Nome do cliente (cache)
- `validated_at` - Data/hora de validação (NULL = não validado)
- `created_at` - Data de emissão

---

## 🗑️ Tabelas Removidas

### ❌ order_items (REMOVIDA)
- **Motivo:** Não permitia rastreamento individual de ingressos
- **Substituída por:** `issued_tickets`
- **Diferença:** 
  - Antes: 1 registro para N ingressos do mesmo tipo
  - Agora: N registros, 1 por ingresso

### ❌ validated_tickets (REMOVIDA)
- **Motivo:** Duplicação de dados
- **Substituída por:** Campo `validated_at` em `issued_tickets`
- **Diferença:** 
  - Antes: Tabela separada para ingressos validados
  - Agora: Flag no próprio ingresso

---

## 🔄 Alterações no Código

### 1. **orderService.ts**
- ✅ `getAll()` - Agora retorna `issued_tickets` em vez de `order_items`
- ✅ `create()` - Cria ingressos individuais automaticamente

### 2. **localStorageService.ts**
- ✅ `addOrder()` - Gera `issued_tickets` a partir do carrinho
- ✅ Adicionado método `generateTicketCode()` privado
- ✅ Suporte completo para modo offline

### 3. **AdminScreenFull.tsx**
- ✅ Relatórios agora usam `issued_tickets`
- ✅ Contagem correta: `issued_tickets.length`
- ✅ Detalhamento por tipo usando `ticket_name`

### 4. **ValidationScreenFull.tsx**
- ✅ Estatísticas agora usam `issued_tickets.length`
- ✅ Contagem precisa de ingressos vendidos

### 5. **types/index.ts**
- ❌ Removido `OrderItem` interface
- ❌ Removido `ValidatedTicket` interface
- ✅ `Order` agora só tem `issued_tickets`
- ✅ `Database` interface atualizada

---

## 📝 Arquivos SQL Atualizados

### 1. **database_migration_complete.sql**
- ❌ Removida criação de `order_items`
- ❌ Removida criação de `validated_tickets`
- ✅ Apenas 5 tabelas principais
- ✅ RLS configurado corretamente
- ✅ Índices otimizados

### 2. **database_cleanup.sql**
- ❌ Removidas referências a tabelas antigas
- ✅ Limpeza simplificada

### 3. **database_seed.sql**
- ❌ Removidos comentários sobre tabelas antigas

---

## 🎫 Formato do Código de Ingresso

```
TKT-{RANDOM}{TIMESTAMP}{INDEX}-{CHECKDIGIT}
```

**Exemplo:** `TKT-A1B2C3D4-5`

- **RANDOM:** 4 caracteres aleatórios (base36)
- **TIMESTAMP:** 4 últimos dígitos do timestamp (base36)
- **INDEX:** Índice do ingresso no pedido (2 dígitos)
- **CHECKDIGIT:** Dígito verificador (base36)

---

## 🚀 Como Aplicar a Migração

### Novo Projeto
Execute `database_migration_complete.sql` no Supabase SQL Editor

### Projeto Existente com Dados
⚠️ **ATENÇÃO:** Backup obrigatório antes de executar!

```sql
-- 1. Backup dos dados atuais (se necessário)
-- Exporte via Supabase Dashboard

-- 2. Execute database_migration_complete.sql
-- Isso vai dropar e recriar todas as tabelas

-- 3. Execute database_seed.sql
-- Para adicionar dados de exemplo
```

---

## ✅ Checklist de Validação

- [x] Tabelas antigas removidas da migration
- [x] Tipos TypeScript atualizados
- [x] AdminScreenFull usando issued_tickets
- [x] ValidationScreenFull usando issued_tickets
- [x] localStorageService gerando issued_tickets
- [x] orderService retornando issued_tickets
- [x] Sem erros de compilação TypeScript
- [x] Arquivos SQL limpos

---

## 📚 Vantagens da Nova Estrutura

### ✅ Rastreamento Individual
- Cada ingresso tem código único
- Impossível validar o mesmo ingresso duas vezes
- Histórico completo de cada ingresso

### ✅ Validação Simplificada
- Campo `validated_at` diretamente no ingresso
- Não precisa de tabela separada
- Query mais rápida

### ✅ Relatórios Precisos
- Contagem exata de ingressos
- Filtros por tipo, evento, período
- Detalhamento completo

### ✅ Preparado para o Futuro
- Suporte a transferências de ingresso
- Histórico de proprietário
- Integração com QR Code
- Analytics detalhados

---

## 🔍 Consultas Úteis

### Ver todos os ingressos de um pedido
```sql
SELECT * FROM issued_tickets 
WHERE order_id = 'ORD-1738530461234'
ORDER BY created_at;
```

### Ver ingressos não validados de um evento
```sql
SELECT * FROM issued_tickets 
WHERE event_id = 1 
  AND validated_at IS NULL
ORDER BY created_at DESC;
```

### Contar ingressos por tipo
```sql
SELECT 
  ticket_name,
  COUNT(*) as quantidade,
  SUM(unit_price) as receita_total
FROM issued_tickets 
WHERE event_id = 1
GROUP BY ticket_name
ORDER BY quantidade DESC;
```

### Ver taxa de validação por evento
```sql
SELECT 
  e.name,
  COUNT(*) as total_vendidos,
  COUNT(it.validated_at) as total_validados,
  ROUND(COUNT(it.validated_at) * 100.0 / COUNT(*), 2) as taxa_validacao
FROM issued_tickets it
JOIN events e ON e.id = it.event_id
GROUP BY e.id, e.name
ORDER BY e.name;
```

---

## 🎉 Conclusão

A migração foi concluída com sucesso! O sistema agora está totalmente baseado em `issued_tickets`, proporcionando:
- ✅ Melhor rastreabilidade
- ✅ Código mais limpo
- ✅ Performance otimizada
- ✅ Relatórios precisos
- ✅ Estrutura escalável

Todas as funcionalidades continuam operacionais, com melhorias significativas na precisão dos dados e facilidade de manutenção.
