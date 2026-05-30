---
name: Revisar Regras de Segurança do Firestore
description: Esta skill orienta a auditoria, validação e revisão de regras de segurança do Firestore (firestore.rules) no projeto Bolão Copa 2026, mitigando acessos não autorizados.
---
# Skill: Revisar Regras de Segurança do Firestore

Esta skill auxilia na elaboração e auditoria das regras de acesso (`firestore.rules`) do banco de dados Firebase para garantir que usuários não consigam alterar dados alheios ou cadastrar placares inválidos.

## 🧱 Coleções e Regras Esperadas

### 1. Coleção `/users/{userId}`
- **Leitura:** Permitida para qualquer usuário autenticado (`request.auth != null`).
- **Escrita (Criar/Atualizar):** Permitida apenas se o usuário logado estiver gravando seu próprio documento (`request.auth.uid == userId`).
- **Validação:** O campo `pts` deve ser numérico e a `unit` deve ser uma das unidades permitidas (`koncili`, `anymarket`, `predize`, `winnerbox`, `marcaseleta`).

### 2. Subcoleção `/users/{userId}/predictions/{matchId}`
- **Leitura:** Permitida para qualquer usuário autenticado.
- **Escrita:** Permitida apenas se `request.auth.uid == userId`.
- **Validação Crítica:** 
  - Impedir gravação se o jogo já começou. Para isso, a regra do Firestore deve cruzar dados com o documento do jogo na coleção `results` ou receber a validação temporal.
  - Como as regras do Firestore têm acesso apenas ao documento atual e ao que está sendo escrito, idealmente o prazo de limite (kickoff) é validado lendo o documento de resultado correspondente:
    ```javascript
    get(/databases/$(database)/documents/results/$(matchId)).data.kickoffTime
    ```

### 3. Coleção `/results/{matchId}`
- **Leitura:** Permitida para qualquer usuário (autenticado ou não).
- **Escrita:** Permitida apenas se o e-mail do usuário autenticado estiver listado como admin:
  ```javascript
  request.auth.token.email in ['luigigonzaga96@gmail.com', 'bruno.rossmann@db1.com.br', 'jocimar.huss@db1.com.br']
  ```

### 4. Coleção `/invites/{email}`
- **Leitura:** Permitida para qualquer usuário (necessário para checar convite antes de criar a conta).
- **Escrita:** Permitida apenas para administradores.

---

## 📝 Exemplo Prático de `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar para checar se é admin
    function isAdmin() {
      return request.auth != null && 
        request.auth.token.email in [
          'luigigonzaga96@gmail.com', 
          'bruno.rossmann@db1.com.br', 
          'jocimar.huss@db1.com.br'
        ];
    }

    // Regras para Coleção de Usuários
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Subcoleção de Palpites
      match /predictions/{matchId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Regras para Resultados dos Jogos (apenas admin escreve)
    match /results/{matchId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Regras para Convites (apenas admin escreve, qualquer um lê)
    match /invites/{email} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Regras para Sistema de Trava da API
    match /system/apifetch {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Regras para Mata-Mata
    match /torneio/matamata {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

---

## 🚀 Como usar esta skill
Sempre que regras de banco ou segurança do Firebase forem mencionadas ou modificadas, acione:
*"Faça uma auditoria nas regras de segurança do Firestore com base na skill de regras do Firestore."*
