# Contexto do Projeto: Bolão Copa 2026 (DB1 Group)

Este documento reúne todas as especificações técnicas, arquitetura de software, regras de negócio e informações de segurança do aplicativo **Bolão Copa 2026 - DB1 Group**.

---

## 1. Visão Geral do Aplicativo
O aplicativo é um **Bolão interno** exclusivo para colaboradores do grupo **DB1 Group** para a Copa do Mundo FIFA de 2026 (sediada nos EUA, Canadá e México).

- **Público-alvo**: Colaboradores de todas as unidades e ecossistemas de negócio do grupo (ex: *Koncili*, *Anymarket*, *Predize*, *Winnerbox*, *Marca Seleta*, *Holding*, etc.).
- **Modelo de Execução**: Single Page Application (SPA) construída em **React (v19)** com **TypeScript** e build orquestrado por **Vite**.
- **Hospedagem**: Implantado no GitHub Pages (`gh-pages`).
- **Backend/Banco de Dados**: Firebase (Authentication e Cloud Firestore).

---

## 2. Arquitetura do Sistema
O projeto foi migrado de uma estrutura em arquivo único para um projeto modularizado em React + TypeScript, garantindo manutenibilidade, segurança e tipagem estática.

### Estrutura de Diretórios
- **`src/main.tsx`**: Ponto de entrada do React.
- **`src/App.tsx`**: Componente principal e orquestrador das abas de navegação.
- **`src/components/`**: Componentes desacoplados para cada aba e seção:
  - `Header.tsx`: Cabeçalho unificado com seleção de idioma, resumo de pontos/ranking do usuário logado e menu de conta/admin.
  - `MatchesTab.tsx`: Listagem de partidas de teste e oficiais com entradas para palpites.
  - `LeaderboardTab.tsx`: Rankings gerais (Top 10) e ranking dinâmico de unidades de negócio.
  - `HistoryTab.tsx`: Histórico completo de palpites de outros usuários após o bloqueio de cada partida.
  - `AccountTab.tsx`: Edição do perfil do colaborador (Nome, Unidade de Negócio, Avatar de Emoji).
  - `AdminTab.tsx`: Painel de controle completo para administradores.
  - `FaqTab.tsx`: Perguntas frequentes e regras do bolão.
- **`src/contexts/`**: Provedores de estado global do React:
  - `AuthContext.tsx`: Autenticação e sincronização de perfil/nível de acesso de admin.
  - `DataContext.tsx`: Listeners em tempo real para as coleções do Firestore (`users`, `matches`, `results`, `businessUnits`, `predictions`).
  - `ModalContext.tsx`: Gerenciamento de modais globais.
- **`src/index.css`**: Estilização vanilla centralizada (design dark premium com suporte a cores temáticas por ecossistema).
- **`src/i18n.ts` & `src/i18n-dictionary.ts`**: Internacionalização (i18next) com suporte completo a Português, Inglês e Espanhol.

### Stack Tecnológica
- **Framework & Linguagens**: React 19, TypeScript 6, HTML5, CSS3 vanilla (estilização customizada).
- **Gerenciador de Pacotes**: Yarn (v3.8.7).
- **Ferramentas de Qualidade**: ESLint para linting e análise de código.
- **Serviços de Terceiros**:
  - **Firebase Web SDK v12**:
    - **Authentication**: Login e controle de sessão do usuário.
    - **Firestore Database**: Banco de dados relacional NoSQL em tempo real.
  - **API-Sports (Football)**: Sincronização e atualização de placares oficiais em tempo real.
  - **FlagCDN**: Renderização de bandeiras das seleções nos componentes visuais.

---

## 3. Funcionalidades Detalhadas

### 3.1. Controle de Acesso
- **Autenticação Corporativa (SSO)**: O acesso ao Bolão é restrito a colaboradores autenticados por Single Sign-On (SSO) via contas corporativas Microsoft (Entra ID) no Tenant ID `ea47001a-3428-40f3-8ea1-86bdb1a3bc84`.
- **Registro Automático**: No primeiro login, os dados do perfil (Nome, E-mail e Emoji padrão) são criados automaticamente a partir do SSO e o usuário é convidado a selecionar sua unidade corporativa na aba de Perfil para que possa participar dos rankings.

### 3.2. Regras e Janelas de Palpites
- **Acesso 24/7**: A antiga janela de palpites diária (05:00h às 12:30h BRT) foi removida. O sistema aceita a criação e modificação de palpites a qualquer hora do dia ou da noite.
- **Bloqueio por Partida**: O palpite individual de cada jogo é bloqueado de forma estrita **30 minutos antes do kickoff** (horário de início oficial do jogo). Fora deste prazo, o campo de palpite fica bloqueado para edição, exibindo um contador ou status correspondente.
- **Armazenamento**: Os palpites são salvos no Firestore sob o caminho `/users/{uid}/predictions/{matchId}`.

