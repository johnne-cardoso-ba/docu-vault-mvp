# Scripts de Instalação do Ticket Z

Scripts automatizados para instalar, atualizar e gerenciar o Ticket Z na VPS.

## 📋 Pré-requisitos

1. **VPS rodando Ubuntu 22.04** (recomendado)
2. **Acesso root** via SSH
3. **Domínios configurados no DNS** apontando para o IP da VPS:
   - `wp.escrituraai.com.br` → IP da VPS
   - `api.escrituraai.com.br` → IP da VPS

### Verificar DNS

Antes de instalar, verifique se os domínios estão apontando corretamente:

```bash
dig wp.escrituraai.com.br +short
dig api.escrituraai.com.br +short
```

Ambos devem retornar o IP da sua VPS.

## 🚀 Instalação

### Passo 1: Conectar na VPS

```bash
ssh root@seu-ip-da-vps
```

### Passo 2: Baixar os scripts

```bash
cd /root
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo/scripts-ticketz
chmod +x *.sh
```

### Passo 3: Executar instalação

```bash
sudo ./install-ticketz.sh
```

O script irá:
- ✅ Instalar Docker e Docker Compose
- ✅ Clonar o repositório do Ticket Z
- ✅ Configurar variáveis de ambiente
- ✅ Configurar Nginx como reverse proxy
- ✅ Obter certificados SSL (HTTPS)
- ✅ Iniciar os containers

**Tempo estimado: 5-10 minutos**

### Passo 4: Acessar o sistema

Após a instalação:

- **Frontend**: https://wp.escrituraai.com.br
- **Backend**: https://api.escrituraai.com.br

**Credenciais padrão:**
- Email: `admin@ticketz.com`
- Senha: `123456`

⚠️ **IMPORTANTE**: Altere a senha no primeiro acesso!

## 🔄 Atualização

Para atualizar o Ticket Z para a versão mais recente:

```bash
cd /root/seu-repo/scripts-ticketz
sudo ./update-ticketz.sh
```

## 💾 Backup

### Backup manual

```bash
cd /root/seu-repo/scripts-ticketz
sudo ./backup-ticketz.sh
```

Os backups são salvos em: `/root/backups/ticketz/`

### Backup automático (diário às 3h da manhã)

```bash
# Adicionar ao crontab
crontab -e

# Adicionar esta linha:
0 3 * * * /root/seu-repo/scripts-ticketz/backup-ticketz.sh >> /var/log/ticketz-backup.log 2>&1
```

## 🗑️ Desinstalação

Para remover completamente o Ticket Z:

```bash
cd /root/seu-repo/scripts-ticketz
sudo ./uninstall-ticketz.sh
```

⚠️ Isso remove TODOS os dados. Um backup automático é feito antes.

## 📊 Monitoramento

### Ver logs em tempo real

```bash
cd /opt/ticketz
docker compose logs -f
```

### Ver logs de um serviço específico

```bash
cd /opt/ticketz
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Verificar status dos containers

```bash
cd /opt/ticketz
docker compose ps
```

### Verificar uso de recursos

```bash
docker stats
```

## 🔧 Comandos Úteis

```bash
# Reiniciar todos os serviços
cd /opt/ticketz && docker compose restart

# Reiniciar um serviço específico
cd /opt/ticketz && docker compose restart backend

# Parar todos os serviços
cd /opt/ticketz && docker compose down

# Iniciar todos os serviços
cd /opt/ticketz && docker compose up -d

# Ver logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Testar configuração do Nginx
nginx -t

# Recarregar Nginx
systemctl reload nginx
```

## 🔍 Troubleshooting

### Os domínios não estão acessíveis

```bash
# Verificar se o DNS está correto
dig wp.escrituraai.com.br +short
dig api.escrituraai.com.br +short

# Verificar se os containers estão rodando
cd /opt/ticketz && docker compose ps

# Verificar logs do Nginx
tail -f /var/log/nginx/error.log
```

### SSL não está funcionando

```bash
# Renovar certificados
certbot renew --force-renewal

# Verificar certificados
certbot certificates
```

### Containers não iniciam

```bash
# Ver logs detalhados
cd /opt/ticketz && docker compose logs

# Remover tudo e reinstalar
cd /opt/ticketz
docker compose down -v
docker compose up -d --build
```

### Banco de dados corrompido

```bash
# Restaurar backup mais recente
cd /root/backups/ticketz
# Encontrar o backup mais recente
ls -lth database_*.sql | head -1

# Restaurar
cd /opt/ticketz
docker compose exec -T postgres psql -U ticketz ticketz < /root/backups/ticketz/database_YYYYMMDD_HHMMSS.sql
```

## 📝 Arquivos Importantes

- `/opt/ticketz/` - Diretório principal da aplicação
- `/opt/ticketz/.env` - Variáveis de ambiente
- `/root/ticketz-credentials.txt` - Credenciais e senhas
- `/root/backups/ticketz/` - Backups
- `/etc/nginx/sites-available/ticketz-*` - Configurações do Nginx
- `/var/log/nginx/` - Logs do Nginx

## 🔒 Segurança

1. **Firewall**: Certifique-se que apenas as portas necessárias estão abertas:
   ```bash
   ufw status
   # Deve mostrar: 22 (SSH), 80 (HTTP), 443 (HTTPS)
   ```

2. **Credenciais**: Altere TODAS as senhas padrão imediatamente

3. **Backups**: Configure backups automáticos diários

4. **SSL**: Os certificados renovam automaticamente. Verifique com:
   ```bash
   certbot certificates
   ```

## 📚 Recursos

- [Ticket Z - Documentação Oficial](https://github.com/ticketz-oss/ticketz)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs: `cd /opt/ticketz && docker compose logs -f`
2. Verifique o status: `docker compose ps`
3. Consulte a seção de Troubleshooting acima
4. Abra uma issue no repositório do Ticket Z
