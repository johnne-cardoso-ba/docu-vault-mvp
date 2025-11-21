#!/bin/bash

# Script de Atualização do Ticket Z
# Uso: sudo ./update-ticketz.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

INSTALL_DIR="/opt/ticketz"

echo -e "${GREEN}🔄 Atualizando Ticket Z${NC}"

if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root: sudo ./update-ticketz.sh${NC}"
    exit 1
fi

if [ ! -d "$INSTALL_DIR" ]; then
    echo -e "${RED}❌ Ticket Z não encontrado em $INSTALL_DIR${NC}"
    exit 1
fi

cd $INSTALL_DIR

echo -e "${YELLOW}📥 Baixando atualizações...${NC}"
git pull

echo -e "${YELLOW}🐳 Reconstruindo containers...${NC}"
docker compose down
docker compose up -d --build

echo -e "${YELLOW}⏳ Aguardando serviços (20s)...${NC}"
sleep 20

if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Atualização concluída!${NC}"
else
    echo -e "${RED}❌ Erro ao atualizar. Verificando logs...${NC}"
    docker compose logs
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Ticket Z atualizado com sucesso!${NC}"
