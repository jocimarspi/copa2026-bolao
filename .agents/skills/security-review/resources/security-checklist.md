# Checklist de Segurança - Bolão Copa 2026

## 🔥 Firebase & Firestore Rules

### 1. Autenticação e Autorização
- [ ] As regras do Firestore (`firestore.rules`) validam a autenticação (`request.auth != null`) para qualquer leitura ou escrita crítica?
- [ ] Um usuário comum só consegue gravar palpites na sua própria subcoleção `/users/{uid}/predictions/{matchId}`? (Verificar se a regra impede gravação em caminhos de outros usuários).
- [ ] A coleção de convites (`invites`) e os resultados oficiais (`results`) estão protegidos por regras que só permitem gravação para e-mails de administradores?
- [ ] A verificação de admin no Firestore está implementada de forma a validar contra uma lista fixa ou campo de perfil seguro (evitando confiar 100% no código do cliente JS)?

### 2. Validação no Banco (Firestore)
- [ ] As regras do Firestore validam os tipos de dados enviados (ex: placares devem ser numéricos inteiros e maiores/iguais a zero)?
- [ ] Há regras do Firestore impedindo a gravação de palpites se a partida já tiver iniciado (kickoff) ou se estiver fora da janela diária permitida?

---

## 💻 Segurança do Cliente (Web / SPA)

### 1. Chaves de API e Variáveis de Ambiente
- [ ] As credenciais do Firebase (`apiKey`, `authDomain`, etc.) estão corretas? (Sabemos que ficam expostas no cliente, mas as regras do Firestore devem ser a defesa principal).
- [ ] A chave da API-Sports (`APIKEY`) está protegida? Se exposta, a cota de uso diário (100 req) está sendo monitorada? O repositório no GitHub deve ser privado para evitar varredura pública.

### 2. Validação e Controle de Janelas
- [ ] O código do cliente JS valida e bloqueia o input de palpites fora do horário (05:00h - 12:30h BRT) e após 5 minutos antes do início do jogo?
- [ ] O link de convite (`?convite=TOKEN`) é verificado adequadamente contra o banco (`invites`) antes de permitir a criação da conta, impedindo forjar e-mails não convidados?

### 3. Exposição de Dados
- [ ] Senhas dos usuários não são manipuladas ou guardadas em variáveis globais/logs locais (devem ser gerenciadas exclusivamente pelo fluxo seguro do Firebase Auth).
- [ ] Logs temporários de console (`console.log`) contendo e-mails, tokens ou objetos de autenticação foram limpos.
