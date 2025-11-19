# Deploy na VPS Hetzner - Ubuntu 22

Este guia mostra como fazer deploy do projeto na sua VPS Hetzner com Ubuntu 22.

## 1. Conectar ao GitHub

1. No Lovable, clique em **GitHub** → **Connect to GitHub**
2. Autorize o Lovable GitHub App
3. Selecione sua conta/organização
4. Clique em **Create Repository** para criar o repositório com seu código

⚠️ **Importante**: Após conectar ao GitHub, qualquer mudança no Lovable sincroniza automaticamente com o GitHub (e vice-versa).

## 2. Preparar a VPS

### 2.1. Instalar Dependências

```bash
# Conectar na VPS
ssh root@seu-ip-da-vps

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar Git
apt install -y git

# Instalar Nginx
apt install -y nginx

# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Criar usuário para a aplicação
adduser --system --group --home /opt/app appuser
```

### 2.2. Configurar Firewall

```bash
# Permitir SSH, HTTP e HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## 3. Deploy da Aplicação

### 3.1. Clonar Repositório

```bash
# Ir para o diretório da aplicação
cd /opt/app

# Clonar repositório (substitua pela URL do seu repo)
git clone https://github.com/seu-usuario/seu-repositorio.git .

# Dar permissões corretas
chown -R appuser:appuser /opt/app
```

### 3.2. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
nano /opt/app/.env
```

Cole as variáveis (copie do arquivo .env do Lovable):
```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

### 3.3. Instalar e Build

```bash
# Como usuário appuser
su - appuser

cd /opt/app

# Instalar dependências
npm install

# Fazer build
npm run build

# Sair do usuário appuser
exit
```

## 4. Configurar Nginx

```bash
# Criar configuração do Nginx
nano /etc/nginx/sites-available/app
```

Cole a configuração:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    root /opt/app/dist;
    index index.html;
    
    # Compressão
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Cache de assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA - redirecionar tudo para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Ativar site:
```bash
# Criar link simbólico
ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/

# Remover site padrão
rm /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

## 5. Configurar SSL (HTTPS) com Let's Encrypt

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado (substitua pelo seu domínio)
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática já está configurada
```

## 6. Script de Deploy Automático

Para facilitar futuras atualizações, use o script `deploy.sh`:

```bash
# Tornar executável
chmod +x /opt/app/deploy.sh

# Executar deploy
./deploy.sh
```

## 7. Atualizações Futuras

Quando fizer mudanças no Lovable, elas são enviadas automaticamente para o GitHub. Para atualizar na VPS:

```bash
# Conectar na VPS
ssh root@seu-ip-da-vps

# Executar script de deploy
cd /opt/app
./deploy.sh
```

## 8. Monitoramento

```bash
# Ver logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Verificar status do Nginx
systemctl status nginx
```

## 9. Configurar Domínio

1. No painel da Hetzner ou seu provedor de DNS:
   - Adicione um registro **A** apontando para o IP da VPS
   - Se usar www, adicione também: **CNAME** www → seu-dominio.com

2. Aguarde propagação DNS (pode levar até 24h)

3. Execute o Certbot para obter SSL

## Troubleshooting

### Erro 502 Bad Gateway
```bash
# Verificar se o build foi feito
ls -la /opt/app/dist

# Refazer build se necessário
cd /opt/app
su - appuser
npm run build
exit
systemctl restart nginx
```

### Erro de Permissões
```bash
# Corrigir permissões
chown -R appuser:appuser /opt/app
chmod -R 755 /opt/app/dist
```

### Atualização não funciona
```bash
# Limpar cache e reinstalar
cd /opt/app
rm -rf node_modules dist
npm install
npm run build
systemctl restart nginx
```

## Backup

```bash
# Criar backup do projeto
tar -czf /root/app-backup-$(date +%Y%m%d).tar.gz /opt/app

# Backup automático diário (crontab)
0 2 * * * tar -czf /root/backups/app-backup-$(date +\%Y\%m\%d).tar.gz /opt/app
```

## Segurança Adicional

```bash
# Desabilitar login root via SSH
nano /etc/ssh/sshd_config
# Alterar: PermitRootLogin no

# Criar usuário admin
adduser admin
usermod -aG sudo admin

# Reiniciar SSH
systemctl restart sshd

# Instalar Fail2Ban
apt install -y fail2ban
systemctl enable fail2ban
```

## Recursos

- **Nginx**: Para servir os arquivos estáticos
- **Let's Encrypt**: SSL gratuito e automático
- **Git**: Para puxar atualizações do GitHub
- **UFW**: Firewall para segurança
