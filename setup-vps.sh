#!/bin/bash

# =============================================================
# Script de Configuração Inicial da VPS - Escritura AI
# Execute UMA VEZ na VPS nova
# Uso: sudo bash setup-vps.sh
# =============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root: sudo bash setup-vps.sh${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}============================================="
echo "   SETUP VPS - ESCRITURA AI"
echo "=============================================${NC}"
echo ""

# 1. Atualizar sistema
echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
apt update && apt upgrade -y

# 2. Instalar Node.js 20
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"

# 3. Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
apt install -y git nginx certbot python3-certbot-nginx ufw fail2ban

# 4. Criar usuário da aplicação
if ! id "appuser" &>/dev/null; then
    echo -e "${YELLOW}👤 Criando usuário appuser...${NC}"
    adduser --system --group --home /opt/app --shell /bin/bash appuser
else
    echo -e "${YELLOW}👤 Usuário appuser já existe${NC}"
    usermod -s /bin/bash appuser
fi

# 5. Criar diretórios
mkdir -p /opt/app
mkdir -p /root/backups
chown -R appuser:appuser /opt/app

# 6. Configurar firewall
echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'

# 7. Configurar Fail2Ban
systemctl enable fail2ban
systemctl start fail2ban

echo ""
echo -e "${GREEN}============================================="
echo "   ✅ SETUP CONCLUÍDO!"
echo "=============================================${NC}"
echo ""
echo "Próximos passos:"
echo ""
echo "  1. Clonar repositório:"
echo "     cd /opt/app"
echo "     git clone https://github.com/SEU-USUARIO/SEU-REPO.git ."
echo "     chown -R appuser:appuser /opt/app"
echo ""
echo "  2. Criar .env:"
echo "     nano /opt/app/.env"
echo "     (cole as variáveis VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID)"
echo ""
echo "  3. Build e Nginx:"
echo "     cd /opt/app"
echo "     sudo -u appuser bash -c 'npm install && npm run build'"
echo "     cp nginx.conf /etc/nginx/sites-available/app"
echo "     ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/"
echo "     rm -f /etc/nginx/sites-enabled/default"
echo "     nginx -t && systemctl restart nginx"
echo ""
echo "  4. SSL:"
echo "     certbot --nginx -d SEU-DOMINIO.COM"
echo ""
echo "  Veja DEPLOY.md para instruções detalhadas."
echo ""
