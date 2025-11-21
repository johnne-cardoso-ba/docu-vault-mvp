#!/bin/bash

# Script de Desinstalação do Ticket Z
# Uso: sudo ./uninstall-ticketz.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

INSTALL_DIR="/opt/ticketz"

echo -e "${RED}🗑️  Desinstalação do Ticket Z${NC}"
echo "=================================="
echo ""
echo -e "${YELLOW}⚠️  ATENÇÃO: Isso removerá TODOS os dados do Ticket Z!${NC}"
echo ""
read -p "Tem certeza? Digite 'SIM' para confirmar: " confirmacao

if [ "$confirmacao" != "SIM" ]; then
    echo "Cancelado."
    exit 0
fi

if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root${NC}"
    exit 1
fi

echo -e "${YELLOW}💾 Fazendo backup antes de remover...${NC}"
if [ -f "./backup-ticketz.sh" ]; then
    ./backup-ticketz.sh
fi

echo -e "${YELLOW}🐳 Parando containers...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    cd $INSTALL_DIR
    docker compose down -v
fi

echo -e "${YELLOW}🗑️  Removendo arquivos...${NC}"
rm -rf $INSTALL_DIR

echo -e "${YELLOW}🗑️  Removendo configurações do Nginx...${NC}"
rm -f /etc/nginx/sites-enabled/ticketz-api
rm -f /etc/nginx/sites-enabled/ticketz-frontend
rm -f /etc/nginx/sites-available/ticketz-api
rm -f /etc/nginx/sites-available/ticketz-frontend

nginx -t && systemctl reload nginx

echo -e "${GREEN}✅ Ticket Z removido completamente!${NC}"
echo ""
echo "Os backups foram mantidos em: /root/backups/ticketz"
