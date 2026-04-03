# 🚀 Deploy na VPS - Escritura AI

Guia completo para hospedar o sistema na sua VPS com Ubuntu 22+.

> **Nota:** Este projeto usa o Lovable Cloud (Supabase) como backend. Apenas o **frontend** será hospedado na VPS. O banco de dados continua no Lovable Cloud.

---

## Pré-requisitos

- VPS com Ubuntu 22.04+ (mínimo 1GB RAM, 20GB disco)
- Domínio apontado para o IP da VPS (registro A no DNS)
- Acesso SSH como root

---

## Opção 1: Instalação Rápida (Recomendado)

```bash
# 1. Conectar na VPS
ssh root@SEU-IP-VPS

# 2. Baixar e executar o script de setup
curl -sSL https://raw.githubusercontent.com/SEU-USUARIO/SEU-REPO/main/setup-vps.sh | bash

# 3. Clonar o repositório
cd /opt/app
git clone https://github.com/SEU-USUARIO/SEU-REPO.git .
chown -R appuser:appuser /opt/app

# 4. Configurar variáveis de ambiente
nano /opt/app/.env
```

Conteúdo do `.env`:
```env
VITE_SUPABASE_URL=https://mpqhmmdggsymyhsczucs.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcWhtbWRnZ3N5bXloc2N6dWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzOTA5MTIsImV4cCI6MjA3ODk2NjkxMn0.LXbp8fPM96DFbasGBUVKADOkRK5Q3j3B06DF-GGBIk8
VITE_SUPABASE_PROJECT_ID=mpqhmmdggsymyhsczucs
```

```bash
# 5. Build e configurar Nginx
cd /opt/app
sudo -u appuser bash -c "npm install && npm run build"
cp nginx.conf /etc/nginx/sites-available/app
ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 6. SSL (HTTPS)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d SEU-DOMINIO.COM
```

---

## Opção 2: Deploy Automático via GitHub Actions

### Configurar Secrets no GitHub

No repositório GitHub, vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret | Descrição |
|--------|-----------|
| `VPS_HOST` | IP da sua VPS (ex: `123.456.789.0`) |
| `VPS_USER` | Usuário SSH (ex: `root`) |
| `VPS_SSH_KEY` | Chave SSH privada (conteúdo do `~/.ssh/id_ed25519`) |

### Gerar chave SSH

```bash
# No seu computador local:
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy

# Copiar chave pública para a VPS:
ssh-copy-id -i ~/.ssh/github_deploy.pub root@SEU-IP-VPS

# O conteúdo de ~/.ssh/github_deploy (privada) vai no secret VPS_SSH_KEY
cat ~/.ssh/github_deploy
```

### Como funciona

Após configurar, todo push na branch `main` automaticamente:
1. Conecta na VPS via SSH
2. Puxa as últimas mudanças do GitHub
3. Instala dependências e faz build
4. Reinicia o Nginx

---

## Atualizações Manuais

```bash
ssh root@SEU-IP-VPS
cd /opt/app
chmod +x deploy.sh
./deploy.sh
```

---

## Comandos Úteis

```bash
# Status do Nginx
systemctl status nginx

# Logs de acesso
tail -f /var/log/nginx/app-access.log

# Logs de erro
tail -f /var/log/nginx/app-error.log

# Refazer build completo
cd /opt/app && rm -rf node_modules dist && sudo -u appuser bash -c "npm install && npm run build" && systemctl restart nginx

# Testar configuração Nginx
nginx -t
```

---

## Troubleshooting

### Página em branco ou 404
```bash
ls -la /opt/app/dist/   # Verificar se o build existe
nginx -t                 # Testar configuração
```

### Erro de permissão
```bash
chown -R appuser:appuser /opt/app
chmod -R 755 /opt/app/dist
```

### Build falha
```bash
cd /opt/app
rm -rf node_modules
sudo -u appuser bash -c "npm install && npm run build"
```

---

## Nginx - Editar domínio

Abra o arquivo `nginx.conf` na raiz do projeto e altere `server_name` para o seu domínio:

```nginx
server_name meu-dominio.com.br;
```

Depois:
```bash
cp /opt/app/nginx.conf /etc/nginx/sites-available/app
nginx -t && systemctl reload nginx
certbot --nginx -d meu-dominio.com.br
```
