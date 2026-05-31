# Funcionalidades do Projeto (Escopo)

O sistema do Bolão Copa 2026 contempla as seguintes áreas funcionais:

## 1. Controle de Acesso e Autenticação
- **Login Corporativo (SSO)**: Autenticação obrigatória com contas DB1 via Microsoft Entra ID (Azure AD), validando o Tenant ID da organização.
- **Completude do Perfil**: Usuários recém-cadastrados são impedidos de navegar pelas abas até preencherem a unidade de negócio no Perfil.

## 2. Perfil do Usuário (`AccountTab`)
- **Dados Pessoais**: Exibição do nome e e-mail vindos do SSO.
- **Personalização**: Escolha de um avatar de Emoji.
- **Unidade Corporativa**: Seleção obrigatória da unidade de negócio do colaborador para fins de ranking.

## 3. Palpites e Partidas (`MatchesTab`)
- **Visualização das Partidas**: Lista organizada por grupos, rodadas ou fases de teste.
- **Lançamento de Palpites**: Entradas numéricas para placares do time da casa e visitante, salvando automaticamente em tempo real no banco de dados.
- **Partidas de Teste**: Rodadas sinalizadas visualmente que servem apenas para simulação e não pontuam no ranking geral.

## 4. Rankings (`LeaderboardTab`)
- **Classificação Geral**: Top 10 participantes com maior número de pontos.
- **Ranking DB1 Group**: Tabela baseada na média de pontuação das unidades de negócio (`pontos totais da unidade / membros cadastrados na unidade`), assegurando equidade para setores com menos membros.
- **Estilização Temática**: Aplicação automática de cores específicas nos rankings de acordo com o ecossistema (ex: Christian Tech, Techfin, Holding).

## 5. Histórico de Palpites (`HistoryTab`)
- **Transparência**: Permite visualizar o palpite detalhado de todos os participantes para um jogo específico.
- **Regra de Exibição**: O histórico só fica visível para consulta pública após o bloqueio da partida (30 minutos antes do kickoff), garantindo que ninguém copie palpites alheios antes do jogo começar.

## 6. Painel do Administrador (`AdminTab`)
- **Dashboard de Uso**: Totalizadores de usuários, palpites, partidas e unidades.
- **Gerenciador de Partidas**: Ferramentas para cadastrar, editar, remover e restaurar partidas oficiais padrão.
- **Lançamento de Placares**: Inserção manual de resultados oficiais para fins de correção ou encerramento manual.
- **Controle do Mata-mata**: Editor visual dos times e placares das fases eliminatórias.
- **Gestão de Administradores**: Adição e exclusão de novos e-mails na lista de administradores dinâmicos.
- **Recálculo Geral**: Botão administrativo para reprocessar toda a classificação geral e pontuação de todas as unidades baseando-se nos palpites históricos e resultados.
