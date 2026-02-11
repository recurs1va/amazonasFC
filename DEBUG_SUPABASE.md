# 🔍 Guia de Debug - Problema com Relatórios no Supabase

## ✅ Checklist de Verificação

### 1️⃣ Abra o Console do Navegador (F12)

**IMPORTANTE:** Mantenha o console aberto durante todo o processo!

---

### 2️⃣ Faça Login como Admin

```
Email: admin@admin.com
Senha: (sua senha de admin)
```

**O que observar no console:**
```
🔄 [App.loadOrders] Iniciando carregamento de pedidos...
[orderService.getAll] Buscando pedidos no Supabase...
[orderService.getAll] Contagem direta: { orders: X, issued_tickets: Y }
[orderService.getAll] X pedidos encontrados
[orderService.getAll] Y issued_tickets encontrados no total
✅ [App.loadOrders] Pedidos recebidos: X
```

**❓ O que fazer se:**
- **Nenhum log aparecer:** Problema de conexão ou credenciais
- **Contagem = 0:** Não há dados no Supabase
- **Erro de permissão:** Problema de RLS (Row Level Security)

---

### 3️⃣ Vá para a Aba "Relatórios"

**O que observar no console:**
```
🔍 [AdminScreen] Props orders atualizados: { total: X, ... }
📊 [AdminScreen] Total de pedidos: X
📊 [AdminScreen] Issued tickets do primeiro pedido: [...]
📊 [AdminScreen] Total de issued_tickets em todos pedidos: X
```

**❓ O que fazer se:**
- **total: 0** mas há pedidos no banco → Problema no getAll()
- **issued_tickets: []** ou **undefined** → Problema no mapeamento
- **Nenhum log aparecer** → useEffect não está disparando

---

### 4️⃣ Clique em "🔄 Recarregar Dados"

**O que observar:**
```
🔄 Forçando reload dos dados...
[Todo o processo do passo 2 deve se repetir]
```

---

### 5️⃣ Execute o SQL de Debug no Supabase

1. Abra Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole e execute as queries do arquivo `database_debug_issued_tickets.sql`

**Queries mais importantes:**

#### Query 1: Contar registros
```sql
SELECT COUNT(*) as total_pedidos FROM orders;
SELECT COUNT(*) as total_issued_tickets FROM issued_tickets;
```

**Resultado esperado:**
- Se fez compras: total_pedidos > 0 e total_issued_tickets > 0
- Se total_pedidos > 0 mas total_issued_tickets = 0: **PROBLEMA ENCONTRADO!**

#### Query 4: Pedidos sem tickets
```sql
SELECT o.order_id, o.created_at, o.total
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM issued_tickets it WHERE it.order_id = o.order_id
);
```

**Se retornar pedidos:** Os issued_tickets não foram criados!

---

### 6️⃣ Faça uma Nova Compra (Teste)

**Passo a passo:**
1. Faça logout do admin
2. Escolha um evento
3. Adicione ingressos ao carrinho
4. Faça login/cadastro
5. Complete a compra

**O que observar no console:**
```
[orderService] Gerando códigos de ingressos...
[orderService] Total de X ingressos gerados
[orderService.create] Criando pedido no Supabase: ORD-...
[orderService.create] Pedido criado com sucesso, ID: X
[orderService.create] Inserindo X issued_tickets...
[orderService.create] Primeiro ticket: { order_id: "ORD-...", ... }
[orderService.create] X issued_tickets criados com sucesso
[orderService.create] IDs dos tickets: TKT-..., TKT-..., ...
[orderService.create] Pedido completo com X ingressos
```

**❓ O que fazer se:**
- **Erro ao criar pedido:** Verifique permissões RLS
- **Erro ao criar issued_tickets:** Pode ser constraint ou tipo de dados
- **Código duplicado (23505):** O sistema vai tentar gerar novos códigos

---

### 7️⃣ Volte ao Admin e Clique em Recarregar

**Os dados devem aparecer agora!**

---

## 🔧 Problemas Comuns e Soluções

### ❌ Problema: "Contagem direta: { orders: 0, issued_tickets: 0 }"

**Solução:** Não há dados no banco. Execute `database_seed.sql` ou faça compras.

---

### ❌ Problema: RLS bloqueando acesso

**Sintomas:**
- Erro de permissão no console
- Contagem = 0 mas você sabe que há dados

**Solução:** Execute no Supabase SQL Editor:

```sql
-- Ver políticas RLS ativas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('orders', 'issued_tickets');

-- TEMPORARIAMENTE desabilitar RLS para admin testar:
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE issued_tickets DISABLE ROW LEVEL SECURITY;

-- Depois de testar, REABILITAR:
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_tickets ENABLE ROW LEVEL SECURITY;
```

---

### ❌ Problema: Pedidos existem mas sem issued_tickets

**Sintomas:**
- Query 4 retorna pedidos
- Relatórios mostram 0 vendas

**Solução:** Deletar pedidos órfãos:

```sql
-- VER pedidos órfãos primeiro
SELECT o.order_id, o.created_at, o.total, c.name
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
WHERE NOT EXISTS (
  SELECT 1 FROM issued_tickets it WHERE it.order_id = o.order_id
);

-- DELETAR pedidos órfãos (cuidado!)
DELETE FROM orders 
WHERE NOT EXISTS (
  SELECT 1 FROM issued_tickets it WHERE it.order_id = orders.order_id
);
```

---

### ❌ Problema: order_id não está fazendo match

**Sintomas:**
- Pedidos e tickets existem
- Query 7 (teste de JOIN) mostra match = false

**Solução:** Verificar tipo de dados:

```sql
-- Ver tipo de order_id em cada tabela
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE column_name = 'order_id'
  AND table_name IN ('orders', 'issued_tickets');

-- Ambos devem ser TEXT
-- Se um for INTEGER, precisa corrigir a migration
```

---

## 📋 Checklist Final

- [ ] Login como admin funciona
- [ ] Console mostra logs de carregamento
- [ ] Contagem direta mostra dados > 0
- [ ] Não há pedidos órfãos (sem tickets)
- [ ] Nova compra cria pedido + issued_tickets
- [ ] Relatórios mostram as vendas
- [ ] Botão "Recarregar Dados" funciona

---

## 🆘 Se Nada Funcionar

**Me envie:**

1. **Logs do Console** (copie e cole tudo que aparecer)
2. **Resultado da Query 1** (contagem de registros)
3. **Resultado da Query 4** (pedidos órfãos)
4. **Resultado da Query 7** (teste de JOIN)
5. **Mensagens de erro** (se houver)

Com essas informações, consigo identificar exatamente o problema!

---

## 💡 Dica Rápida

**Teste mais simples de todos:**

1. Execute no SQL Editor:
```sql
SELECT 
  o.order_id,
  COUNT(it.id) as tickets_count
FROM orders o
LEFT JOIN issued_tickets it ON it.order_id = o.order_id
GROUP BY o.order_id;
```

2. Se `tickets_count` = 0 para algum pedido → Problema!
3. Se todos têm tickets mas relatório vazio → Problema no frontend
4. Se nenhum pedido aparecer → Problema no RLS ou não há dados
