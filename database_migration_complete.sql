-- =============================================
-- MIGRAÇÃO COMPLETA - AMAZONAS FC TICKETMASTER
-- =============================================
-- Este script recria toda a estrutura do banco de dados
-- Pode ser usado para: migrations iniciais, limpeza completa, reset de ambiente
--
-- ATENÇÃO: Este script irá DELETAR todos os dados existentes!
-- Use com cuidado em produção!
--
-- Versão: 1.0
-- Data: 02/02/2026
-- =============================================

-- =============================================
-- PARTE 1: LIMPEZA (OPCIONAL - Comentar se não quiser deletar)
-- =============================================

-- Remover políticas RLS existentes
DROP POLICY IF EXISTS "Users can read their own customer data" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customer data" ON public.customers;
DROP POLICY IF EXISTS "Users can insert their own customer data" ON public.customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.events;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.tickets;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable read for users based on customer_id" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.issued_tickets;
DROP POLICY IF EXISTS "Enable read for users based on customer_id" ON public.issued_tickets;

-- Remover funções existentes
DROP FUNCTION IF EXISTS public.create_customer_for_user(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_customer_for_user(TEXT, TEXT, TEXT, TEXT);

-- Remover tabelas existentes (em ordem de dependências)
DROP TABLE IF EXISTS public.validated_tickets CASCADE;
DROP TABLE IF EXISTS public.issued_tickets CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;

-- =============================================
-- PARTE 2: CRIAÇÃO DE TABELAS
-- =============================================

-- Tabela: EVENTS (Eventos)
CREATE TABLE public.events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE public.events IS 'Armazena informações sobre eventos/jogos';
COMMENT ON COLUMN public.events.name IS 'Nome do evento';
COMMENT ON COLUMN public.events.date IS 'Data do evento (formato: DD/MM/YYYY)';
COMMENT ON COLUMN public.events.location IS 'Local do evento';

-- Tabela: TICKETS (Tipos de Ingresso)
CREATE TABLE public.tickets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  desc TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE public.tickets IS 'Tipos de ingressos disponíveis para cada evento';
COMMENT ON COLUMN public.tickets.event_id IS 'Referência ao evento';
COMMENT ON COLUMN public.tickets.name IS 'Nome do tipo de ingresso (ex: Arquibancada, Camarote)';
COMMENT ON COLUMN public.tickets.price IS 'Preço unitário do ingresso';

-- Tabela: CUSTOMERS (Clientes)
CREATE TABLE public.customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cpf TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.customers IS 'Dados dos clientes/compradores';
COMMENT ON COLUMN public.customers.auth_user_id IS 'Vínculo com usuário autenticado (auth.users)';
COMMENT ON COLUMN public.customers.cpf IS 'CPF do cliente (pode conter formatação)';

-- Tabela: ORDERS (Pedidos)
CREATE TABLE public.orders (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  customer_id INTEGER REFERENCES public.customers(id) ON DELETE SET NULL,
  event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE public.orders IS 'Pedidos/compras realizados';
COMMENT ON COLUMN public.orders.order_id IS 'ID único do pedido (ex: ORD-1738530461234)';
COMMENT ON COLUMN public.orders.payment_method IS 'Método de pagamento (pix, cartao, dinheiro)';

-- Tabela: ISSUED_TICKETS (Ingressos Emitidos Individualmente)
-- IMPORTANTE: order_id é TEXT e NÃO tem FK para orders.id
-- A relação é feita através de orders.order_id (também TEXT)
-- Por isso, joins automáticos com Supabase não funcionam
-- Use queries separadas no código para buscar issued_tickets
CREATE TABLE public.issued_tickets (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_id BIGINT NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL UNIQUE,
  ticket_name TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.issued_tickets IS 'Cada ingresso individual emitido (1 registro = 1 ingresso)';
COMMENT ON COLUMN public.issued_tickets.ticket_code IS 'Código único do ingresso (ex: TKT-ABC-1234-5)';
COMMENT ON COLUMN public.issued_tickets.validated_at IS 'Data/hora de validação (NULL = não validado ainda)';

-- Tabela: ORDER_ITEMS (DEPRECATED - manter para compatibilidade)
CREATE TABLE public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_id INTEGER REFERENCES public.tickets(id) ON DELETE CASCADE,
  ticket_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE public.order_items IS 'DEPRECATED: Use issued_tickets. Mantido para compatibilidade.';

-- Tabela: VALIDATED_TICKETS (DEPRECATED - manter para compatibilidade)
CREATE TABLE public.validated_tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_code TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL,
  event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  ticket_id BIGINT NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.validated_tickets IS 'DEPRECATED: Use issued_tickets.validated_at. Mantido para compatibilidade.';

-- =============================================
-- PARTE 3: ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para tabela customers
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON public.customers(auth_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_auth_user_id_unique ON public.customers(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON public.customers(cpf);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- Índices para tabela tickets
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);

-- Índices para tabela orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON public.orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Índices para tabela issued_tickets
CREATE INDEX IF NOT EXISTS idx_issued_tickets_order_id ON public.issued_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_issued_tickets_event_id ON public.issued_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_issued_tickets_ticket_code ON public.issued_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_issued_tickets_customer_id ON public.issued_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_issued_tickets_validated_at ON public.issued_tickets(validated_at);

-- =============================================
-- PARTE 4: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issued_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validated_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas para CUSTOMERS
CREATE POLICY "Users can read their own customer data"
ON public.customers
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own customer data"
ON public.customers
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id);

-- Não criar política de INSERT - usar função create_customer_for_user

-- Políticas para EVENTS (leitura pública)
CREATE POLICY "Enable read access for all users"
ON public.events
FOR SELECT
TO authenticated, anon
USING (true);

-- Políticas para TICKETS (leitura pública)
CREATE POLICY "Enable read access for all users"
ON public.tickets
FOR SELECT
TO authenticated, anon
USING (true);

-- Políticas para ORDERS
CREATE POLICY "Enable insert for authenticated users"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can read their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
  )
);

-- Políticas para ISSUED_TICKETS
CREATE POLICY "Enable insert for authenticated users"
ON public.issued_tickets
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can read their own issued tickets"
ON public.issued_tickets
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Enable update for validation"
ON public.issued_tickets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================
-- PARTE 5: FUNÇÕES UTILITÁRIAS
-- =============================================

-- Função para criar customer bypassing RLS
CREATE OR REPLACE FUNCTION public.create_customer_for_user(
  p_auth_user_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_cpf TEXT,
  p_phone TEXT
)
RETURNS SETOF public.customers
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
  IF EXISTS (SELECT 1 FROM public.customers WHERE auth_user_id = p_auth_user_id) THEN
    RAISE EXCEPTION 'Customer já existe para este usuário';
  END IF;

  -- Inserir e retornar o customer criado
  RETURN QUERY
  INSERT INTO public.customers (auth_user_id, name, email, cpf, phone)
  VALUES (p_auth_user_id, p_name, p_email, p_cpf, p_phone)
  RETURNING *;
END;
$$;

-- Dar permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION public.create_customer_for_user TO authenticated;

COMMENT ON FUNCTION public.create_customer_for_user IS 'Cria registro de customer vinculado ao auth.users (bypassa RLS)';

-- =============================================
-- PARTE 6: DADOS INICIAIS (SEED) - OPCIONAL
-- =============================================

-- Inserir eventos de exemplo
INSERT INTO public.events (name, date, location, description) VALUES
  ('Campeonato Amazonense 2026', '15/03/2026', 'Arena da Amazônia', 'Grande final do campeonato estadual'),
  ('Copa do Brasil - Fase Preliminar', '20/04/2026', 'Estádio Carlos Zamith', 'Jogo decisivo da Copa do Brasil')
ON CONFLICT DO NOTHING;

-- Inserir tipos de ingressos para os eventos
INSERT INTO public.tickets (event_id, name, price, desc) VALUES
  (1, 'Arquibancada', 50.00, 'Setor de arquibancada - Visão geral do campo'),
  (1, 'Cadeira Numerada', 120.00, 'Assento numerado - Conforto garantido'),
  (1, 'Camarote Premium', 350.00, 'Open bar + buffet + vista privilegiada'),
  (2, 'Arquibancada', 45.00, 'Setor de arquibancada'),
  (2, 'Cadeira Numerada', 100.00, 'Assento numerado'),
  (2, 'Camarote', 280.00, 'Open bar + buffet')
ON CONFLICT DO NOTHING;

-- =============================================
-- PARTE 7: PERMISSÕES E GRANTS
-- =============================================

-- Garantir que usuários autenticados podem inserir dados
GRANT USAGE ON SEQUENCE public.events_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.tickets_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.customers_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.orders_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.issued_tickets_id_seq TO authenticat
GRANT USAGE ON SEQUENCE public.validated_tickets_id_seq TO authenticated;ed;
GRANT USAGE ON SEQUENCE public.order_items_id_seq TO authenticated;

GRANT SELECT ON public.events TO authenticated, anon;
GRANT SELECT ON public.tickets TO authenticated, anon;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.issued_tickets TO authenticated;
GRANT ALL ON public.order_items TO authenticated;

-- =============================================
-- PARTE 8: VERIFICAÇÃO
-- =============================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('events', 'tickets', 'customers', 'orders', 'issued_tickets', 'order_items', 'validated_tickets');
  
  RAISE NOTICE 'Tabelas criadas: %', table_count;
  
  IF table_count = 7 THEN
    RAISE NOTICE '✅ Migração concluída com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Nem todas as tabelas foram criadas. Esperado: 7, Encontrado: %', table_count;
  END IF;
END $$;

-- Listar tabelas criadas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =============================================
-- FIM DA MIGRAÇÃO
-- =============================================
-- Para executar este script:
-- 1. Acesse Supabase Dashboard → SQL Editor
-- 2. Cole este script completo
-- 3. Clique em "Run"
-- 
-- ATENÇÃO: Este script irá deletar todos os dados existentes!
-- Faça backup antes de executar em produção!
-- =============================================
