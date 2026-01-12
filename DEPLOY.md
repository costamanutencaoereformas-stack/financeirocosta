# Gestão Financeira 2026 - Guia de Deploy

## 🚀 Deploy no Render.com (Recomendado)

### Pré-requisitos
1. Conta no GitHub
2. Conta no Render.com (gratuita)

### Passo a Passo

#### 1. Preparar o Repositório Git

```bash
# Inicializar Git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Preparar aplicação para deploy"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/SEU_USUARIO/gestao-financeira-2026.git
git branch -M main
git push -u origin main
```

#### 2. Deploy no Render.com

1. Acesse [render.com](https://render.com) e faça login
2. Clique em **"New +"** → **"Blueprint"**
3. Conecte seu repositório GitHub
4. O Render detectará automaticamente o arquivo `render.yaml`
5. Clique em **"Apply"**
6. Aguarde o deploy (5-10 minutos)

#### 3. Configurar Banco de Dados

O Render criará automaticamente:
- ✅ Banco PostgreSQL gratuito
- ✅ Variáveis de ambiente configuradas
- ✅ SSL/HTTPS habilitado

#### 4. Aplicar Schema do Banco

Após o deploy, execute:

```bash
# Conectar ao banco via Render Dashboard
# Ou usar a URL de conexão fornecida

npm run db:push
```

#### 5. Criar Usuário Administrador

Acesse a aplicação e registre o primeiro usuário (será admin automaticamente).

---

## 🔧 Variáveis de Ambiente Necessárias

O Render configurará automaticamente:

- `DATABASE_URL` - String de conexão PostgreSQL
- `SESSION_SECRET` - Chave secreta para sessões
- `NODE_ENV=production`
- `PORT=10000`

---

## 📱 Alternativa: Railway.app

### Deploy no Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Iniciar projeto
railway init

# Deploy
railway up
```

---

## 🌐 Alternativa: Vercel + Neon

### 1. Deploy Frontend/Backend no Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### 2. Banco de Dados no Neon

1. Acesse [neon.tech](https://neon.tech)
2. Crie um projeto PostgreSQL gratuito
3. Copie a connection string
4. Adicione como variável de ambiente no Vercel:
   - `DATABASE_URL=postgresql://...`

---

## ✅ Checklist Pós-Deploy

- [ ] Aplicação acessível via HTTPS
- [ ] Banco de dados conectado
- [ ] Login funcionando
- [ ] Criar primeiro usuário admin
- [ ] Testar todas as funcionalidades principais
- [ ] Configurar backup do banco (recomendado)

---

## 🔒 Segurança

### Recomendações:
1. ✅ Use HTTPS (já configurado no Render)
2. ✅ Senhas fortes para usuários
3. ✅ Backup regular do banco de dados
4. ✅ Monitore logs de acesso
5. ✅ Atualize dependências regularmente

---

## 📊 Monitoramento

### Render Dashboard
- Logs em tempo real
- Métricas de uso
- Status do serviço
- Alertas automáticos

---

## 💰 Custos

### Render Free Tier:
- ✅ 750 horas/mês de web service
- ✅ PostgreSQL 1GB (suficiente para começar)
- ✅ SSL/HTTPS incluído
- ✅ Deploy automático via Git

### Upgrade quando necessário:
- **Starter**: $7/mês (mais recursos)
- **Standard**: $25/mês (produção)

---

## 🆘 Suporte e Troubleshooting

### Problemas Comuns:

**1. Erro de conexão com banco**
- Verifique `DATABASE_URL` nas variáveis de ambiente
- Execute `npm run db:push` após deploy

**2. Aplicação não inicia**
- Verifique logs no Render Dashboard
- Confirme que `npm run build` funciona localmente

**3. Sessões não persistem**
- Verifique `SESSION_SECRET` está configurado
- Confirme que cookies estão habilitados

---

## 📞 Contato

Para suporte adicional:
- Documentação Render: https://render.com/docs
- Documentação Railway: https://docs.railway.app
- Documentação Vercel: https://vercel.com/docs
