---
name: Boas Práticas de Vanilla JS/CSS
description: Esta skill define padrões de design, estruturação CSS e encapsulamento JavaScript para manter o arquivo único index.html do Bolão Copa 2026 limpo e manutenível.
---
# Skill: Boas Práticas de Vanilla JS/CSS

Esta skill orienta a manutenção visual e lógica de aplicações de página única (SPA) implementadas em arquivo único (`index.html`), garantindo responsividade, legibilidade e performance.

## 🎨 Padrões de CSS (Estilização)

### 1. Sistema de Cores e Temas
- **Tema Escuro (Dark Mode):** O tema padrão deve ser escuro, utilizando as variáveis CSS declaradas no `:root`:
  - `--bg`: Cor de fundo principal (`#080808`).
  - `--card`: Fundo dos cards principais (`#111`).
  - `--border`: Borda dos elementos (`#242424`).
  - `--gold`/`--gold2`: Destaque em ouro (`#c9a84c` / `#e8c96a`).
- **Unidades de Negócio:** Cores de destaque para cada unidade Anytools devem ser respeitadas (ex: verde para Koncili, laranja para Anymarket).

### 2. Responsividade (Layouts)
- **Flexbox & Grid:** Utilizar layouts fluidos com `flex` e `grid` em vez de larguras fixas em pixels (`px`).
- **Media Queries:** Garantir compatibilidade com telas menores (smartphones de 320px de largura até desktops de 1080px+). Exemplo:
  ```css
  @media(max-width: 580px) {
    .mc { grid-template-columns: 1fr auto 1fr; }
    .nb { padding: 4px 7px; font-size: .6rem; }
  }
  ```

---

## ⚡ Estruturação de JavaScript (Vanilla JS Módulo)

### 1. Escopo Encapsulado (`type="module"`)
- Toda a lógica do Firebase e variáveis de estado da aplicação devem rodar dentro de um script com `type="module"`.
- Evite declarar variáveis globais soltas. Mantenha o estado da aplicação em um escopo controlado.

### 2. Exposição Controlada para Eventos Inline
- Eventos chamados direto no HTML (ex: `onclick="GT('ranking')"`) exigem que a função correspondente esteja registrada no escopo global (`window`).
- Ao expor funções, faça de forma explícita no fim do script ou ao declará-las:
  ```javascript
  window.doLogin = async () => { ... };
  window.SP = async (mid) => { ... };
  ```

### 3. Manipulação de DOM Limpa
- Utilize seletores claros e eficientes como `document.getElementById` (ou a função simplificada `$(id)`).
- Ao concatenar strings HTML para inserção dinâmica, garanta que os dados inseridos (como nomes de usuários) sejam tratados ou venham de fontes confiáveis para evitar XSS.
- Prefira construir strings limpas usando Template Literals (crases) para renderização de cards e tabelas.

---

## 🚀 Como usar esta skill
Sempre que for modificar o HTML/CSS ou JavaScript do front-end do Bolão, chame:
*"Siga os padrões de Vanilla JS/CSS descritos na skill web-styling-standards para essa modificação."*
