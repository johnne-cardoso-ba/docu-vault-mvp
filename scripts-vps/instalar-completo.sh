#!/bin/bash

# =============================================================================
# Script de Instalação Completa - Sistema Contabilidade
# Instala: Supabase Self-Hosted + Frontend + Nginx + SSL
# =============================================================================

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações - ALTERE CONFORME NECESSÁRIO
DOMINIO="app.escrituraai.com.br"
EMAIL_ADMIN="admin@escrituraai.com.br"
INSTALL_DIR="/opt/escritura"
SUPABASE_DIR="/opt/supabase"

echo -e "${BLUE}"
echo "=============================================="
echo "   INSTALAÇÃO COMPLETA - SISTEMA CONTÁBIL    "
echo "=============================================="
echo -e "${NC}"

# Verificar root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root: sudo ./instalar-completo.sh${NC}"
    exit 1
fi

# Solicitar configurações
echo ""
read -p "Domínio do sistema [$DOMINIO]: " input_dominio
DOMINIO=${input_dominio:-$DOMINIO}

read -p "Email do admin [$EMAIL_ADMIN]: " input_email
EMAIL_ADMIN=${input_email:-$EMAIL_ADMIN}

echo ""
echo -e "${YELLOW}Configurações:${NC}"
echo "  Domínio: $DOMINIO"
echo "  Email: $EMAIL_ADMIN"
echo ""
read -p "Confirma? (s/n): " confirma
if [ "$confirma" != "s" ]; then
    echo "Cancelado."
    exit 0
fi

# =============================================================================
# 1. ATUALIZAÇÃO DO SISTEMA
# =============================================================================
echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
apt update && apt upgrade -y

# =============================================================================
# 2. INSTALAÇÃO DE DEPENDÊNCIAS
# =============================================================================
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
apt install -y curl git nginx certbot python3-certbot-nginx ufw fail2ban

# Node.js 20
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}🐳 Instalando Docker Compose...${NC}"
    apt install -y docker-compose-plugin
fi

# =============================================================================
# 3. CONFIGURAÇÃO DO SUPABASE SELF-HOSTED
# =============================================================================
echo -e "${YELLOW}🗄️  Configurando Supabase Self-Hosted...${NC}"

# Gerar senhas seguras
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
JWT_SECRET=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)
ANON_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
SERVICE_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
DASHBOARD_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

mkdir -p $SUPABASE_DIR
cd $SUPABASE_DIR

# Clonar Supabase
if [ ! -d "$SUPABASE_DIR/docker" ]; then
    git clone --depth 1 https://github.com/supabase/supabase.git temp
    mv temp/docker .
    rm -rf temp
fi

cd $SUPABASE_DIR/docker

# Configurar .env
cp .env.example .env

# Atualizar configurações
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|g" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env
sed -i "s|ANON_KEY=.*|ANON_KEY=$ANON_KEY|g" .env
sed -i "s|SERVICE_ROLE_KEY=.*|SERVICE_ROLE_KEY=$SERVICE_KEY|g" .env
sed -i "s|DASHBOARD_USERNAME=.*|DASHBOARD_USERNAME=admin|g" .env
sed -i "s|DASHBOARD_PASSWORD=.*|DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD|g" .env
sed -i "s|SITE_URL=.*|SITE_URL=https://$DOMINIO|g" .env
sed -i "s|API_EXTERNAL_URL=.*|API_EXTERNAL_URL=https://api.$DOMINIO|g" .env

# Iniciar Supabase
echo -e "${YELLOW}🚀 Iniciando Supabase...${NC}"
docker compose up -d

# Aguardar inicialização
echo -e "${YELLOW}⏳ Aguardando Supabase inicializar (60s)...${NC}"
sleep 60

# =============================================================================
# 4. CONFIGURAÇÃO DO FRONTEND
# =============================================================================
echo -e "${YELLOW}🖥️  Configurando Frontend...${NC}"

mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

# Criar usuário da aplicação
if ! id "appuser" &>/dev/null; then
    useradd -r -s /bin/bash -d $INSTALL_DIR appuser
fi

