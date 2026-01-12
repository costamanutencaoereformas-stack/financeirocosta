# 🚀 Guia Rápido de Deploy - Render.com

## ⏱️ Tempo estimado: 15 minutos

---

## 📋 PASSO 1: Preparar o Código

### 1.1 Adicionar arquivos ao Git

```powershell
git add .
git commit -m "Preparar para deploy em produção"
```

### 1.2 Criar repositório no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `gestao-financeira-2026`
3. Deixe como **Público** ou **Privado** (sua escolha)
4. **NÃO** marque "Add README" (já temos um)
5. Clique em **"Create repository"**

### 1.3 Conectar ao GitHub

```powershell
# Substitua SEU_USUARIO pelo seu usuário do GitHub
git remote add origin https://github.com/SEU_USUARIO/gestao-financeira-2026.git
git branch -M main
git push -u origin main
```

✅ **Checkpoint**: Seu código está no GitHub!

---

## 📋 PASSO 2: Criar Conta no Render

1. Acesse: https://render.com
2. Clique em **"Get Started"**
3. Faça login com sua conta GitHub
4. Autorize o Render a acessar seus repositórios

✅ **Checkpoint**: Conta criada no Render!

---

## 📋 PASSO 3: Deploy da Aplicação

### 3.1 Criar Blueprint

1. No Render Dashboard, clique em **"New +"**
2. Selecione **"Blueprint"**
3. Conecte seu repositório `gestao-financeira-2026`
4. O Render detectará automaticamente o arquivo `render.yaml`
5. Clique em **"Apply"**

### 3.2 Aguardar Deploy

- ⏳ O Render criará:
  - ✅ Banco de dados PostgreSQL
  - ✅ Web Service (Backend + Frontend)
  - ✅ Variáveis de ambiente
  - ✅ SSL/HTTPS automático

- 📊 Acompanhe o progresso nos logs
- ⏱️ Tempo estimado: 5-10 minutos

✅ **Checkpoint**: Aplicação deployada!

---

## 📋 PASSO 4: Configurar Banco de Dados

### 4.1 Acessar o Shell do Banco

1. No Render Dashboard, clique no serviço **"gestao-financeira-db"**
2. Clique na aba **"Shell"**
3. Conecte ao banco

### 4.2 Aplicar Schema

Você tem 2 opções:

**Opção A: Via Render Shell**
```bash
npm run db:push
```

**Opção B: Via Local (Recomendado)**
```powershell
# No seu computador, configure a DATABASE_URL do Render
# Copie a "External Database URL" do Render Dashboard

# Crie um arquivo .env.production
DATABASE_URL=postgresql://...sua-url-do-render...

# Execute
npm run db:push
```

✅ **Checkpoint**: Banco de dados configurado!

---

## 📋 PASSO 5: Primeiro Acesso

### 5.1 Acessar a Aplicação

1. No Render Dashboard, clique no serviço **"gestao-financeira-app"**
2. Copie a URL (algo como: `https://gestao-financeira-app.onrender.com`)
3. Abra no navegador

### 5.2 Criar Usuário Administrador

1. Clique em **"Registrar"**
2. Preencha:
   - Nome: Seu nome
   - Usuário: admin
   - Senha: (escolha uma senha forte)
3. Clique em **"Cadastrar"**

🎉 **O primeiro usuário é automaticamente ADMIN!**

✅ **Checkpoint**: Aplicação funcionando online!

---

## 📋 PASSO 6: Configuração Inicial

### 6.1 Configurar Categorias

1. Vá em **"Categorias"**
2. As categorias padrão já estarão criadas
3. Adicione/edite conforme necessário

### 6.2 Configurar Centros de Custo

1. Vá em **"Centros de Custo"**
2. Configure seus departamentos/projetos

### 6.3 Cadastrar Clientes e Fornecedores

1. Vá em **"Clientes"** e cadastre seus clientes
2. Vá em **"Fornecedores"** e cadastre seus fornecedores

✅ **Checkpoint**: Sistema configurado e pronto para uso!

---

## 🎯 PRONTO! Sua aplicação está online!

### 📱 Compartilhe com sua equipe

Envie a URL para seus colaboradores:
```
https://gestao-financeira-app.onrender.com
```

### 🔐 Criar mais usuários

1. Faça login como admin
2. Vá em **"Usuários"**
3. Clique em **"Novo Usuário"**
4. Escolha o perfil:
   - **Admin**: Acesso total
   - **Financeiro**: Pode criar/editar lançamentos
   - **Visualizador**: Apenas visualizar

---

## 🆘 Problemas Comuns

### ❌ Erro ao conectar ao banco
**Solução**: Verifique se executou `npm run db:push`

### ❌ Aplicação não carrega
**Solução**: Verifique os logs no Render Dashboard

### ❌ Sessão não persiste
**Solução**: Limpe cookies do navegador e faça login novamente

---

## 📊 Monitoramento

### Render Dashboard
- **Logs**: Veja logs em tempo real
- **Metrics**: Monitore uso de recursos
- **Events**: Histórico de deploys

### Backup do Banco
1. No Render Dashboard, vá em **"gestao-financeira-db"**
2. Clique em **"Backups"**
3. Configure backups automáticos (recomendado)

---

## 💰 Custos

### Plano Gratuito Render:
- ✅ 750 horas/mês de web service
- ✅ PostgreSQL 1GB
- ✅ SSL/HTTPS incluído
- ✅ Deploy automático

### Quando fazer upgrade?
- Mais de 1GB de dados no banco
- Precisa de mais performance
- Quer backup automático

**Plano Starter**: $7/mês (recomendado para produção)

---

## 🎉 Parabéns!

Sua aplicação de Gestão Financeira está online e pronta para uso!

### Próximos passos:
- [ ] Configurar backup automático
- [ ] Adicionar usuários da equipe
- [ ] Importar dados existentes (se houver)
- [ ] Treinar equipe no sistema
- [ ] Monitorar uso e performance

---

**Dúvidas?** Consulte o arquivo `DEPLOY.md` para mais detalhes.
