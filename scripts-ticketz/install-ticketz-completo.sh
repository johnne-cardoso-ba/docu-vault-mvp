#!/bin/bash

# Script de Instalação Completa do Ticket Z
# Uso: sudo bash install-ticketz-completo.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configurações
FRONTEND_DOMAIN="wp.escrituraai.com.br"
BACKEND_DOMAIN="api.escrituraai.com.br"
ADMIN_EMAIL="admin@escrituraai.com.br"
INSTALL_DIR="/opt/ticketz"

echo -e "${GREEN}🚀 Instalando Ticket Z${NC}"
echo -e "${YELLOW}Frontend: $FRONTEND_DOMAIN${NC}"
echo -e "${YELLOW}Backend: $BACKEND_DOMAIN${NC}"
echo ""
echo -e "${YELLOW}⚠️  Execute como root: sudo bash install-ticketz-completo.sh${NC}"
echo ""

# Verificar root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root${NC}"
    exit 1
fi

# Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
apt update
apt install -y curl git

# Instalar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
    curl -fsSL https://get.docker.com | bash
else
    echo -e "${GREEN}✅ Docker já instalado${NC}"
fi

# Instalar Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo -e "${YELLOW}🐳 Instalando Docker Compose...${NC}"
    apt install -y docker-compose-plugin
else
    echo -e "${GREEN}✅ Docker Compose já instalado${NC}"
fi

# Clonar repositório
echo -e "${YELLOW}📥 Clonando Ticket Z...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠️  Diretório já existe, removendo...${NC}"
    rm -rf $INSTALL_DIR
fi
git clone https://github.com/ticketz/ticketz.git $INSTALL_DIR
cd $INSTALL_DIR

# Configurar .env
echo -e "${YELLOW}⚙️  Configurando variáveis de ambiente...${NC}"
cp .env.example .env

# Gerar senhas aleatórias
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Atualizar .env
sed -i "s|NODE_ENV=.*|NODE_ENV=production|" .env
sed -i "s|BACKEND_URL=.*|BACKEND_URL=https://$BACKEND_DOMAIN|" .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$FRONTEND_DOMAIN|" .env
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env

# Configurar Nginx
echo -e "${YELLOW}🌐 Configurando Nginx...${NC}"

# Nginx para Backend
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
    }
}
EOF

# Nginx para Frontend
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
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar sites
ln -sf /etc/nginx/sites-available/ticketz-backend /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/ticketz-frontend /etc/nginx/sites-enabled/

# Testar e recarregar Nginx
nginx -t && systemctl reload nginx

# SSL com Certbot
echo -e "${YELLOW}🔒 Configurando SSL...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

certbot --nginx -d $FRONTEND_DOMAIN -d $BACKEND_DOMAIN --non-interactive --agree-tos -m $ADMIN_EMAIL

# Iniciar containers
echo -e "${YELLOW}🐳 Iniciando containers...${NC}"
cd $INSTALL_DIR
docker compose up -d

# Aguardar inicialização
echo -e "${YELLOW}⏳ Aguardando serviços (30s)...${NC}"
sleep 30

# Verificar status
if docker compose ps | grep -q "Up"; then
    echo ""
    echo -e "${GREEN}✅ Ticket Z instalado com sucesso!${NC}"
    echo ""
    echo -e "${GREEN}📋 Informações de Acesso:${NC}"
    echo -e "Frontend: https://$FRONTEND_DOMAIN"
    echo -e "Backend: https://$BACKEND_DOMAIN"
    echo ""
    echo -e "${GREEN}🔑 Credenciais Padrão:${NC}"
    echo -e "Email: admin@ticketz.com"
    echo -e "Senha: admin"
    echo -e "${RED}⚠️  IMPORTANTE: Altere a senha após o primeiro acesso!${NC}"
    echo ""
    echo -e "${GREEN}💾 Credenciais salvas em: /root/ticketz-credentials.txt${NC}"
    
    # Salvar credenciais
    cat > /root/ticketz-credentials.txt <<CREDS
===========================================
TICKET Z - CREDENCIAIS DE INSTALAÇÃO
===========================================

Frontend: https://$FRONTEND_DOMAIN
Backend: https://$BACKEND_DOMAIN

Credenciais Padrão:
- Email: admin@ticketz.com
- Senha: admin

Credenciais Geradas:
- DB Password: $DB_PASSWORD
- JWT Secret: $JWT_SECRET

Diretório: $INSTALL_DIR

Comandos Úteis:
- Ver logs: cd $INSTALL_DIR && docker compose logs -f
- Reiniciar: cd $INSTALL_DIR && docker compose restart
- Parar: cd $INSTALL_DIR && docker compose down
- Backup: bash /opt/ticketz/scripts/backup-ticketz.sh

===========================================
CREDS

else
    echo -e "${RED}❌ Erro ao iniciar containers${NC}"
    docker compose logs
    exit 1
fi
