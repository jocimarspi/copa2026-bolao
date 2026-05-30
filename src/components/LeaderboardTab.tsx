import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useData, UserRankInfo } from "../contexts/DataContext";
import { RI, RC, fmtName } from "../helpers";

export default function LeaderboardTab() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const { users, businessUnits, loading: dataLoading } = useData();

  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [unitMembers, setUnitMembers] = useState<Record<string, UserRankInfo[]>>({});
  const [unitLoading, setUnitLoading] = useState<Record<string, boolean>>({});

  // 1. General Classification (Top 10 users)
  const sortedUsers = [...users]
    .sort((a, b) => (b.pts || 0) - (a.pts || 0))
    .slice(0, 10);

  // 2. Business Units Ranking
  // Calculate stats dynamically based on the current users list
  const unitStats: Record<string, { totalPts: number; memberCount: number }> = {};
  users.forEach(u => {
    if (u.unit) {
      if (!unitStats[u.unit]) {
        unitStats[u.unit] = { totalPts: 0, memberCount: 0 };
      }
      unitStats[u.unit].totalPts += (u.pts || 0);
      unitStats[u.unit].memberCount += 1;
    }
  });

  const activeUnits = Object.values(businessUnits)
    .map(bu => {
      const stats = unitStats[bu.id] || { totalPts: 0, memberCount: 0 };
      const avg = stats.memberCount ? stats.totalPts / stats.memberCount : 0;
      return {
        ...bu,
        avg,
        total: stats.totalPts,
        count: stats.memberCount
      };
    })
    .filter(bu => bu.count > 0)
    .sort((a, b) => b.avg - a.avg);

  const maxAvg = activeUnits[0]?.avg || 1;

  const toggleUnit = async (unitKey: string) => {
    const nextExpanded = new Set(expandedUnits);
    if (nextExpanded.has(unitKey)) {
      nextExpanded.delete(unitKey);
      setExpandedUnits(nextExpanded);
    } else {
      nextExpanded.add(unitKey);
      setExpandedUnits(nextExpanded);

      // Lazy-load members if not already fetched
      if (!unitMembers[unitKey] && !unitLoading[unitKey]) {
        setUnitLoading(prev => ({ ...prev, [unitKey]: true }));
        try {
          const q = query(collection(db, "users"), where("unit", "==", unitKey));
          const snap = await getDocs(q);
          const list: UserRankInfo[] = [];
          snap.forEach(docSnap => {
            list.push({ uid: docSnap.id, ...docSnap.data() } as UserRankInfo);
          });
          // Sort and slice top 5
          list.sort((a, b) => (b.pts || 0) - (a.pts || 0));
          const top5 = list.slice(0, 5);

          setUnitMembers(prev => ({ ...prev, [unitKey]: top5 }));
        } catch (err) {
          console.error("Erro ao carregar colaboradores da unidade:", err);
        } finally {
          setUnitLoading(prev => ({ ...prev, [unitKey]: false }));
        }
      }
    }
  };

  const renderMembers = (unitKey: string) => {
    const members = unitMembers[unitKey] || [];
    const isLoading = !!unitLoading[unitKey];

    if (isLoading) {
      return (
        <div style={{ textAlign: "center", padding: "12px", color: "var(--muted)", fontSize: "0.75rem" }}>
          {t("loading_members") || "Carregando participantes..."}
        </div>
      );
    }

    if (members.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "12px", color: "var(--muted)", fontSize: "0.75rem" }}>
          Nenhum participante nesta unidade.
        </div>
      );
    }

    return members.map((m, j) => {
      const isMe = authUser && m.uid === authUser.uid;
      return (
        <div className={`leaderboard__row leaderboard__row--member ${isMe ? "leaderboard__row--me" : ""}`} key={m.uid}>
          <div className={`leaderboard__rank ${RC(j)}`}>{RI(j)}</div>
          <div className="leaderboard__avatar" style={{ fontSize: "1rem" }}>{m.emoji || "⚽"}</div>
          <div className="leaderboard__info">
            <div className="leaderboard__name" title={m.name} style={{ fontSize: ".82rem" }}>
              {fmtName(m.name)}
              {isMe && <span style={{ color: "var(--gold)", fontSize: ".65rem" }}> ({t("user_you").toLowerCase()})</span>}
            </div>
          </div>
          <div className="leaderboard__points-col">
            <div className="leaderboard__points" style={{ fontSize: "1rem" }}>{m.pts || 0}</div>
            <div className="leaderboard__points-label">{t("pts_label")}</div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="tab tab--active">
      {/* Slim Hero section */}
      <div className="hero-slim">
        <div className="hero-slim__info">
          <span className="hero-slim__title">🏆 <span>COPA 2026</span></span>
          <span className="hero-slim__divider">•</span>
          <span className="hero-slim__subtitle">{t("hero_slim_subtitle")}</span>
        </div>
        <div className="hero-slim__dates">
          <span className="hero-slim__date-item">
            <span className="hero-slim__date-value">11 Jun</span>
            <span className="hero-slim__date-label">{t("hero_opening")}</span>
          </span>
          <span className="hero-slim__divider">•</span>
          <span className="hero-slim__date-item">
            <span className="hero-slim__date-value">19 Jul</span>
            <span className="hero-slim__date-label">{t("hero_final")}</span>
          </span>
        </div>
      </div>

      <div className="section-title">{t("general_classification")}</div>
      
      {/* 1. General Ranking List */}
      <div className="leaderboard">
        {dataLoading ? (
          // Skeleton loading
          <>
            <div className="leaderboard__row" style={{ opacity: 0.5 }}>
              <div className="skeleton" style={{ width: 25, height: 20 }}></div>
              <div className="skeleton skeleton-avatar"></div>
              <div className="leaderboard__info">
                <div className="skeleton skeleton-text" style={{ width: 130 }}></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="skeleton" style={{ width: 35, height: 20 }}></div>
              </div>
            </div>
            <div className="leaderboard__row" style={{ opacity: 0.3 }}>
              <div className="skeleton" style={{ width: 25, height: 20 }}></div>
              <div className="skeleton skeleton-avatar"></div>
              <div className="leaderboard__info">
                <div className="skeleton skeleton-text" style={{ width: 100 }}></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="skeleton" style={{ width: 35, height: 20 }}></div>
              </div>
            </div>
          </>
        ) : sortedUsers.length === 0 ? (
          <div style={{ color: "var(--muted)", textAlign: "center", padding: "36px" }}>
            {t("lb_empty")}
          </div>
        ) : (
          sortedUsers.map((u, i) => {
            const isMe = authUser && u.uid === authUser.uid;
            const bu = businessUnits[u.unit];
            return (
              <div className={`leaderboard__row ${isMe ? "leaderboard__row--me" : ""}`} key={u.uid}>
                <div className={`leaderboard__rank ${RC(i)}`}>{RI(i)}</div>
                <div className="leaderboard__avatar">{u.emoji || "⚽"}</div>
                <div className="leaderboard__info">
                  <div className="leaderboard__name" title={u.name}>
                    {fmtName(u.name)}
                    {isMe && <span style={{ color: "var(--gold)", fontSize: ".68rem" }}> ({t("user_you").toLowerCase()})</span>}
                  </div>
                  {bu && (
                    <div 
                      className="leaderboard__unit-tag" 
                      style={{ backgroundColor: bu.bg, color: bu.text }}
                    >
                      {bu.label}
                    </div>
                  )}
                </div>
                <div className="leaderboard__points-col">
                  <div className="leaderboard__points">{u.pts || 0}</div>
                  <div className="leaderboard__points-label">{t("pts_label")}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Units Ranking List */}
      <div className="section-title" style={{ marginTop: "28px" }}>
        {t("ranking_units")}
      </div>
      <div className="alert alert--info" style={{ marginBottom: "12px" }}>
        {t("ranking_info")}
      </div>

      <div className="leaderboard">
        {dataLoading ? (
          <div className="leaderboard__row" style={{ opacity: 0.5 }}>
            <div className="skeleton" style={{ width: "100%", height: 35 }}></div>
          </div>
        ) : activeUnits.length === 0 ? (
          <div style={{ color: "var(--muted)", padding: "18px", textAlign: "center" }}>
            {t("lb_units_empty")}
          </div>
        ) : (
          activeUnits.map((bu, i) => {
            const isOpen = expandedUnits.has(bu.id);
            const barWidth = Math.round((bu.avg / maxAvg) * 100);

            return (
              <div 
                className="leaderboard__unit-accordion" 
                key={bu.id}
                style={{ 
                  borderLeft: `3px solid ${bu.color || "#888"}`, 
                  borderRadius: "6px", 
                  marginBottom: "4px", 
                  overflow: "hidden" 
                }}
              >
                <button 
                  className="leaderboard__row leaderboard__unit-header" 
                  style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                  onClick={() => toggleUnit(bu.id)}
                  aria-expanded={isOpen}
                >
                  <div className={`leaderboard__rank ${RC(i)}`}>{RI(i)}</div>
                  <div className="leaderboard__info" style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: ".88rem", marginBottom: "3px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2px" }}>
                      {bu.label}
                      <span 
                        style={{ 
                          fontSize: ".55rem", 
                          fontWeight: 700, 
                          letterSpacing: ".03em", 
                          color: bu.text, 
                          backgroundColor: bu.bg, 
                          border: `1px solid ${bu.color}33`, 
                          padding: "1px 6px", 
                          borderRadius: "3px", 
                          marginLeft: "6px", 
                          verticalAlign: "middle", 
                          whiteSpace: "nowrap" 
                        }}
                      >
                        {bu.ecossistema}
                      </span>
                    </div>
                    <div className="leaderboard__bar-bg" style={{ marginTop: "6px" }}>
                      <div className="leaderboard__bar" style={{ width: `${barWidth}%`, backgroundColor: bu.color }}></div>
                    </div>
                  </div>
                  <div className="leaderboard__points-col">
                    <div className="leaderboard__points" style={{ fontSize: "1.3rem" }}>
                      {Math.round(bu.avg)}
                    </div>
                    <div className="leaderboard__points-label">{t("lb_avg")}</div>
                    <div className="leaderboard__total-points" style={{ fontSize: ".6rem", color: "var(--muted)", marginTop: "1px" }}>
                      {bu.total} {t("lb_total_pts")}
                    </div>
                  </div>
                  <div 
                    className="leaderboard__accordion-arrow" 
                    style={{ 
                      fontSize: ".75rem", 
                      color: "var(--muted)", 
                      marginLeft: "8px", 
                      transition: "transform .25s",
                      transform: isOpen ? "rotate(180deg)" : "none" 
                    }}
                  >
                    ▼
                  </div>
                </button>
                
                {isOpen && (
                  <div className="leaderboard__members" style={{ padding: "0 4px 4px" }}>
                    {renderMembers(bu.id)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
