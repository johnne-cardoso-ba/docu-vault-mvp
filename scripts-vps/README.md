# Scripts de Instalação na VPS

Este diretório contém scripts para migrar o sistema completo do Lovable Cloud para sua própria VPS.

## 📋 Pré-requisitos

- VPS com Ubuntu 22.04 ou superior
- Mínimo 4GB RAM (recomendado 8GB para Supabase)
- Mínimo 40GB de disco
- Domínio configurado apontando para a VPS
- Acesso root

## 🚀 Instalação Rápida

### 1. Conectar na VPS
```bash
ssh root@seu-ip-vps
```

### 2. Baixar scripts
```bash
mkdir -p /root/scripts
cd /root/scripts

# Baixe os scripts do repositório ou copie manualmente
```

### 3. Executar instalação
```bash
chmod +x instalar-completo.sh
sudo ./instalar-completo.sh
```

### 4. Migrar dados
```bash
chmod +x migrar-dados.sh
sudo ./migrar-dados.sh
```

### 5. Clonar e fazer deploy do frontend
```bash
cd /opt/escritura
git clone https://github.com/seu-usuario/seu-repo.git .
chmod +x /root/scripts/deploy-frontend.sh
/root/scripts/deploy-frontend.sh
```

## 📁 Estrutura após instalação

```
/opt/
├── escritura/          # Frontend da aplicação
│   ├── dist/           # Build de produção
│   ├── .env            # Variáveis de ambiente
│   └── ...
│
└── supabase/           # Supabase Self-Hosted
    └── docker/
        ├── docker-compose.yml
        ├── .env
        └── volumes/    # Dados persistentes
```

## 🔧 Comandos Úteis

### Supabase
```bash
# Ver logs
cd /opt/supabase/docker && docker compose logs -f

# Reiniciar
cd /opt/supabase/docker && docker compose restart

# Parar
cd /opt/supabase/docker && docker compose down

# Iniciar
cd /opt/supabase/docker && docker compose up -d
```

### Frontend
```bash
# Deploy
/root/scripts/deploy-frontend.sh

# Ver logs do Nginx
tail -f /var/log/nginx/app.escrituraai.com.br-*.log
```

### Backup do Banco
```bash
# Criar backup
docker exec supabase-db pg_dump -U postgres postgres > backup-$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i supabase-db psql -U postgres postgres < backup.sql
```

## 🔐 Credenciais

Todas as credenciais são salvas em: `/root/escritura-credentials.txt`

**⚠️ IMPORTANTE:** Guarde esse arquivo em local seguro e delete da VPS após anotar as senhas.

## 🔄 Atualizações

### Atualizar Frontend
```bash
cd /opt/escritura
git pull
npm install
npm run build
systemctl reload nginx
```

### Atualizar Supabase
```bash
cd /opt/supabase/docker
docker compose pull
docker compose up -d
```

## ❓ Troubleshooting

### Supabase não inicia
```bash
# Ver logs detalhados
cd /opt/supabase/docker
docker compose logs db
docker compose logs rest
docker compose logs auth
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep supabase-db

# Testar conexão
docker exec -it supabase-db psql -U postgres -c "SELECT 1"
```

### Frontend não carrega
```bash
# Verificar Nginx
nginx -t
systemctl status nginx

# Ver logs
tail -f /var/log/nginx/error.log
```

## 💰 Economia

Com esta configuração você elimina:
- Custos do Lovable Cloud
- Limites de requisições
- Dependência de terceiros

Você passa a ter:
- Controle total dos dados
- Sem limites de uso
- Backups próprios
- Escalabilidade conforme necessário
