# 🗄️ Scripts de Banco de Dados - Amazonas FC

## 📋 Visão Geral

Esta pasta contém todos os scripts SQL necessários para gerenciar o banco de dados do sistema de venda de ingressos.

## 📁 Arquivos Disponíveis

### 1️⃣ `database_migration_complete.sql` ⭐
**Propósito:** Migração completa - recria toda a estrutura do banco  
**Quando usar:** 
- Primeira instalação do projeto
- Reset completo do ambiente de desenvolvimento
- Criar novo ambiente (staging, produção)

**O que faz:**
- ❌ Deleta todas as tabelas existentes
- ✅ Cria todas as tabelas do zero
- ✅ Cria índices para performance
- ✅ Configura Row Level Security (RLS)
- ✅ Cria funções utilitárias
- ✅ Insere dados de exemplo (seed básico)

**Como executar:**
```sql
-- No Supabase Dashboard → SQL Editor
-- Cole o conteúdo do arquivo e clique em "Run"
```

⚠️ **ATENÇÃO:** Este script DELETA todos os dados! Faça backup antes!

---

### 2️⃣ `database_cleanup.sql`
**Propósito:** Limpar todos os dados mantendo a estrutura  
**Quando usar:**
- Resetar dados de teste
- Limpar ambiente de desenvolvimento
- Preparar para novo seed de dados

**O que faz:**
- ❌ Deleta TODOS os dados das tabelas
- ✅ Mantém a estrutura das tabelas
- ✅ Reseta sequências (IDs voltam para 1)
- ✅ Não afeta customers com auth vinculado

**Como executar:**
```sql
-- No Supabase Dashboard → SQL Editor
-- Cole o conteúdo e clique em "Run"
```

---

### 3️⃣ `database_seed.sql`
**Propósito:** Inserir dados de exemplo/teste  
**Quando usar:**
- Após migração ou limpeza
- Criar dados de demonstração
- Popular ambiente de desenvolvimento

**O que faz:**
- ✅ Insere 5 eventos de exemplo
- ✅ Insere tipos de ingressos variados
- ✅ Mostra estatísticas dos dados inseridos

**Como executar:**
```sql
-- No Supabase Dashboard → SQL Editor
-- Cole o conteúdo e clique em "Run"
```

---

### 4️⃣ `database_queries_uteis.sql`
**Propósito:** Queries prontas para análise e debug  
**Quando usar:**
- Verificar vendas e estatísticas
- Debug de problemas
- Análise de dados
- Relatórios gerenciais

**O que contém:**
1. Estatísticas gerais do sistema
2. Vendas por evento
3. Top clientes
4. Ingressos por tipo
5. Vendas por método de pagamento
6. Pedidos recentes
7. Ingressos não validados
8. Verificação de integridade
9. Análise de validações
10. Buscar pedido específico
11. Limpar dados de teste
12. Backup de dados

---

## 🚀 Workflows Comuns

### 🆕 Setup Inicial (Primeira Vez)

```sql
-- 1. Executar migração completa
-- database_migration_complete.sql

-- 2. (Opcional) Adicionar mais dados de teste
-- database_seed.sql
```

### 🔄 Reset de Ambiente de Desenvolvimento

```sql
-- 1. Limpar dados
-- database_cleanup.sql

-- 2. Inserir dados de teste
-- database_seed.sql
```

### 🧹 Limpeza Total e Recriação

```sql
-- 1. Migração completa (deleta tudo e recria)
-- database_migration_complete.sql
```

### 📊 Análise e Relatórios

```sql
-- Use as queries em database_queries_uteis.sql
-- Copie e cole a query desejada no SQL Editor
```

---

## 📊 Estrutura do Banco de Dados

```
┌─────────────────┐
│     events      │ ← Eventos/Jogos
├─────────────────┤
│ id              │ (PK)
│ name            │
│ date            │
│ location        │
│ description     │
└─────────────────┘
         ↓
┌─────────────────┐
│    tickets      │ ← Tipos de Ingresso
├─────────────────┤
│ id              │ (PK)
│ event_id        │ (FK)
│ name            │
│ price           │
└─────────────────┘
         ↓
┌─────────────────┐      ┌─────────────────┐
│   customers     │      │     orders      │
├─────────────────┤      ├─────────────────┤
│ id              │ ←──┐ │ id              │
│ auth_user_id    │    └─│ customer_id     │ (FK)
│ name            │      │ order_id        │ (unique)
│ cpf             │      │ event_id        │ (FK)
│ email           │      │ total           │
│ phone           │      │ payment_method  │
└─────────────────┘      └─────────────────┘
                                  ↓
                         ┌─────────────────┐
                         │ issued_tickets  │ ← Ingressos Individuais
                         ├─────────────────┤
                         │ id              │ (PK)
                         │ order_id        │
                         │ ticket_code     │ (unique)
                         │ event_id        │ (FK)
                         │ ticket_id       │ (FK)
                         │ customer_id     │ (FK)
                         │ validated_at    │
                         └─────────────────┘
```

---

## 🔐 Segurança (RLS - Row Level Security)

Todas as tabelas têm RLS habilitado:

- ✅ **customers:** Usuários só veem seus próprios dados
- ✅ **events/tickets:** Leitura pública (authenticated + anon)
- ✅ **orders:** Usuários só veem seus próprios pedidos
- ✅ **issued_tickets:** Usuários só veem seus próprios ingressos

---

## ⚡ Dicas Importantes

### 📌 Antes de Executar em Produção

1. **Sempre faça backup dos dados**
2. **Teste em ambiente de desenvolvimento primeiro**
3. **Verifique se há pedidos pendentes**
4. **Avise os usuários sobre manutenção**

### 🔍 Como Fazer Backup Manual

```sql
-- Exportar todos os pedidos
SELECT * FROM public.orders;

-- Exportar todos os ingressos
SELECT * FROM public.issued_tickets;

-- Copie os resultados e salve em arquivo CSV
```

### 🆘 Recuperação de Desastre

Se você executou um script por engano:

1. **No Supabase:** Acesse **Database** → **Backups**
2. **Restaure** o backup mais recente
3. **Ou** entre em contato com suporte do Supabase

---

## 📝 Checklist de Migração

Ao executar migração em produção:

- [ ] Backup dos dados criado
- [ ] Script testado em ambiente de desenvolvimento
- [ ] Usuários notificados sobre manutenção
- [ ] Horário de baixo tráfego escolhido
- [ ] Variáveis de ambiente verificadas
- [ ] RLS policies testadas
- [ ] Função `create_customer_for_user` funcionando
- [ ] Dados de seed (se necessário) preparados
- [ ] Rollback plan definido

---

## 🐛 Troubleshooting

### Erro: "relation does not exist"
**Solução:** Execute `database_migration_complete.sql`

### Erro: "RLS policy violation"
**Solução:** Verifique se as policies foram criadas corretamente

### Erro: "function create_customer_for_user does not exist"
**Solução:** Execute novamente a PARTE 5 do script de migração

### Dados não aparecem
**Solução:** 
1. Verifique RLS policies
2. Confirme que está logado com usuário correto
3. Execute queries em `database_queries_uteis.sql`

---

## 📞 Suporte

Para problemas relacionados ao banco de dados:

1. Verifique os logs no Supabase Dashboard → Logs
2. Execute queries de verificação em `database_queries_uteis.sql`
3. Consulte documentação do Supabase: https://supabase.com/docs

---

**Última atualização:** 02/02/2026  
**Versão:** 1.0  
**Compatível com:** Supabase PostgreSQL 15+
