# Exemplos de User Stories (INVEST)

## Funcionalidades de Usuário (Bons Exemplos)
- **Filtro de Conteúdo**: "Como participante do bolão, eu quero filtrar a lista de jogos por grupo, para que eu possa localizar e palpitar nos jogos do Brasil mais facilmente."
- **Autenticação**: "Como colaborador convidado, eu quero entrar no bolão usando minha conta Google, para que eu não precise criar e lembrar de outra senha."
- **Histórico**: "Como participante, eu quero ver meus palpites e pontuações das rodadas anteriores, para que eu possa acompanhar meu desempenho ao longo da Copa."

## Erros Comuns (Maus Exemplos)
- **História Técnica**: "Como desenvolvedor, eu quero criar uma coleção 'results' no Firestore com índice no matchId, para que a leitura seja mais rápida."
  - *Correção*: Foque no benefício para o usuário (ex: "Como participante, eu quero que os resultados dos jogos sejam atualizados instantaneamente para ver minha pontuação subir...").
- **História Muito Grande (Epic)**: "Como participante, eu quero um sistema completo de liga com chats privados e fóruns de discussão no bolão."
  - *Correção*: Divida em histórias menores (ex: "Como participante, eu quero comparar meus pontos com meus colegas de unidade...", "Como participante, eu quero ver comentários dos outros participantes nos jogos...").
- **História sem Valor Claro**: "Como administrador, eu quero mudar a cor do botão de salvar palpite para dourado brilhante, para que o sistema fique diferente."
  - *Correção*: Explique o benefício (ex: "...para que o botão de salvar palpites fique mais destacado na tela, reduzindo a taxa de palpites esquecidos antes do bloqueio").
