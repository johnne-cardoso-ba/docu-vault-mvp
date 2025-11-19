#!/bin/bash

# Script de Configuração Inicial da VPS
# Execute este script UMA VEZ na VPS nova
# Uso: curl -sSL https://raw.githubusercontent.com/seu-usuario/seu-repo/main/setup-vps.sh | bash

set -e

echo "🚀 Configurando VPS para deploy..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Execute como root: sudo bash setup-vps.sh"
    exit 1
fi

echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}📦 Instalando Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x -o nodesource_setup.sh
bash nodesource_setup.sh
apt-get install -y nodejs
rm nodesource_setup.sh
node --version
npm --version

echo -e "${YELLOW}📦 Instalando dependências...${NC}"
apt install -y git nginx ufw fail2ban

echo -e "${YELLOW}📦 Instalando PM2...${NC}"
npm install -g pm2

echo -e "${YELLOW}👤 Criando usuário da aplicação...${NC}"
if ! id "appuser" &>/dev/null; then
    adduser --system --group --home /opt/app --shell /bin/bash appuser
    echo -e "${GREEN}✅ Usuário appuser criado${NC}"
else
    echo -e "${YELLOW}⚠️  Usuário appuser já existe${NC}"
    usermod -s /bin/bash appuser
fi

echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'

echo -e "${YELLOW}🛡️  Configurando Fail2Ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban

echo -e "${YELLOW}📁 Criando estrutura de diretórios...${NC}"
mkdir -p /opt/app
mkdir -p /root/backups
chown -R appuser:appuser /opt/app

echo ""
echo -e "${GREEN}✅ Configuração inicial concluída!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Clone seu repositório em /opt/app"
echo "2. Configure as variáveis de ambiente em /opt/app/.env"
echo "3. Configure o Nginx (copie nginx.conf para /etc/nginx/sites-available/app)"
echo "4. Execute o primeiro build"
echo ""
echo "Comandos úteis:"
echo "  git clone https://github.com/seu-usuario/seu-repo.git /opt/app"
echo "  nano /opt/app/.env"
echo "  cp /opt/app/nginx.conf /etc/nginx/sites-available/app"
echo "  ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/"
echo "  cd /opt/app && sudo -u appuser bash -c 'npm install && npm run build'"
echo "  systemctl restart nginx"
echo ""
