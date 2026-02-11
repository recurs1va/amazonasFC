-- =============================================
-- SCRIPT DE LIMPEZA RÁPIDA - AMAZONAS FC
-- =============================================
-- Este script DELETA todos os dados mas mantém a estrutura
-- Use quando quiser resetar os dados sem recriar tabelas
-- =============================================

-- ATENÇÃO: Este comando irá DELETAR TODOS OS DADOS!
-- Não há como desfazer esta ação!

-- Desabilitar triggers temporariamente (se houver)
SET session_replication_role = replica;

-- Limpar dados na ordem correta (respeitando foreign keys)
DELETE FROM public.issued_tickets;
DELETE FROM public.orders;
DELETE FROM public.tickets;
DELETE FROM public.events;
DELETE FROM public.customers WHERE auth_user_id IS NULL; -- Não deletar customers com auth

-- Resetar sequências (IDs voltam para 1)
ALTER SEQUENCE public.events_id_seq RESTART WITH 1;
ALTER SEQUENCE public.tickets_id_seq RESTART WITH 1;
ALTER SEQUENCE public.customers_id_seq RESTART WITH 1;
ALTER SEQUENCE public.orders_id_seq RESTART WITH 1;
ALTER SEQUENCE public.issued_tickets_id_seq RESTART WITH 1;

-- Reabilitar triggers
SET session_replication_role = DEFAULT;

-- Verificação
SELECT 
  'events' as table_name, COUNT(*) as records FROM public.events
UNION ALL
SELECT 'tickets', COUNT(*) FROM public.tickets
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL
SELECT 'issued_tickets', COUNT(*) FROM public.issued_tickets;

-- =============================================
-- ✅ Limpeza concluída!
-- Todas as tabelas foram esvaziadas e sequências resetadas.
-- =============================================
