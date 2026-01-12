# 🚀 Guia Rápido de Instalação - Sistema de Validação

## 📋 Pré-requisitos

- Projeto já configurado com Supabase
- Acesso ao painel do Supabase

## ⚡ Instalação em 3 Passos

### 1️⃣ Criar Tabela no Banco de Dados

Acesse o Supabase e execute o SQL:

1. Vá para **SQL Editor** no painel do Supabase
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `supabase_migration_validated_tickets.sql`
4. Clique em **Run**

Ou copie e execute este SQL:

```sql
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
```

### 2️⃣ Verificar Instalação

Execute este comando no SQL Editor para verificar:

```sql
SELECT * FROM validated_tickets LIMIT 1;
```

Se não houver erro, a tabela foi criada com sucesso! ✅

### 3️⃣ Testar o Sistema

1. **Teste de Compra**:
   - Acesse o site como cliente
   - Selecione um evento
   - Adicione ingressos ao carrinho
   - Preencha os dados (agora com telefone!)
   - Complete a compra
   - Imprima os ingressos

2. **Teste de Validação**:
   - Acesse o painel Admin
   - Clique em "Validar Ingresso"
   - Selecione o evento
   - Digite o código do QR (ex: `TKT-1-A7B3C9D-0`)
   - Veja o resultado da validação

3. **Teste de Duplicação**:
   - Tente validar o mesmo ingresso novamente
   - Sistema deve bloquear e informar que já foi validado

## ✅ Checklist de Funcionalidades

Após instalação, verifique:

- [ ] Campo telefone aparece no cadastro
- [ ] Validações de formato funcionam (email, CPF, telefone, nome)
- [ ] Mensagens de erro aparecem em campos inválidos
- [ ] QR codes são gerados com códigos únicos
- [ ] Código alfanumérico aparece abaixo do QR na impressão
- [ ] Botão "Validar Ingresso" aparece no menu Admin
- [ ] Tela de validação carrega corretamente
- [ ] Validação funciona e registra no banco
- [ ] Estatísticas aparecem corretamente
- [ ] Histórico de validações é exibido

## 🎯 Exemplos de Teste

### Dados Válidos para Teste:

**Nome**: `João da Silva`  
**CPF**: `123.456.789-09` (será validado)  
**Telefone**: `(11) 98765-4321`  
**Email**: `joao@example.com`

### Dados Inválidos (para testar validações):

**Nome**: `Jo` (menos de 3 caracteres) ❌  
**CPF**: `111.111.111-11` (CPF inválido) ❌  
**Telefone**: `1234` (formato inválido) ❌  
**Email**: `emailinvalido` (sem @) ❌

## 🐛 Troubleshooting

### Erro: "Tabela não existe"
**Solução**: Execute o script SQL novamente

### Erro: "Foreign key constraint"
**Solução**: Certifique-se que as tabelas `events` e `tickets` existem

### Validação não funciona
**Solução**: Verifique se a tabela `validated_tickets` foi criada corretamente

### QR code não aparece
**Solução**: Certifique-se que a biblioteca `qrcode.react` está instalada:
```bash
npm install qrcode.react
```

## 📞 Campos do Formulário

### Ordem de Preenchimento:
1. **Nome Completo** - mínimo 3 caracteres, apenas letras
2. **CPF** - formato: XXX.XXX.XXX-XX (validação completa)
3. **Telefone** - formato: (XX) XXXXX-XXXX (NOVO!)
4. **E-mail** - formato padrão de email

Todos os campos são **obrigatórios** e **validados** antes de prosseguir!

## 🎉 Pronto!

Se todos os itens do checklist estão funcionando, a instalação foi bem-sucedida!

---

**Documentação Completa**: Veja `RESUMO_IMPLEMENTACOES.md`  
**Documentação de Validação**: Veja `VALIDACAO_INGRESSOS.md`
