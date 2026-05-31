---
name: github-pages-publish
description: Faz a publicação do site através da execução do yarn build e em seguida o yarn deploy.
---

# Skill: github-pages-publish

Esta skill orienta o processo de build e publicação do site estático no GitHub Pages utilizando o gerenciador de pacotes Yarn.

## 📋 Pré-requisitos

Antes de iniciar a publicação, certifique-se de que:
1. O repositório está limpo (sem modificações não salvas).
2. As dependências do projeto estão atualizadas (`yarn install`).
3. Não há erros de compilação ou linting ativos (`yarn lint`).

## 🚀 Fluxo de Publicação

Para publicar o site atualizado no GitHub Pages, siga os passos abaixo:

### 1. Construir o Projeto
Execute o comando de build para gerar os arquivos estáticos de produção na pasta `dist/`:

```bash
yarn build
```

> [!NOTE]
> O comando acima compila a aplicação React/TypeScript via Vite. Certifique-se de verificar o output no console para garantir que nenhum erro de build ou de tipos do TypeScript ocorra.

### 2. Implantar no GitHub Pages
Execute o comando de deploy para empurrar o diretório `dist/` para a branch `gh-pages` do repositório remoto:

```bash
yarn deploy
```

> [!IMPORTANT]
> O script `deploy` configurado no `package.json` utiliza a biblioteca `gh-pages` com o argumento `-d dist` para publicar a pasta gerada pelo build. O projeto possui um domínio customizado definido em `homepage` no `package.json` (`https://bolacopa2026.app.br`).

## ⚠️ Resolução de Problemas Comuns

- **Falha no Build:** Se o build falhar devido a erros de tipagem do TypeScript, corrija os erros nos arquivos `.ts`/`.tsx` antes de tentar novamente.
- **Falha de Permissão no Deploy:** Certifique-se de que a sua chave SSH ou credenciais de acesso ao GitHub possuem permissões de escrita na branch `gh-pages` do repositório `jocimarspi/copa2026-bolao`.
