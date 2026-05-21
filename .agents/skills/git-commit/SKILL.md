---
name: Padrões de Mensagens de Commit (Git/GitHub)
description: Esta skill define as melhores práticas para mensagens de commit no projeto Bolão Copa 2026, seguindo o padrão Conventional Commits para garantir um histórico claro e automatizável.
---
# Skill: Padrões de Mensagens de Commit (Git/GitHub)

Esta skill orienta a criação de mensagens de commit padronizadas, facilitando a leitura do histórico, a geração de changelogs e a integração contínua.

## 🏗️ Estrutura da Mensagem

O formato deve seguir o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### 1. Tipos de Commit (`<tipo>`)

- **feat**: Uma nova funcionalidade.
- **fix**: Correção de um bug.
- **docs**: Alterações apenas na documentação.
- **style**: Alterações que não afetam o significado do código (espaço em branco, formatação, falta de ponto e vírgula, etc).
- **refactor**: Uma alteração de código que não corrige um bug nem adiciona uma funcionalidade.
- **perf**: Uma alteração de código que melhora o desempenho.
- **test**: Adição de testes ausentes ou correção de testes existentes.
- **build**: Alterações que affectam o sistema de build ou dependências externas (ex: gulp, npm).
- **ci**: Alterações em nossos arquivos e scripts de configuração de CI (ex: GitHub Actions).
- **chore**: Outras alterações que não modificam os arquivos `src` ou `test`.
- **revert**: Reverte um commit anterior.

### 2. Escopo (`<escopo>`)

O escopo é opcional e deve indicar a parte do sistema afetada (ex: `web`, `firebase`, `rules`, `auth`, `predictions`, `admin`, `docs`).

### 3. Descrição (`<descrição>`)

- **Idioma**: A mensagem deve ser escrita **exclusivamente em inglês**.
- Use o **imperativo** (ex: "add feature" em vez de "added feature" ou "adds feature").
- Não coloque ponto final ao final da frase.
- Use letras minúsculas no início da descrição.

---

## 🚀 Melhores Práticas

### 1. Mensagens Curtas e Claras
- Tente manter a primeira linha com menos de 50 caracteres.
- Se precisar de mais detalhes, use o corpo da mensagem (separado por uma linha em branco).

### 2. Breaking Changes
- Indique mudanças que quebram a compatibilidade com `!` após o tipo/escopo ou com `BREAKING CHANGE:` no rodapé.
- Exemplo: `feat(api)!: remove deprecated endpoint`

### 3. Referenciar Issues
- No rodapé, referencie issues do GitHub para fechá-las automaticamente.
- Exemplo: `Fixes #123` ou `Closes #456`

---

## 🔍 Exemplos

Consulte a lista completa de exemplos em [commit-examples.md](examples/commit-examples.md).

---

## Como usar esta skill

Sempre que for realizar um commit ou quando solicitado para sugerir mensagens de commit, utilize:
*"Sugira uma mensagem de commit seguindo os padrões definidos na skill git-commit."*
