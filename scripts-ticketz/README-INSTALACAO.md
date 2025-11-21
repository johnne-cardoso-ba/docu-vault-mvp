# Instalação Ticket Z - Integrado com Sistema Atual

## ⚠️ IMPORTANTE
Este script instala o Ticket Z **em paralelo** ao sistema de contabilidade já existente. Os dois sistemas vão rodar na mesma VPS sem conflitos.

## Domínios Configurados
- **Frontend Ticket Z**: `wp.escrituraai.com.br`
- **Backend Ticket Z**: `api.escrituraai.com.br`
- **Sistema Contabilidade**: `app.escrituraai.com.br` (não será afetado)

## Pré-requisitos

1. **DNS Configurado**: Verifique se os domínios apontam para seu servidor:
```bash
dig wp.escrituraai.com.br +short
dig api.escrituraai.com.br +short
```

2. **Portas Disponíveis**: O Ticket Z usará:
   - Porta 3000 (Frontend)
   - Porta 8080 (Backend)
   - Porta 5432 (PostgreSQL - interno Docker)

## Instalação Rápida

### Passo 1: Conectar na VPS
```bash
ssh root@seu-servidor
```

### Passo 2: Baixar e executar o script
```bash
cd /root
curl -O https://raw.githubusercontent.com/seu-repo/scripts-ticketz/install-ticketz-completo.sh
chmod +x install-ticketz-completo.sh
sudo bash install-ticketz-completo.sh
```

### Ou copie o script manualmente
```bash
cd /root
nano install-ticketz-completo.sh
# Cole o conteúdo do script
chmod +x install-ticketz-completo.sh
sudo bash install-ticketz-completo.sh
```

## O que o script faz

1. ✅ Instala Docker e Docker Compose (se necessário)
2. ✅ Clona o repositório Ticket Z
3. ✅ Configura variáveis de ambiente com domínios corretos
4. ✅ Cria configurações Nginx específicas (sem afetar o app atual)
5. ✅ Configura SSL automático com Let's Encrypt
6. ✅ Inicia os containers Docker
7. ✅ Salva credenciais em `/root/ticketz-credentials.txt`

## Acesso Inicial

**URLs:**
- Frontend: https://wp.escrituraai.com.br
- Backend: https://api.escrituraai.com.br

**Credenciais Padrão:**
- Email: `admin@ticketz.com`
- Senha: `admin`

⚠️ **ALTERE A SENHA** após o primeiro acesso!

## Gerenciamento

### Ver logs em tempo real
```bash
cd /opt/ticketz
docker compose logs -f
```

### Ver status dos containers
```bash
cd /opt/ticketz
docker compose ps
```

### Reiniciar serviços
```bash
cd /opt/ticketz
docker compose restart
```

### Parar serviços
```bash
cd /opt/ticketz
docker compose down
```

### Iniciar serviços
```bash
cd /opt/ticketz
docker compose up -d
```

## Atualização

Para atualizar o Ticket Z:
```bash
cd /opt/ticketz
bash ../scripts-ticketz/update-ticketz.sh
```

## Backup

Para fazer backup manual:
```bash
bash /opt/ticketz/scripts/backup-ticketz.sh
```

Para backup automático diário (4h da manhã):
```bash
crontab -e
# Adicione:
0 4 * * * bash /opt/ticketz/scripts/backup-ticketz.sh
```

## Desinstalação

Se precisar remover o Ticket Z:
```bash
bash /opt/ticketz/scripts/uninstall-ticketz.sh
```

⚠️ Isso **NÃO** afeta o sistema de contabilidade!

## Troubleshooting

### Domínio não acessível
```bash
# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Verificar containers
cd /opt/ticketz
docker compose ps
```

### Erro de SSL
```bash
# Renovar certificados
sudo certbot renew --force-renewal
```

### Containers não iniciam
```bash
cd /opt/ticketz
docker compose logs
# Verificar portas
netstat -tulpn | grep -E '3000|8080|5432'
```

### Banco de dados corrompido
```bash
# Restaurar último backup
cd /opt/ticketz/backups
ls -lt | head -n 1  # Ver último backup
# Restaurar (ajuste a data)
docker compose down
docker volume rm ticketz_postgres_data
docker compose up -d
# Importar backup
docker exec -i ticketz-postgres psql -U postgres ticketz < backup-YYYYMMDD.sql
```

## Arquivos Importantes

- **Instalação**: `/opt/ticketz/`
- **Variáveis**: `/opt/ticketz/.env`
- **Credenciais**: `/root/ticketz-credentials.txt`
- **Backups**: `/opt/ticketz/backups/`
- **Nginx Backend**: `/etc/nginx/sites-available/ticketz-backend`
- **Nginx Frontend**: `/etc/nginx/sites-available/ticketz-frontend`

## Segurança

✅ Firewall configurado (portas 80, 443, 22)
✅ Alterar senha padrão
✅ Backups automáticos
✅ SSL habilitado
✅ Renovação automática de certificados

## Sistemas Rodando em Paralelo

Após a instalação, você terá:

1. **Sistema de Contabilidade** (já existente)
   - URL: `app.escrituraai.com.br`
   - Porta: (conforme configurado)
   
2. **Ticket Z** (novo)
   - Frontend: `wp.escrituraai.com.br` (porta 3000)
   - Backend: `api.escrituraai.com.br` (porta 8080)

Ambos funcionam independentemente sem conflitos!
