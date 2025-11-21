#!/bin/bash

# Script de Instalação Limpa do Ticket Z
# Uso: sudo bash instalar-limpo.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

FRONTEND_DOMAIN="wp.escrituraai.com.br"
BACKEND_DOMAIN="api.escrituraai.com.br"
ADMIN_EMAIL="admin@escrituraai.com.br"
INSTALL_DIR="/opt/ticketz"

clear
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   INSTALAÇÃO LIMPA - TICKET Z         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Frontend: $FRONTEND_DOMAIN${NC}"
echo -e "${YELLOW}Backend:  $BACKEND_DOMAIN${NC}"
echo ""

# Verificar root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root: sudo bash instalar-limpo.sh${NC}"
    exit 1
fi

# Verificar DNS
echo -e "${YELLOW}🔍 Verificando DNS...${NC}"
FRONTEND_IP=$(dig +short $FRONTEND_DOMAIN | tail -n1)
BACKEND_IP=$(dig +short $BACKEND_DOMAIN | tail -n1)
SERVER_IP=$(curl -s ifconfig.me)

if [ -z "$FRONTEND_IP" ] || [ -z "$BACKEND_IP" ]; then
    echo -e "${RED}❌ DNS não configurado!${NC}"
    echo -e "${YELLOW}Configure no seu provedor de domínio:${NC}"
    echo ""
    echo "Tipo: A, Nome: wp, Valor: $SERVER_IP"
    echo "Tipo: A, Nome: api, Valor: $SERVER_IP"
    echo ""
    echo -e "${YELLOW}Aguarde propagação do DNS e execute novamente.${NC}"
    exit 1
fi

if [ "$FRONTEND_IP" != "$SERVER_IP" ] || [ "$BACKEND_IP" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}⚠️  DNS ainda propagando...${NC}"
    echo "Frontend ($FRONTEND_DOMAIN): $FRONTEND_IP"
    echo "Backend ($BACKEND_DOMAIN): $BACKEND_IP"
    echo "Servidor: $SERVER_IP"
    echo ""
    read -p "Continuar mesmo assim? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ DNS verificado${NC}"

# Remover instalação antiga
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}🗑️  Removendo instalação antiga...${NC}"
    
    # Fazer backup do banco
    if docker compose -f $INSTALL_DIR/docker-compose.yml ps | grep -q "Up"; then
        echo -e "${YELLOW}💾 Fazendo backup do banco...${NC}"
        mkdir -p /root/backup-ticketz
        cd $INSTALL_DIR
        docker compose exec -T postgres pg_dump -U postgres ticketz > /root/backup-ticketz/backup-$(date +%Y%m%d-%H%M%S).sql 2>/dev/null || true
        echo -e "${GREEN}✅ Backup salvo em /root/backup-ticketz/${NC}"
    fi
    
    # Parar e remover containers
    cd $INSTALL_DIR
    docker compose down -v 2>/dev/null || true
    
    # Remover diretório
    cd /opt
    rm -rf ticketz
    echo -e "${GREEN}✅ Instalação antiga removida${NC}"
fi

# Remover configs Nginx antigas
echo -e "${YELLOW}🧹 Limpando configurações antigas...${NC}"
rm -f /etc/nginx/sites-enabled/ticketz-* 2>/dev/null || true
rm -f /etc/nginx/sites-available/ticketz-* 2>/dev/null || true
systemctl reload nginx 2>/dev/null || true

# Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
apt update -qq
apt install -y curl git nginx 2>&1 | grep -v "already" || true

# Instalar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
else
    echo -e "${GREEN}✅ Docker já instalado${NC}"
fi

# Instalar Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}🐳 Instalando Docker Compose...${NC}"
    apt install -y docker-compose-plugin
else
    echo -e "${GREEN}✅ Docker Compose já instalado${NC}"
fi

# Clonar repositório
echo -e "${YELLOW}📥 Clonando Ticket Z...${NC}"
git clone https://github.com/ticketz-oss/ticketz.git $INSTALL_DIR
cd $INSTALL_DIR

# Configurar .env
echo -e "${YELLOW}⚙️  Configurando ambiente...${NC}"
cp .env.example .env

# Gerar senhas
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

