import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useData, UserRankInfo } from "../contexts/DataContext";
import { RI, RC, fmtName, sortUsers, getUsersWithRanks } from "../helpers";

export default function LeaderboardTab() {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const { users, businessUnits, loading: dataLoading } = useData();

  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [unitMembers, setUnitMembers] = useState<Record<string, UserRankInfo[]>>({});
  const [unitLoading, setUnitLoading] = useState<Record<string, boolean>>({});

  const [showFullRanking, setShowFullRanking] = useState(false);
  const [visibleRankingLimit, setVisibleRankingLimit] = useState(20);

  const [showFullUnitsRanking, setShowFullUnitsRanking] = useState(false);
  const [unitsLimit, setUnitsLimit] = useState(20);

  const [selectedUser, setSelectedUser] = useState<UserRankInfo | null>(null);

  // 1. General Classification (Top 10 users)
  const allRankedUsers = getUsersWithRanks(sortUsers(users));
  const sortedUsers = allRankedUsers.slice(0, 10);

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
          const sortedList = sortUsers(list);
          const rankedList = getUsersWithRanks(sortedList);
          const top5 = rankedList.slice(0, 5);

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
      const rankIdx = m.displayRank !== undefined ? m.displayRank - 1 : j;
      return (
        <div 
          className={`leaderboard__row leaderboard__row--member ${isMe ? "leaderboard__row--me" : ""}`} 
          key={m.uid}
          onClick={() => setSelectedUser(m)}
        >
          <div className={`leaderboard__rank ${RC(rankIdx)}`}>{RI(rankIdx)}</div>
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

  const renderStatsModal = () => {
    if (!selectedUser) return null;
    
    const rankIdx = selectedUser.displayRank !== undefined ? selectedUser.displayRank - 1 : -1;
    let cardClass = "";
    let avatarClass = "";
    if (rankIdx === 0) {
      cardClass = "stats-modal-card--gold";
      avatarClass = "stats-modal-avatar--gold";
    } else if (rankIdx === 1) {
      cardClass = "stats-modal-card--silver";
      avatarClass = "stats-modal-avatar--silver";
    } else if (rankIdx === 2) {
      cardClass = "stats-modal-card--bronze";
      avatarClass = "stats-modal-avatar--bronze";
    }

    return (
      <div className="stats-modal-backdrop" onClick={() => setSelectedUser(null)}>
        <div className={`stats-modal-card ${cardClass}`} onClick={(e) => e.stopPropagation()}>
          <button className="stats-modal-close" onClick={() => setSelectedUser(null)}>✕</button>
          
          <div className="stats-modal-avatar-container">
            <div className={`stats-modal-avatar ${avatarClass}`}>
              {selectedUser.emoji || "⚽"}
            </div>
            <h3 className="stats-modal-name">{selectedUser.name}</h3>
            
            <div className="stats-modal-badges">
              <span className="stats-modal-badge stats-modal-badge--rank">
                {selectedUser.displayRank ? `${selectedUser.displayRank}º lugar` : "Sem classificação"}
              </span>
              <span className="stats-modal-badge stats-modal-badge--points">
                {selectedUser.pts || 0} {t("pts_label")}
              </span>
              {selectedUser.unit && businessUnits[selectedUser.unit] && (
                <span 
                  className="stats-modal-badge"
                  style={{
                    backgroundColor: businessUnits[selectedUser.unit].bg,
                    color: businessUnits[selectedUser.unit].text,
                    border: `1px solid ${businessUnits[selectedUser.unit].color}33`
                  }}
                >
                  {businessUnits[selectedUser.unit].label}
                </span>
              )}
            </div>
          </div>
          
          <div className="stats-modal-divider" />
          
          <div className="stats-modal-subtitle">
            {t("stats_details_title")}
          </div>
          
          <div className="stats-modal-grid">
            <div className="stats-modal-item stats-modal-item--exact">
              <div className="stats-modal-label-group">
                <span className="stats-modal-icon">🎯</span>
                <span className="stats-modal-label">{t("stats_exact_scores")}</span>
              </div>
              <span className="stats-modal-value">{selectedUser.exactCount || 0}</span>
            </div>
            
            <div className="stats-modal-item stats-modal-item--correct">
              <div className="stats-modal-label-group">
                <span className="stats-modal-icon">🟢</span>
                <span className="stats-modal-label">{t("stats_correct_results")}</span>
              </div>
              <span className="stats-modal-value">{selectedUser.outcomeCount || 0}</span>
            </div>
            
            <div className="stats-modal-item stats-modal-item--error">
              <div className="stats-modal-label-group">
                <span className="stats-modal-icon">🔴</span>
                <span className="stats-modal-label">{t("stats_errors")}</span>
              </div>
              <span className="stats-modal-value">{selectedUser.wrongCount || 0}</span>
            </div>
          </div>
          
          <button 
            className="btn btn--sm btn--outline" 
            onClick={() => setSelectedUser(null)}
            style={{ width: "100%", marginTop: "20px", padding: "10px 0" }}
          >
            {t("btn_cancel")}
          </button>
        </div>
      </div>
    );
  };

  if (showFullRanking) {
    const paginatedFullRankingUsers = allRankedUsers.slice(0, visibleRankingLimit);
    const hasMoreRanking = allRankedUsers.length > visibleRankingLimit;

    return (
      <div className="tab tab--active">
        {/* Back button */}
        <div style={{ marginBottom: "16px" }}>
          <button 
            className="btn btn--outline btn--sm" 
            onClick={() => setShowFullRanking(false)}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            {t("btn_back_to_summary")}
          </button>
        </div>

        <div className="section-title">{t("full_ranking_title")}</div>

        {/* Full Ranking List */}
        <div className="leaderboard">
          {paginatedFullRankingUsers.map((u, i) => {
            const isMe = authUser && u.uid === authUser.uid;
            const bu = businessUnits[u.unit];
            const rankIdx = u.displayRank !== undefined ? u.displayRank - 1 : i;
            return (
              <div 
                className={`leaderboard__row ${isMe ? "leaderboard__row--me" : ""}`} 
                key={u.uid}
                onClick={() => setSelectedUser(u)}
              >
                <div className={`leaderboard__rank ${RC(rankIdx)}`}>{RI(rankIdx)}</div>
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
          })}
        </div>

        {hasMoreRanking && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button 
              className="btn btn--outline" 
              onClick={() => setVisibleRankingLimit(prev => prev + 20)}
              style={{ width: "100%", maxWidth: "300px", padding: "10px 0" }}
            >
              {t("btn_load_more")}
            </button>
          </div>
        )}
        {renderStatsModal()}
      </div>
    );
  }

  if (showFullUnitsRanking) {
    const paginatedUnits = activeUnits.slice(0, unitsLimit);
    const hasMoreUnits = activeUnits.length > unitsLimit;

    return (
      <div className="tab tab--active">
        {/* Back button */}
        <div style={{ marginBottom: "16px" }}>
          <button 
            className="btn btn--outline btn--sm" 
            onClick={() => {
              setShowFullUnitsRanking(false);
              setUnitsLimit(20);
            }}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            {t("btn_back_to_summary")}
          </button>
        </div>

        <div className="section-title">
          {t("full_units_ranking_title")}
        </div>
        
        <div 
          className="alert alert--info" 
          style={{ marginBottom: "12px" }}
          dangerouslySetInnerHTML={{ __html: t("ranking_info") }}
        />

        <div className="leaderboard">
          {paginatedUnits.map((bu, i) => {
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
          })}
        </div>

        {hasMoreUnits && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button 
              className="btn btn--outline" 
              onClick={() => setUnitsLimit(prev => prev + 20)}
              style={{ width: "100%", maxWidth: "300px", padding: "10px 0" }}
            >
              {t("btn_load_more")}
            </button>
          </div>
        )}
        {renderStatsModal()}
      </div>
    );
  }

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
      {dataLoading ? (
        <div className="leaderboard">
          {/* Skeleton loading */}
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
        </div>
      ) : sortedUsers.length === 0 ? (
        <div className="leaderboard">
          <div style={{ color: "var(--muted)", textAlign: "center", padding: "36px" }}>
            {t("lb_empty")}
          </div>
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          {sortedUsers.length >= 3 && (
            <div className="podium">
              {/* 2nd Place */}
              {(() => {
                const u = sortedUsers[1];
                const isMe = authUser && u.uid === authUser.uid;
                const medalClass = u.displayRank === 1 ? "podium__medal--gold" : u.displayRank === 2 ? "podium__medal--silver" : "podium__medal--bronze";
                return (
                  <div 
                    className={`podium__item podium__item--second ${isMe ? "podium__item--me" : ""}`}
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="podium__avatar-wrapper">
                      <div className="podium__avatar">{u.emoji || "⚽"}</div>
                      <div className="podium__ribbon"></div>
                      <div className={`podium__medal ${medalClass}`}>{u.displayRank}</div>
                    </div>
                    <div className="podium__name" title={u.name}>
                      {fmtName(u.name)}
                      {isMe && <span style={{ color: "var(--gold)", fontSize: ".65rem" }}> ({t("user_you").toLowerCase()})</span>}
                    </div>
                    <div className="podium__points">
                      {u.pts || 0} <span className="podium__points-label">{t("pts_label")}</span>
                    </div>
                  </div>
                );
              })()}

              {/* 1st Place */}
              {(() => {
                const u = sortedUsers[0];
                const isMe = authUser && u.uid === authUser.uid;
                const medalClass = u.displayRank === 1 ? "podium__medal--gold" : u.displayRank === 2 ? "podium__medal--silver" : "podium__medal--bronze";
                return (
                  <div 
                    className={`podium__item podium__item--first ${isMe ? "podium__item--me" : ""}`}
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="podium__avatar-wrapper">
                      <div className="podium__avatar">{u.emoji || "⚽"}</div>
                      <div className="podium__ribbon"></div>
                      <div className={`podium__medal ${medalClass}`}>{u.displayRank}</div>
                    </div>
                    <div className="podium__name" title={u.name}>
                      {fmtName(u.name)}
                      {isMe && <span style={{ color: "var(--gold)", fontSize: ".65rem" }}> ({t("user_you").toLowerCase()})</span>}
                    </div>
                    <div className="podium__points">
                      {u.pts || 0} <span className="podium__points-label">{t("pts_label")}</span>
                    </div>
                  </div>
                );
              })()}

              {/* 3rd Place */}
              {(() => {
                const u = sortedUsers[2];
                const isMe = authUser && u.uid === authUser.uid;
                const medalClass = u.displayRank === 1 ? "podium__medal--gold" : u.displayRank === 2 ? "podium__medal--silver" : "podium__medal--bronze";
                return (
                  <div 
                    className={`podium__item podium__item--third ${isMe ? "podium__item--me" : ""}`}
                    onClick={() => setSelectedUser(u)}
                  >
                    <div className="podium__avatar-wrapper">
                      <div className="podium__avatar">{u.emoji || "⚽"}</div>
                      <div className="podium__ribbon"></div>
                      <div className={`podium__medal ${medalClass}`}>{u.displayRank}</div>
                    </div>
                    <div className="podium__name" title={u.name}>
                      {fmtName(u.name)}
                      {isMe && <span style={{ color: "var(--gold)", fontSize: ".65rem" }}> ({t("user_you").toLowerCase()})</span>}
                    </div>
                    <div className="podium__points">
                      {u.pts || 0} <span className="podium__points-label">{t("pts_label")}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Remaining users in vertical list */}
          <div className="leaderboard">
            {(sortedUsers.length >= 3 ? sortedUsers.slice(3) : sortedUsers).map((u, i) => {
              const isMe = authUser && u.uid === authUser.uid;
              const bu = businessUnits[u.unit];
              const rankIdx = u.displayRank !== undefined ? u.displayRank - 1 : (sortedUsers.length >= 3 ? i + 3 : i);
              return (
                <div 
                  className={`leaderboard__row ${isMe ? "leaderboard__row--me" : ""}`} 
                  key={u.uid}
                  onClick={() => setSelectedUser(u)}
                >
                  <div className={`leaderboard__rank ${RC(rankIdx)}`}>{RI(rankIdx)}</div>
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
            })}

            {users.length > 10 && (
              <button 
                className="leaderboard__row" 
                style={{ 
                  width: "100%", 
                  justifyContent: "center", 
                  cursor: "pointer", 
                  background: "rgba(255, 255, 255, 0.02)", 
                  borderStyle: "dashed",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "var(--gold)"
                }}
                onClick={() => {
                  setShowFullRanking(true);
                  setVisibleRankingLimit(20);
                }}
              >
                {t("btn_view_full_ranking")} ➔
              </button>
            )}
          </div>
        </>
      )}

      {/* 2. Units Ranking List */}
      <div className="section-title" style={{ marginTop: "28px" }}>
        {t("ranking_units")}
      </div>
      <div 
        className="alert alert--info" 
        style={{ marginBottom: "12px" }}
        dangerouslySetInnerHTML={{ __html: t("ranking_info") }}
      />

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
          <>
            {activeUnits.slice(0, 5).map((bu, i) => {
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
            })}

            {activeUnits.length > 5 && (
              <button 
                className="leaderboard__row" 
                style={{ 
                  width: "100%", 
                  justifyContent: "center", 
                  cursor: "pointer", 
                  background: "rgba(255, 255, 255, 0.02)", 
                  borderStyle: "dashed",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "var(--gold)"
                }}
                onClick={() => {
                  setShowFullUnitsRanking(true);
                }}
              >
                {t("btn_view_full_units_ranking")} ➔
              </button>
            )}
          </>
        )}
      </div>
      {renderStatsModal()}
    </div>
  );
}
