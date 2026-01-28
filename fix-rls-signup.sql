-- =============================================
-- CORREÇÃO RÁPIDA: RLS bloqueando signup
-- =============================================
-- Execute este script no Supabase SQL Editor

-- 1. Remover políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Users can insert their own customer data" ON customers;
DROP POLICY IF EXISTS "Users can read their own customer data" ON customers;
DROP POLICY IF EXISTS "Users can update their own customer data" ON customers;

-- 2. Recriar política de INSERT com TO authenticated (essencial!)
CREATE POLICY "Users can insert their own customer data"
ON customers
FOR INSERT
TO authenticated  -- Apenas usuários autenticados (importante!)
WITH CHECK (auth.uid() = auth_user_id);

-- 3. Recriar política de SELECT
CREATE POLICY "Users can read their own customer data"
ON customers
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- 4. Recriar política de UPDATE
CREATE POLICY "Users can update their own customer data"
ON customers
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id);

-- 5. Verificar se RLS está habilitado
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TESTE A CORREÇÃO
-- =============================================
-- Tente cadastrar um novo usuário
-- O erro 401 não deve mais aparecer

-- =============================================
-- DIAGNÓSTICO (OPCIONAL)
-- =============================================
-- Se quiser ver as políticas atuais:
-- SELECT * FROM pg_policies WHERE tablename = 'customers';

-- Se quiser desabilitar RLS temporariamente para teste:
-- ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
-- ⚠️ NÃO DEIXE DESABILITADO EM PRODUÇÃO!
