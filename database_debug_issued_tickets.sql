-- =============================================
-- SCRIPT DE DEBUG - ISSUED TICKETS
-- =============================================
-- Use este script para verificar se os issued_tickets
-- estão sendo salvos corretamente no Supabase
-- =============================================

-- 1. Verificar quantos pedidos existem
SELECT 
  COUNT(*) as total_pedidos,
  MAX(created_at) as ultimo_pedido
FROM orders;

-- 2. Verificar quantos issued_tickets existem
SELECT 
  COUNT(*) as total_issued_tickets,
  MAX(created_at) as ultimo_ticket
FROM issued_tickets;

-- 3. Listar pedidos recentes com contagem de tickets
SELECT 
  o.order_id,
  o.created_at,
  o.total,
  o.payment_method,
  c.name as customer_name,
  e.name as event_name,
  (SELECT COUNT(*) FROM issued_tickets it WHERE it.order_id = o.order_id) as tickets_count
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
LEFT JOIN events e ON e.id = o.event_id
ORDER BY o.created_at DESC
LIMIT 10;

-- 4. Verificar se há pedidos SEM issued_tickets
SELECT 
  o.order_id,
  o.created_at,
  o.total,
  'SEM TICKETS!' as alerta
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM issued_tickets it WHERE it.order_id = o.order_id
)
ORDER BY o.created_at DESC;

-- 5. Ver detalhes dos issued_tickets mais recentes
SELECT 
  it.id,
  it.order_id,
  it.ticket_code,
  it.ticket_name,
  it.unit_price,
  it.customer_name,
  it.validated_at,
  it.created_at
FROM issued_tickets it
ORDER BY it.created_at DESC
LIMIT 20;

-- 6. Verificar tipos de dados dos campos order_id
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name = 'order_id'
  AND table_name IN ('orders', 'issued_tickets');

-- 7. Teste de JOIN entre orders e issued_tickets
SELECT 
  o.order_id as pedido_order_id,
  it.order_id as ticket_order_id,
  o.order_id = it.order_id as match,
  it.ticket_code
FROM orders o
LEFT JOIN issued_tickets it ON it.order_id = o.order_id
ORDER BY o.created_at DESC
LIMIT 10;

-- 8. Estatísticas por evento
SELECT 
  e.name as evento,
  COUNT(DISTINCT o.order_id) as total_pedidos,
  COUNT(it.id) as total_tickets,
  SUM(it.unit_price) as receita_total
FROM events e
LEFT JOIN orders o ON o.event_id = e.id
LEFT JOIN issued_tickets it ON it.order_id = o.order_id
GROUP BY e.id, e.name
ORDER BY total_pedidos DESC;

-- =============================================
-- COMANDOS DE REPARO (Use com cuidado!)
-- =============================================

-- Se você encontrar pedidos sem issued_tickets,
-- NÃO é possível recriá-los automaticamente porque
-- os códigos de ticket são gerados no momento da compra.
-- 
-- Opções:
-- 1. Deletar pedidos órfãos (sem tickets):
-- DELETE FROM orders WHERE order_id IN (
--   SELECT o.order_id FROM orders o
--   WHERE NOT EXISTS (
--     SELECT 1 FROM issued_tickets it WHERE it.order_id = o.order_id
--   )
-- );

-- 2. Ver detalhes antes de deletar:
SELECT 
  o.order_id,
  o.created_at,
  o.total,
  c.name as cliente,
  e.name as evento
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
LEFT JOIN events e ON e.id = o.event_id
WHERE NOT EXISTS (
  SELECT 1 FROM issued_tickets it WHERE it.order_id = o.order_id
)
ORDER BY o.created_at DESC;

-- =============================================
-- CONCLUSÃO
-- =============================================
-- Depois de executar este script, você deve ver:
-- - Total de pedidos = Total de issued_tickets (ou múltiplo)
-- - Cada pedido deve ter pelo menos 1 issued_ticket
-- - Os order_id devem ser do tipo TEXT em ambas tabelas
-- - O JOIN entre orders e issued_tickets deve funcionar
-- =============================================
