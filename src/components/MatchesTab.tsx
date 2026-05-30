import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useData, Match } from "../contexts/DataContext";
import { useModal } from "../contexts/ModalContext";
import { 
  isOpen, 
  lockLbl, 
  pSt, 
  pts, 
  fmtDT, 
  TN, 
  getFlagUrl, 
  parseKoDate 
} from "../helpers";

interface ScoreInputs {
  home: string;
  away: string;
}

export default function MatchesTab({ setCurrentTab }: { setCurrentTab: (tab: string) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { matches, results, predictions } = useData();
  const { showModal } = useModal();

  const [currentFilter, setCurrentFilter] = useState<string>("todos");
  const [inputs, setInputs] = useState<Record<number, ScoreInputs>>({});
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

  // Check if daily prediction window is open (08:00 - 15:30 UTC)
  const isDailyWindowOpen = (): boolean => {
    const now = new Date();
    const utcH = now.getUTCHours();
    const utcM = now.getUTCMinutes();
    const minUTC = utcH * 60 + utcM;
    const abre = 8 * 60; // 08:00 UTC
    const fecha = 15 * 60 + 30; // 15:30 UTC
    return minUTC >= abre && minUTC < fecha;
  };

  const windowOpen = isDailyWindowOpen();

  // Populate local inputs from database predictions
  useEffect(() => {
    const nextInputs: Record<number, ScoreInputs> = {};
    matches.forEach(m => {
      const pred = predictions[m.id];
      nextInputs[m.id] = {
        home: pred ? pred.home.toString() : "",
        away: pred ? pred.away.toString() : ""
      };
    });
    setInputs(nextInputs);
  }, [predictions, matches]);

  const handleInputChange = (mid: number, side: "home" | "away", val: string) => {
    setInputs(prev => ({
      ...prev,
      [mid]: {
        ...prev[mid],
        [side]: val
      }
    }));
  };

  const handleSavePrediction = async (mid: number) => {
    if (!user) {
      showModal(t("alert_need_login"));
      return;
    }

    const m = matches.find(x => x.id === mid);
    if (!m) return;

    if (!isOpen(m)) {
      showModal(t("alert_pred_closed"));
      return;
    }

    if (!windowOpen) {
      showModal(t("alert_window_closed") || "A janela de palpites está fechada agora. Palpites só podem ser salvos das 05:00 às 12:30h.");
      return;
    }

    const score = inputs[mid];
    const h = parseInt(score?.home);
    const a = parseInt(score?.away);

    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      showModal(t("alert_invalid_score"));
      return;
    }

    // Set saving state
    setSavingIds(prev => {
      const next = new Set(prev);
      next.add(mid);
      return next;
    });

    try {
      // 1. Save prediction subcollection
      await setDoc(doc(db, "users", user.uid, "predictions", String(mid)), { home: h, away: a });

      // 2. Compute new total points including this updated prediction locally to avoid delay
      const updatedPredictions = {
        ...predictions,
        [mid]: { home: h, away: a }
      };
      const newTotalPoints = pts(updatedPredictions, results, matches);

      // 3. Update main profile doc
      await setDoc(doc(db, "users", user.uid), { pts: newTotalPoints }, { merge: true });
    } catch (err: any) {
      console.error(err);
      if (err.code === "permission-denied") {
        showModal(t("alert_pred_closed") || "Palpite encerrado no servidor! Tempo limite ou janela de palpites expirados.");
      } else {
        showModal(t("alert_error_save") + err.message);
      }
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(mid);
        return next;
      });
    }
  };

  // Filter and sort matches
  let filteredMatches = [...matches];
  if (currentFilter === "teste") {
    filteredMatches = filteredMatches
      .filter(m => m.test)
      .sort((a, b) => parseKoDate(a.ko).getTime() - parseKoDate(b.ko).getTime());
  } else {
    filteredMatches = filteredMatches.filter(m => !m.test);
    if (currentFilter !== "todos") {
      filteredMatches = filteredMatches.filter(m => m.rod === currentFilter);
    }
    filteredMatches.sort((a, b) => parseKoDate(a.ko).getTime() - parseKoDate(b.ko).getTime());
  }

  // Calculate overall user points
  const userTotalPoints = user ? pts(predictions, results, matches) : 0;

  return (
    <div className="tab tab--active">
      {/* Daily Window Warning Banner */}
      {!windowOpen && (
        <div className="alert alert--danger alert--full-width" style={{ marginBottom: "16px", textAlign: "center" }}>
          🔒 <strong>{t("window_closed_title") || "Janela de Palpites Fechada"}</strong>: {t("window_closed_desc") || "O sistema só aceita palpites das 05:00h às 12:30h (Horário de Brasília) / 08:00 às 15:30 UTC."}
        </div>
      )}

      {windowOpen && (
        <div className="alert alert--success alert--full-width" style={{ marginBottom: "16px", textAlign: "center" }}>
          🟢 <strong>{t("window_open_title") || "Janela de Palpites Aberta"}</strong>: {t("window_open_desc") || "Palpites liberados até 30 minutos antes do início de cada jogo."}
        </div>
      )}

      {/* Points summary banner */}
      {user ? (
        <div className="alert alert--info alert--full-width" style={{ marginBottom: "16px", textAlign: "center" }}>
          {t("pred_your_pts")}{" "}
          <strong style={{ color: "var(--gold)", fontSize: "1rem" }}>{userTotalPoints} pts</strong>{" "}
          {t("pred_your_pts_end")}
        </div>
      ) : (
        <div className="alert alert--info alert--full-width" style={{ marginBottom: "16px", textAlign: "center" }}>
          {t("pred_not_logged")}{" "}
          <span 
            onClick={() => setCurrentTab("conta")}
            style={{ color: "var(--gold)", cursor: "pointer", textDecoration: "underline", fontWeight: 600 }}
          >
            {t("pred_login_account_link")}
          </span>{" "}
          {t("pred_not_logged_text")}
        </div>
      )}

      {/* Filters bar */}
      <div className="filters-bar" style={{ display: "flex", gap: "5px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button 
          className={`filter-btn ${currentFilter === "todos" ? "is-active" : ""}`}
          onClick={() => setCurrentFilter("todos")}
        >
          {t("filter_all") || "Todos"}
        </button>
        <button 
          className={`filter-btn ${currentFilter === "R1" ? "is-active" : ""}`}
          onClick={() => setCurrentFilter("R1")}
        >
          {t("pred_r1")}
        </button>
        <button 
          className={`filter-btn ${currentFilter === "R2" ? "is-active" : ""}`}
          onClick={() => setCurrentFilter("R2")}
        >
          {t("pred_r2")}
        </button>
        <button 
          className={`filter-btn ${currentFilter === "R3" ? "is-active" : ""}`}
          onClick={() => setCurrentFilter("R3")}
        >
          {t("pred_r3")}
        </button>
        <button 
          className={`filter-btn ${currentFilter === "teste" ? "is-active" : ""}`}
          onClick={() => setCurrentFilter("teste")}
        >
          🧪 {t("filter_tests") || "Testes"}
        </button>
      </div>

      {/* Match cards list */}
      <div id="ml">
        {filteredMatches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
            Nenhum jogo encontrado para este filtro.
          </div>
        ) : (
          filteredMatches.map(m => {
            const r = results[m.id];
            const done = r && r.home !== null;
            const live = r?.live;
            const pred = predictions[m.id];
            const st = pSt(m.id, predictions, results);
            const op = isOpen(m);
            const lk = lockLbl(m);
            const homeFlag = getFlagUrl(m.h);
            const awayFlag = getFlagUrl(m.a);
            const nh = TN(m.h);
            const na = TN(m.a);

            // Status Badge
            let statusBadge = null;
            if (live) {
              statusBadge = (
                <span style={{ color: "var(--red)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="live-dot"></span>
                  {t("pred_live")}
                </span>
              );
            } else if (done) {
              statusBadge = <span style={{ color: "var(--muted)" }}>{t("pred_ended")}</span>;
            } else if (!op) {
              statusBadge = <span style={{ color: "var(--red)" }}>{t("pred_closed")}</span>;
            } else if (lk) {
              statusBadge = <span style={{ color: "var(--gold)", fontSize: "0.7rem" }}>{lk}</span>;
            }

            // Predictions HTML Render Block
            let predictionBlock = null;

            if (done) {
              predictionBlock = (
                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                  {t("pred_your_label")}{" "}
                  {pred ? (
                    <strong>{pred.home} × {pred.away}</strong>
                  ) : (
                    <span style={{ color: "var(--muted)" }}>{t("pred_none")}</span>
                  )}
                </div>
              );
            } else if (!user) {
              if (op) {
                predictionBlock = (
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    🔒{" "}
                    <span 
                      onClick={() => setCurrentTab("conta")}
                      style={{ color: "var(--gold)", cursor: "pointer", textDecoration: "underline" }}
                    >
                      {t("pred_login_link")}
                    </span>
                    {t("pred_login_text")}
                  </div>
                );
              } else {
                predictionBlock = <div style={{ fontSize: "0.75rem", color: "var(--red)", fontWeight: 600 }}>{t("pred_closed")}</div>;
              }
            } else if (op) {
              const val = inputs[m.id] || { home: "", away: "" };
              const isSaving = savingIds.has(m.id);
              const hasChanged = pred ? (val.home !== pred.home.toString() || val.away !== pred.away.toString()) : (val.home !== "" || val.away !== "");
              const isBtnDisabled = isSaving || !windowOpen || !hasChanged;

              predictionBlock = (
                <div className="score-input-row">
                  {t("pred_label")}{" "}
                  <input 
                    className="score-input" 
                    type="number" 
                    min="0" 
                    max="20" 
                    value={val.home}
                    onChange={(e) => handleInputChange(m.id, "home", e.target.value)}
                    disabled={isSaving || !windowOpen}
                    placeholder="0"
                  />
                  <span style={{ color: "var(--muted)" }}>×</span>
                  <input 
                    className="score-input" 
                    type="number" 
                    min="0" 
                    max="20" 
                    value={val.away}
                    onChange={(e) => handleInputChange(m.id, "away", e.target.value)}
                    disabled={isSaving || !windowOpen}
                    placeholder="0"
                  />
                  <button 
                    className={`btn btn--sm ${isSaving ? "btn--loading" : ""}`}
                    onClick={() => handleSavePrediction(m.id)}
                    disabled={isBtnDisabled}
                  >
                    {isSaving ? "..." : (pred ? t("btn_update") : t("btn_save"))}
                  </button>
                </div>
              );
            } else {
              predictionBlock = (
                <>
                  <div style={{ fontSize: "0.75rem", color: "var(--red)", fontWeight: 600 }}>{t("pred_closed")}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "2px" }}>
                    {t("pred_your_label")}{" "}
                    {pred ? (
                      <strong>{pred.home} × {pred.away}</strong>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>{t("pred_none")}</span>
                    )}
                  </div>
                </>
              );
            }

            // Points badge
            let pointsBadge = null;
            if (done && pred) {
              if (st === "e") {
                pointsBadge = <span className="bet-badge bet-badge--exact">+5 pts</span>;
              } else if (st === "w") {
                pointsBadge = <span className="bet-badge bet-badge--win">+3 pts</span>;
              } else if (st === "l") {
                pointsBadge = <span className="bet-badge bet-badge--loss">0 pts</span>;
              }
            }

            const groupLabel = m.test ? "TESTE" : `Grupo ${m.g}`;
            const roundLabel = m.test ? m.round : (m.rod === "R1" ? t("pred_r1") : m.rod === "R2" ? t("pred_r2") : t("pred_r3"));

            return (
              <div className="match-card--unified" key={m.id}>
                <div className="match-card__header">
                  <span className="match-card__tag">{groupLabel} · {roundLabel}</span>
                  <span className="match-card__status">{statusBadge}</span>
                </div>
                <div className="match-card__main">
                  <div className="match-card__team match-card__team--home">
                    <span className="match-card__name" title={nh}>{nh}</span>
                    <span className="match-card__flag">
                      {homeFlag && <img src={homeFlag} style={{ verticalAlign: "middle" }} alt="" />}
                    </span>
                  </div>
                  <div className="match-card__vs">
                    <span className="match-card__score">
                      {done ? r.home : "–"} × {done ? r.away : "–"}
                    </span>
                  </div>
                  <div className="match-card__team match-card__team--away">
                    <span className="match-card__flag">
                      {awayFlag && <img src={awayFlag} style={{ verticalAlign: "middle" }} alt="" />}
                    </span>
                    <span className="match-card__name" title={na}>{na}</span>
                  </div>
                </div>
                <div className="match-card__prediction">
                  {predictionBlock}
                </div>
                <div className="match-card__footer">
                  <span className="match-card__meta">
                    {fmtDT(m.ko).d} · {fmtDT(m.ko).t}
                  </span>
                  <span className="match-card__points">
                    {pointsBadge}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
