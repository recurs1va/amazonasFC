-- =============================================
-- TESTE RÁPIDO - ADMIN CONSEGUE VER OS DADOS?
-- =============================================
-- Execute estas queries no SQL Editor do Supabase
-- para verificar se o problema é de permissão RLS
-- =============================================

-- 1. TESTE BÁSICO - Contar registros (ignora RLS)
SELECT 
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM issued_tickets) as total_tickets;

-- 2. VER TODOS OS PEDIDOS (pode falhar se RLS bloquear)
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;

-- 3. VER TODOS OS ISSUED_TICKETS (pode falhar se RLS bloquear)
SELECT * FROM issued_tickets ORDER BY created_at DESC LIMIT 10;

-- 4. VERIFICAR POLÍTICAS RLS ATIVAS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('orders', 'issued_tickets')
ORDER BY tablename, policyname;

-- 5. TESTE DE JOIN (crucial!)
SELECT 
  o.order_id,
  o.total,
  o.created_at,
  COUNT(it.id) as tickets_count,
  ARRAY_AGG(it.ticket_code) as ticket_codes
FROM orders o
LEFT JOIN issued_tickets it ON it.order_id = o.order_id
GROUP BY o.order_id, o.total, o.created_at
ORDER BY o.created_at DESC
LIMIT 5;

-- =============================================
-- SOLUÇÃO TEMPORÁRIA: Permitir admin ver tudo
-- =============================================
-- Se as queries acima falharem por permissão,
-- execute isto para criar políticas de admin:

-- Política para ADMIN ver TODOS os pedidos
CREATE POLICY "Admin can read all orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@admin.com'
  )
);

-- Política para ADMIN ver TODOS os issued_tickets  
CREATE POLICY "Admin can read all issued_tickets"
ON issued_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@admin.com'
  )
);

-- =============================================
-- VERIFICAR SE AS NOVAS POLÍTICAS FORAM CRIADAS
-- =============================================
SELECT policyname, tablename 
FROM pg_policies 
WHERE policyname LIKE '%Admin%'
OR policyname LIKE '%admin%';

-- =============================================
-- SE PRECISAR REMOVER AS POLÍTICAS ANTIGAS
-- =============================================
-- (Execute apenas se necessário)

-- DROP POLICY IF EXISTS "Users can read their own orders" ON orders;
-- DROP POLICY IF EXISTS "Users can read their own issued tickets" ON issued_tickets;

-- =============================================
-- RECRIAR AS POLÍTICAS CORRETAS
-- =============================================

-- Política 1: Usuários veem seus próprios pedidos
DROP POLICY IF EXISTS "Users can read their own orders" ON orders;
CREATE POLICY "Users can read their own orders"
ON orders
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
  OR
  -- OU é admin
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@admin.com'
  )
);

-- Política 2: Usuários veem seus próprios tickets
DROP POLICY IF EXISTS "Users can read their own issued tickets" ON issued_tickets;
CREATE POLICY "Users can read their own issued tickets"
ON issued_tickets
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  )
  OR
  -- OU é admin
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@admin.com'
  )
);

-- =============================================
-- TESTE FINAL
-- =============================================
-- Faça login como admin e execute:

SELECT 
  'Orders visiveis' as tipo,
  COUNT(*) as quantidade
FROM orders
UNION ALL
SELECT 
  'Issued Tickets visiveis',
  COUNT(*)
FROM issued_tickets;

-- Se retornar > 0, o admin agora consegue ver os dados!

-- =============================================
-- IMPORTANTE: ATUALIZAR database_migration_complete.sql
-- =============================================
-- Depois de confirmar que funciona, atualize o arquivo
-- database_migration_complete.sql com as novas políticas
-- que incluem a verificação de admin
-- =============================================