# Criar arquivo .env para o frontend
cat > $INSTALL_DIR/.env << EOF
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_PUBLISHABLE_KEY=$ANON_KEY
VITE_SUPABASE_PROJECT_ID=local
EOF

# =============================================================================
# 5. CONFIGURAÇÃO DO NGINX
# =============================================================================
echo -e "${YELLOW}🌐 Configurando Nginx...${NC}"

# Frontend
cat > /etc/nginx/sites-available/$DOMINIO << EOF
server {
    listen 80;
    server_name $DOMINIO;
    
    root $INSTALL_DIR/dist;
    index index.html;
    
    # Logs
    access_log /var/log/nginx/$DOMINIO-access.log;
    error_log /var/log/nginx/$DOMINIO-error.log;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Cache de assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# API Supabase (proxy)
cat > /etc/nginx/sites-available/api.$DOMINIO << EOF
server {
    listen 80;
    server_name api.$DOMINIO;
    
    location / {
        proxy_pass http://localhost:8000;
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

# Habilitar sites
ln -sf /etc/nginx/sites-available/$DOMINIO /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.$DOMINIO /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar e recarregar
nginx -t && systemctl reload nginx

# =============================================================================
# 6. CONFIGURAÇÃO DO FIREWALL
# =============================================================================
echo -e "${YELLOW}🔥 Configurando Firewall...${NC}"
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'

# =============================================================================
# 7. SSL COM CERTBOT
# =============================================================================
echo -e "${YELLOW}🔒 Configurando SSL...${NC}"
certbot --nginx -d $DOMINIO -d api.$DOMINIO --non-interactive --agree-tos -m $EMAIL_ADMIN --redirect || true

# =============================================================================
# 8. SALVAR CREDENCIAIS
# =============================================================================
CREDENTIALS_FILE="/root/escritura-credentials.txt"
cat > $CREDENTIALS_FILE << EOF
==============================================
  CREDENCIAIS DO SISTEMA - GUARDE COM SEGURANÇA
==============================================

📅 Data de instalação: $(date)

🌐 URLs:
   Frontend: https://$DOMINIO
   API Supabase: https://api.$DOMINIO
   Dashboard Supabase: http://localhost:3000

🔑 Supabase Dashboard:
   Usuário: admin
   Senha: $DASHBOARD_PASSWORD

🗄️  Banco de Dados PostgreSQL:
   Host: localhost
   Porta: 5432
   Usuário: postgres
   Senha: $POSTGRES_PASSWORD
   Database: postgres

🔐 Chaves Supabase:
   ANON_KEY: $ANON_KEY
   SERVICE_KEY: $SERVICE_KEY
   JWT_SECRET: $JWT_SECRET

📁 Diretórios:
   Frontend: $INSTALL_DIR
   Supabase: $SUPABASE_DIR/docker

📋 Comandos úteis:
   # Ver logs do Supabase
   cd $SUPABASE_DIR/docker && docker compose logs -f
   
   # Reiniciar Supabase
   cd $SUPABASE_DIR/docker && docker compose restart
   
   # Fazer backup do banco
   docker exec supabase-db pg_dump -U postgres postgres > backup.sql
   
   # Deploy do frontend
   cd $INSTALL_DIR && ./deploy.sh

==============================================
EOF

chmod 600 $CREDENTIALS_FILE

# =============================================================================
# CONCLUSÃO
# =============================================================================
echo ""
echo -e "${GREEN}=============================================="
echo "   ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "==============================================${NC}"
echo ""
echo -e "${BLUE}📋 Próximos passos:${NC}"
echo ""
echo "1. Clone seu repositório:"
echo "   cd $INSTALL_DIR"
echo "   git clone https://github.com/seu-usuario/seu-repo.git ."
echo ""
echo "2. Atualize o .env com as chaves corretas"
echo ""
echo "3. Faça o build:"
echo "   npm install && npm run build"
echo ""
echo "4. Importe os dados do banco antigo (ver script migrar-dados.sh)"
echo ""
echo -e "${YELLOW}🔑 Credenciais salvas em: $CREDENTIALS_FILE${NC}"
echo ""
echo -e "${GREEN}URLs:${NC}"
echo "   Frontend: https://$DOMINIO"
echo "   API: https://api.$DOMINIO"
echo ""
