# 🔐 Sistema de Autenticação - Supabase Auth

## ✅ Implementação Completa

Sistema de autenticação e autorização usando **Supabase Auth** com as seguintes características:

### 🎯 Características Principais

1. **Autenticação Segura**
   - Senhas com hash bcrypt via Supabase Auth
   - Tokens JWT com refresh automático
   - Sessão persistente entre recarregamentos
   - Admin hardcoded (não usa Supabase Auth)

2. **Registro de Usuários**
   - Cadastro com validação completa
   - Campos: nome, e-mail, CPF, telefone, senha
   - Vinculação automática com tabela `customers`
   - Senha mínima de 6 caracteres

3. **Segurança no Banco de Dados**
   - Row Level Security (RLS) habilitado
   - Políticas de acesso granulares
   - Usuários acessam apenas seus próprios dados
   - Relacionamento 1:1 entre `auth.users` e `customers`

4. **Experiência do Usuário**
   - Auto-preenchimento de dados no checkout
   - Login automático após cadastro
   - Persistência de sessão
   - Fallback para localStorage (sem Supabase)

---

## 📋 Instruções de Configuração

### 1️⃣ Executar Migração do Banco de Dados

**No Supabase Dashboard:**

1. Acesse: **SQL Editor**
2. Cole o conteúdo do arquivo: `supabase-auth-migration.sql`
3. Clique em **Run**

Isso irá:
- Adicionar coluna `auth_user_id` na tabela `customers`
- Criar índices para performance
- Habilitar Row Level Security (RLS)
- Criar políticas de acesso

### 2️⃣ Verificar Variáveis de Ambiente

Certifique-se de que as variáveis estão configuradas (`.env` ou Vercel):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_KEY=sua-chave-publica-anon
```

### 3️⃣ Habilitar Email Auth no Supabase

**No Supabase Dashboard:**

1. Acesse: **Authentication > Providers**
2. Certifique-se de que **Email** está habilitado
3. Configure **Email Templates** (opcional)
4. Desabilite **Email Confirmations** para testes (ou configure SMTP)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                  FRONTEND (React)                    │
│                                                      │
│  ┌──────────────┐       ┌──────────────────────┐   │
│  │   useAuth    │◀──────│   authService.ts     │   │
│  │   (hook)     │       │  (Supabase Auth API) │   │
│  └──────────────┘       └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────┐
│              SUPABASE (Backend)                      │
│                                                      │
│  ┌─────────────────┐    ┌──────────────────────┐   │
│  │   auth.users    │◀──▶│      customers       │   │
│  │  (email/senha)  │    │  (nome, CPF, tel)    │   │
│  │   [JWT/bcrypt]  │    │  [auth_user_id FK]   │   │
│  └─────────────────┘    └──────────────────────┘   │
│                                │                     │
│                                ▼                     │
│                         ┌─────────────┐             │
│                         │   orders    │             │
│                         │(customer_id)│             │
│                         └─────────────┘             │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Arquivos Modificados/Criados

### Novos Arquivos
- `src/services/authService.ts` - Serviço de autenticação
- `supabase-auth-migration.sql` - Migração do banco de dados
- `AUTH_SETUP.md` - Esta documentação

### Arquivos Modificados
- `src/hooks/useAuth.ts` - Refatorado para usar Supabase Auth
- `src/hooks/index.ts` - Exporta RegisterData
- `src/services/index.ts` - Exporta authService
- `src/components/screens/CheckoutScreen.tsx` - Auto-preenchimento
- `App.tsx` - Integração com novo sistema de auth

---

## 🔒 Políticas de Segurança (RLS)

### Tabela `customers`
- ✅ Usuários podem **ler** seus próprios dados
- ✅ Usuários podem **atualizar** seus próprios dados
- ✅ Usuários podem **criar** seu próprio registro (vinculado ao auth_user_id)

### Tabela `orders`
- ✅ Usuários podem **ler** seus próprios pedidos
- ✅ Usuários podem **criar** pedidos para si mesmos

### Tabela `issued_tickets`
- ✅ Usuários podem **ler** seus próprios ingressos

---

## 🧪 Testando a Implementação

### 1. Cadastro de Novo Usuário
```bash
1. Acesse a aplicação
2. Clique em "Criar uma conta"
3. Preencha: Nome, E-mail, CPF, Telefone, Senha
4. Clique em "Criar Conta"
✅ Deve criar usuário no Supabase Auth + registro em customers
✅ Deve fazer login automaticamente
```

### 2. Login Existente
```bash
1. Faça logout
2. Clique em "Entrar"
3. Use e-mail e senha cadastrados
✅ Deve carregar dados do customer automaticamente
```

### 3. Auto-preenchimento no Checkout
```bash
1. Faça login
2. Adicione ingressos ao carrinho
3. Vá para checkout
✅ Campos devem estar preenchidos com seus dados
```

### 4. Admin (Hardcoded)
```bash
Email: admin@admin.com
Senha: admin
✅ Admin não usa Supabase Auth (hardcoded no authService)
```

---

## 🔄 Fallback (Sem Supabase)

Se o Supabase não estiver configurado, o sistema usa **localStorage** como fallback:
- Senhas armazenadas em texto plano (⚠️ apenas para desenvolvimento)
- Mesmas validações aplicadas
- Funcionalidade limitada (sem RLS, sem JWT)

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras
1. **Confirmação de E-mail**
   - Configurar SMTP no Supabase
   - Exigir verificação de e-mail antes da compra

2. **Reset de Senha**
   - Implementar "Esqueci minha senha"
   - Usar `authService.resetPassword()`

3. **OAuth Social**
   - Login com Google/Facebook
   - Configurar providers no Supabase

4. **Dois Fatores (2FA)**
   - Adicionar autenticação de dois fatores
   - Usar Supabase MFA

5. **Perfil do Usuário**
   - Tela para editar dados do perfil
   - Upload de foto (Supabase Storage)

---

## 📞 Suporte

Em caso de dúvidas:
1. Verifique os logs no console do navegador
2. Verifique logs do Supabase Dashboard
3. Teste as políticas RLS no SQL Editor

---

## ⚠️ Importante

- **Não commitar** arquivo `.env` com credenciais
- **Habilitar email confirmations** em produção
- **Configurar SMTP** antes do deploy final
- **Revisar políticas RLS** conforme necessidade do negócio
