-- =============================================
-- SOLUÇÃO DEFINITIVA: Função para criar customer
-- =============================================

-- 1. Criar função que bypassa RLS para criar customer
CREATE OR REPLACE FUNCTION public.create_customer_for_user(
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
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se já existe customer para este usuário
  IF EXISTS (SELECT 1 FROM customers WHERE auth_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Customer já existe para este usuário';
  END IF;

  -- Inserir e retornar o customer criado
  RETURN QUERY
  INSERT INTO customers (auth_user_id, name, email, cpf, phone)
  VALUES (auth.uid(), p_name, p_email, p_cpf, p_phone)
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
-- SELECT * FROM public.create_customer_for_user('Teste', 'teste@teste.com', '12345678901', '11999999999');
