---
name: Refinamento de Itens do Backlog
description: Esta skill auxilia no processo de análise e refinamento de requisitos, ajudando a identificar ambiguidades, dependências e riscos antes do início do desenvolvimento.
---
# Skill: Refinamento de Itens do Backlog

O objetivo desta skill é garantir que um item do backlog esteja "Pronto para Desenvolvimento" (Definition of Ready), minimizando bloqueios e retrabalho.

## 🔍 Processo de Refinamento

Ao analisar uma funcionalidade ou tarefa, considere os seguintes pilares:

### 1. Ambiguidade e Clareza
- A necessidade está clara para quem vai desenvolver?
- Existem termos técnicos ou de negócio que precisam de definição?
- O objetivo final (o "porquê") está explícito?

### 2. Casos de Borda (Edge Cases)
- O que acontece se o usuário perder a conexão?
- E se os dados inseridos forem inválidos ou estiverem vazios?
- Como o sistema se comporta em cenários de erro da API?

### 3. Dependências e Impactos
- Esta tarefa depende de outra funcionalidade ainda não concluída?
- Existem impactos em outras áreas do sistema (ex: mudança no banco de dados que afeta a SPA)?
- Requer alterações em serviços de terceiros (ex: Firebase, API-Sports)?

---

## ✅ Checklist "Definition of Ready" (DoR)

Um item é considerado refinado quando:
- [ ] Possui uma User Story clara.
- [ ] Possui Critérios de Aceitação testáveis.
- [ ] Mockups ou fluxos de UI estão anexados (se aplicável).
- [ ] Dependências técnicas foram identificadas e discutidas.
- [ ] O time de desenvolvimento compreende o que deve ser feito.

---

## 🚀 Como Refinar

Ao usar esta skill, o analista deve:
1.  **Questionar o "Caminho Feliz"**: "E se o usuário clicar duas vezes?"
2.  **Validar Regras de Negócio**: "Usuários sem convite podem fazer palpites?"
3.  **Identificar Requisitos Não Funcionais**: "Qual a performance esperada para esta busca?"

---

## Como usar esta skill

Sempre que precisar refinar uma ideia ou tarefa bruta, utilize:
*"Refine o seguinte item do backlog utilizando a skill refine-backlog-item: [descrição da tarefa]"*
