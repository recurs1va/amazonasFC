-- =====================================================
-- MIGRAÇÃO: Criar tabela issued_tickets
-- Esta tabela substitui order_items e validated_tickets
-- Cada ingresso é um registro único com controle de validação
-- =====================================================

-- 1. Criar tabela issued_tickets
CREATE TABLE IF NOT EXISTS issued_tickets (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,                                    -- ID do pedido (ex: ORD-1737312000000)
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL UNIQUE,                          -- Código único (TKT-XXX-XXXX-X)
  ticket_name TEXT NOT NULL,                                 -- Nome do tipo de ingresso
  unit_price DECIMAL(10,2) NOT NULL,                         -- Preço no momento da compra
  customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,                                        -- Desnormalizado para facilitar
  validated_at TIMESTAMPTZ DEFAULT NULL,                     -- NULL = não validado, data = validado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_issued_tickets_order_id ON issued_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_issued_tickets_event_id ON issued_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_issued_tickets_ticket_code ON issued_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_issued_tickets_customer_id ON issued_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_issued_tickets_validated_at ON issued_tickets(validated_at);

-- 3. Comentários
COMMENT ON TABLE issued_tickets IS 'Armazena cada ingresso emitido individualmente';
COMMENT ON COLUMN issued_tickets.ticket_code IS 'Código único do ingresso no formato TKT-XXX-XXXX-X';
COMMENT ON COLUMN issued_tickets.validated_at IS 'Data/hora da validação. NULL significa não validado';

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE issued_tickets ENABLE ROW LEVEL SECURITY;

-- 5. Política para permitir todas as operações (ajuste conforme necessário em produção)
CREATE POLICY "Allow all operations on issued_tickets" ON issued_tickets
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- OPCIONAL: Migrar dados existentes de order_items
-- Execute apenas se já tiver dados em produção
-- =====================================================

-- INSERT INTO issued_tickets (order_id, event_id, ticket_id, ticket_code, ticket_name, unit_price, customer_name, created_at)
-- SELECT 
--   o.order_id,
--   o.event_id,
--   oi.ticket_id,
--   'TKT-' || SUBSTRING(o.order_id FROM 5 FOR 4) || '-' || LPAD(ROW_NUMBER() OVER (PARTITION BY o.id ORDER BY oi.id)::TEXT, 4, '0') || '-0',
--   oi.ticket_name,
--   oi.unit_price,
--   c.name,
--   o.created_at
-- FROM orders o
-- JOIN order_items oi ON oi.order_id = o.id
-- JOIN customers c ON c.id = o.customer_id;

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para resumo de vendas por evento
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
  e.id as event_id,
  e.name as event_name,
  COUNT(it.id) as tickets_sold,
  COUNT(it.validated_at) as tickets_validated,
  SUM(it.unit_price) as total_revenue
FROM events e
LEFT JOIN issued_tickets it ON it.event_id = e.id
GROUP BY e.id, e.name;

-- View para resumo por tipo de ingresso
CREATE OR REPLACE VIEW ticket_type_summary AS
SELECT 
  event_id,
  ticket_name,
  COUNT(*) as quantity,
  SUM(unit_price) as subtotal,
  COUNT(validated_at) as validated
FROM issued_tickets
GROUP BY event_id, ticket_name;
