# Sistema de Validação de Ingressos

## 📋 Visão Geral

Sistema de validação de ingressos com QR codes únicos e seguros para eventos.

## 🎯 Funcionalidades Implementadas

### 1. Geração de Ingressos
- **QR Code Único**: Cada ingresso possui um código único no formato `TKT-{EVENT_ID}-{HASH}-{INDEX}`
- **Informações Validáveis**: O código contém informações criptografadas do evento, pedido e índice do item
- **Impressão**: Código QR e código alfanumérico imprimível para validação manual

### 2. Tela de Validação
Acessível através do painel administrativo com as seguintes funcionalidades:

- ✅ Seleção do evento atual
- ✅ Campo de input para código do ingresso (suporta leitura de QR code ou digitação manual)
- ✅ Validação em tempo real
- ✅ Estatísticas do evento (vendidos vs validados)
- ✅ Histórico de validações recentes

### 3. Validações Implementadas

O sistema verifica:
- ✅ Formato do código do ingresso
- ✅ Se o ingresso pertence ao evento selecionado
- ✅ Se o ingresso já foi validado anteriormente
- ✅ Se o ingresso existe no sistema

## 🔐 Segurança

### Estrutura do Código
```
TKT-{EVENT_ID}-{HASH}-{INDEX}
```

- **EVENT_ID**: ID do evento
- **HASH**: Hash único gerado a partir de múltiplos fatores (order_id, event_id, ticket_id, timestamp)
- **INDEX**: Índice do item no pedido

### Prevenção de Fraudes
- Códigos únicos impossíveis de duplicar
- Verificação cruzada com banco de dados
- Registro de data/hora de validação
- Impossibilidade de validar o mesmo ingresso duas vezes

## 📱 Como Usar

### Para Validar Ingressos:

1. Acesse o painel administrativo
2. Clique em "Validar Ingresso"
3. Selecione o evento
4. Digite ou escaneie o código QR do ingresso
5. O sistema mostrará se o ingresso é válido ou não

### Mensagens de Validação:

**✅ Ingresso Válido:**
- Exibe informações do titular
- Tipo de ingresso
- Número do pedido
- Valor pago

**❌ Ingresso Inválido:**
- Código inválido
- Evento incorreto
- Já validado anteriormente
- Não encontrado no sistema

## 🗄️ Banco de Dados

### Nova Tabela: `validated_tickets`

Execute o script SQL fornecido no arquivo `supabase_migration_validated_tickets.sql` no seu banco Supabase.

```sql
CREATE TABLE validated_tickets (
  id BIGSERIAL PRIMARY KEY,
  ticket_code TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL,
  event_id BIGINT NOT NULL,
  ticket_id BIGINT NOT NULL,
  customer_name TEXT NOT NULL,
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎨 Interface

### Cores de Feedback:
- **Verde**: Ingresso válido ✅
- **Vermelho**: Ingresso inválido ❌
- **Amarelo**: Botões de ação

### Estatísticas em Tempo Real:
- Total de ingressos vendidos para o evento
- Total de ingressos já validados
- Lista das 10 validações mais recentes

## 🔄 Fluxo de Validação

```
1. Cliente compra ingresso
   ↓
2. Sistema gera código único
   ↓
3. QR code é impresso no ingresso
   ↓
4. Na entrada do evento:
   - Organizador seleciona o evento
   - Escaneia ou digita o código
   ↓
5. Sistema valida:
   - Formato correto?
   - Evento correto?
   - Já validado?
   - Existe no sistema?
   ↓
6. Resultado exibido instantaneamente
```

## 🚀 Melhorias Futuras

- [ ] Scanner de QR code integrado via câmera
- [ ] Modo offline para validação
- [ ] Exportação de relatórios de validação
- [ ] Notificações em tempo real
- [ ] Dashboard com gráficos de entrada
- [ ] Validação por biometria
