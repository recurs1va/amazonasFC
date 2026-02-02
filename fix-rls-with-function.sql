-- =============================================
-- SOLUÇÃO DEFINITIVA: Função para criar customer
-- =============================================

-- 0. Remover versões antigas da função
DROP FUNCTION IF EXISTS public.create_customer_for_user(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_customer_for_user(UUID, TEXT, TEXT, TEXT, TEXT);

-- 1. Criar função que bypassa RLS para criar customer
CREATE OR REPLACE FUNCTION public.create_customer_for_user(
  p_auth_user_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_cpf TEXT,
  p_phone TEXT
)
RETURNS SETOF customers
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do dono (bypassa RLS)
SET search_path = public
AS $$
BEGIN
  -- Verificar se o user_id foi fornecido
  IF p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID não fornecido';
  END IF;

  -- Verificar se já existe customer para este usuário
  IF EXISTS (SELECT 1 FROM customers WHERE auth_user_id = p_auth_user_id) THEN
    RAISE EXCEPTION 'Customer já existe para este usuário';
  END IF;

  -- Inserir e retornar o customer criado
  RETURN QUERY
  INSERT INTO customers (auth_user_id, name, email, cpf, phone)
  VALUES (p_auth_user_id, p_name, p_email, p_cpf, p_phone)
  RETURNING *;
END;
$$;

-- 2. Dar permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION public.create_customer_for_user TO authenticated;

-- 3. Manter as políticas de SELECT e UPDATE
DROP POLICY IF EXISTS "Users can read their own customer data" ON customers;
CREATE POLICY "Users can read their own customer data"
ON customers
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update their own customer data" ON customers;
CREATE POLICY "Users can update their own customer data"
ON customers
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id);

-- 4. REMOVER política de INSERT (vamos usar a função)
DROP POLICY IF EXISTS "Users can insert their own customer data" ON customers;

-- 5. Garantir que RLS está habilitado
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TESTE
-- =============================================
-- Substitua 'SEU-USER-ID-AQUI' pelo ID real de um usuário de teste
-- SELECT * FROM public.create_customer_for_user('SEU-USER-ID-AQUI'::UUID, 'Teste', 'teste@teste.com', '12345678901', '11999999999');
