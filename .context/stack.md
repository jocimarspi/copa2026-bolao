# Stack Tecnológica

O projeto utiliza um conjunto de tecnologias modernas focadas em performance, tipagem estática e facilidade de deploy.

## Tecnologias Principais
- **Framework Frontend**: React 19
- **Linguagem**: TypeScript 6
- **Estilização**: CSS3 Vanilla (sem frameworks utilitários como Tailwind, com suporte a tema escuro/dark premium de fallback e tema claro/soft warm-paper com alternador manual)
- **Bundler/Build Tool**: Vite

## Infraestrutura & Backend
- **Firebase Web SDK v12 / Firebase Admin SDK**:
  - **Firebase Authentication**: Login corporativo via Provedor Microsoft (Entra ID) com restrição de inquilino (Tenant ID).
  - **Cloud Firestore**: Banco de dados NoSQL com suporte a listeners em tempo real (`onSnapshot`).
  - **Cloud Functions (v2)**:
    - Sincronização automática agendada de placares via Scheduler.
    - Funções HTTP para rotinas administrativas (ex: popular rodadas).
- **Provedor de Hospedagem**: GitHub Pages (`gh-pages`)

## Integrações Externas
- **API Oficial de Futebol**: [Football-Data.org](https://www.football-data.org/) (consome endpoints da v4 para resultados e tabelas).
- **Bandeiras das Seleções**: [FlagCDN](https://flagcdn.com/) para carregamento otimizado de imagens de bandeiras de países.

## Ferramentas de Desenvolvimento
- **Gerenciador de Pacotes**: Yarn v3.8.7
- **Linter**: ESLint (configuração customizada de regras de qualidade)
- **Scripts de Manutenção**: Script de reset e administração de banco de dados (`scripts/reset-db.js`) usando `firebase-admin`.

