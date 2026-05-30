---
title: Análise e Correção de Bugs
command: debug-and-fix
type: workflow
description: Workflow para ajudar a analisar, debugar e corrigir problemas no aplicativo SPA e banco Firestore do Bolão Copa 2026.
---

# Workflow: Análise e Correção de Bugs (/debug-and-fix)

Este workflow fornece um processo estruturado para diagnosticar falhas na SPA (`index.html`), nas regras do Firestore ou na integração de placares em tempo real.

## 🚀 Passos do Workflow

Ao ser acionado com o comando `/debug-and-fix`, siga rigorosamente a seguinte sequência:

1.  **Entendimento do Sintoma**: Peça ao usuário a descrição do erro, prints do console do navegador (se houver) ou comportamento inesperado observado.
2.  **Mapeamento de Código**: Identifique no arquivo `index.html` ou nas regras de segurança as funções, listeners do Firebase ou blocos de estilo CSS relacionados ao bug.
3.  **Investigação da Causa Raiz**:
    - Se for um erro visual/CSS, revise a responsividade e seletores.
    - Se for erro lógico/JS, verifique variáveis globais, concorrência ou escopo do módulo.
    - Se for falha no Firestore, verifique se o erro é de permissão negada (Security Rules) ou formato de dados.
    - Se for na API-Sports, valide a trava de lock (`/system/apifetch`) e chaves.
4.  **Criação de Diagnóstico Temporário (Opcional)**: Se necessário, crie um script em `artifacts/scratch/debug-helper.js` para simular chamadas ao Firebase ou simular o processamento de regras fora da produção.
5.  **Formulação e Execução da Correção**: Proponha as alterações necessárias no código e justifique a correção. Com a autorização, edite os arquivos correspondentes.
6.  **Validação**: Instrua o usuário como testar a correção localmente (com o servidor `npx serve` ativo).
7.  **Finalização**: Sugira o commit da alteração chamando o workflow `/git-commit`.

## 🎯 Objetivo
Garantir que as correções sejam efetuadas com foco na causa raiz, sem quebrar funcionalidades existentes da SPA ou violar regras de segurança do banco.
