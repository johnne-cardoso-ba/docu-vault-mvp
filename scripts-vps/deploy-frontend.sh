#!/bin/bash

# =============================================================================
# Script de Deploy do Frontend
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

APP_DIR="/opt/escritura"

echo -e "${YELLOW}🚀 Deploy do Frontend${NC}"

# Verificar root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root: sudo ./deploy-frontend.sh${NC}"
    exit 1
fi

cd $APP_DIR

# Atualizar código
echo -e "${YELLOW}📥 Atualizando código...${NC}"
git pull origin main

# Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
npm install

# Build
echo -e "${YELLOW}🔨 Fazendo build...${NC}"
npm run build

# Verificar build
if [ ! -d "$APP_DIR/dist" ]; then
    echo -e "${RED}❌ Build falhou!${NC}"
    exit 1
fi

# Corrigir permissões
chown -R www-data:www-data $APP_DIR/dist
chmod -R 755 $APP_DIR/dist

# Recarregar nginx
systemctl reload nginx

echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "🌐 Acesse: https://$(grep server_name /etc/nginx/sites-available/app.* 2>/dev/null | head -1 | awk '{print $2}' | tr -d ';')"
