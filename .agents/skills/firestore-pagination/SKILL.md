---
name: Paginação com Firestore
description: Orienta a implementação de paginação de dados (next/previous/load-more) utilizando Cloud Firestore SDK Modular (v9/v10) no projeto Bolão Copa 2026.
---

# Skill: Paginação com Firestore

Esta skill fornece diretrizes e padrões para implementar paginação eficiente em consultas do Cloud Firestore no projeto Bolão Copa 2026.

## 📌 Quando Utilizar
Use esta skill sempre que precisar carregar listas extensas de dados sob demanda na SPA (como rankings de usuários, palpites salvos, histórico de partidas, etc.), reduzindo o número de leituras no banco de dados e melhorando a performance de carregamento da interface.

---

## 🛠️ Conceitos Fundamentais

No Firestore, a paginação é feita através de **Cursores de Consulta** combinados com limites. Não há suporte nativo eficiente para paginação por deslocamento (como o `offset` do SQL), pois o Firestore cobraria a leitura de todos os registros pulados.

Os principais métodos utilizados são:
*   `limit(n)`: Define o tamanho máximo da página.
*   `orderBy(campo, direcao)`: Define a ordenação (obrigatória para o funcionamento dos cursores).
*   `startAfter(docSnapshot)`: Inicia a consulta *após* o documento especificado (próxima página).
*   `endBefore(docSnapshot)`: Termina a consulta *antes* do documento especificado (página anterior).

> [!IMPORTANT]
> Para usar cursores de paginação, você deve passar o **objeto DocumentSnapshot** inteiro (retornado pelo Firestore) e não apenas o valor do campo.

---

## 📋 Padrão 1: Paginação "Carregar Mais" (Infinite Scroll / Load More)

Este é o padrão mais simples e performático. Ele adiciona novos itens ao final da lista conforme o usuário clica em um botão "Ver Mais".

### Exemplo de Implementação

```javascript
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();
const ITENS_POR_PAGINA = 10;
let ultimoDoc = null; // Armazena a referência para a próxima página
let carregando = false;

// Função para buscar e renderizar itens
async function buscarItens(carregarMais = false) {
  if (carregando) return;
  carregando = true;

  try {
    // Configura a query
    let q = query(
      collection(db, "ranking"),
      orderBy("pontos", "desc"),
      limit(ITENS_POR_PAGINA)
    );

    // Se for carregar mais, inicia a partir do último documento lido
    if (carregarMais && ultimoDoc) {
      q = query(
        collection(db, "ranking"),
        orderBy("pontos", "desc"),
        startAfter(ultimoDoc),
        limit(ITENS_POR_PAGINA)
      );
    }

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("Nenhum registro encontrado.");
      if (carregarMais) {
        document.getElementById("btn-carregar-mais").style.display = "none";
      }
      return;
    }

    // Salva o último documento para a próxima chamada
    ultimoDoc = snapshot.docs[snapshot.docs.length - 1];

    // Se retornou menos itens que o limite, esconde o botão
    if (snapshot.docs.length < ITENS_POR_PAGINA) {
      document.getElementById("btn-carregar-mais").style.display = "none";
    } else {
      document.getElementById("btn-carregar-mais").style.display = "block";
    }

    // Renderizar os documentos
    renderizarItens(snapshot.docs, carregarMais);
  } catch (error) {
    console.error("Erro ao buscar dados paginados:", error);
  } finally {
    carregando = false;
  }
}

function renderizarItens(docs, append = false) {
  const container = document.getElementById("lista-ranking");
  if (!append) container.innerHTML = "";

  docs.forEach(doc => {
    const data = doc.data();
    const item = document.createElement("div");
    item.textContent = `${data.nome} - ${data.pontos} pts`;
    container.appendChild(item);
  });
}
```

---

## 📋 Padrão 2: Paginação Bidirecional (Próximo / Anterior)

Para implementar botões tradicionais de "Anterior" e "Próximo", a melhor prática é manter uma **pilha (stack) de páginas** para gerenciar o histórico de navegação. Isso evita problemas ao tentar fazer consultas reversas diretas.

### Exemplo de Implementação

```javascript
let paginaAtual = 1;
const pilhaDePaginas = []; // Guarda o primeiro documento de cada página já visitada
let primeiroDocDaPagina = null;
let ultimoDocDaPagina = null;

async function buscarPagina(direcao) {
  let q;

  if (direcao === "proximo" && ultimoDocDaPagina) {
    // Guarda o estado para permitir voltar depois
    if (pilhaDePaginas.indexOf(primeiroDocDaPagina) === -1) {
      pilhaDePaginas.push(primeiroDocDaPagina);
    }
    
    q = query(
      collection(db, "ranking"),
      orderBy("pontos", "desc"),
      startAfter(ultimoDocDaPagina),
      limit(ITENS_POR_PAGINA)
    );
    paginaAtual++;
  } else if (direcao === "anterior" && pilhaDePaginas.length > 0) {
    // Recupera o primeiro documento da página anterior da nossa pilha
    const docAnterior = pilhaDePaginas.pop();
    
    q = query(
      collection(db, "ranking"),
      orderBy("pontos", "desc"),
      startAt(docAnterior),
      limit(ITENS_POR_PAGINA)
    );
    paginaAtual--;
  } else {
    // Primeira Página (Inicialização)
    q = query(
      collection(db, "ranking"),
      orderBy("pontos", "desc"),
      limit(ITENS_POR_PAGINA)
    );
    paginaAtual = 1;
    pilhaDePaginas.length = 0; // Limpa a pilha
  }

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    primeiroDocDaPagina = snapshot.docs[0];
    ultimoDocDaPagina = snapshot.docs[snapshot.docs.length - 1];
    
    renderizarItens(snapshot.docs, false);
    atualizarBotoesControle(snapshot.docs.length);
  }
}

function atualizarBotoesControle(itensRetornados) {
  const btnAnterior = document.getElementById("btn-anterior");
  const btnProximo = document.getElementById("btn-proximo");

  // Habilita anterior apenas se não estiver na página 1
  btnAnterior.disabled = (paginaAtual === 1);

  // Habilita próximo apenas se retornou a quantidade máxima da página
  btnProximo.disabled = (itensRetornados < ITENS_POR_PAGINA);
}
```

---

## ⚠️ Boas Práticas e Pegadinhas Comuns

1.  **Ordenação Única (Tie-breaker):** Se o campo de ordenação tiver valores duplicados (ex: múltiplos usuários com a mesma pontuação), a paginação pode falhar ou pular registros. Para resolver isso, adicione o ID do documento como critério secundário de ordenação:
    ```javascript
    orderBy("pontos", "desc"),
    orderBy("__name__", "desc") // Garante unicidade
    ```
2.  **Tratamento de Exclusões/Inserções em Tempo Real:** Se houver novas inserções enquanto o usuário navega, a paginação por cursor pode repetir itens ou pulá-los. Para listas em tempo real de alta volatilidade, considere buscar uma lista completa localmente se o tamanho total de registros for pequeno.
3.  **Índices no Firestore:** Consultas paginadas que usam múltiplos `orderBy` ou filtros compostos requerem um índice composto. Verifique o console do navegador se receber erros do Firestore com um link direto para a criação do índice necessário.
