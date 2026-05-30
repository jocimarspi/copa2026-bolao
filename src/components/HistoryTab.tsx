import React from "react";
import { useTranslation } from "react-i18next";
import { useData, Match, Result } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { sgn, ptsRound, TN, getFlagUrl, fmtDT } from "../helpers";

export default function HistoryTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { matches, results, predictions } = useData();

  // Test rounds: unique rounds of test matches
  const testMatches = matches.filter(m => m.test);
  const testRounds = Array.from(new Set(testMatches.map(m => m.round).filter(Boolean))) as string[];

  // Completed official matches (non-test matches with finished results)
  const completedOfficialMatches = matches.filter(m => {
    if (m.test) return false;
    const r = results[m.id];
    return r && r.home !== null;
  });

  const getPredictionStatusBadge = (m: Match, r: Result) => {
    const pred = predictions[m.id];
    if (!pred) {
      return (
        <span className="bet-badge" style={{ backgroundColor: "#1a1a1a", color: "var(--muted)" }}>
          {t("history_no_prediction")}
        </span>
      );
    }

    if (r && r.home !== null) {
      const isExact = pred.home === r.home && pred.away === r.away;
      const isCorrectOutcome = sgn(pred.home - pred.away) === sgn(r.home - r.away);

      if (isExact) {
        return <span className="bet-badge bet-badge--exact">🎯 +5</span>;
      } else if (isCorrectOutcome) {
        return <span className="bet-badge bet-badge--win">✅ +3</span>;
      } else {
        return <span className="bet-badge bet-badge--loss">❌ 0</span>;
      }
    }

    return <span className="bet-badge bet-badge--pending">⏳ {pred.home}×{pred.away}</span>;
  };

  const hasContent = testRounds.length > 0 || completedOfficialMatches.length > 0;

  return (
    <div className="tab tab--active">
      <div className="section-title">{t("history_title")}</div>
      <div className="alert alert--warning" style={{ marginBottom: "14px" }}>
        🧪 {t("history_info")}
      </div>

      {!hasContent ? (
        <div style={{ color: "var(--muted)", textAlign: "center", padding: "36px" }}>
          {t("history_empty")}
        </div>
      ) : (
        <>
          {/* 1. Test Rounds Section */}
          {testRounds.map((rnd) => {
            const roundGames = testMatches.filter(m => m.round === rnd);
            const userRoundPoints = ptsRound(predictions, rnd, results, matches);

            return (
              <div className="card" key={rnd} style={{ borderColor: "#6b3fa0", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".75rem", fontWeight: 900, color: "#c49de8" }}>
                    {rnd}
                  </span>
                  <span className="admin-pill" style={{ backgroundColor: "#6b3fa0", fontSize: ".5rem" }}>
                    {t("history_test_badge")}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {roundGames.map((m) => {
                    const r = results[m.id];
                    const done = r && r.home !== null;
                    const homeFlag = getFlagUrl(m.h);
                    const awayFlag = getFlagUrl(m.a);

                    return (
                      <div 
                        key={m.id}
                        style={{ 
                          backgroundColor: "var(--card2)", 
                          border: "1px solid var(--border)", 
                          borderRadius: "7px", 
                          padding: "10px 13px", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "10px", 
                          flexWrap: "wrap" 
                        }}
                      >
                        <span style={{ fontSize: ".83rem", fontWeight: 600, flex: 1 }}>
                          {homeFlag && <img src={homeFlag} style={{ marginRight: 6, verticalAlign: "middle" }} alt="" />}
                          {TN(m.h)} × {TN(m.a)} 
                          {awayFlag && <img src={awayFlag} style={{ marginLeft: 6, verticalAlign: "middle" }} alt="" />}
                        </span>
                        <span style={{ fontSize: ".8rem" }}>
                          {done ? (
                            <strong style={{ color: "var(--gold)" }}>{r.home} × {r.away}</strong>
                          ) : (
                            <span style={{ color: "var(--muted)" }}>– × –</span>
                          )}
                        </span>
                        {getPredictionStatusBadge(m, r)}
                      </div>
                    );
                  })}
                </div>

                {user && (
                  <div style={{ marginTop: "10px", textAlign: "right", fontSize: ".75rem", color: "var(--muted)" }}>
                    {t("history_round_pts")}{" "}
                    <strong style={{ color: "#c49de8" }}>{userRoundPoints} pts</strong>{" "}
                    <span style={{ fontSize: ".62rem" }}>{t("history_round_pts_note")}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* 2. Official Matches Section */}
          {completedOfficialMatches.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: "24px" }}>
                {t("history_copa_title")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {completedOfficialMatches.map((m) => {
                  const r = results[m.id];
                  const homeFlag = getFlagUrl(m.h);
                  const awayFlag = getFlagUrl(m.a);

                  return (
                    <div 
                      key={m.id}
                      style={{ 
                        backgroundColor: "var(--card2)", 
                        border: "1px solid var(--border)", 
                        borderRadius: "7px", 
                        padding: "10px 13px", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px", 
                        flexWrap: "wrap" 
                      }}
                    >
                      <span style={{ fontSize: ".83rem", fontWeight: 600, flex: 1 }}>
                        {homeFlag && <img src={homeFlag} style={{ marginRight: 6, verticalAlign: "middle" }} alt="" />}
                        {TN(m.h)} × {TN(m.a)}
                        {awayFlag && <img src={awayFlag} style={{ marginLeft: 6, verticalAlign: "middle" }} alt="" />}
                      </span>
                      <span style={{ fontSize: ".7rem", color: "var(--muted)" }}>
                        {fmtDT(m.ko).d} · {t("group_short")}{m.g}
                      </span>
                      <span style={{ fontSize: ".8rem" }}>
                        <strong style={{ color: "var(--gold)" }}>{r.home} × {r.away}</strong>
                      </span>
                      {getPredictionStatusBadge(m, r)}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
