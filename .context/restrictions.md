# Restrições Técnicas, Proibições e Guias de Deploy

Este documento elenca as restrições rígidas de arquitetura, segurança e regras de negócio que devem ser seguidas e mantidas a todo custo, bem como as diretrizes para implantação.

## 1. Bloqueio da Janela de Palpites (Regra Rígida de Negócio)
- **Prazo Limite**: Os palpites individuais devem ser salvos, alterados ou removidos **até 30 minutos antes do início oficial** (kickoff) da partida.
- **Dupla Validação**:
  - **Interface**: Os campos de input de placar e os botões de exclusão de palpite (🗑️) devem ser automaticamente desabilitados no frontend.
  - **Banco de Dados (Firestore Rules)**: As regras em `firestore.rules` barram requisições de gravação (create, update, delete) feitas a menos de 30 minutos da data/hora oficial cadastrada na partida:
    ```javascript
    allow write: if request.auth != null 
      && request.auth.uid == userId
      && request.time < getKickoffTimestamp(matchId) - duration.value(30, 'm');
    ```

## 2. Regras de Pontuação e Classificação
O cálculo de pontos é fixado sob os seguintes critérios:
- **5 pontos**: Acerto exato do placar (ex: palpite 2x1, resultado oficial 2x1).
- **3 pontos**: Acerto do desfecho do jogo (vitória de A, vitória de B ou empate), mas com gols errados (ex: palpite 3x1, resultado oficial 1x0).
- **0 pontos**: Erro completo do resultado.
- **Partidas de Teste**: Partidas com o atributo `test: true` na coleção `matches` não devem somar pontos no ranking oficial.

### Critérios de Desempate da Classificação
Caso dois ou mais participantes possuam a mesma pontuação, o desempate é feito de forma determinística seguindo esta hierarquia:
1. **Pontos Totais** (mais pontos vence)
2. **Quantidade de Placares Exatos** (mais acertos de placar exato de 5 pontos vence)
3. **Quantidade de Acertos de Resultado** (mais acertos de resultado de 3 pontos vence)
4. **Quantidade de Erros** (menos erros / palpites com 0 pontos vence)
5. **Divisão de Posição**: Se o empate persistir em todos os critérios anteriores, os participantes compartilham a mesma posição (ex: dois em 1º lugar, e o próximo em 3º lugar).

## 3. Segurança e Acesso Administrativo
- **Bootstrap Admins**: Três contas iniciais (`luigi.gonzaga@db1.com.br`, `bruno.rossmann@db1.com.br`, `jocimar.huss@db1.com.br`) possuem permissões administrativas nativas no código e nas regras de segurança do banco.
- **Admins Dinâmicos**: A gravação de dados em coleções administrativas (`/matches`, `/results`, `/admins`, `/businessUnits`, `/torneio/matamata`) é restrita a e-mails contidos no Bootstrap ou presentes na coleção `/admins/{email}`.
- **Segurança de API**: As chaves privadas de APIs externas (como a do Football-Data.org) nunca devem ser expostas no código do frontend (SPA) compilado. A consulta deve ser feita inteiramente no backend via Cloud Functions, e a chave configurada de forma segura nas variáveis de ambiente.

## 4. Diretrizes de Código e Interface
- **Estilização**: Uso exclusivo de CSS Vanilla customizado no arquivo `/src/index.css`. Frameworks como Tailwind CSS são proibidos a menos que haja solicitação explícita do usuário.
- **Preservação de Layout**: O tema dark premium e a paleta de cores dos ecossistemas corporativos devem ser mantidos sem alterações que quebrem a consistência visual.
- **Internacionalização (i18n)**: Todas as strings do sistema devem passar pelo dicionário de traduções (`src/i18n-dictionary.ts`) cobrindo Português, Inglês e Espanhol.

---

## 5. Instruções de Execução Local e Deploy

### Execução Local:
1. Navegue até a pasta do projeto:
   ```bash
   cd /home/jocimar/Lab/copa2026-bolao
   ```
2. Instale as dependências:
   ```bash
   yarn install
   ```
3. Inicie o servidor Vite:
   ```bash
   yarn dev
   ```

### Deploy do Frontend (GitHub Pages):
Para realizar o build e o deploy do frontend SPA:
```bash
yarn deploy
```
*Isso executa o `yarn build` e envia a pasta `dist/` para a branch `gh-pages`.*

### Deploy para o Firebase (Regras e Cloud Functions):
Para implantar as regras de segurança do Firestore e as Cloud Functions no Firebase:

1. Navegue até o diretório `firebase/` na raiz do projeto:
   ```bash
   cd /home/jocimar/Lab/copa2026-bolao/firebase
   ```
2. Certifique-se de estar autenticado na sua conta do Firebase:
   ```bash
   npx firebase login
   ```
3. Verifique ou selecione o projeto ativo correto (`copa2026-bolao-d6e2a`):
   ```bash
   npx firebase use default
   ```
4. **Configuração de Variáveis de Ambiente**:
   Certifique-se de que a chave da API do Football-Data.org esteja configurada no arquivo `.env` localizado dentro de `firebase/functions/`:
   ```env
   FOOTBALL_DATA_API_KEY=sua_chave_aqui
   ```
5. Execute o deploy de todos os recursos (regras e funções):
   ```bash
   npx firebase deploy
   ```
   *Ou implante componentes específicos separadamente:*
   - Apenas regras do Firestore: `npx firebase deploy --only firestore:rules`
   - Apenas Cloud Functions: `npx firebase deploy --only functions`
