# Deploy Automático com GitHub Actions

Este guia mostra como configurar deploy automático na VPS sempre que houver mudanças no código.

## Como Funciona

Quando você faz mudanças no Lovable:
1. ✅ Lovable sincroniza automaticamente com GitHub
2. ✅ GitHub Actions detecta o push
3. ✅ GitHub Actions conecta na VPS via SSH
4. ✅ Executa o script `deploy.sh` automaticamente
5. ✅ Sua aplicação é atualizada em produção

## Configuração (Passo a Passo)

### 1. Preparar Chave SSH na VPS

```bash
# Conectar na VPS
ssh root@seu-ip-da-vps

# Criar chave SSH dedicada para GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key -N ""

# Adicionar chave pública ao authorized_keys
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys

# Exibir chave PRIVADA (copiar TODO o conteúdo)
cat ~/.ssh/github_actions_key
```

**IMPORTANTE:** Copie TODA a chave privada, incluindo:
```
-----BEGIN OPENSSH PRIVATE KEY-----
[todo o conteúdo]
-----END OPENSSH PRIVATE KEY-----
```

### 2. Configurar Secrets no GitHub

1. Acesse seu repositório no GitHub
2. Vá em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione 3 secrets:

**Secret 1: VPS_HOST**
- Nome: `VPS_HOST`
- Valor: IP da sua VPS (ex: `123.45.67.89`)

**Secret 2: VPS_USER**
- Nome: `VPS_USER`
- Valor: `root`

**Secret 3: VPS_SSH_KEY**
- Nome: `VPS_SSH_KEY`
- Valor: Cole a chave privada completa que você copiou no passo 1

### 3. Configurar Permissões do Script

```bash
# Conectar na VPS
ssh root@seu-ip-da-vps

# Dar permissão de execução
chmod +x /opt/app/deploy.sh

# Permitir que root execute deploy.sh sem senha (opcional)
# Isso é necessário porque o script usa sudo
visudo

# Adicionar no final do arquivo:
root ALL=(ALL) NOPASSWD: /opt/app/deploy.sh
```

Salve (Ctrl+O, Enter, Ctrl+X)

### 4. Testar o Deploy Automático

Agora qualquer mudança no Lovable dispara o deploy automaticamente:

1. Faça uma mudança pequena no Lovable (ex: alterar um texto)
2. Aguarde 10-15 segundos
3. Vá no GitHub → **Actions** para ver o deploy rodando
4. Quando terminar (ícone ✅), sua aplicação estará atualizada!

## Monitorar Deploys

### Ver Status no GitHub
- Acesse: `https://github.com/seu-usuario/seu-repo/actions`
- Veja histórico de todos os deploys
- Clique em qualquer deploy para ver logs detalhados

### Ver Logs na VPS
```bash
# Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/app-error.log

# Status do Nginx
systemctl status nginx
```

## Solução de Problemas

### Deploy falha com "Permission denied"
```bash
# Verificar permissões do script
ls -la /opt/app/deploy.sh
chmod +x /opt/app/deploy.sh

# Verificar se chave SSH está correta
cat ~/.ssh/authorized_keys
```

### Deploy demora muito
- Verifique se a VPS tem recursos suficientes (RAM/CPU)
- Considere aumentar instância da VPS
- Verifique logs: `tail -f /var/log/nginx/error.log`

### GitHub Actions mostra erro de SSH
1. Verifique se copiou a chave privada COMPLETA
2. Verifique se o IP está correto no secret `VPS_HOST`
3. Teste conexão manual: `ssh -i ~/.ssh/github_actions_key root@SEU-IP`

## Deploy Manual (Quando Necessário)

Se preferir fazer deploy manual em algum momento:

```bash
ssh root@seu-ip-da-vps
cd /opt/app
./deploy.sh
```

## Desabilitar Deploy Automático

Para desabilitar temporariamente:

1. No GitHub: **Settings** → **Actions** → **General**
2. Em "Actions permissions", selecione "Disable actions"

Para reativar, selecione "Allow all actions"

## Segurança

✅ **Boas práticas implementadas:**
- Chave SSH dedicada apenas para GitHub Actions
- Secrets criptografados no GitHub
- Deploy roda como usuário específico (`appuser`)
- Logs de todos os deploys no GitHub

⚠️ **Recomendações adicionais:**
- Revogue a chave SSH se suspeitar de comprometimento
- Monitore logs regularmente
- Mantenha VPS atualizada: `apt update && apt upgrade`

## Recursos

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [SSH Action Plugin](https://github.com/appleboy/ssh-action)
- [Lovable + GitHub Integration](https://docs.lovable.dev/)