### 3.3. Sistema de Pontuação
- **5 pontos (Acerto Exato)**: O participante acerta o placar exato de ambos os times (ex: palpite 2x1, resultado oficial 2x1).
- **3 pontos (Acerto de Resultado)**: O participante acerta o vencedor ou o empate, mas erra o número de gols (ex: palpite 2x0, resultado oficial 1x0; ou palpite 1x1, resultado oficial 2x2).
- **0 pontos (Erro)**: Qualquer outro cenário de palpite incorreto.
- *Nota*: Rodadas classificadas como "Teste" (ex: `test: true`) são marcadas visualmente com uma borda roxa e **não são somadas** ao ranking geral de pontos.

### 3.4. Rankings
O aplicativo calcula e exibe dois rankings principais:
1. **Classificação Geral**: Lista dos 10 melhores usuários ordenada de forma decrescente pelo total de pontos acumulados.
2. **Ranking DB1 Group (Média por Unidade)**: Para manter a disputa justa entre unidades de tamanhos diferentes, calcula a **média de pontos por participante** daquela unidade específica (`soma dos pontos dos membros ativos / total de membros cadastrados da unidade`).
   - O cálculo das estatísticas das unidades é realizado de forma dinâmica no lado do cliente com base na lista de usuários ativos, atualizando dinamicamente as estatísticas e as cores temáticas de cada ecossistema:
     - **CHRISTIAN TECH** (ex: *Arvia*, *Mykids*, *Voluts*): Roxo (`#a855f7`)
     - **TECHFIN** (ex: *Consignet*, *Ducz*, *Flinke*, *Mixtra*): Verde (`#10b981`)
     - **DIGITAL TRANSFORMATION** (ex: *DB1 Global*, *Lughy*): Azul (`#3b82f6`)
     - **E-COMMERCE** (ex: *Anymarket*, *Koncili*, *Predize*, *Winnerbox*): Laranja (`#f47c20`)
     - **HOLDING** (ex: *Holding Shared Services*, *Holding INV*): Ciano (`#06b6d4`)
     - **DB1 LABS**: Rosa (`#ec4899`)

### 3.5. Sincronização de Resultados (API-Sports)
- O sistema possui um mecanismo de atualização automática de resultados a partir da API-Sports.
- Para evitar chamadas excessivas que esgotariam a cota gratuita (100 requisições/dia), o sistema utiliza uma trava no Firestore (`/system/apifetch`).
- A atualização é executada no máximo **uma vez por hora** por um cliente conectado que detecte que a hora atual mudou e ainda não foi sincronizada.
- Os resultados oficiais obtidos são salvos na coleção `results` do Firestore, o que dispara re-renderizações automáticas via listeners (`onSnapshot`) em todos os clientes conectados.

### 3.6. Fase Eliminatória (Mata-Mata)
- O mata-mata (Oitavas, Quartas, Semifinais e Final) é gerenciado manualmente pelo administrador via painel de controle.
- Os confrontos e placares são salvos no documento `torneio/matamata` no Firestore e exibidos de forma estruturada.

---

## 4. Painel Administrativo

O acesso administrativo é validado de duas formas:
1. **Administradores de Inicialização (Bootstrap)**: E-mails definidos no array `BOOTSTRAP_ADMINS` no código-fonte da aplicação (`luigi.gonzaga@db1.com.br`, `bruno.rossmann@db1.com.br`, `jocimar.huss@db1.com.br`).
2. **Administradores Dinâmicos**: Cadastrados na coleção `/admins/{email}` no Firestore. Qualquer administrador ativo pode adicionar novos administradores ou remover administradores dinâmicos diretamente através da sub-aba de gerenciamento no painel de controle.

### Funcionalidades do Administrador:
1. **Dashboard de Estatísticas**: Monitoramento geral da quantidade de participantes, palpites registrados e unidades ativas.
2. **Gerenciamento de Partidas**: Adição, edição e remoção de partidas oficiais e testes no banco Firestore.
3. **Lançamento de Resultados Oficiais**: Permite forçar o resultado de um jogo manualmente ou reiniciar o placar, acionando o recálculo automático de pontuação para todos os usuários.
4. **Gerenciamento do Mata-Mata**: Cadastro de confrontos e resultados para as fases eliminatórias.
5. **Gerenciamento de Administradores**: Adição e remoção de outros administradores dinâmicos.
6. **Radar de Segurança**: Auditoria de conformidade (regras de segurança ativas, chaves expostas e configurações).

---

## 5. Estrutura do Banco de Dados (Firestore)

