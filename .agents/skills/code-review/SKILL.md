---
name: Revisão de Código e Qualidade Arquitetural
description: Esta skill define os critérios para revisão de código no projeto Bolão Copa 2026, garantindo excelência técnica, segurança e manutenibilidade em aplicações web SPA de arquivo único.
---
# Skill: Revisão de Código e Qualidade Arquitetural

Esta skill define os critérios para revisão de código no projeto Bolão Copa 2026, garantindo excelência técnica, segurança e manutenibilidade.

## 🧱 Princípios Fundamentais

### 1. KISS (Keep It Simple, Stupid)
- O código resolve o problema de forma direta? 
- Evite abstrações prematuras ou "over-engineering". Como é uma SPA em arquivo único, simplicidade é essencial para leitura.

### 2. Clean Code
- **Nomes Significativos:** Variáveis e funções devem revelar sua intenção (ex: `renderLeaderboard` em vez de `drawData`).
- **Funções Pequenas:** Funções e componentes devem ter escopo reduzido e fazer apenas uma coisa.
- **Comentários:** Devem explicar o "porquê", não o "como" (o código deve ser autoexplicativo).

### 3. Organização em Arquivo Único (SPA)
- **Separação de Preocupações:** Manter CSS na tag `<style>` e lógica JS na tag `<script type="module">`.
- **CSS Vanilla Semântico:** Uso de variáveis CSS (`:root`) para o design system, mantendo consistência de cores, fontes e espaçamentos.
- **Evitar Poluição Global:** Utilizar escopo de módulo do ES6 (`type="module"`) para encapsular funções e estado do aplicativo, registrando no objeto `window` apenas o que for estritamente acionado por eventos inline (ex: `onclick`).

---

## 💻 Boas Práticas: Frontend Web (HTML / CSS / JS)

- **Semântica HTML5:** Utilização correta de tags estruturais (`<header>`, `<main>`, `<nav>`, `<section>`).
- **Responsividade:** Garantir que o design (CSS flexbox/grid) se adapte perfeitamente a dispositivos móveis e desktops.
- **Performance de Renderização:** Atualizações de DOM devem ser pontuais e otimizadas. Limpar ou reutilizar elementos para evitar lentidão.

---

## 🔥 Boas Práticas: Integração com Firebase & API-Sports

- **Políticas de Acesso:** Garantir que toda gravação e leitura crítica passe pelas regras de segurança do Firestore (Auth ativo).
- **Gerenciamento de Cotas:** Mecanismos de trava/lock locais ou no banco (como a trava horária do `apifetch`) para evitar chamadas duplicadas à API externa API-Sports.
- **Listeners Ativos:** Certificar-se de que os listeners (`onSnapshot`) atualizam a UI de forma reativa e não criam concorrência desnecessária.

---

## 🔍 Checklist de Revisão (Guia Rápido)
Utilize o [code-review-checklist.md](resources/code-review-checklist.md) para garantir a qualidade arquitetural e técnica.

## Como usar esta skill
Sempre que uma tarefa for concluída, execute o comando:
*"Revise o código desenvolvido com base na skill de Code Review."*
