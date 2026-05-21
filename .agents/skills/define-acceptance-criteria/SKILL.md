---
name: Definição de Critérios de Aceitação
description: Esta skill orienta a criação de critérios de aceitação objetivos e testáveis, garantindo que o time saiba exatamente o que precisa ser entregue para que uma funcionalidade seja aceita.
---
# Skill: Definição de Critérios de Aceitação

Critérios de Aceitação (AC) definem as condições que um produto deve satisfazer para ser aceito por um usuário, cliente ou outro sistema.

## 🏗️ Estrutura dos Critérios

Existem dois formatos recomendados:

### 1. Checklist de Regras (Funcional)
Lista direta de condições que devem ser verdadeiras.
- O usuário deve conseguir logar com e-mail e senha.
- O campo de senha deve ser mascarado.
- O botão "Entrar" deve estar desabilitado se os campos estiverem vazios.

### 2. Formato Gherkin (Cenários)
Ideal para testes automatizados e clareza de comportamento.
- **Dado** (Given): O contexto inicial.
- **Quando** (When): A ação realizada.
- **Então** (Then): O resultado esperado.

---

## 🚀 Melhores Práticas

- **Seja Específico**: Evite "o sistema deve ser rápido". Prefira "a busca deve retornar resultados em menos de 2 segundos".
- **Foque no Resultado, não na Implementação**: Diga *o que* acontece, não *como* o código faz.
- **Cubra o Fluxo de Erro**: Inclua critérios para o que acontece quando algo dá errado.
- **Testabilidade**: Se você não consegue pensar em um teste para validar o critério, ele precisa ser reescrito.

---

## 🔍 Exemplos de Critérios

Consulte diversos exemplos de critérios de aceitação em [acceptance-criteria-examples.md](examples/acceptance-criteria-examples.md).

---

## Como usar esta skill

Sempre que precisar detalhar o "Done" de uma funcionalidade, utilize:
*"Defina os critérios de aceitação seguindo os padrões da skill define-acceptance-criteria para: [funcionalidade/user story]"*
