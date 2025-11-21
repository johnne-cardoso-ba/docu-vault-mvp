# Passo a Passo: Instalação/Reconfiguração Ticket Z

## 🎯 Objetivo
Instalar o Ticket Z usando os domínios:
- **Frontend**: wp.escrituraai.com.br
- **Backend**: api.escrituraai.com.br

**Importante**: O sistema atual (app.escrituraai.com.br) não será afetado!

---

## ✅ Pré-requisitos

### 1. Configure o DNS (faça isso ANTES de tudo)
No seu provedor de domínio (Registro.br, GoDaddy, etc), adicione:

```
Tipo: A
Nome: wp
Valor: [IP da sua VPS]

Tipo: A
Nome: api
Valor: [IP da sua VPS]
```

**Verificar se DNS está propagado:**
```bash
dig wp.escrituraai.com.br +short
dig api.escrituraai.com.br +short
```
Ambos devem retornar o IP da sua VPS.

---

## 📋 Opção 1: Ticket Z Já Instalado (Reconfigurar)

### Passo 1: Conectar na VPS
```bash
ssh root@seu-ip-vps
```

### Passo 2: Verificar se está instalado
```bash
cd /opt/ticketz
docker compose ps
```

Se aparecer containers rodando, o Ticket Z está instalado.

### Passo 3: Parar containers
```bash
cd /opt/ticketz
docker compose down
```

### Passo 4: Fazer backup (por segurança)
```bash
cp /opt/ticketz/.env /opt/ticketz/.env.backup
```

### Passo 5: Atualizar domínios no .env
```bash
cd /opt/ticketz
nano .env
```

Procure e altere estas linhas:
```
BACKEND_URL=https://api.escrituraai.com.br
FRONTEND_URL=https://wp.escrituraai.com.br
```

Salve: `Ctrl+O`, Enter, `Ctrl+X`

### Passo 6: Reconfigurar Nginx - Backend
```bash
nano /etc/nginx/sites-available/ticketz-api
```

Cole isto (substituindo tudo):
```nginx
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
```

### Passo 7: Reconfigurar Nginx - Frontend
```bash
nano /etc/nginx/sites-available/ticketz-frontend
```

Cole isto (substituindo tudo):
```nginx
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
```

### Passo 8: Testar e recarregar Nginx
```bash
nginx -t
systemctl reload nginx
```

### Passo 9: Configurar SSL
```bash
certbot --nginx -d wp.escrituraai.com.br -d api.escrituraai.com.br --non-interactive --agree-tos -m admin@escrituraai.com.br
```

### Passo 10: Reiniciar containers
```bash
cd /opt/ticketz
docker compose up -d
```

### Passo 11: Verificar
```bash
docker compose ps
docker compose logs -f
```

**Pronto!** Acesse:
- https://wp.escrituraai.com.br
- https://api.escrituraai.com.br

---

## 📋 Opção 2: Instalação Limpa (Remover e Reinstalar)

### Passo 1: Conectar na VPS
```bash
ssh root@seu-ip-vps
```

### Passo 2: Remover instalação antiga (se existir)
```bash
# Parar containers
cd /opt/ticketz
docker compose down

# Fazer backup do banco (se quiser manter dados)
mkdir -p /root/backup-ticketz
docker compose exec postgres pg_dump -U postgres ticketz > /root/backup-ticketz/backup-$(date +%Y%m%d).sql

# Remover tudo
docker compose down -v
cd /opt
rm -rf ticketz

# Remover configs Nginx antigas
rm -f /etc/nginx/sites-enabled/ticketz-*
rm -f /etc/nginx/sites-available/ticketz-*
systemctl reload nginx
```

### Passo 3: Baixar script de instalação
```bash
cd /root
curl -O https://raw.githubusercontent.com/seu-repo/main/scripts-ticketz/install-ticketz.sh
chmod +x install-ticketz.sh
```

**OU** copie manualmente:
```bash
nano /root/install-ticketz.sh
# Cole o conteúdo do script install-ticketz.sh
chmod +x install-ticketz.sh
```

### Passo 4: Executar instalação
```bash
sudo bash /root/install-ticketz.sh
```

Aguarde... (pode demorar 5-10 minutos)

### Passo 5: Verificar
```bash
cd /opt/ticketz
docker compose ps
```

**Credenciais padrão:**
- Email: admin@ticketz.com
- Senha: 123456

**Acesse:**
- https://wp.escrituraai.com.br
- https://api.escrituraai.com.br

---

## 🔍 Verificações Finais

### 1. Containers rodando?
```bash
cd /opt/ticketz
docker compose ps
```
Todos devem estar "Up"

### 2. Nginx funcionando?
```bash
systemctl status nginx
```

### 3. SSL ativo?
```bash
certbot certificates
```

### 4. Logs sem erros?
```bash
cd /opt/ticketz
docker compose logs --tail=50
```

---

## ❌ Troubleshooting

### Erro: "Cannot connect to Docker daemon"
```bash
systemctl start docker
systemctl enable docker
```

### Erro: "Port already in use"
```bash
# Ver o que está usando as portas
netstat -tulpn | grep -E '3000|8080|5432'
# Parar o serviço conflitante ou mudar porta no docker-compose.yml
```

### Erro: "SSL certificate issue"
```bash
# Remover certificados antigos
certbot delete --cert-name wp.escrituraai.com.br
certbot delete --cert-name api.escrituraai.com.br
# Reinstalar
certbot --nginx -d wp.escrituraai.com.br -d api.escrituraai.com.br --non-interactive --agree-tos -m admin@escrituraai.com.br
```

### Site não abre
```bash
# Verificar se DNS está propagado
dig wp.escrituraai.com.br +short
dig api.escrituraai.com.br +short

# Verificar Nginx
nginx -t
cat /etc/nginx/sites-enabled/ticketz-*

# Verificar containers
cd /opt/ticketz
docker compose logs
```

---

## 📞 Comandos Úteis

```bash
# Ver logs em tempo real
cd /opt/ticketz && docker compose logs -f

# Reiniciar tudo
cd /opt/ticketz && docker compose restart

# Parar tudo
cd /opt/ticketz && docker compose down

# Iniciar tudo
cd /opt/ticketz && docker compose up -d

# Ver status
cd /opt/ticketz && docker compose ps

# Limpar e reconstruir
cd /opt/ticketz && docker compose down -v && docker compose up -d --build
```

---

## ✅ Checklist Final

- [ ] DNS configurado (wp e api)
- [ ] DNS propagado (verificado com dig)
- [ ] Ticket Z instalado/reconfigurado
- [ ] Nginx configurado
- [ ] SSL funcionando (https)
- [ ] Containers rodando
- [ ] Consegue acessar wp.escrituraai.com.br
- [ ] Consegue acessar api.escrituraai.com.br
- [ ] Sistema atual (app.escrituraai.com.br) continua funcionando

---

## 🎉 Sucesso!

Se tudo funcionou, você tem agora:
1. **Sistema de Contabilidade**: app.escrituraai.com.br
2. **Ticket Z Frontend**: wp.escrituraai.com.br
3. **Ticket Z Backend**: api.escrituraai.com.br

Todos rodando na mesma VPS sem conflitos! 🚀
