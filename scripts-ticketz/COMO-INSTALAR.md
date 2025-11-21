# Como Instalar o Ticket Z do Zero

## 📝 Pré-requisitos (FAÇA PRIMEIRO!)

### 1. Configure o DNS
No seu provedor de domínio (Registro.br, etc), adicione:

```
Tipo: A
Nome: wp
Valor: [IP da sua VPS]

Tipo: A
Nome: api  
Valor: [IP da sua VPS]
```

**Aguarde 5-10 minutos** para o DNS propagar.

---

## 🚀 Instalação (3 comandos)

### 1. Conecte na VPS
```bash
ssh root@seu-ip-vps
```

### 2. Copie o script para a VPS
```bash
nano instalar-limpo.sh
```

**Cole o conteúdo completo do arquivo `scripts-ticketz/instalar-limpo.sh` deste projeto**

Depois salve:
- Pressione `Ctrl+O` (salvar)
- Pressione `Enter` (confirmar)
- Pressione `Ctrl+X` (sair)

Dê permissão de execução:
```bash
chmod +x instalar-limpo.sh
```

### 3. Execute
```bash
sudo bash instalar-limpo.sh
```

**Aguarde 5-10 minutos...**

---

## ✅ Pronto!

Acesse:
- **Frontend**: https://wp.escrituraai.com.br
- **Backend**: https://api.escrituraai.com.br

**Login:**
- Email: `admin@ticketz.com`
- Senha: `123456`

**⚠️ Altere a senha imediatamente!**

---

## 🔍 O que o script faz automaticamente

1. ✅ Verifica DNS
2. ✅ Remove instalação antiga (faz backup antes)
3. ✅ Instala Docker e dependências
4. ✅ Clona Ticket Z
5. ✅ Configura domínios corretos
6. ✅ Configura Nginx
7. ✅ Configura SSL (https automático)
8. ✅ Inicia containers
9. ✅ Salva informações em `/root/ticketz-info.txt`

---

## ⚠️ Troubleshooting

### Erro: "DNS não configurado"
- Verifique se adicionou os registros A no provedor de domínio
- Aguarde mais tempo para propagação
- Execute novamente

### Erro: "Port already in use"
```bash
# Ver o que está usando as portas
netstat -tulpn | grep -E '3000|8080'
# Parar serviço conflitante
```

### Site não abre
```bash
# Ver logs
cd /opt/ticketz
docker compose logs -f

# Ver status
docker compose ps
```

### Reinstalar tudo
Basta executar o script novamente:
```bash
sudo bash instalar-limpo.sh
```

---

## 📋 Comandos Úteis

```bash
# Ver logs
cd /opt/ticketz && docker compose logs -f

# Reiniciar
cd /opt/ticketz && docker compose restart

# Parar
cd /opt/ticketz && docker compose down

# Iniciar
cd /opt/ticketz && docker compose up -d

# Status
cd /opt/ticketz && docker compose ps
```

---

## 💾 Backup

O script faz backup automático antes de remover instalação antiga.

Backups ficam em: `/root/backup-ticketz/`

---

## ℹ️ Informações Salvas

Todas as credenciais e informações ficam salvas em:
```bash
cat /root/ticketz-info.txt
```

---

## ✅ Sistemas Rodando

Após instalação você terá:

1. **Sistema Contabilidade**: app.escrituraai.com.br ✅
2. **Ticket Z Frontend**: wp.escrituraai.com.br ✅
3. **Ticket Z Backend**: api.escrituraai.com.br ✅

Todos funcionando sem conflitos! 🎉
