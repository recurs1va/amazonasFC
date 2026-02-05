-- =============================================
-- QUERIES ÚTEIS PARA MANUTENÇÃO E DEBUG
-- =============================================
-- Coleção de queries úteis para administração do banco
-- =============================================

-- =============================================
-- 1. ESTATÍSTICAS GERAIS
-- =============================================

-- Resumo geral do sistema
SELECT 
  (SELECT COUNT(*) FROM public.events) as total_eventos,
  (SELECT COUNT(*) FROM public.tickets) as total_tipos_ingressos,
  (SELECT COUNT(*) FROM public.customers) as total_clientes,
  (SELECT COUNT(*) FROM public.orders) as total_pedidos,
  (SELECT COUNT(*) FROM public.issued_tickets) as total_ingressos_emitidos,
  (SELECT COUNT(*) FROM public.issued_tickets WHERE validated_at IS NOT NULL) as ingressos_validados,
  (SELECT SUM(total) FROM public.orders) as faturamento_total;

-- =============================================
-- 2. VENDAS POR EVENTO
-- =============================================

SELECT 
  e.id,
  e.name as evento,
  e.date as data,
  COUNT(DISTINCT o.id) as total_pedidos,
  COUNT(it.id) as ingressos_vendidos,
  COUNT(CASE WHEN it.validated_at IS NOT NULL THEN 1 END) as ingressos_validados,
  SUM(o.total) as faturamento,
  ROUND(AVG(o.total), 2) as ticket_medio
FROM public.events e
LEFT JOIN public.orders o ON e.id = o.event_id
LEFT JOIN public.issued_tickets it ON o.order_id = it.order_id
GROUP BY e.id, e.name, e.date
ORDER BY faturamento DESC NULLS LAST;

-- =============================================
-- 3. TOP CLIENTES
-- =============================================

SELECT 
  c.id,
  c.name,
  c.email,
  c.cpf,
  COUNT(DISTINCT o.id) as total_compras,
  COUNT(it.id) as total_ingressos,
  SUM(o.total) as valor_total_gasto,
  MAX(o.created_at) as ultima_compra
FROM public.customers c
LEFT JOIN public.orders o ON c.id = o.customer_id
LEFT JOIN public.issued_tickets it ON o.order_id = it.order_id
GROUP BY c.id, c.name, c.email, c.cpf
HAVING COUNT(o.id) > 0
ORDER BY valor_total_gasto DESC
LIMIT 20;

-- =============================================
-- 4. INGRESSOS POR TIPO
-- =============================================

SELECT 
  t.event_id,
  e.name as evento,
  t.name as tipo_ingresso,
  t.price as preco_unitario,
  COUNT(it.id) as quantidade_vendida,
  SUM(it.unit_price) as faturamento_tipo
FROM public.tickets t
LEFT JOIN public.events e ON t.event_id = e.id
LEFT JOIN public.issued_tickets it ON t.id = it.ticket_id
GROUP BY t.event_id, e.name, t.name, t.price
ORDER BY t.event_id, quantidade_vendida DESC;

-- =============================================
-- 5. VENDAS POR MÉTODO DE PAGAMENTO
-- =============================================

SELECT 
  payment_method as metodo_pagamento,
  COUNT(*) as total_pedidos,
  SUM(total) as faturamento,
  ROUND(AVG(total), 2) as valor_medio
FROM public.orders
GROUP BY payment_method
ORDER BY faturamento DESC;

-- =============================================
-- 6. PEDIDOS RECENTES (ÚLTIMAS 24H)
-- =============================================

SELECT 
  o.order_id,
  c.name as cliente,
  e.name as evento,
  o.total,
  o.payment_method,
  COUNT(it.id) as qtd_ingressos,
  o.created_at
FROM public.orders o
JOIN public.customers c ON o.customer_id = c.id
JOIN public.events e ON o.event_id = e.id
LEFT JOIN public.issued_tickets it ON o.order_id = it.order_id
WHERE o.created_at > NOW() - INTERVAL '24 hours'
GROUP BY o.id, o.order_id, c.name, e.name, o.total, o.payment_method, o.created_at
ORDER BY o.created_at DESC;

-- =============================================
-- 7. INGRESSOS NÃO VALIDADOS
-- =============================================

SELECT 
  it.ticket_code,
  e.name as evento,
  e.date as data_evento,
  it.ticket_name as tipo,
  c.name as cliente,
  o.created_at as data_compra,
  EXTRACT(DAY FROM (NOW() - o.created_at)) as dias_desde_compra
