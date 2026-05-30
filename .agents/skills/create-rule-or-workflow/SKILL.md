---
name: Criar Regra ou Workflow
description: Esta skill orienta a criação de Regras (.md em .agents/rules) e Workflows (.md em .agents/workflows) para padronizar o comportamento do agente e automatizar tarefas repetitivas no ecossistema Bolão Copa 2026.
---

# Skill: Criar Regra ou Workflow

Esta skill fornece as diretrizes para estender as capacidades do agente através de **Regras** (instruções de comportamento) e **Workflows** (sequências de passos estruturadas).

## 🛠️ Regras (Rules)

As regras são restrições ou guias de estilo que o agente deve seguir.

- **Localização:** `.agents/rules/<nome-da-regra>.md`
- **Formato:** Markdown padrão.
- **Limite:** 12.000 caracteres por arquivo.
- **Uso:** Podem ser "Always On" (sempre ativas), ativadas por "Model Decision" ou mencionadas manualmente via `@`.

### Estrutura de uma Regra
```markdown
# [Nome da Regra]

[Descrição clara do comportamento esperado]

## Diretrizes
- [Diretriz 1]
- [Diretriz 2]

## Exemplos (Opcional)
...
```

---

## 🔄 Workflows

Os workflows são sequências de prompts/passos para realizar tarefas complexas ou repetitivas.

- **Localização:** `.agents/workflows/<nome-do-workflow>.md`
- **Formato:** Markdown padrão.
- **Limite:** 12.000 caracteres por arquivo.
- **Invocação:** Executado via comando de barra: `/nome-do-workflow`.

### Estrutura de um Workflow
```markdown
# Workflow: [Nome]

[Descrição do que este workflow realiza]

## Passos
1. [Primeiro passo ou prompt]
2. [Segundo passo ou prompt]
...
```

---

## ⚡ Anotações Especiais (Turbo)

Para workflows que envolvem execução de comandos via `run_command`, existem anotações que permitem a execução automática (SafeToAutoRun):

- `// turbo`: Colocada acima de um passo específico para permitir que o agente execute o comando sem pedir aprovação (apenas para aquele passo).
- `// turbo-all`: Colocada em qualquer lugar do arquivo para permitir que **todos** os comandos do workflow sejam executados automaticamente.

> [!CAUTION]
> Use `// turbo` com extrema cautela. Apenas para comandos seguros e determinísticos.

---

## 🚀 Fluxo de Criação

1.  **Identificar a Necessidade:**
    - É uma instrução de estilo ou comportamento constante? Use uma **Regra**.
    - É um processo passo a passo para uma tarefa? Use um **Workflow**.
2.  **Criar o Arquivo:**
    - Regra: `.agents/rules/minha-regra.md`
    - Workflow: `.agents/workflows/meu-workflow.md`
3.  **Definir o Conteúdo:** Escreva de forma clara e acionável.
4.  **Testar:**
    - Para Regras: Pergunte ao agente algo relacionado à regra e veja se ele a segue.
    - Para Workflows: Digite `/nome-do-workflow` e valide a execução.

## 💡 Melhores Práticas

- **Atomicidade:** Cada regra ou workflow deve focar em um único objetivo.
- **Clareza:** Use listas e negrito para destacar pontos cruciais.
- **Contexto:** Se uma regra depende de outra, use `@caminho/para/outra_regra.md` para incluí-la.
- **Nomenclatura:** Use nomes em kebab-case (ex: `padrao-de-estilo-css.md`).
