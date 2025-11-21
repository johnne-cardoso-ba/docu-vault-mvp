# Instalação Simples do Ticket Z

## Passo único - Cole no terminal da VPS

Conecte na VPS via SSH e cole este comando:

```bash
curl -fsSL https://raw.githubusercontent.com/seu-usuario/seu-repo/main/scripts-ticketz/install-ticketz.sh | sudo bash
```

**OU** copie e cole todo o script abaixo diretamente no terminal:

---

```bash
#!/bin/bash
# Instalação All-in-One do Ticket Z
# Copie TUDO e cole no terminal da VPS

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

FRONTEND_DOMAIN="wp.escrituraai.com.br"
BACKEND_DOMAIN="api.escrituraai.com.br"
ADMIN_EMAIL="contato@escrituraai.com.br"
INSTALL_DIR="/opt/ticketz"

echo -e "${GREEN}🚀 Instalação do Ticket Z${NC}"
echo "Frontend: $FRONTEND_DOMAIN"
echo "Backend: $BACKEND_DOMAIN"

if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root: sudo su${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Instalando dependências...${NC}"
apt update && apt install -y curl git

echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker && systemctl start docker
fi

echo -e "${YELLOW}🐳 Instalando Docker Compose...${NC}"
if ! command -v docker compose &> /dev/null; then
    apt install -y docker-compose-plugin
fi

echo -e "${YELLOW}📥 Clonando Ticket Z...${NC}"
[ -d "$INSTALL_DIR" ] && rm -rf $INSTALL_DIR
git clone https://github.com/ticketz-oss/ticketz.git $INSTALL_DIR
cd $INSTALL_DIR

echo -e "${YELLOW}⚙️  Configurando...${NC}"
cp .env.example .env
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

sed -i "s|NODE_ENV=.*|NODE_ENV=production|g" .env
sed -i "s|BACKEND_URL=.*|BACKEND_URL=https://$BACKEND_DOMAIN|g" .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$FRONTEND_DOMAIN|g" .env
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$DB_PASSWORD|g" .env
sed -i "s|DB_PASS=.*|DB_PASS=$DB_PASSWORD|g" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" .env

echo -e "${YELLOW}🔧 Configurando Nginx...${NC}"
cat > /etc/nginx/sites-available/ticketz-api << 'EOFAPI'
server {
    listen 80;
    server_name api.escrituraai.com.br;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOFAPI

cat > /etc/nginx/sites-available/ticketz-frontend << 'EOFFRONT'
server {
    listen 80;
    server_name wp.escrituraai.com.br;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOFFRONT

ln -sf /etc/nginx/sites-available/ticketz-api /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/ticketz-frontend /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo -e "${YELLOW}🔒 Configurando SSL...${NC}"
apt install -y certbot python3-certbot-nginx
certbot --nginx -d $BACKEND_DOMAIN -d $FRONTEND_DOMAIN --email $ADMIN_EMAIL --agree-tos --non-interactive

echo -e "${YELLOW}🐳 Iniciando containers...${NC}"
cd $INSTALL_DIR
docker compose up -d

echo -e "${YELLOW}⏳ Aguardando 30s...${NC}"
sleep 30

cat > /root/ticketz-info.txt << EOFINFO
Ticket Z - Instalação Concluída
================================
Data: $(date)

🌐 Acessos:
   Frontend: https://$FRONTEND_DOMAIN
   Backend:  https://$BACKEND_DOMAIN

👤 Login padrão:
   Email: admin@ticketz.com
   Senha: 123456
   ⚠️  ALTERE NO PRIMEIRO ACESSO!

🔑 Credenciais do sistema:
   DB Password: $DB_PASSWORD
   JWT Secret: $JWT_SECRET

📋 Comandos úteis:
   Ver logs:    cd $INSTALL_DIR && docker compose logs -f
   Reiniciar:   cd $INSTALL_DIR && docker compose restart
   Atualizar:   cd $INSTALL_DIR && git pull && docker compose up -d --build

📁 Diretório: $INSTALL_DIR
EOFINFO

chmod 600 /root/ticketz-info.txt

echo ""
echo -e "${GREEN}✅ INSTALAÇÃO CONCLUÍDA!${NC}"
echo ""
echo "🌐 Acesse: https://$FRONTEND_DOMAIN"
echo "👤 Login: admin@ticketz.com | Senha: 123456"
echo "📄 Detalhes salvos em: /root/ticketz-info.txt"
```

---

## Isso é tudo!

Após colar o script, aguarde 5-10 minutos e acesse:
- **https://wp.escrituraai.com.br**
- Login: `admin@ticketz.com`
- Senha: `123456`

⚠️ **Altere a senha no primeiro acesso!**
