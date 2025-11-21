#!/bin/bash

# Script de Backup do Ticket Z
# Uso: sudo ./backup-ticketz.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

INSTALL_DIR="/opt/ticketz"
BACKUP_DIR="/root/backups/ticketz"
DATE=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}💾 Backup do Ticket Z${NC}"

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Execute como root"
    exit 1
fi

mkdir -p $BACKUP_DIR

cd $INSTALL_DIR

echo -e "${YELLOW}📦 Fazendo backup do banco de dados...${NC}"
docker compose exec -T postgres pg_dump -U ticketz ticketz > $BACKUP_DIR/database_$DATE.sql

echo -e "${YELLOW}📦 Fazendo backup dos arquivos...${NC}"
tar -czf $BACKUP_DIR/files_$DATE.tar.gz .env backend/public frontend/.env

echo -e "${GREEN}✅ Backup concluído!${NC}"
echo "Arquivos salvos em: $BACKUP_DIR"
echo "  - database_$DATE.sql"
echo "  - files_$DATE.tar.gz"

# Limpar backups antigos (manter últimos 7)
echo -e "${YELLOW}🧹 Limpando backups antigos...${NC}"
cd $BACKUP_DIR
ls -t database_*.sql | tail -n +8 | xargs -r rm
ls -t files_*.tar.gz | tail -n +8 | xargs -r rm

echo -e "${GREEN}✅ Limpeza concluída!${NC}"
