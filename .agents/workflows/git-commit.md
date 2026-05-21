---
title: Commit Padronizado
command: git-commit
type: workflow
description: Workflow para realizar commits seguindo o padrão Conventional Commits do projeto Bolão Copa 2026.
---

# Workflow: Commit Padronizado (/git-commit)

Este workflow automatiza o processo de criação de mensagens de commit e a execução do comando git, garantindo que o histórico do projeto seja mantido limpo e padronizado.

## 🚀 Passos do Workflow

Ao ser acionado com o comando `/git-commit`, siga rigorosamente esta sequência:

1.  **Análise de Alterações**: Analise os arquivos modificados. Use `git status` e `git diff --cached` para entender o que está sendo commitado.
2.  **Identificação de Escopo**: Identifique a área afetada (ex: `web`, `firebase`, `rules`, `auth`, `predictions`, `admin`, `docs`).
3.  **Formulação da Mensagem**: Utilize as diretrizes da skill `git-commit` para formular uma mensagem no padrão Conventional Commits.
4.  **Sugestão ao Usuário**: Apresente a mensagem sugerida ao usuário e peça confirmação ou ajustes.
5.  **Execução do Commit**:
    // turbo
    - Após a aprovação do usuário, execute o comando: `git commit -m "[mensagem_aprovada]"`.
6.  **Finalização**: Confirme que o commit foi realizado e pergunte se o usuário deseja realizar o `push`.

## 🎯 Objetivo
Garantir que todas as alterações no ecossistema Bolão Copa 2026 possuam um histórico rastreável, profissional e compatível com ferramentas de automação.
