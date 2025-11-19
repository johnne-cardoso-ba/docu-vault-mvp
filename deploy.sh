#!/bin/bash

# Script de Deploy Automático para VPS
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando deploy..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Por favor, execute como root: sudo ./deploy.sh${NC}"
    exit 1
fi

# Diretório do app
APP_DIR="/opt/app"
APP_USER="appuser"

# Verificar se o diretório existe
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Diretório $APP_DIR não encontrado!${NC}"
    exit 1
fi

cd $APP_DIR

# Configurar Git safe directory
git config --global --add safe.directory /opt/app

# Corrigir permissões antes de atualizar código
chown -R $APP_USER:$APP_USER $APP_DIR

echo -e "${YELLOW}📥 Baixando últimas mudanças do GitHub...${NC}"
sudo -u $APP_USER bash -c "cd $APP_DIR && git fetch origin && git reset --hard origin/main"

echo -e "${YELLOW}📦 Instalando dependências...${NC}"
sudo -u $APP_USER bash -c "cd $APP_DIR && npm install"

echo -e "${YELLOW}🔨 Fazendo build...${NC}"
sudo -u $APP_USER bash -c "cd $APP_DIR && npm run build"

# Verificar se o build foi bem-sucedido
if [ ! -d "$APP_DIR/dist" ]; then
    echo -e "${RED}❌ Build falhou! Diretório dist não encontrado.${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 Corrigindo permissões...${NC}"
chmod 755 $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR
chmod -R 755 $APP_DIR/dist

echo -e "${YELLOW}♻️  Reiniciando Nginx...${NC}"
systemctl restart nginx

# Verificar se Nginx está rodando
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx está rodando!${NC}"
else
    echo -e "${RED}❌ Erro ao reiniciar Nginx!${NC}"
    systemctl status nginx
    exit 1
fi

# Limpar cache antigo (manter últimos 3 builds)
echo -e "${YELLOW}🧹 Limpando arquivos antigos...${NC}"
find $APP_DIR -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}🌐 Sua aplicação está rodando!${NC}"
echo ""
echo "Dicas úteis:"
echo "  - Ver logs do Nginx: tail -f /var/log/nginx/access.log"
echo "  - Status do Nginx: systemctl status nginx"
echo "  - Testar configuração: nginx -t"
echo ""
