-- =============================================
-- SCRIPT DE SEED - DADOS INICIAIS
-- =============================================
-- Este script insere dados de exemplo para testes
-- Execute após a migração ou limpeza do banco
-- =============================================

-- Limpar dados existentes (opcional)
-- DELETE FROM public.issued_tickets;
-- DELETE FROM public.orders;
-- DELETE FROM public.tickets;
-- DELETE FROM public.events;

-- =============================================
-- EVENTOS
-- =============================================

INSERT INTO public.events (name, date, location, description) VALUES
  ('Campeonato Amazonense 2026', '15/03/2026', 'Arena da Amazônia', 'Grande final do campeonato estadual'),
  ('Copa do Brasil - Fase Preliminar', '20/04/2026', 'Estádio Carlos Zamith', 'Jogo decisivo da Copa do Brasil'),
  ('Campeonato Brasileiro Série B', '10/05/2026', 'Arena da Amazônia', 'Rodada do Brasileirão'),
  ('Torneio Amistoso Internacional', '25/06/2026', 'Arena da Amazônia', 'Jogos preparatórios'),
  ('Final do Amazonense Sub-20', '30/07/2026', 'Estádio Ismael Benigno', 'Revelando novos talentos')
ON CONFLICT DO NOTHING;

-- =============================================
-- INGRESSOS
-- =============================================

-- Ingressos para Evento 1 (Campeonato Amazonense)
INSERT INTO public.tickets (event_id, name, price, desc) VALUES
  (1, 'Arquibancada', 50.00, 'Setor de arquibancada - Visão geral do campo'),
  (1, 'Cadeira Inferior', 120.00, 'Setor de cadeiras próximo ao campo'),
  (1, 'Cadeira Superior', 90.00, 'Setor de cadeiras parte superior'),
  (1, 'Camarote Premium', 350.00, 'Open bar + buffet + vista privilegiada'),
  (1, 'Meia-entrada', 25.00, 'Estudantes, idosos e pessoas com deficiência')
ON CONFLICT DO NOTHING;

-- Ingressos para Evento 2 (Copa do Brasil)
INSERT INTO public.tickets (event_id, name, price, desc) VALUES
  (2, 'Arquibancada', 45.00, 'Setor de arquibancada'),
  (2, 'Cadeira Numerada', 100.00, 'Assento numerado com conforto'),
  (2, 'Camarote', 280.00, 'Open bar + buffet'),
  (2, 'Meia-entrada', 22.50, 'Estudantes, idosos e pessoas com deficiência')
ON CONFLICT DO NOTHING;

-- Ingressos para Evento 3 (Brasileirão Série B)
INSERT INTO public.tickets (event_id, name, price, desc) VALUES
  (3, 'Arquibancada', 60.00, 'Setor de arquibancada'),
  (3, 'Cadeira Numerada', 140.00, 'Assento numerado'),
  (3, 'Camarote VIP', 400.00, 'Open bar premium + buffet executivo'),
  (3, 'Meia-entrada', 30.00, 'Estudantes, idosos e pessoas com deficiência')
ON CONFLICT DO NOTHING;

-- Ingressos para Evento 4 (Amistoso Internacional)
INSERT INTO public.tickets (event_id, name, price, desc) VALUES
  (4, 'Arquibancada', 80.00, 'Setor de arquibancada'),
  (4, 'Cadeira Premium', 200.00, 'Assento premium com visão privilegiada'),
  (4, 'Camarote Executivo', 500.00, 'Experiência VIP completa'),
  (4, 'Meia-entrada', 40.00, 'Estudantes, idosos e pessoas com deficiência')
ON CONFLICT DO NOTHING;

-- Ingressos para Evento 5 (Final Sub-20)
INSERT INTO public.tickets (event_id, name, price, desc) VALUES
  (5, 'Arquibancada', 30.00, 'Setor de arquibancada'),
  (5, 'Cadeira', 60.00, 'Assento numerado'),
  (5, 'Meia-entrada', 15.00, 'Estudantes, idosos e pessoas com deficiência')
ON CONFLICT DO NOTHING;

-- =============================================
-- VERIFICAÇÃO
-- =============================================

-- Contar eventos e ingressos criados
SELECT 
  'Eventos criados' as tipo,
  COUNT(*) as total
FROM public.events
UNION ALL
SELECT 
  'Ingressos criados' as tipo,
  COUNT(*) as total
FROM public.tickets;

-- Listar eventos com quantidade de ingressos
SELECT 
  e.id,
  e.name,
  e.date,
  e.location,
  COUNT(t.id) as tipos_de_ingressos,
  MIN(t.price) as preco_minimo,
  MAX(t.price) as preco_maximo
FROM public.events e
LEFT JOIN public.tickets t ON e.id = t.event_id
GROUP BY e.id, e.name, e.date, e.location
ORDER BY e.id;

-- =============================================
-- ✅ Seed concluído!
-- =============================================
