<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🎫 AmazonasFC - Sistema de Gestão de Eventos e Ingressos

Sistema completo para gerenciamento de eventos, venda de ingressos e validação de acesso.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.90-3ecf8e)](https://supabase.com/)

## 🏗️ Nova Arquitetura Modular

Este projeto foi recentemente refatorado de um arquivo monolítico (1400+ linhas) para uma arquitetura modular, escalável e de fácil manutenção.

### 📚 Documentação

- 📋 [**RESUMO.md**](./RESUMO.md) - Resumo executivo da refatoração
- 🏛️ [**ARQUITETURA.md**](./ARQUITETURA.md) - Visão geral da arquitetura
- 🔄 [**MIGRACAO.md**](./MIGRACAO.md) - Guia de migração passo a passo
- ✨ [**MELHORES_PRATICAS.md**](./MELHORES_PRATICAS.md) - Padrões e convenções
- 📂 [**ESTRUTURA.md**](./ESTRUTURA.md) - Estrutura completa do projeto

## 🚀 Quick Start

**Prerequisites:** Node.js 18+

1. **Clone o repositório**
   ```bash
   git clone [repository-url]
   cd amazonasFC
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   # Edite .env.local com suas credenciais Supabase
   ```

4. **Execute o projeto**
   ```bash
   npm run dev
   ```

5. **Acesse no navegador**
   ```
   http://localhost:3000
   ```

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes React (UI)
├── hooks/          # Custom Hooks (lógica)
├── services/       # API/Database (dados)
├── utils/          # Funções auxiliares
├── constants/      # Configurações e mocks
└── types/          # TypeScript types
```

Para detalhes completos, veja [ESTRUTURA.md](./ESTRUTURA.md)

## ✨ Funcionalidades

- ✅ Gestão de eventos (criar, editar, excluir)
- ✅ Gestão de ingressos por evento
- ✅ Sistema de carrinho de compras
- ✅ Múltiplos métodos de pagamento (PIX, Cartão, Dinheiro)
- ✅ Geração de QR Code para ingressos
- ✅ Validação de ingressos por QR Code
- ✅ Painel administrativo completo
- ✅ Relatórios e estatísticas
- ✅ Modo demonstração (sem Supabase)

## 🎨 Tecnologias

- **React 19** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Supabase** - Backend/Database
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **QRCode.react** - QR Code generation

## 🔐 Credenciais Padrão

**Admin:**
- Email: `admin@admin.com`
- Senha: `admin`

## 📖 Guias de Desenvolvimento

### Para Iniciantes
1. Leia o [RESUMO.md](./RESUMO.md)
2. Veja exemplos em [MIGRACAO.md](./MIGRACAO.md)
3. Explore a [ESTRUTURA.md](./ESTRUTURA.md)

### Para Desenvolvedores
1. Estude a [ARQUITETURA.md](./ARQUITETURA.md)
2. Siga [MELHORES_PRATICAS.md](./MELHORES_PRATICAS.md)
3. Contribua com código modular

## 🛠️ Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

## 🎯 Benefícios da Nova Arquitetura

- ✅ **Manutenibilidade**: Código organizado e fácil de modificar
- ✅ **Escalabilidade**: Adicione features sem afetar código existente
- ✅ **Testabilidade**: Componentes e funções fáceis de testar
- ✅ **Performance**: Imports otimizados e code splitting
- ✅ **DX**: Developer experience melhorada com path aliases

## 📊 Métricas

| Métrica | Antes | Depois |
|---------|-------|--------|
| Linhas por arquivo | 1400+ | <200 |
| Reutilização | Baixa | Alta |
| Testabilidade | Difícil | Fácil |
| Manutenibilidade | ⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona NovaFeature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

Siga os padrões em [MELHORES_PRATICAS.md](./MELHORES_PRATICAS.md)

## 📝 Convenções de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `refactor:` Refatoração
- `docs:` Documentação
- `style:` Formatação
- `test:` Testes

## 📄 Licença

Este projeto está sob a licença MIT.

## 🔗 Links Úteis

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Versão**: 2.0.0 (Refatorado)  
**Status**: ✅ Produção - Arquitetura Modular  
**Última Atualização**: Janeiro 2026

