#!/bin/bash

# =============================================================================
# Script de Migração de Dados - Lovable Cloud para VPS
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}"
echo "=============================================="
echo "   MIGRAÇÃO DE DADOS - LOVABLE PARA VPS      "
echo "=============================================="
echo -e "${NC}"

# Configurações do Lovable Cloud (origem)
LOVABLE_PROJECT_ID="mpqhmmdggsymyhsczucs"
LOVABLE_DB_HOST="aws-0-sa-east-1.pooler.supabase.com"
LOVABLE_DB_PORT="6543"
LOVABLE_DB_USER="postgres.$LOVABLE_PROJECT_ID"
LOVABLE_DB_NAME="postgres"

# Configurações do VPS (destino)
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5432"
LOCAL_DB_USER="postgres"
LOCAL_DB_NAME="postgres"

BACKUP_DIR="/root/backup-lovable"
BACKUP_FILE="$BACKUP_DIR/lovable-backup-$(date +%Y%m%d-%H%M%S).sql"

echo ""
echo -e "${YELLOW}⚠️  ATENÇÃO: Você precisa da senha do banco Lovable Cloud${NC}"
echo ""
echo "Para obter a senha:"
echo "1. Acesse o Lovable"
echo "2. Vá em Settings → Cloud → Database"
echo "3. Copie a connection string e extraia a senha"
echo ""
read -p "Senha do banco Lovable Cloud: " LOVABLE_DB_PASSWORD

if [ -z "$LOVABLE_DB_PASSWORD" ]; then
    echo -e "${RED}❌ Senha é obrigatória${NC}"
    exit 1
fi

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# =============================================================================
# PASSO 1: EXPORTAR DADOS DO LOVABLE CLOUD
# =============================================================================
echo ""
echo -e "${YELLOW}📥 Exportando dados do Lovable Cloud...${NC}"

# Exportar schema e dados das tabelas públicas
PGPASSWORD=$LOVABLE_DB_PASSWORD pg_dump \
    -h $LOVABLE_DB_HOST \
    -p $LOVABLE_DB_PORT \
    -U $LOVABLE_DB_USER \
    -d $LOVABLE_DB_NAME \
    --schema=public \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    -f $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"
    echo "   Tamanho: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo -e "${RED}❌ Erro ao exportar dados${NC}"
    exit 1
fi

# =============================================================================
# PASSO 2: EXPORTAR USUÁRIOS (auth.users)
# =============================================================================
echo ""
echo -e "${YELLOW}👥 Exportando usuários...${NC}"

USERS_FILE="$BACKUP_DIR/users-$(date +%Y%m%d-%H%M%S).sql"

PGPASSWORD=$LOVABLE_DB_PASSWORD psql \
    -h $LOVABLE_DB_HOST \
    -p $LOVABLE_DB_PORT \
    -U $LOVABLE_DB_USER \
    -d $LOVABLE_DB_NAME \
    -c "COPY (SELECT * FROM auth.users) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/auth_users.csv" 2>/dev/null || echo "⚠️  Não foi possível exportar auth.users (permissão negada - normal)"

# =============================================================================
# PASSO 3: EXPORTAR ARQUIVOS DO STORAGE
# =============================================================================
echo ""
echo -e "${YELLOW}📁 Exportando metadados do storage...${NC}"

PGPASSWORD=$LOVABLE_DB_PASSWORD psql \
    -h $LOVABLE_DB_HOST \
    -p $LOVABLE_DB_PORT \
    -U $LOVABLE_DB_USER \
    -d $LOVABLE_DB_NAME \
    -c "COPY (SELECT * FROM storage.objects) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/storage_objects.csv" 2>/dev/null || echo "⚠️  Não foi possível exportar storage.objects"

PGPASSWORD=$LOVABLE_DB_PASSWORD psql \
    -h $LOVABLE_DB_HOST \
    -p $LOVABLE_DB_PORT \
    -U $LOVABLE_DB_USER \
    -d $LOVABLE_DB_NAME \
    -c "COPY (SELECT * FROM storage.buckets) TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/storage_buckets.csv" 2>/dev/null || echo "⚠️  Não foi possível exportar storage.buckets"

# =============================================================================
# PASSO 4: IMPORTAR NO BANCO LOCAL
# =============================================================================
echo ""
read -p "Deseja importar os dados no banco local agora? (s/n): " importar

if [ "$importar" = "s" ]; then
    echo -e "${YELLOW}📤 Importando dados no banco local...${NC}"
    
    # Obter senha local do arquivo de credenciais
    LOCAL_DB_PASSWORD=$(grep "Senha:" /root/escritura-credentials.txt | grep -A1 "PostgreSQL" | tail -1 | awk '{print $2}')
    
    if [ -z "$LOCAL_DB_PASSWORD" ]; then
        read -p "Senha do PostgreSQL local: " LOCAL_DB_PASSWORD
    fi
    
    # Importar usando docker
    docker exec -i supabase-db psql -U postgres -d postgres < $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dados importados com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao importar dados${NC}"
        echo "Tente manualmente:"
        echo "  docker exec -i supabase-db psql -U postgres -d postgres < $BACKUP_FILE"
        exit 1
    fi
fi

# =============================================================================
# RESUMO
# =============================================================================
echo ""
echo -e "${GREEN}=============================================="
echo "   MIGRAÇÃO CONCLUÍDA"
echo "==============================================${NC}"
echo ""
echo "📁 Arquivos de backup em: $BACKUP_DIR"
echo ""
ls -la $BACKUP_DIR
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "1. Verifique se todos os dados foram importados corretamente"
echo "2. Os usuários precisarão redefinir suas senhas"
echo "3. Arquivos do storage precisam ser baixados manualmente"
echo ""
echo -e "${BLUE}Para baixar arquivos do storage:${NC}"
echo "Os arquivos estão em: https://mpqhmmdggsymyhsczucs.supabase.co/storage/v1/object/public/[bucket]/[path]"
echo ""