FROM public.issued_tickets it
JOIN public.orders o ON it.order_id = o.order_id
JOIN public.events e ON it.event_id = e.id
JOIN public.customers c ON o.customer_id = c.id
WHERE it.validated_at IS NULL
ORDER BY o.created_at DESC
LIMIT 50;

-- =============================================
-- 8. VERIFICAR INTEGRIDADE DE DADOS
-- =============================================

-- Pedidos sem ingressos emitidos (problema!)
SELECT 
  o.order_id,
  o.created_at,
  c.name as cliente,
  o.total
FROM public.orders o
LEFT JOIN public.issued_tickets it ON o.order_id = it.order_id
LEFT JOIN public.customers c ON o.customer_id = c.id
WHERE it.id IS NULL;

-- Ingressos órfãos (sem pedido correspondente)
SELECT 
  it.ticket_code,
  it.order_id,
  it.ticket_name
FROM public.issued_tickets it
LEFT JOIN public.orders o ON it.order_id = o.order_id
WHERE o.id IS NULL;

-- Clientes sem auth_user_id (não vinculados)
SELECT 
  id,
  name,
  email,
  cpf,
  created_at
FROM public.customers
WHERE auth_user_id IS NULL
ORDER BY created_at DESC;

-- =============================================
-- 9. ANÁLISE DE VALIDAÇÕES
-- =============================================

SELECT 
  DATE(validated_at) as data,
  COUNT(*) as total_validacoes,
  COUNT(DISTINCT event_id) as eventos_distintos
FROM public.issued_tickets
WHERE validated_at IS NOT NULL
GROUP BY DATE(validated_at)
ORDER BY data DESC;

-- =============================================
-- 10. BUSCAR PEDIDO ESPECÍFICO
-- =============================================

-- Substitua 'ORD-XXXXX' pelo ID do pedido
SELECT 
  o.order_id,
  o.created_at as data_pedido,
  c.name as cliente,
  c.email,
  c.phone,
  c.cpf,
  e.name as evento,
  e.date as data_evento,
  o.payment_method,
  o.total,
  COUNT(it.id) as qtd_ingressos
FROM public.orders o
JOIN public.customers c ON o.customer_id = c.id
JOIN public.events e ON o.event_id = e.id
LEFT JOIN public.issued_tickets it ON o.order_id = it.order_id
WHERE o.order_id = 'ORD-XXXXX'  -- <-- ALTERE AQUI
GROUP BY o.id, o.order_id, o.created_at, c.name, c.email, c.phone, c.cpf, e.name, e.date, o.payment_method, o.total;

-- Ingressos do pedido
SELECT 
  ticket_code,
  ticket_name,
  unit_price,
  CASE 
    WHEN validated_at IS NOT NULL THEN 'Validado'
    ELSE 'Pendente'
  END as status,
  validated_at
FROM public.issued_tickets
WHERE order_id = 'ORD-XXXXX'  -- <-- ALTERE AQUI
ORDER BY id;

-- =============================================
-- 11. LIMPAR DADOS DE TESTE
-- =============================================

-- Deletar pedidos e ingressos de um cliente específico
-- CUIDADO: Não há como desfazer!
/*
DELETE FROM public.issued_tickets 
WHERE customer_id = (SELECT id FROM public.customers WHERE email = 'teste@teste.com');

DELETE FROM public.orders 
WHERE customer_id = (SELECT id FROM public.customers WHERE email = 'teste@teste.com');

DELETE FROM public.customers WHERE email = 'teste@teste.com';
*/

-- =============================================
-- 12. BACKUP DE DADOS IMPORTANTES
-- =============================================

-- Exportar lista de todos os ingressos vendidos
SELECT 
  it.ticket_code,
  o.order_id,
  e.name as evento,
  e.date as data_evento,
  it.ticket_name as tipo_ingresso,
  it.unit_price,
  c.name as cliente,
  c.cpf,
  c.email,
  c.phone,
  o.payment_method,
  o.created_at as data_compra,
  CASE WHEN it.validated_at IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as validado,
  it.validated_at as data_validacao
FROM public.issued_tickets it
JOIN public.orders o ON it.order_id = o.order_id
JOIN public.events e ON it.event_id = e.id
JOIN public.customers c ON o.customer_id = c.id
ORDER BY o.created_at DESC;

-- =============================================
-- FIM DAS QUERIES ÚTEIS
-- =============================================
