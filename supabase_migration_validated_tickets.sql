-- Tabela para armazenar ingressos validados
CREATE TABLE IF NOT EXISTS validated_tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_code TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_validated_tickets_event_id ON validated_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_validated_tickets_ticket_code ON validated_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_validated_tickets_validated_at ON validated_tickets(validated_at);

-- Comentários
COMMENT ON TABLE validated_tickets IS 'Armazena os ingressos que já foram validados na entrada do evento';
COMMENT ON COLUMN validated_tickets.ticket_code IS 'Código único do ingresso gerado no formato TKT-XXX-XXXX-X';
COMMENT ON COLUMN validated_tickets.validated_at IS 'Data e hora em que o ingresso foi validado';
