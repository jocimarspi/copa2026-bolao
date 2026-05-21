# Checklist de Revisão de Código - Bolão Copa 2026

## 🧱 Princípios de Design
- [ ] **KISS**: O código é simples, limpo e direto?
- [ ] **Clean Code**: Nomes de variáveis e funções são claros e revelam intenção?
- [ ] **Single File**: A estrutura interna do arquivo `index.html` está bem dividida e de fácil leitura?
- [ ] **DRY**: Há repetição de código desnecessária na manipulação de DOM?

## 💻 Frontend Web (HTML / CSS / JS)
- [ ] **Semântica HTML**: Uso correto de tags semânticas no lugar de `div` redundantes?
- [ ] **Responsividade**: Testado em telas mobile e desktop? Flexbox/Grid funcionando adequadamente?
- [ ] **Global Pollution**: Variáveis e funções internas estão encapsuladas no escopo do módulo `<script type="module">`?
- [ ] **CSS Variables**: Os estilos utilizam as variáveis definidas em `:root` (Tokens de design)?

## 🔥 Firebase & Integrações
- [ ] **Firestore Rules**: As alterações no banco de dados respeitam e testam as regras de segurança?
- [ ] **Cotas e Locks**: Mecanismo de trava horária (`apifetch`) está ativo e prevenindo requisições excessivas?
- [ ] **Sincronização**: Os listeners (`onSnapshot`) estão atualizando a interface em tempo real e de forma eficiente?
- [ ] **Chaves**: Variáveis críticas e chaves da API estão bem documentadas em termos de risco de cota?

## 🔍 Qualidade Geral
- [ ] Há logs de debug (`console.log`) temporários que devem ser removidos?
- [ ] O tratamento de erros de rede (Firebase Auth/Firestore) é amigável ao usuário?
- [ ] O código passou por revisão de segurança do Firebase?
