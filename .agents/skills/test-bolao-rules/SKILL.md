---
name: Teste de Regras de Negócio do Bolão
description: Esta skill orienta a validação das regras de negócio do Bolão (como o cálculo de pontos de palpites: 5 pts para exato, 3 pts para resultado) e simulação de rodadas.
---
# Skill: Teste de Regras de Negócio do Bolão

Esta skill descreve o funcionamento e a validação lógica das regras de cálculo de pontos do Bolão Copa 2026, orientando como testar a coerência do sistema através de dados simulados (mocks).

## 🧮 Regras Lógicas de Pontuação

A pontuação de um palpite comparado com o resultado de um jogo segue a seguinte lógica:

1.  **Sinalizador de Resultado (`sgn(n)`):**
    - Retorna `1` se `n > 0` (Vitória do time de casa).
    - Retorna `-1` se `n < 0` (Vitória do time visitante).
    - Retorna `0` se `n == 0` (Empate).
2.  **Pontos Ganhos por Jogo:**
    - Se `palpite.home == resultado.home` AND `palpite.away == resultado.away` ➡️ **5 pontos** (Placar Exato).
    - Se `sgn(palpite.home - palpite.away) == sgn(resultado.home - resultado.away)` ➡️ **3 pontos** (Resultado Certo, Placar Errado).
    - Senão ➡️ **0 pontos** (Erro).
3.  **Filtragem de Rodadas de Teste:**
    - Qualquer jogo marcado com `test: true` ou pertencente a uma rodada de teste (ex: `g: "T"`) **não deve** ser contabilizado no cálculo do ranking geral.

---

## 🧪 Como Criar e Executar Testes de Regra de Negócio

Para testar a integridade lógica sem afetar o banco de dados de produção:
1.  Crie um script temporário em `artifacts/scratch/test-points.js`.
2.  Importe ou cole as funções matemáticas de cálculo (`pts` e `sgn`) extraídas do código da aplicação.
3.  Defina uma lista de casos de teste contendo:
    - O jogo real (se é teste ou oficial).
    - O palpite simulado.
    - O resultado simulado.
    - Os pontos esperados.
4.  Execute o script via Node.js localmente para validar.

### Exemplo de Script de Teste (`test-points.js`)

```javascript
// Função sgn e pts idênticas às da aplicação
const sgn = n => n > 0 ? 1 : n < 0 ? -1 : 0;

function calcularPontos(pred, r, isTestGame = false, incluirTeste = false) {
  if (isTestGame && !incluirTeste) return 0;
  if (!r || r.home === null) return 0;
  if (pred.home === r.home && pred.away === r.away) return 5;
  if (sgn(pred.home - pred.away) === sgn(r.home - r.away)) return 3;
  return 0;
}

// Casos de Teste
const tests = [
  { desc: "Placar Exato (5 pts)", pred: {home: 2, away: 1}, res: {home: 2, away: 1}, isTest: false, expected: 5 },
  { desc: "Resultado Certo, Gols Diferentes (3 pts)", pred: {home: 2, away: 1}, res: {home: 1, away: 0}, isTest: false, expected: 3 },
  { desc: "Empate Certo, Placar Diferente (3 pts)", pred: {home: 1, away: 1}, res: {home: 2, away: 2}, isTest: false, expected: 3 },
  { desc: "Erro Completo (0 pts)", pred: {home: 2, away: 1}, res: {home: 0, away: 2}, isTest: false, expected: 0 },
  { desc: "Jogo de Teste sem incluirTestes (0 pts)", pred: {home: 2, away: 1}, res: {home: 2, away: 1}, isTest: true, expected: 0 },
];

let failed = 0;
tests.forEach((t, i) => {
  const pts = calcularPontos(t.pred, t.res, t.isTest, false);
  if (pts !== t.expected) {
    console.error(`❌ Falha no Caso ${i + 1} (${t.desc}): Esperava ${t.expected}, obteve ${pts}`);
    failed++;
  } else {
    console.log(`✅ Caso ${i + 1} (${t.desc}) passou!`);
  }
});

process.exit(failed > 0 ? 1 : 0);
```

---

## 🚀 Como usar esta skill
Se houver alguma mudança nas regras de pontuação (ex: adição de pontos para vice-campeão, alteração de valores de acerto de resultado), execute:
*"Valide a lógica de cálculo de pontos do Bolão rodando o script de teste de regras de negócio."*