# Atualizar .env
sed -i "s|NODE_ENV=.*|NODE_ENV=production|g" .env
sed -i "s|BACKEND_URL=.*|BACKEND_URL=https://$BACKEND_DOMAIN|g" .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$FRONTEND_DOMAIN|g" .env
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$DB_PASSWORD|g" .env
sed -i "s|DB_PASS=.*|DB_PASS=$DB_PASSWORD|g" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env

echo -e "${GREEN}✅ Ambiente configurado${NC}"

# Configurar Nginx - Backend
echo -e "${YELLOW}🌐 Configurando Nginx...${NC}"
cat > /etc/nginx/sites-available/ticketz-backend <<EOF
server {
    listen 80;
    server_name $BACKEND_DOMAIN;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 100M;
    }
}
EOF

# Configurar Nginx - Frontend
cat > /etc/nginx/sites-available/ticketz-frontend <<EOF
server {
    listen 80;
    server_name $FRONTEND_DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar sites
ln -sf /etc/nginx/sites-available/ticketz-backend /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/ticketz-frontend /etc/nginx/sites-enabled/

# Testar Nginx
nginx -t
systemctl reload nginx

echo -e "${GREEN}✅ Nginx configurado${NC}"

# Configurar SSL
echo -e "${YELLOW}🔒 Configurando SSL...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

# Remover certificados antigos
certbot delete --cert-name $FRONTEND_DOMAIN --non-interactive 2>/dev/null || true
certbot delete --cert-name $BACKEND_DOMAIN --non-interactive 2>/dev/null || true

# Obter novos certificados
certbot --nginx \
    -d $FRONTEND_DOMAIN \
    -d $BACKEND_DOMAIN \
    --non-interactive \
    --agree-tos \
    -m $ADMIN_EMAIL \
    --redirect

echo -e "${GREEN}✅ SSL configurado${NC}"

# Iniciar containers
echo -e "${YELLOW}🐳 Iniciando containers...${NC}"
cd $INSTALL_DIR
docker compose up -d

# Aguardar
echo -e "${YELLOW}⏳ Aguardando serviços (40s)...${NC}"
sleep 40

# Verificar status
if docker compose ps | grep -q "Up"; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✅ INSTALAÇÃO CONCLUÍDA!          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}🌐 URLs de Acesso:${NC}"
    echo -e "   Frontend: ${GREEN}https://$FRONTEND_DOMAIN${NC}"
    echo -e "   Backend:  ${GREEN}https://$BACKEND_DOMAIN${NC}"
    echo ""
    echo -e "${GREEN}🔑 Credenciais Padrão:${NC}"
    echo -e "   Email: ${YELLOW}admin@ticketz.com${NC}"
    echo -e "   Senha: ${YELLOW}123456${NC}"
    echo ""
    echo -e "${RED}⚠️  IMPORTANTE: Altere a senha no primeiro acesso!${NC}"
    echo ""
    echo -e "${GREEN}📋 Comandos Úteis:${NC}"
    echo "   Ver logs:    cd $INSTALL_DIR && docker compose logs -f"
    echo "   Reiniciar:   cd $INSTALL_DIR && docker compose restart"
    echo "   Parar:       cd $INSTALL_DIR && docker compose down"
    echo ""
    echo -e "${GREEN}💾 Credenciais salvas em: /root/ticketz-info.txt${NC}"
    
    # Salvar info
    cat > /root/ticketz-info.txt <<INFO
═══════════════════════════════════════
TICKET Z - INFORMAÇÕES DE INSTALAÇÃO
═══════════════════════════════════════
Data: $(date)

🌐 URLs:
Frontend: https://$FRONTEND_DOMAIN
Backend:  https://$BACKEND_DOMAIN

🔑 Credenciais Padrão:
Email: admin@ticketz.com
Senha: 123456
⚠️  ALTERE NO PRIMEIRO ACESSO!

🔐 Credenciais Geradas:
DB Password: $DB_PASSWORD
JWT Secret: $JWT_SECRET

📁 Diretório: $INSTALL_DIR

📋 Comandos:
cd $INSTALL_DIR && docker compose logs -f
cd $INSTALL_DIR && docker compose restart
cd $INSTALL_DIR && docker compose down

💾 Backup: /root/backup-ticketz/
═══════════════════════════════════════
INFO
    
else
    echo ""
    echo -e "${RED}❌ Erro ao iniciar containers!${NC}"
    echo -e "${YELLOW}Verificando logs...${NC}"
    docker compose logs --tail=50
    exit 1
fi
