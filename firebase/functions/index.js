const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onRequest} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");

// Inicializa o Firebase Admin SDK
initializeApp();
const db = getFirestore();

// ID da Competição na API (Ex: WC para World Cup.
// Confirme o ID atualizado na API)
const COMPETITION_CODE = "WC";

/**
 * Normaliza o nome do país vindo da API para bater com o
 * padrão de chaves do frontend.
 * @param {string} name Nome original do time.
 * @return {string} Nome normalizado.
 */
function normalizeTeamName(name) {
  if (!name) return "";
  return name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[.-]/g, " ") // substitui pontos/hifens por espaços
      .replace(/\s+/g, " ") // remove espaços extras
      .trim()
      .replace(/\s/g, "_");
}

/**
 * Cloud Function agendada para rodar a cada 15 minutos.
 * Consome os resultados da API externa e atualiza o Firestore.
 */
exports.atualizarResultadosBolao = onSchedule("*/15 * * * *", async (event) => {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    console.error("FOOTBALL_DATA_API_KEY is not configured.");
    return;
  }

  try {
    // Consome a API do football-data.org.
    // Filtra partidas pela competição desejada.
    const url = `https://api.football-data.org/v4/competitions/` +
        `${COMPETITION_CODE}/matches`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Auth-Token": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`,
      );
    }

    const data = await response.json();
    const matches = data.matches || [];

    // Filtra apenas as partidas que foram encerradas (FINISHED)
    const finishedMatches = matches.filter(
        (match) => match.status === "FINISHED",
    );

    if (finishedMatches.length === 0) {
      console.log(
          "Nenhuma partida encerrada encontrada na resposta da API.",
      );
      return;
    }

    // Usamos um Batch do Firestore para agrupar as atualizações
    const batch = db.batch();
    let updatesCount = 0;

    // Processa cada partida encerrada
    for (const match of finishedMatches) {
      const matchId = String(match.id);
      const matchRef = db.collection("partidas").doc(matchId);

      const docSnap = await matchRef.get();

      if (docSnap.exists) {
        const currentData = docSnap.data();

        // Só atualiza se o status no banco ainda não for "encerrado"
        if (currentData.status !== "encerrado") {
          const golsA = match.score.fullTime.home;
          const golsB = match.score.fullTime.away;

          batch.update(matchRef, {
            golsA: golsA,
            golsB: golsB,
            status: "encerrado",
            atualizadoEm: new Date(),
          });

          updatesCount++;
          console.log(
              `Partida ${matchId} pronta: ` +
              `${match.homeTeam.name} ${golsA} x ${golsB} ` +
              `${match.awayTeam.name}`,
          );
        }
      } else {
        // Opcional: Se a partida não existir no seu banco, pode criá-la aqui
        console.warn(
            `Aviso: Partida ID ${matchId} não existe em 'partidas'.`,
        );
      }
    }

    // Executa o lote de atualizações no banco de dados
    if (updatesCount > 0) {
      await batch.commit();
      console.log(
          `Sucesso: ${updatesCount} partidas atualizadas para 'encerrado'.`,
      );
    } else {
      console.log("Todas as partidas finalizadas já estavam atualizadas.");
    }
  } catch (error) {
    console.error("Erro na atualização de resultados:", error);
  }
});

/**
 * Cloud Function acionada manualmente (HTTP/HTTPS) para importar as partidas.
 * Consome a API do football-data.org e popula/atualiza a coleção 'matches' no
 * Firestore.
 */
exports.popularMatchesManual = onRequest({cors: true}, async (req, res) => {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    res.status(500).json({
      error: "FOOTBALL_DATA_API_KEY is not configured.",
    });
    return;
  }

  const competitionCode = req.query.competition || COMPETITION_CODE;

  try {
    const url = `https://api.football-data.org/v4/competitions/` +
        `${competitionCode}/matches`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Auth-Token": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`,
      );
    }

    const data = await response.json();
    const apiMatches = data.matches || [];

    // Filtra apenas as partidas da fase de grupos
    const groupMatches = apiMatches.filter((match) =>
      match.stage === "GROUP_STAGE" ||
      (match.group && match.group.startsWith("GROUP_")),
    );

    if (groupMatches.length === 0) {
      res.status(200).json({
        message: "Nenhuma partida da fase de grupos encontrada.",
        count: 0,
      });
      return;
    }

    const batch = db.batch();
    const importedMatches = [];

    for (const match of groupMatches) {
      const matchId = String(match.id);
      const matchRef = db.collection("matches").doc(matchId);

      const groupLetter = match.group ?
          match.group.replace("GROUP_", "").trim() : "";
      const roundStr = match.matchday ? `R${match.matchday}` : "";

      const matchData = {
        g: groupLetter,
        rod: roundStr,
        h: normalizeTeamName(match.homeTeam.name),
        a: normalizeTeamName(match.awayTeam.name),
        ko: match.utcDate,
      };

      batch.set(matchRef, matchData, {merge: true});
      importedMatches.push({id: match.id, ...matchData});
    }

    await batch.commit();

    res.status(200).json({
      success: true,
      message: `Sucesso: ${importedMatches.length} partidas ` +
          `importadas/atualizadas na coleção 'matches'.`,
      count: importedMatches.length,
      matches: importedMatches,
    });
  } catch (error) {
    console.error("Erro crítico ao popular a coleção de matches:", error);
    res.status(500).json({error: error.message});
  }
});
