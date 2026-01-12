#!/bin/bash

# Script de Deploy Rápido para Render.com
# Execute este script para preparar e fazer deploy da aplicação

echo "🚀 Preparando aplicação para deploy..."

# 1. Adicionar todos os arquivos ao Git
echo "📦 Adicionando arquivos ao Git..."
git add .

# 2. Fazer commit
echo "💾 Fazendo commit..."
git commit -m "Preparar aplicação para deploy em produção"

# 3. Verificar se o remote origin existe
if git remote | grep -q "origin"; then
    echo "✅ Remote origin já configurado"
    echo "📤 Fazendo push para o GitHub..."
    git push origin main
else
    echo "⚠️  Remote origin não configurado"
    echo ""
    echo "Por favor, execute os seguintes comandos:"
    echo ""
    echo "1. Crie um repositório no GitHub: https://github.com/new"
    echo ""
    echo "2. Execute:"
    echo "   git remote add origin https://github.com/SEU_USUARIO/gestao-financeira-2026.git"
    echo "   git push -u origin main"
    echo ""
fi

echo ""
echo "✨ Próximos passos:"
echo ""
echo "1. Acesse https://render.com e faça login"
echo "2. Clique em 'New +' → 'Blueprint'"
echo "3. Conecte seu repositório GitHub"
echo "4. O Render detectará o arquivo render.yaml automaticamente"
echo "5. Clique em 'Apply' e aguarde o deploy (5-10 minutos)"
echo ""
echo "6. Após o deploy, acesse o Render Dashboard e:"
echo "   - Copie a URL da aplicação"
echo "   - Execute 'npm run db:push' para criar as tabelas"
echo "   - Acesse a aplicação e crie o primeiro usuário (será admin)"
echo ""
echo "📖 Para mais detalhes, consulte DEPLOY.md"
echo ""
