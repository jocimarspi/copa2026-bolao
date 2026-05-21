---
name: Análise e Correção de Bugs (Bolão Copa 2026)
description: Esta skill orienta o diagnóstico e depuração de erros comuns na SPA (DOM, Eventos, ES Modules) e na integração com Firebase/Firestore e API-Sports.
---
# Skill: Análise e Correção de Bugs (Bolão Copa 2026)

Esta skill fornece diretrizes técnicas e ferramentas para identificar e resolver problemas rapidamente na SPA em arquivo único (`index.html`) e no banco Firestore do Bolão.

## 🔍 Erros Comuns e Como Corrigi-los

### 1. "Uncaught ReferenceError: [função] is not defined" (Eventos Inline)
- **Sintoma:** Ocorre quando uma ação HTML como `onclick="GT('ranking')"` falha porque a função `GT` está dentro de um `<script type="module">` e não está no escopo global.
- **Correção:** Exponha a função explicitamente no objeto `window`:
  ```javascript
  window.GT = (tab) => { ... };
  ```

### 2. Falhas no Firestore ("FirebaseError: Missing or insufficient permissions")
- **Sintoma:** O usuário tenta salvar um palpite ou alterar um dado, mas a operação é rejeitada.
- **Causas possíveis:**
    - O usuário não está devidamente autenticado (Auth expirado).
    - As regras do Firestore (`firestore.rules`) bloqueiam a escrita fora do próprio UID ou após o prazo de kickoff do jogo.
- **Correção:** Auditar as regras utilizando a skill `review-firestore-rules` e garantir que o código envie as credenciais/UID corretos e dentro das validações de regras.

### 3. Falha de Atualização de Resultados (API-Sports)
- **Sintoma:** Os resultados não são atualizados automaticamente na tela.
- **Diagnóstico:**
    1.  Verificar o console do navegador por erros de rede ou CORS.
    2.  Verificar se a trava `/system/apifetch` no Firestore está travada com um timestamp que impede novas requisições (por exemplo, bloqueio de 1 hora ativo).
    3.  Verificar se a cota gratuita de 100 requisições diárias da API-Sports foi atingida.
- **Correção:** Ajustar os locks de horário ou sugerir cache manual caso a cota do cliente tenha estourado.

### 4. Layout Quebrado em Dispositivos Móveis
- **Sintoma:** Visual desconfigurado, elementos sobrepostos ou tabelas cortadas em telas de celular.
- **Correção:** Revisar as regras de estilo de responsividade utilizando a skill `web-styling-standards` e ajustar os grids (`grid-template-columns`) e flexbox para usar unidades relativas (`%`, `fr`, `rem`, `vh`/`vw`) em vez de larguras fixas.

---

## 🛠️ Técnicas de Depuração Recomendadas

1.  **Auditoria Visual da Árvore DOM:**
    - Examine se IDs dinâmicos estão sendo gerados corretamente (ex: `predictions-${matchId}`). IDs duplicados geram comportamento inesperado na manipulação via `document.getElementById`.
2.  **Scripts de Teste (Scratch Files):**
    - Para depurar lógicas complexas de cálculo de ranking ou pontuações sem afetar a UI, crie um arquivo na pasta `artifacts/scratch/` e teste isoladamente a função.
3.  **Logs Limpos:**
    - Utilize `console.warn` ou `console.error` para capturar exceções silenciosas nos blocos `try/catch` de chamadas do Firebase Auth e Firestore, facilitando a visualização dos erros pelo usuário.

---

## Como usar esta skill
Sempre que o usuário reportar uma falha de carregamento, erro de salvamento de palpites ou interface travada, execute:
*"Diagnostique o bug apresentado utilizando as técnicas da skill debug-and-fix."*
