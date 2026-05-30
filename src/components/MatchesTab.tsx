import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
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
  const [saveStatus, setSaveStatus] = useState<Record<number, "idle" | "saving" | "saved" | "error">>({});

  const saveTimers = React.useRef<Record<number, any>>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Populate local inputs from database predictions, without overwriting actively modified ones
  useEffect(() => {
    setInputs(prev => {
      const next = { ...prev };
      matches.forEach(m => {
        if (saveTimers.current[m.id] || savingIds.has(m.id) || saveStatus[m.id] === "saving") {
          return;
        }
        const pred = predictions[m.id];
        next[m.id] = {
          home: pred ? pred.home.toString() : "",
          away: pred ? pred.away.toString() : ""
        };
      });
      return next;
    });
  }, [predictions, matches]);

  const handleInputChange = (mid: number, side: "home" | "away", val: string) => {
    setInputs(prev => {
      const updatedInputs = {
        ...prev,
        [mid]: {
          ...prev[mid],
          [side]: val
        }
      };

      const score = updatedInputs[mid];
      const h = parseInt(score.home);
      const a = parseInt(score.away);
      const isValid = !isNaN(h) && !isNaN(a) && h >= 0 && a >= 0;

      const pred = predictions[mid];
      const hasChanged = pred
        ? (score.home !== pred.home.toString() || score.away !== pred.away.toString())
        : (score.home !== "" || score.away !== "");

      if (isValid && hasChanged) {
        if (saveTimers.current[mid]) {
          clearTimeout(saveTimers.current[mid]);
        }

        setSaveStatus(prevStatus => ({
          ...prevStatus,
          [mid]: "saving"
        }));

        saveTimers.current[mid] = setTimeout(() => {
          performAutosave(mid, h, a);
        }, 800);
      } else {
        if (saveTimers.current[mid]) {
          clearTimeout(saveTimers.current[mid]);
          delete saveTimers.current[mid];
        }

        setSaveStatus(prevStatus => ({
          ...prevStatus,
          [mid]: !hasChanged && pred ? "saved" : "idle"
        }));
      }

      return updatedInputs;
    });
  };

  const performAutosave = async (mid: number, h: number, a: number) => {
    if (!user) {
      showModal(t("alert_need_login"));
      setSaveStatus(prev => ({ ...prev, [mid]: "error" }));
      return;
    }

    const m = matches.find(x => x.id === mid);
    if (!m) return;

    if (!isOpen(m)) {
      showModal(t("alert_pred_closed"));
      setSaveStatus(prev => ({ ...prev, [mid]: "error" }));
      return;
    }

    setSavingIds(prev => {
      const next = new Set(prev);
      next.add(mid);
      return next;
    });

    try {
      await setDoc(doc(db, "users", user.uid, "predictions", String(mid)), { home: h, away: a });

      const updatedPredictions = {
        ...predictions,
        [mid]: { home: h, away: a }
      };
      const newTotalPoints = pts(updatedPredictions, results, matches);

      await setDoc(doc(db, "users", user.uid), { pts: newTotalPoints }, { merge: true });

      setSaveStatus(prev => ({ ...prev, [mid]: "saved" }));
    } catch (err: any) {
      console.error("Autosave error:", err);
      setSaveStatus(prev => ({ ...prev, [mid]: "error" }));
      if (err.code === "permission-denied") {
        showModal(t("alert_pred_closed") || "Palpite encerrado no servidor!");
      } else {
        showModal(t("alert_error_save") + err.message);
      }
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(mid);
        return next;
      });
      if (saveTimers.current[mid]) {
        delete saveTimers.current[mid];
      }
    }
  };

  const handleRemovePrediction = async (mid: number) => {
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

    if (saveTimers.current[mid]) {
      clearTimeout(saveTimers.current[mid]);
      delete saveTimers.current[mid];
    }

    setSavingIds(prev => {
      const next = new Set(prev);
      next.add(mid);
      return next;
    });

    try {
      await deleteDoc(doc(db, "users", user.uid, "predictions", String(mid)));

      const updatedPredictions = { ...predictions };
      delete updatedPredictions[mid];
      const newTotalPoints = pts(updatedPredictions, results, matches);

      await setDoc(doc(db, "users", user.uid), { pts: newTotalPoints }, { merge: true });

      setInputs(prev => ({
        ...prev,
        [mid]: { home: "", away: "" }
      }));
      setSaveStatus(prev => ({
        ...prev,
        [mid]: "idle"
      }));
    } catch (err: any) {
      console.error("Remove prediction error:", err);
      if (err.code === "permission-denied") {
        showModal(t("alert_pred_closed") || "Palpite encerrado no servidor!");
      } else {
        showModal((t("alert_error_remove") || "Erro ao remover palpite: ") + err.message);
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
      {/* Prediction Window Info Banner */}
      <div className="alert alert--success alert--full-width" style={{ marginBottom: "16px", textAlign: "center" }}>
        🟢 <strong>{t("window_open_title") || "Regra de Palpites"}</strong>: {t("window_open_desc") || "Palpites liberados até 30 minutos antes do início de cada jogo."}
      </div>

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
          🧪 {t("filter_test") || "Testes"}
        </button>
      </div>

      {/* Match cards list */}
      <div id="ml" className="match-list-grid">
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
              statusBadge = <span className="status-badge status-badge--win" >{t("pred_ended")}</span>;
            } else if (!op) {
              statusBadge = <span style={{ color: "var(--red)" }}>{t("pred_closed")}</span>;
            } else if (lk) {
              statusBadge = <span style={{ color: "var(--gold)", fontSize: "0.7rem" }}>{lk}</span>;
            }

            // Predictions HTML Render Block
            let predictionBlock = null;

            if (!user) {
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
            } else if (done) {
              predictionBlock = (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", flexWrap: "wrap", position: "relative" }}>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--gold)" }}>
                      {pred ? (
                        `${pred.home} × ${pred.away}`
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: "normal" }}>{t("pred_none")}</span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "var(--muted)", fontWeight: 500 }}>
                    {t("pred_your_label") || "Seu palpite:"}
                  </span>
                </div>
              );
            } else if (op) {
              const val = inputs[m.id] || { home: "", away: "" };
              const isSaving = savingIds.has(m.id) || saveStatus[m.id] === "saving";
              const isSaved = pred && val.home === pred.home.toString() && val.away === pred.away.toString();

              predictionBlock = (
                <div className="score-input-row" style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", flexWrap: "wrap", position: "relative" }}>
                    <input
                      className="score-input"
                      type="number"
                      min="0"
                      max="20"
                      value={val.home}
                      onChange={(e) => handleInputChange(m.id, "home", e.target.value)}
                      disabled={isSaving}
                    />
                    <span style={{ color: "var(--muted)" }}>×</span>
                    <input
                      className="score-input"
                      type="number"
                      min="0"
                      max="20"
                      value={val.away}
                      onChange={(e) => handleInputChange(m.id, "away", e.target.value)}
                      disabled={isSaving}
                    />

                    {isSaving && (
                      <span style={{
                        position: "absolute",
                        left: "0px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "0.75rem",
                        color: "var(--muted)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        ⏳ {t("autosave_saving") || "salvando..."}
                      </span>
                    )}
                    {!isSaving && isSaved && (
                      <span style={{
                        position: "absolute",
                        left: "0px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "0.75rem",
                        color: "#10b981",
                        fontWeight: 500,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        ✅ {t("autosave_saved") || "salvo"}
                      </span>
                    )}

                    {pred && (
                      <button
                        className="btn--danger"
                        style={{
                          position: "absolute",
                          right: "0px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          padding: "4px 8px",
                          fontSize: "0.85rem",
                          borderRadius: "4px"
                        }}
                        onClick={() => handleRemovePrediction(m.id)}
                        disabled={isSaving}
                        title={t("btn_remove_prediction") || "Remover"}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "var(--muted)", fontWeight: 500 }}>{t("pred_label") || "Palpite:"}</span>
                </div>
              );
            } else {
              predictionBlock = (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", flexWrap: "wrap", position: "relative" }}>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--gold)" }}>
                      {pred ? (
                        `${pred.home} × ${pred.away}`
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: "normal" }}>{t("pred_none")}</span>
                      )}
                    </div>
                    {pred && (
                      <button
                        className="btn--danger"
                        style={{
                          position: "absolute",
                          right: "0px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          padding: "4px 8px",
                          fontSize: "0.85rem",
                          borderRadius: "4px",
                          opacity: 0.5,
                          cursor: "not-allowed"
                        }}
                        disabled={true}
                        title={t("btn_remove_prediction") || "Remover"}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "var(--muted)", fontWeight: 500 }}>
                    {t("pred_your_label") || "Seu palpite:"}
                  </span>
                  <div style={{ fontSize: "0.75rem", color: "var(--red)", fontWeight: 600, marginTop: "2px" }}>
                    {t("pred_closed")}
                  </div>
                </div>
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
