# Gestão Financeira 2026

Sistema completo de gestão financeira empresarial desenvolvido para o mercado brasileiro.

## 🚀 Funcionalidades

### 📊 Dashboard Financeiro
- Visão geral de receitas e despesas
- Gráficos interativos de fluxo de caixa
- KPIs financeiros em tempo real
- Alertas de vencimentos e inadimplência

### 💰 Fluxo de Caixa
- Controle de entradas e saídas
- Movimentações diárias, semanais e mensais
- Ajustes de saldo (inicial/final)
- Projeções financeiras
- Múltiplas formas de pagamento (PIX, Dinheiro, Cartão, etc.)

### 📝 Contas a Pagar
- Cadastro de fornecedores
- Gestão de vencimentos
- Controle de pagamentos
- Histórico completo por fornecedor
- Alertas de contas vencidas

### 💵 Contas a Receber
- Cadastro de clientes
- Gestão de recebimentos
- Controle de inadimplência
- Histórico completo por cliente
- Descontos e ajustes

### 📈 DRE (Demonstração do Resultado do Exercício)
- Receita bruta e líquida
- Custos e despesas operacionais
- Lucro bruto e líquido
- Comparação mensal
- Exportação de relatórios

### 👥 Gestão de Usuários
- Controle de acesso por perfil (Admin, Financeiro, Visualizador)
- Autenticação segura
- Gerenciamento de permissões

### 🏢 Cadastros
- Clientes com histórico financeiro
- Fornecedores com histórico de pagamentos
- Categorias e subcategorias
- Centros de custo

## 🛠️ Tecnologias

### Frontend
- **React 18** - Interface moderna e responsiva
- **TypeScript** - Tipagem estática
- **TanStack Query** - Gerenciamento de estado servidor
- **Wouter** - Roteamento leve
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **Recharts** - Gráficos interativos
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados relacional
- **Drizzle ORM** - ORM type-safe
- **Passport.js** - Autenticação
- **Express Session** - Gerenciamento de sessões

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### Configuração Local

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/gestao-financeira-2026.git
cd gestao-financeira-2026

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute as migrações do banco
npm run db:push

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5001`

## 🌐 Deploy

Consulte o arquivo [DEPLOY.md](./DEPLOY.md) para instruções detalhadas de deploy em:
- Render.com (Recomendado)
- Railway.app
- Vercel + Neon

## 📝 Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/gestao_financeira

# Sessão
SESSION_SECRET=sua-chave-secreta-aqui

# Ambiente
NODE_ENV=development
PORT=5001
```

## 🔐 Primeiro Acesso

1. Acesse a aplicação
2. Clique em "Registrar"
3. O primeiro usuário será automaticamente admin
4. Configure categorias e centros de custo
5. Comece a usar!

## 📊 Estrutura do Projeto

```
gestao-financeira-2026/
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── lib/         # Utilitários e configurações
│   │   └── hooks/       # Custom hooks
├── server/              # Backend Express
│   ├── routes.ts        # Rotas da API
│   ├── storage.ts       # Camada de dados
│   ├── auth.ts          # Autenticação
│   └── index.ts         # Entrada do servidor
├── shared/              # Código compartilhado
│   └── schema.ts        # Schemas do banco de dados
└── script/              # Scripts de build
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato.

## ✨ Funcionalidades Futuras

- [ ] Integração com Mercado Pago
- [ ] Exportação de relatórios em PDF/Excel
- [ ] Notificações por email
- [ ] App mobile
- [ ] Backup automático
- [ ] Multi-empresa
- [ ] Conciliação bancária automática

---

Desenvolvido com ❤️ para o mercado brasileiro
