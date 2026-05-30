# Exemplos de Critérios de Aceitação

## 1. Envio de Palpite (Misto)
- **AC 1**: O usuário só pode salvar palpites que sejam números inteiros maiores ou iguais a zero.
- **AC 2**: O sistema deve salvar o palpite no Firestore e exibir um toast visual de "Palpite salvo!" em caso de sucesso.
- **AC 3 (Gherkin - Cenário de Bloqueio)**:
    - **Dado** que faltam menos de 5 minutos para o início do jogo (kickoff)
    - **Quando** visualizo a linha do jogo no bolão
    - **Então** os campos de input de gols devem estar desabilitados (readonly) e o status do jogo deve ser exibido como "Bloqueado".

## 2. Cadastro via Convite (Checklist)
- O sistema deve validar se o token de convite informado na URL existe na coleção `invites` e está associado ao e-mail inserido.
- A senha deve conter no mínimo 6 caracteres (restrição padrão do Firebase Auth).
- Se o convite for válido, o sistema cria o usuário no Firestore vinculando-o à sua respectiva `unit` (unidade cadastrada no convite).
- Após o sucesso do login, o usuário deve ser redirecionado para o painel principal do bolão.

## 3. Busca/Filtro de Ranking por Nome (Gherkin - Fluxo Feliz)
- **Dado** que estou visualizando a tela de classificação geral
- **Quando** digito parte do nome de um colega no campo de busca
- **Então** o ranking deve filtrar em tempo real mostrando apenas os participantes cujo nome corresponda à busca.
- **E** a média da unidade não deve ser afetada por essa busca visual.