### Coleção `users`
Documento identificado pelo `uid` do Firebase Auth:
- `name` (string): Nome do participante.
- `email` (string): E-mail do participante.
- `emoji` (string): Emoji escolhido como avatar.
- `unit` (string): Identificador da unidade (ex: `"ec_koncili"`).
- `pts` (number): Pontuação atual acumulada.

#### Subcoleção `users/{uid}/predictions`
Documento identificado pelo `matchId` (ID do jogo):
- `home` (number): Gols do time mandante palpita.
- `away` (number): Gols do time visitante palpita.

### Coleção `matches`
Documento identificado pelo `matchId` (ID do jogo):
- `id` (number): ID numérico correspondente.
- `g` (string): Grupo da partida (ex: `"A"`).
- `rod` (string): Rodada correspondente (ex: `"R1"`).
- `h` (string): Time mandante.
- `a` (string): Time visitante.
- `ko` (string): Data/hora de início (ISO UTC).
- `test` (boolean): Flag indicando se é rodada de teste.
- `round` (string/optional): Nome da rodada de teste (ex: `"Teste 1"`).

### Coleção `results`
Documento identificado pelo `matchId` (ID do jogo):
- `home` (number/null): Gols reais do time mandante.
- `away` (number/null): Gols reais do time visitante.
- `live` (boolean/optional): Indica se a partida está ocorrendo no momento.
- `updatedAt` (timestamp): Data e hora da última sincronização.

### Coleção `businessUnits`
Documento identificado pelo `unitId` (ex: `"ec_koncili"`):
- `nome` (string): Nome completo da unidade de negócio.
- `ecossistema` (string): Ecossistema correspondente (ex: `"E-COMMERCE"`).
- `totalPts` (number): Total de pontos somados por colaboradores da unidade.
- `memberCount` (number): Quantidade de membros ativos cadastrados na unidade.

### Coleção `admins`
Documento identificado pelo e-mail do administrador em letras minúsculas:
- Sem campos obrigatórios (a existência do documento valida o e-mail como administrador).

### Coleção `system`
Documento `apifetch`:
- `hora` (string): String da hora da última consulta (formato `YYYY-MM-DDTHH`).
- `who` (string): E-mail do usuário que disparou a chamada da API.
- `at` (timestamp): Data/hora exata do fetch.

### Documento `torneio/matamata`
- `oitavas`, `quartas`, `semis`, `final` (arrays de objetos):
  - `h` (string): Nome do time mandante.
  - `a` (string): Nome do time visitante.
  - `gh` (number/null): Gols do time mandante.
  - `ga` (number/null): Gols do time visitante.

---

## 6. Considerações de Segurança e Boas Práticas

> [!WARNING]
> **Chaves Expostas no Cliente**: Como o aplicativo é uma SPA React executada inteiramente no navegador, as chaves do Firebase SDK (`apiKey`) e API-Sports (`APIKEY`) estão visíveis no código compilado.
> - **Firebase**: É seguro manter a `apiKey` no cliente, desde que as **Regras de Segurança do Firestore** estejam configuradas de forma rígida.
> - **API-Sports**: Risco de uso não autorizado da cota diária (100 requisições/dia). O repositório do GitHub deve ser mantido como **Privado** para reduzir a exposição das chaves de API.

> [!IMPORTANT]
> **Regras de Segurança do Firestore**:
> As regras de segurança em `firestore.rules` bloqueiam o acesso não autorizado:
> - Apenas o próprio usuário autenticado pode gravar em `/users/{uid}/predictions/{matchId}` e `/users/{uid}`.
> - A gravação de palpites é impedida caso a requisição seja feita **menos de 30 minutos antes do kickoff** de cada partida (validando o timestamp de `ko` no documento do jogo contra o `request.time` do servidor).
> - Gravações de partidas, resultados oficiais, convites, administradores e mata-mata exigem estritamente autenticação de admin (verificado pela função `isAdmin()`).

---

## 7. Instruções para Execução Local e Deploy

Para rodar e testar o bolão localmente:

1. Navegue até a pasta do projeto:
   ```bash
   cd /home/jocimar/Lab/copa2026-bolao
   ```
2. Instale as dependências com o Yarn:
   ```bash
   yarn install
   ```
3. Inicie o servidor de desenvolvimento Vite:
   ```bash
   yarn dev
   ```
   *O aplicativo estará disponível em `http://localhost:5173`.*

4. Para compilar o código para produção:
   ```bash
   yarn build
   ```
   *Os arquivos otimizados serão gerados no diretório `dist/`.*

5. Para realizar o deploy para o GitHub Pages:
   ```bash
   yarn deploy
   ```
   *Isso executará o build de produção e enviará o conteúdo da pasta `dist/` para a branch correspondente de hospedagem.*
