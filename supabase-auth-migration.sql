-- =============================================
-- MIGRAÇÃO: Adicionar autenticação Supabase
-- =============================================

-- 1. Adicionar coluna auth_user_id na tabela customers
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Criar índice para melhorar performance de busca
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);

-- 3. Criar índice único para garantir 1:1 entre auth.users e customers
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_auth_user_id_unique ON customers(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- 4. Habilitar Row Level Security (RLS) na tabela customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 5. Criar política: Usuários podem ler seus próprios dados
DROP POLICY IF EXISTS "Users can read their own customer data" ON customers;
CREATE POLICY "Users can read their own customer data"
ON customers
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- 6. Criar política: Usuários podem atualizar seus próprios dados
DROP POLICY IF EXISTS "Users can update their own customer data" ON customers;
CREATE POLICY "Users can update their own customer data"
ON customers
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id);

-- 7. Criar política: Permitir inserção durante cadastro (vinculado ao auth_user_id)
-- IMPORTANTE: Esta política permite que usuários autenticados criem seu próprio registro
DROP POLICY IF EXISTS "Users can insert their own customer data" ON customers;
CREATE POLICY "Users can insert their own customer data"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_user_id);

-- 8. Criar política: Admin pode ler todos os dados (opcional)
-- Descomentar se precisar que admin veja todos os customers
-- CREATE POLICY "Admins can read all customer data"
-- ON customers
-- FOR SELECT
-- USING (auth.jwt() ->> 'email' = 'admin@admin.com');

-- 9. Habilitar RLS nas outras tabelas relacionadas (opcional, mas recomendado)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE issued_tickets ENABLE ROW LEVEL SECURITY;

-- 10. Criar política: Usuários podem ler seus próprios pedidos
CREATE POLICY "Users can read their own orders"
ON orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = orders.customer_id 
    AND customers.auth_user_id = auth.uid()
  )
);

-- 11. Criar política: Usuários podem criar pedidos para si mesmos
CREATE POLICY "Users can create their own orders"
ON orders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers 
    WHERE customers.id = customer_id 
    AND customers.auth_user_id = auth.uid()
  )
);

-- 12. Criar política: Usuários podem ler seus próprios ingressos
CREATE POLICY "Users can read their own tickets"
ON issued_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.order_id = issued_tickets.order_id 
    AND c.auth_user_id = auth.uid()
  )
);

-- =============================================
-- FUNÇÃO AUXILIAR: Criar customer automaticamente após signup
-- =============================================

-- Esta função pode ser usada como trigger para criar customer automaticamente
-- quando um novo usuário se registra no Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar registro de customer com dados básicos
  -- Os campos nome, cpf, phone serão preenchidos pela aplicação
  INSERT INTO public.customers (auth_user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Usuário'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger (OPCIONAL - a aplicação já cria o customer manualmente)
-- Descomentar se quiser automatizar a criação do customer
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- NOTAS IMPORTANTES
-- =============================================
-- 1. Executar esta migração no Supabase SQL Editor
-- 2. Testar as políticas RLS com diferentes usuários
-- 3. Para eventos e tickets públicos, não aplicar RLS (ou criar políticas de leitura pública)
-- 4. Considerar criar índices adicionais se houver queries lentas
