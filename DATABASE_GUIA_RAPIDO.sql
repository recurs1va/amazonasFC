-- =============================================
-- GUIA RÁPIDO - ESCOLHA SEU CENÁRIO
-- =============================================

-- ┌─────────────────────────────────────────────┐
-- │  CENÁRIO 1: PRIMEIRA INSTALAÇÃO             │
-- └─────────────────────────────────────────────┘
-- Execute: database_migration_complete.sql
-- Isso irá criar toda a estrutura e dados de exemplo


-- ┌─────────────────────────────────────────────┐
-- │  CENÁRIO 2: RESETAR DADOS (MANTER ESTRUTURA)│
-- └─────────────────────────────────────────────┘
-- 1. Execute: database_cleanup.sql
-- 2. Execute: database_seed.sql (opcional)


-- ┌─────────────────────────────────────────────┐
-- │  CENÁRIO 3: RECRIAR TUDO DO ZERO            │
-- └─────────────────────────────────────────────┘
-- Execute: database_migration_complete.sql
-- ATENÇÃO: Vai deletar TUDO!


-- ┌─────────────────────────────────────────────┐
-- │  CENÁRIO 4: ADICIONAR DADOS DE TESTE        │
-- └─────────────────────────────────────────────┘
-- Execute: database_seed.sql


-- ┌─────────────────────────────────────────────┐
-- │  CENÁRIO 5: ANALISAR DADOS / DEBUG          │
-- └─────────────────────────────────────────────┘
-- Copie queries de: database_queries_uteis.sql


-- =============================================
-- ONDE EXECUTAR?
-- =============================================
-- 1. Acesse: https://app.supabase.com
-- 2. Selecione seu projeto
-- 3. Vá em: SQL Editor (menu lateral)
-- 4. Cole o script desejado
-- 5. Clique em: Run


-- =============================================
-- ARQUIVOS DISPONÍVEIS
-- =============================================
-- ✅ database_migration_complete.sql    - Migração completa
-- 🧹 database_cleanup.sql               - Limpar dados
-- 🌱 database_seed.sql                  - Dados de teste
-- 🔍 database_queries_uteis.sql         - Queries prontas
-- 📖 DATABASE_README.md                 - Documentação completa


-- =============================================
-- VERIFICAÇÃO PÓS-EXECUÇÃO
-- =============================================

-- Ver se todas as tabelas foram criadas:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Contar registros em cada tabela:
SELECT 
  'events' as tabela, COUNT(*) as registros FROM public.events
UNION ALL
SELECT 'tickets', COUNT(*) FROM public.tickets
UNION ALL
SELECT 'customers', COUNT(*) FROM public.customers
UNION ALL
SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL
SELECT 'issued_tickets', COUNT(*) FROM public.issued_tickets;

-- =============================================
-- FIM
-- =============================================
