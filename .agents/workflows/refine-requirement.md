---
title: Refinamento de Requisito
command: refine-requirement
type: workflow
description: Workflow para orquestrar o refinamento de requisitos entre PO e Analista de Negócio.
---

# Workflow: Refinamento de Requisito (/refine-requirement)

Este workflow orquestra as habilidades de PO e Analista de Negócio para transformar uma necessidade bruta em um item de backlog pronto para desenvolvimento.

## 🚀 Passos do Workflow

Ao ser acionado com o comando `/refine-requirement`, siga rigorosamente esta sequência:

1.  **Entendimento**: Peça ao usuário uma breve descrição da funcionalidade ou problema se ainda não tiver sido fornecida.
2.  **User Story**: Utilize as diretrizes da skill `write-user-story` para redigir a história no formato INVEST.
3.  **Refinamento Técnico e de Negócio**: Utilize a skill `refine-backlog-item` para listar casos de borda, dependências e possíveis riscos.
4.  **Critérios de Aceitação**: Utilize a skill `define-acceptance-criteria` para detalhar as condições de aceite (funcionais e Gherkin).
5.  **Validação Final**: Pergunte ao usuário se a definição está clara ou se deseja ajustar algum ponto.
6.  **Documentação**: Utilize a skill `document-specification` para salvar o refinamento no diretório `spec/` seguindo o padrão de nomenclatura.

## 🎯 Objetivo
Garantir que todos os itens passem por um crivo de qualidade de negócio antes de serem implementados, reduzindo retrabalho e desalinhamento.
