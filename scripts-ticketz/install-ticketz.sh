#!/bin/bash

# Script de Instalação Automatizada do Ticket Z
# Uso: sudo ./install-ticketz.sh

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configurações
FRONTEND_DOMAIN="wp.escrituraai.com.br"
BACKEND_DOMAIN="api.escrituraai.com.br"
ADMIN_EMAIL="contato@escrituraai.com.br"
INSTALL_DIR="/opt/ticketz"

echo -e "${GREEN}🚀 Instalação do Ticket Z${NC}"
echo "=================================="
echo "Frontend: $FRONTEND_DOMAIN"
echo "Backend: $BACKEND_DOMAIN"
echo "Email: $ADMIN_EMAIL"
echo "=================================="
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root: sudo ./install-ticketz.sh${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Instalando dependências...${NC}"
apt update
apt install -y curl git

echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✅ Docker instalado${NC}"
else
    echo -e "${GREEN}✅ Docker já instalado${NC}"
fi

echo -e "${YELLOW}🐳 Instalando Docker Compose...${NC}"
if ! command -v docker compose &> /dev/null; then
    apt install -y docker-compose-plugin
    echo -e "${GREEN}✅ Docker Compose instalado${NC}"
else
    echo -e "${GREEN}✅ Docker Compose já instalado${NC}"
fi

echo -e "${YELLOW}📥 Clonando repositório do Ticket Z...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠️  Diretório já existe. Removendo...${NC}"
    rm -rf $INSTALL_DIR
fi

git clone https://github.com/ticketz-oss/ticketz.git $INSTALL_DIR
cd $INSTALL_DIR

echo -e "${YELLOW}⚙️  Configurando ambiente...${NC}"
cp .env.example .env

# Gerar senhas aleatórias
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Configurar .env
sed -i "s|NODE_ENV=.*|NODE_ENV=production|g" .env
sed -i "s|BACKEND_URL=.*|BACKEND_URL=https://$BACKEND_DOMAIN|g" .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$FRONTEND_DOMAIN|g" .env
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$DB_PASSWORD|g" .env
sed -i "s|DB_PASS=.*|DB_PASS=$DB_PASSWORD|g" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env

echo -e "${GREEN}✅ Ambiente configurado${NC}"

echo -e "${YELLOW}🔧 Configurando Nginx...${NC}"

# Criar configuração do Nginx para o backend
cat > /etc/nginx/sites-available/ticketz-api << EOF
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

# Criar configuração do Nginx para o frontend
cat > /etc/nginx/sites-available/ticketz-frontend << EOF
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
ln -sf /etc/nginx/sites-available/ticketz-api /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/ticketz-frontend /etc/nginx/sites-enabled/

# Testar e recarregar Nginx
nginx -t
systemctl reload nginx

echo -e "${GREEN}✅ Nginx configurado${NC}"

echo -e "${YELLOW}🔒 Configurando SSL...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

# Obter certificados SSL
certbot --nginx -d $BACKEND_DOMAIN -d $FRONTEND_DOMAIN --email $ADMIN_EMAIL --agree-tos --non-interactive

echo -e "${GREEN}✅ SSL configurado${NC}"

echo -e "${YELLOW}🐳 Iniciando containers Docker...${NC}"
cd $INSTALL_DIR
docker compose up -d

echo -e "${YELLOW}⏳ Aguardando serviços iniciarem (30s)...${NC}"
sleep 30

# Verificar status dos containers
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Containers rodando!${NC}"
else
    echo -e "${RED}❌ Erro ao iniciar containers. Verificando logs...${NC}"
    docker compose logs
    exit 1
fi

echo ""
echo -e "${GREEN}=================================="
echo "✅ Instalação concluída com sucesso!"
echo "==================================${NC}"
echo ""
echo "🌐 Acesse o sistema:"
echo "   Frontend: https://$FRONTEND_DOMAIN"
echo "   Backend:  https://$BACKEND_DOMAIN"
echo ""
echo "👤 Credenciais padrão:"
echo "   Email: admin@ticketz.com"
echo "   Senha: 123456"
echo ""
echo "⚠️  IMPORTANTE: Altere a senha no primeiro acesso!"
echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs:      cd $INSTALL_DIR && docker compose logs -f"
echo "   Reiniciar:     cd $INSTALL_DIR && docker compose restart"
echo "   Parar:         cd $INSTALL_DIR && docker compose down"
echo "   Atualizar:     cd $INSTALL_DIR && git pull && docker compose up -d --build"
echo ""
echo "💾 Credenciais salvas em: /root/ticketz-credentials.txt"

# Salvar credenciais
cat > /root/ticketz-credentials.txt << EOF
Ticket Z - Credenciais de Instalação
====================================
Data: $(date)

Frontend: https://$FRONTEND_DOMAIN
Backend: https://$BACKEND_DOMAIN

Credenciais padrão:
Email: admin@ticketz.com
Senha: 123456

Banco de Dados:
Password: $DB_PASSWORD

JWT Secret: $JWT_SECRET

Diretório: $INSTALL_DIR
EOF

chmod 600 /root/ticketz-credentials.txt

echo -e "${GREEN}✅ Tudo pronto!${NC}"
