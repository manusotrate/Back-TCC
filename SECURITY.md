# Segurança e passos para remover credenciais do repositório

Este projeto continha um arquivo `.env` com credenciais para o Mercado Pago. Para evitar vazamento, siga os passos abaixo localmente e em produção.

1) Remover `.env` do controle do Git (mantém o arquivo local, remove o rastreio):

```bash
# no diretório Back-TCC
git rm --cached .env
git commit -m "Remove .env from repository"
git push origin <sua-branch>
```

2) Opcional — remover da história do Git (apenas se a credencial já vazou publicamente):

Usar BFG (recomendado) ou git filter-branch. Exemplo com BFG:

```bash
# instale BFG e rode:
bfg --replace-text passwords.txt
# ou usar git filter-repo / filter-branch conforme documentação
```

3) Rotacionar chaves no Mercado Pago

- Entre no painel do Mercado Pago e revogue/gere uma nova chave de acesso (Access Token).
- Atualize a nova chave no ambiente do servidor (variáveis de ambiente no host/container), NÃO no repo.

4) Configurar variáveis de ambiente no servidor/host

- Em produção, coloque as variáveis no provedor (ex.: Heroku Config Vars, Vercel Environment Variables, Azure App Settings, etc.)
- Nunca commit `.env` em repositórios públicos.

5) Boas práticas adicionais

- Use um gerenciador de segredos (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault) para ambientes críticos.
- Revise logs para garantir que nenhum valor sensível (token, CPF, PAN, CVV) é impresso. Este repositório já teve sanitização aplicada nos logs de pagamento.
- Defina `JWT_SECRET` forte e com expiração apropriada para tokens.

6) Gerar e aplicar `WEBHOOK_SECRET` (exemplo local)

- Para gerar um segredo forte localmente (Node.js):

```bash
# no diretório Back-TCC
node scripts/generate-webhook-secret.js
```

- O script imprime o segredo e sugere como setar no PowerShell ou adicionar ao `.env` local. Exemplo PowerShell (não commite `.env`):

```powershell
$env:WEBHOOK_SECRET = "VALOR_GERADO"
```

- Para produção, configure `WEBHOOK_SECRET` nas variáveis do ambiente do seu provedor (Heroku/PM2/Docker secrets, etc.).

7) Remoção segura de segredos já comitados

- Se uma chave real vazou e foi enviada ao repositório remoto, seguir as instruções com BFG/git-filter-repo e rotacionar imediatamente as chaves no provedor.

Se quiser, eu executo os comandos Git para você (preciso de permissão para rodar no seu ambiente). Caso prefira executar, envie `ok` que eu forneço os comandos prontos e explico cada passo.

### Comandos prontos (exemplo)

Se quiser que eu execute localmente, rode estes comandos no diretório `Back-TCC`:

```powershell
# 1) Garantir que .env não seja mais versionado
git rm --cached .env
git commit -m "chore: remove .env from repo"
git push origin main

# 2) Gerar novo segredo e exportar localmente (PowerShell)
node scripts/generate-webhook-secret.js
# use o valor impresso para setar no PowerShell:
$env:WEBHOOK_SECRET = "VALOR_GERADO"

# 3) Atualize sua configuração no provedor (Heroku/Vercel/Azure) com o mesmo valor
```
