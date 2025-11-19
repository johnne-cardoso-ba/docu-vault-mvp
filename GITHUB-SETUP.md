# Guia de Configuração do GitHub com Lovable

## Como Conectar ao GitHub

### Passo 1: Conectar no Lovable

1. No editor do Lovable, procure o botão **GitHub** no canto superior direito
2. Clique em **Connect to GitHub**
3. Você será redirecionado para o GitHub para autorizar o Lovable GitHub App
4. Autorize o acesso à sua conta ou organização

### Passo 2: Criar Repositório

1. Após autorizar, retorne ao Lovable
2. Clique em **Create Repository**
3. O Lovable criará automaticamente um novo repositório no GitHub com todo seu código

### Passo 3: Verificar Sincronização

✅ A partir de agora, qualquer mudança que você fizer no Lovable será **automaticamente enviada para o GitHub**

✅ Se você fizer mudanças diretamente no GitHub (via editor web ou push local), elas serão **automaticamente sincronizadas no Lovable**

## Sincronização Bidirecional Automática

### Do Lovable para o GitHub
- Todas as suas edições no Lovable são commitadas automaticamente
- Você não precisa fazer "push" manual
- Os commits são feitos em tempo real

### Do GitHub para o Lovable
- Se você clonar o repositório localmente e fazer push
- Se alguém fizer um pull request e você aceitar
- Se você editar diretamente no GitHub
- **Tudo sincroniza automaticamente no Lovable**

## Trabalhando Localmente (Opcional)

Se quiser trabalhar localmente também:

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio

# Instale dependências
npm install

# Rode localmente
npm run dev

# Faça suas mudanças, commit e push
git add .
git commit -m "Minhas mudanças"
git push origin main
```

As mudanças aparecerão automaticamente no Lovable! 🎉

## Branches (Experimental)

O Lovable tem suporte **experimental** limitado para branches do Git:

### Como Habilitar

1. Vá em **Account Settings** > **Labs**
2. Ative **GitHub Branch Switching**

### Limitações

- O suporte é experimental e limitado
- Nem todas as funcionalidades de branches são suportadas
- Recomendado apenas para usuários avançados

## Deploy na VPS

Depois de conectar ao GitHub, siga o guia em `DEPLOY.md` para configurar o deploy automático na sua VPS Hetzner.

## Troubleshooting

### "Não consigo conectar ao GitHub"
- Certifique-se de que você tem permissões na conta/organização do GitHub
- Tente desconectar e reconectar
- Verifique se o Lovable GitHub App está autorizado em: https://github.com/settings/installations

### "Minhas mudanças não aparecem no GitHub"
- Aguarde alguns segundos, a sincronização é quase instantânea mas pode ter um pequeno delay
- Verifique se você está conectado olhando o indicador no botão do GitHub
- Tente fazer uma pequena mudança para forçar um commit

### "Mudanças do GitHub não aparecem no Lovable"
- Aguarde alguns minutos para a sincronização
- Atualize a página do Lovable
- Verifique se o webhook do GitHub está ativo no repositório

## Próximos Passos

Após conectar ao GitHub:

1. ✅ Seu código está seguro e versionado
2. 📝 Siga o `DEPLOY.md` para fazer deploy na VPS
3. 🚀 Configure o script automático de deploy
4. 🔒 Configure SSL com Let's Encrypt

## Recursos

- [Documentação Lovable - GitHub](https://docs.lovable.dev/)
- [GitHub - Sobre Apps](https://docs.github.com/en/apps)
- Suporte: discord.lovable.dev
