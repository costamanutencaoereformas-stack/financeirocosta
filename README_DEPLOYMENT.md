# 🚀 Deployment Guide - Gestão Financeira 2026

## 📋 Pré-requisitos

- Node.js 18+
- Conta GitHub
- Conta Vercel
- Banco de dados PostgreSQL

## 🔧 Configuração do Ambiente

### 1. Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Configure as seguintes variáveis:

```env
# Database (obrigatório)
DATABASE_URL=postgresql://username:password@host:port/database

# Session (obrigatório)
SESSION_SECRET=seu-secret-aqui

# Ambiente
NODE_ENV=production
```

### 2. Build da Aplicação

```bash
npm install
npm run build
```

## 🌐 Deployment no Vercel

### Opção 1: Via GitHub (Recomendado)

1. **Fork o repositório**:
   ```bash
   git clone https://github.com/costamanutencaoereformas-stack/financeiro2026.git
   cd financeiro2026
   ```

2. **Configure as variáveis de ambiente** no Vercel Dashboard:
   - `DATABASE_URL`: Sua URL do PostgreSQL
   - `SESSION_SECRET`: Um secret seguro
   - `NODE_ENV`: `production`

3. **Conecte o GitHub** ao Vercel:
   - Vá para [Vercel Dashboard](https://vercel.com/dashboard)
   - Import Project → GitHub
   - Selecione o repositório `financeiro2026`

### Opção 2: Via Vercel CLI

1. **Instale Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Faça login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## 🗄️ Configuração do Banco de Dados

### PostgreSQL (Recomendado)

1. **Crie um banco PostgreSQL**:
   - [Supabase](https://supabase.com) (grátis)
   - [Railway](https://railway.app)
   - [Neon](https://neon.tech)

2. **Obtenha a Connection String**:
   ```sql
   postgresql://username:password@host:port/database
   ```

3. **Configure no Vercel**:
   - Dashboard → Settings → Environment Variables
   - Adicione `DATABASE_URL`

## 🔍 Verificação do Deployment

### URLs Importantes

- **Aplicação**: `https://seu-projeto.vercel.app`
- **API**: `https://seu-projeto.vercel.app/api/*`
- **Health Check**: `https://seu-projeto.vercel.app/api/auth/me`

### Testes Pós-Deployment

1. **Teste a API**:
   ```bash
   curl https://seu-projeto.vercel.app/api/auth/me
   ```

2. **Teste o Frontend**:
   - Acesse a URL principal
   - Verifique se todos os assets carregam

3. **Teste Funcionalidades**:
   - Login/Cadastro
   - Criação de contas
   - Visualização de relatórios

## 🛠️ Troubleshooting

### Problemas Comuns

#### 1. Erro de Database Connection
```
Error: getaddrinfo ENOTFOUND database
```
**Solução**: Verifique se `DATABASE_URL` está correta e acessível.

#### 2. Erro de CORS
```
Access blocked by CORS policy
```
**Solução**: O `vercel.json` já inclui headers CORS.

#### 3. Build Falha
```
Error: Module not found
```
**Solução**: Verifique se todas dependências foram instaladas.

#### 4. Timeout de Função
```
Function execution timed out
```
**Solução**: O `vercel.json` já configura `maxDuration: 30s`.

### Logs e Debugging

1. **Vercel Logs**:
   - Dashboard → Functions → Logs

2. **Console do Browser**:
   - F12 → Network/Console

3. **Database Logs**:
   - Verifique logs do seu provider PostgreSQL

## 📊 Monitoramento

### Métricas Importantes

- **Performance**: Tempo de carregamento
- **Uso**: Requests por minuto
- **Erros**: Taxa de falhas
- **Database**: Conexões ativas

## 🔄 CI/CD

### GitHub Actions (Opcional)

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/costamanutencaoereformas-stack/financeiro2026/issues)
- **Documentação**: [README.md](./README.md)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)

---

## 🎉 Deploy Realizado!

Após seguir estes passos, sua aplicação estará rodando em produção no Vercel com integração contínua com GitHub!
