import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useData, Match, BusinessUnit } from "../contexts/DataContext";
import { useModal } from "../contexts/ModalContext";
import { 
  isOpen, 
  lockLbl, 
  pts, 
  fmtDT, 
  parseKoDate, 
  TN, 
  getFlagUrl 
} from "../helpers";
import { DEFAULT_BUSINESS_UNITS, DEFAULT_MATCHES } from "../constants";

const BOOTSTRAP_ADMINS = [
  "luigi.gonzaga@db1.com.br",
  "bruno.rossmann@db1.com.br",
  "jocimar.huss@db1.com.br"
];

const MM_FASES = [
  { key: "oitavas", label: "Oitavas de Final", n: 8 },
  { key: "quartas", label: "Quartas de Final", n: 4 },
  { key: "semis", label: "Semifinais", n: 2 },
  { key: "final", label: "Final", n: 1 }
];

export default function AdminTab() {
  const { t } = useTranslation();
  const { user, admins } = useAuth();
  const { matches, results, businessUnits, users } = useData();
  const { showModal } = useModal();

  // Navigation within admin sub-tabs
  const [adminSubTab, setAdminSubTab] = useState<string>("stats");

  // Status and loaders
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [recalcProgress, setRecalcProgress] = useState<string>("");

  // New admin state
  const [newAdminEmail, setNewAdminEmail] = useState<string>("");

  // API Config state
  const [apiUrl, setApiUrl] = useState<string>("");
  const [apiLoading, setApiLoading] = useState<boolean>(false);

  // Match Form states
  const [isAddingMatch, setIsAddingMatch] = useState<boolean>(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [mfId, setMfId] = useState<string>("");
  const [mfHome, setMfHome] = useState<string>("");
  const [mfAway, setMfAway] = useState<string>("");
  const [mfGroup, setMfGroup] = useState<string>("");
  const [mfRod, setMfRod] = useState<string>("");
  const [mfTest, setMfTest] = useState<boolean>(false);
  const [mfKo, setMfKo] = useState<string>("");
  const [mfRound, setMfRound] = useState<string>("");

  // Local match score input states (for saving results)
  const [matchResultInputs, setMatchResultInputs] = useState<Record<number, { home: string; away: string }>>({});

  // Business Unit form states
  const [isAddingBU, setIsAddingBU] = useState<boolean>(false);
  const [editingBU, setEditingBU] = useState<BusinessUnit | null>(null);
  const [bufId, setBufId] = useState<string>("");
  const [bufNome, setBufNome] = useState<string>("");
  const [bufEcossistema, setBufEcossistema] = useState<string>("DIGITAL TRANSFORMATION");

  // Mata-mata local state
  const [mmData, setMmData] = useState<Record<string, any>>({});
  const [mmLoading, setMmLoading] = useState<boolean>(false);

  // Load API config and Mata-mata on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const snap = await getDoc(doc(db, "system", "config"));
        if (snap.exists() && snap.data().apiUrl) {
          setApiUrl(snap.data().apiUrl);
        }
      } catch (err) {
        console.error("Erro ao carregar URL da API:", err);
      }
    }

    async function loadMataMata() {
      try {
        const snap = await getDoc(doc(db, "torneio", "matamata"));
        if (snap.exists()) {
          setMmData(snap.data());
        }
      } catch (err) {
        console.error("Erro ao carregar mata-mata:", err);
      }
    }

    loadConfig();
    loadMataMata();
  }, []);

  // Sync result inputs when results or matches update
  useEffect(() => {
    const nextInputs: Record<number, { home: string; away: string }> = {};
    matches.forEach(m => {
      const r = results[m.id];
      nextInputs[m.id] = {
        home: r && r.home !== null ? r.home.toString() : "",
        away: r && r.away !== null ? r.away.toString() : ""
      };
    });
    setMatchResultInputs(nextInputs);
  }, [results, matches]);

  // Points recalculation function
  const runRecalculation = async () => {
    setRecalculating(true);
    setRecalcProgress(t("recalc_fetching") || "Buscando dados...");
    try {
      // 1. Fetch latest results
      const resultsSnap = await getDocs(collection(db, "results"));
      const latestResults: Record<string, any> = {};
      resultsSnap.forEach(d => {
        latestResults[d.id] = d.data();
      });

      // 2. Fetch business units to reset counters
      const businessUnitsSnap = await getDocs(collection(db, "businessUnits"));
      const unitTotals: Record<string, { totalPts: number; memberCount: number }> = {};
      businessUnitsSnap.forEach(d => {
        unitTotals[d.id] = { totalPts: 0, memberCount: 0 };
      });

      // 3. Fetch users
      setRecalcProgress(t("recalc_users") || "Processando pontos dos usuários...");
      const usersSnap = await getDocs(collection(db, "users"));
      
      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        const uData = userDoc.data();
        const predictionsSnap = await getDocs(collection(db, "users", userId, "predictions"));
        const userPredictions: Record<string, any> = {};
        predictionsSnap.forEach(d => {
          userPredictions[d.id] = d.data();
        });
        
        // Pass matches as 3rd parameter to prevent crash
        const newPoints = pts(userPredictions, latestResults, matches);
        await setDoc(doc(db, "users", userId), { pts: newPoints }, { merge: true });

        const unit = uData.unit;
        if (unit) {
          if (!unitTotals[unit]) {
            unitTotals[unit] = { totalPts: 0, memberCount: 0 };
          }
          unitTotals[unit].totalPts += newPoints;
          unitTotals[unit].memberCount += 1;
        }
      }

      // 4. Update BUs totals
      setRecalcProgress(t("recalc_bus") || "Sincronizando BUs...");
      for (const [unitId, stats] of Object.entries(unitTotals)) {
        await setDoc(doc(db, "businessUnits", unitId), {
          totalPts: stats.totalPts,
          memberCount: stats.memberCount
        }, { merge: true });
      }

      showModal(t("recalc_success") || "Reprocessamento concluído com sucesso!");
    } catch (err: any) {
      console.error(err);
      showModal("Erro ao reprocessar pontos: " + err.message);
    } finally {
      setRecalculating(false);
      setRecalcProgress("");
    }
  };

  // --- Admin additions/deletions ---
  const handleAddAdmin = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) {
      showModal("Digite o email do administrador.");
      return;
    }
    if (!email.includes("@")) {
      showModal("Email inválido.");
      return;
    }

    try {
      await setDoc(doc(db, "admins", email), {
        addedAt: serverTimestamp()
      });
      setNewAdminEmail("");
      showModal("Administrador adicionado!");
    } catch (err: any) {
      showModal("Erro ao adicionar admin: " + err.message);
    }
  };

  const handleDeleteAdmin = async (email: string) => {
    if (BOOTSTRAP_ADMINS.includes(email.toLowerCase())) {
      showModal("Este administrador faz parte do bootstrap do sistema e não pode ser removido.");
      return;
    }

    showModal(`Deseja realmente remover o administrador "${email}"?`, async () => {
      try {
        await deleteDoc(doc(db, "admins", email));
        showModal("Administrador removido com sucesso!");
      } catch (err: any) {
        showModal("Erro ao remover admin: " + err.message);
      }
    });
  };

  // --- Save config ---
  const handleSaveApiUrl = async () => {
    try {
      await setDoc(doc(db, "system", "config"), { apiUrl: apiUrl.trim() }, { merge: true });
      showModal("Configurações salvas!");
    } catch (err: any) {
      showModal("Erro ao salvar: " + err.message);
    }
  };

  const handleImportFromAPI = async () => {
    if (!apiUrl.trim()) {
      showModal("Configure a URL da API da Cloud Function primeiro.");
      return;
    }

    showModal("Deseja realmente importar as partidas da API oficial? Isso atualizará os jogos ativos.", async () => {
      try {
        setApiLoading(true);
        const token = await auth.currentUser?.getIdToken();
        const headers: Record<string, string> = { "Accept": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(apiUrl.trim(), { method: "GET", headers });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        showModal(`Sucesso! ${data.count || 0} partidas importadas.`, () => {
          window.location.reload();
        });
      } catch (err: any) {
        showModal("Erro ao importar: " + err.message);
      } finally {
        setApiLoading(false);
      }
    });
  };

  // --- Match CRUD ---
  const handleScoreResultChange = (mid: number, side: "home" | "away", val: string) => {
    setMatchResultInputs(prev => ({
      ...prev,
      [mid]: { ...prev[mid], [side]: val }
    }));
  };

  const handleSaveMatchResult = async (mid: number) => {
    const scores = matchResultInputs[mid];
    const h = parseInt(scores?.home);
    const a = parseInt(scores?.away);

    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      showModal(t("adm_invalid_score"));
      return;
    }

    const m = matches.find(x => x.id === mid);
    if (!m) return;

    showModal(`Confirmar resultado oficial de ${TN(m.h)} ${h} × ${a} ${TN(m.a)}?`, async () => {
      try {
        await setDoc(doc(db, "results", String(mid)), {
          home: h,
          away: a,
          live: false,
          kickoffTime: parseKoDate(m.ko),
          updatedAt: serverTimestamp()
        });
        await runRecalculation();
      } catch (err: any) {
        showModal("Erro ao salvar resultado: " + err.message);
      }
    });
  };

  const handleClearMatchResult = async (mid: number) => {
    const m = matches.find(x => x.id === mid);
    showModal(`Deseja limpar o placar oficial de #${mid}?`, async () => {
      try {
        await setDoc(doc(db, "results", String(mid)), {
          home: null,
          away: null,
          live: false,
          kickoffTime: m ? parseKoDate(m.ko) : null
        });
        await runRecalculation();
      } catch (err: any) {
        showModal("Erro ao limpar placar: " + err.message);
      }
    });
  };

  const openMatchForm = (m: Match | null) => {
    if (m) {
      setEditingMatch(m);
      setIsAddingMatch(false);
      setMfId(m.id.toString());
      setMfHome(m.h);
      setMfAway(m.a);
      setMfGroup(m.g || "");
      setMfRod(m.rod || "");
      setMfTest(!!m.test);
      setMfRound(m.round || "");
      if (m.ko) {
        try {
          const d = parseKoDate(m.ko);
          const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setMfKo(iso);
        } catch (_) {
          setMfKo("");
        }
      } else {
        setMfKo("");
      }
    } else {
      setEditingMatch(null);
      setIsAddingMatch(true);
      setMfId("");
      setMfHome("");
      setMfAway("");
      setMfGroup("");
      setMfRod("");
      setMfTest(false);
      setMfRound("");
      setMfKo("");
    }
  };

  const handleSaveMatch = async () => {
    const numId = parseInt(mfId);
    if (isNaN(numId) || numId <= 0) {
      showModal("ID da partida inválido!");
      return;
    }
    if (!mfHome.trim() || !mfAway.trim()) {
      showModal("Preencha os times!");
      return;
    }
    if (!mfKo) {
      showModal("Preencha a data de kickoff!");
      return;
    }

    try {
      const koIso = new Date(mfKo).toISOString();
      const mData: any = {
        g: mfGroup.trim().toUpperCase(),
        rod: mfRod.trim().toUpperCase(),
        h: mfHome.trim().toLowerCase(),
        a: mfAway.trim().toLowerCase(),
        ko: koIso
      };
      if (mfTest) mData.test = true;
      if (mfRound.trim()) mData.round = mfRound.trim();

      await setDoc(doc(db, "matches", String(numId)), mData);
      setIsAddingMatch(false);
      setEditingMatch(null);
      showModal("Partida salva com sucesso!");
    } catch (err: any) {
      showModal("Erro ao salvar partida: " + err.message);
    }
  };

  const handleDeleteMatch = async (mid: number) => {
    showModal(`Deseja realmente deletar a partida #${mid}? Ação irreversível.`, async () => {
      try {
        await deleteDoc(doc(db, "matches", String(mid)));
        await deleteDoc(doc(db, "results", String(mid)));
        await runRecalculation();
      } catch (err: any) {
        showModal("Erro ao deletar partida: " + err.message);
      }
    });
  };

  const handleRestoreDefaultMatches = () => {
    showModal("Deseja realmente restaurar os jogos padrão? Isso substituirá dados modificados.", async () => {
      try {
        for (const m of DEFAULT_MATCHES) {
          const mData: any = {
            g: m.g || "",
            rod: m.rod || "",
            h: m.h || "",
            a: m.a || "",
            ko: m.ko || ""
          };
          if (m.test !== undefined) mData.test = m.test;
          if (m.round !== undefined) mData.round = m.round;
          await setDoc(doc(db, "matches", String(m.id)), mData);
        }
        showModal("Partidas padrão restauradas!");
      } catch (err: any) {
        showModal("Erro ao restaurar partidas: " + err.message);
      }
    });
  };

  // --- Business Unit CRUD ---
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  const openBUForm = (bu: BusinessUnit | null) => {
    if (bu) {
      setEditingBU(bu);
      setIsAddingBU(false);
      setBufId(bu.id);
      setBufNome(bu.nome);
      setBufEcossistema(bu.ecossistema);
    } else {
      setEditingBU(null);
      setIsAddingBU(true);
      setBufId("");
      setBufNome("");
      setBufEcossistema("DIGITAL TRANSFORMATION");
    }
  };

  const handleSaveBU = async () => {
    if (!bufNome.trim()) {
      showModal("Nome da unidade de negócio vazio!");
      return;
    }
    const docId = bufId || slugify(bufNome);

    try {
      await setDoc(doc(db, "businessUnits", docId), {
        nome: bufNome.trim(),
        ecossistema: bufEcossistema
      }, { merge: true });
      setIsAddingBU(false);
      setEditingBU(null);
      showModal("Unidade salva!");
    } catch (err: any) {
      showModal("Erro ao salvar unidade: " + err.message);
    }
  };

  const handleDeleteBU = async (id: string, label: string) => {
    showModal(`Deseja deletar a unidade "${label}"?`, async () => {
      try {
        await deleteDoc(doc(db, "businessUnits", id));
        showModal("Unidade excluída!");
      } catch (err: any) {
        showModal("Erro ao deletar: " + err.message);
      }
    });
  };

  const handleSeedDefaultBUs = () => {
    showModal(`Deseja popular a tabela com as ${DEFAULT_BUSINESS_UNITS.length} unidades padrão?`, async () => {
      try {
        for (const bu of DEFAULT_BUSINESS_UNITS) {
          await setDoc(doc(db, "businessUnits", bu.id), {
            nome: bu.nome,
            ecossistema: bu.ecossistema
          });
        }
        showModal("Unidades padrão populadas!");
      } catch (err: any) {
        showModal("Erro ao popular: " + err.message);
      }
    });
  };

  // --- Mata-mata handlers ---
  const handleMmValueChange = (phase: string, idx: number, field: string, val: string) => {
    setMmData(prev => {
      const copy = { ...prev };
      if (!copy[phase]) {
        copy[phase] = Array(8).fill({ h: "", a: "", gh: null, ga: null });
      }
      const games = [...copy[phase]];
      games[idx] = {
        ...games[idx],
        [field]: val === "" ? null : (field.startsWith("g") ? parseInt(val) : val)
      };
      copy[phase] = games;
      return copy;
    });
  };

  const handleSaveMataMata = async () => {
    setMmLoading(true);
    try {
      await setDoc(doc(db, "torneio", "matamata"), mmData);
      showModal(t("adm_mm_saved") || "Mata-mata salvo com sucesso!");
    } catch (err: any) {
      showModal("Erro ao salvar mata-mata: " + err.message);
    } finally {
      setMmLoading(false);
    }
  };

  // Compute stats
  const totalUsers = users.length;
  const totalMatches = matches.length;
  const endedMatches = Object.values(results).filter(r => r.home !== null).length;
  const remainingMatches = totalMatches - endedMatches;
  const totalBUs = Object.keys(businessUnits).length;

  // Sorted lists for admin views
  const allAdmins = Array.from(new Set([...BOOTSTRAP_ADMINS, ...admins]));
  const sortedMatchesForAdmin = [...matches].sort((a, b) => parseKoDate(a.ko).getTime() - parseKoDate(b.ko).getTime());
  const sortedBUsForAdmin = Object.values(businessUnits).sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="tab tab--active">
      <div className="section-title">{t("nav_admin")}</div>

      {recalculating && (
        <div 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "100%", 
            background: "rgba(0,0,0,0.85)", 
            display: "flex", 
            flexDirection: "column",
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 9999 
          }}
        >
          <div className="live-dot" style={{ width: 24, height: 24, marginBottom: 12 }}></div>
          <div style={{ fontFamily: "Unbounded, sans-serif", fontWeight: 700, color: "var(--gold)" }}>
            {t("recalculating_points") || "Recalculando Classificação..."}
          </div>
          <div style={{ color: "var(--muted)", fontSize: ".8rem", marginTop: 8 }}>{recalcProgress}</div>
        </div>
      )}

      {/* Admin Subtabs navigation */}
      <div className="faq-categories" style={{ marginBottom: "16px" }}>
        <button className={`faq-categories__btn ${adminSubTab === "stats" ? "is-active" : ""}`} onClick={() => setAdminSubTab("stats")}>
          📊 {t("adm_sub_stats") || "Estatísticas"}
        </button>
        <button className={`faq-categories__btn ${adminSubTab === "matches" ? "is-active" : ""}`} onClick={() => setAdminSubTab("matches")}>
          ⚽ {t("adm_sub_matches") || "Partidas"}
        </button>
        <button className={`faq-categories__btn ${adminSubTab === "bus" ? "is-active" : ""}`} onClick={() => setAdminSubTab("bus")}>
          🏢 {t("adm_sub_bus") || "Unidades"}
        </button>
        <button className={`faq-categories__btn ${adminSubTab === "matamata" ? "is-active" : ""}`} onClick={() => setAdminSubTab("matamata")}>
          🏆 {t("adm_sub_knockout") || "Mata-Mata"}
        </button>
        <button className={`faq-categories__btn ${adminSubTab === "admins" ? "is-active" : ""}`} onClick={() => setAdminSubTab("admins")}>
          👥 {t("adm_sub_admins") || "Admins"}
        </button>
      </div>

      {/* --- STATS SUB-TAB --- */}
      {adminSubTab === "stats" && (
        <div className="card">
          <div className="admin-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
            <div className="admin-stats__item">
              <div className="admin-stats__number">{totalUsers}</div>
              <div className="admin-stats__label">{t("adm_stats_users")}</div>
            </div>
            <div className="admin-stats__item">
              <div className="admin-stats__number">{endedMatches}</div>
              <div className="admin-stats__label">{t("adm_stats_ended")}</div>
            </div>
            <div className="admin-stats__item">
              <div className="admin-stats__number">{remainingMatches}</div>
              <div className="admin-stats__label">{t("adm_stats_remaining")}</div>
            </div>
            <div className="admin-stats__item">
              <div className="admin-stats__number">{totalBUs}</div>
              <div className="admin-stats__label">{t("adm_stats_units")}</div>
            </div>
          </div>

          <div className="divider" style={{ margin: "20px 0" }}></div>

          {/* Recalculate panel */}
          <div style={{ textAlign: "center" }}>
            <button className="btn" onClick={runRecalculation}>
              🔄 Reprocessar Toda a Classificação
            </button>
            <p style={{ color: "var(--muted)", fontSize: ".68rem", marginTop: 8 }}>
              Isso recalculará os pontos de todos os usuários do banco baseando-se em seus palpites e nos placares oficiais atuais.
            </p>
          </div>
        </div>
      )}

      {/* --- ADMINS SUB-TAB --- */}
      {adminSubTab === "admins" && (
        <div className="card">
          <h3 style={{ fontFamily: "Unbounded, sans-serif", fontSize: ".8rem", marginBottom: 12 }}>Adicionar Administrador</h3>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
            <input 
              className="score-input" 
              style={{ flex: 1, textAlign: "left", padding: "8px", fontSize: "0.75rem" }} 
              placeholder="novo.admin@db1.com.br"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
            />
            <button className="btn btn--sm" onClick={handleAddAdmin}>
              Adicionar
            </button>
          </div>

          <h3 style={{ fontFamily: "Unbounded, sans-serif", fontSize: ".8rem", marginBottom: 12 }}>Administradores Ativos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {allAdmins.map(e => {
              const isBootstrap = BOOTSTRAP_ADMINS.includes(e);
              return (
                <div className="card" key={e} style={{ padding: "10px", marginBottom: "2px", backgroundColor: "rgba(255,255,255,0.01)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                      <div className="leaderboard__avatar" style={{ fontSize: ".9rem", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        ⚙️
                      </div>
                      <div className="leaderboard__name" style={{ fontSize: "0.8rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={e}>
                        {e}
                      </div>
                    </div>
                    <div>
                      {isBootstrap ? (
                        <span className="admin-pill" style={{ backgroundColor: "var(--border)", color: "var(--muted)", fontSize: "0.55rem", padding: "3px 6px" }}>
                          BOOTSTRAP
                        </span>
                      ) : (
                        <button className="btn--danger" style={{ width: 26, height: 26, padding: 0, fontSize: "0.75rem", borderRadius: "4px" }} onClick={() => handleDeleteAdmin(e)}>
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- BUSINESS UNITS SUB-TAB --- */}
      {adminSubTab === "bus" && (
        <div>
          {/* BU form modal */}
          {(isAddingBU || editingBU) && (
            <div className="card" style={{ marginBottom: "16px", border: "1px solid var(--border)" }}>
              <h3 style={{ fontFamily: "Unbounded, sans-serif", fontSize: ".8rem", marginBottom: 12 }}>
                {isAddingBU ? "Adicionar Unidade" : `Editar Unidade: ${bufId}`}
              </h3>
              <div className="form-group">
                <label>Nome da Unidade de Negócio</label>
                <input 
                  type="text" 
                  value={bufNome} 
                  onChange={(e) => setBufNome(e.target.value)} 
                  placeholder="ex: EC - ANYMARKET" 
                />
              </div>
              <div className="form-group">
                <label>Ecossistema</label>
                <select value={bufEcossistema} onChange={(e) => setBufEcossistema(e.target.value)}>
                  <option value="DIGITAL TRANSFORMATION">DIGITAL TRANSFORMATION</option>
                  <option value="E-COMMERCE">E-COMMERCE</option>
                  <option value="TECHFIN">TECHFIN</option>
                  <option value="HOLDING">HOLDING</option>
                  <option value="DB1 LABS">DB1 LABS</option>
                  <option value="CHRISTIAN TECH">CHRISTIAN TECH</option>
                  <option value="OTHERS">OTHERS</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn--sm" onClick={handleSaveBU}>
                  Salvar
                </button>
                <button className="btn btn--sm btn--outline" onClick={() => { setIsAddingBU(false); setEditingBU(null); }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button className="btn btn--sm" onClick={() => openBUForm(null)}>
              ➕ Adicionar Nova BU
            </button>
            <button className="btn btn--sm btn--outline" onClick={handleSeedDefaultBUs}>
              🌱 Restaurar BUs Padrão
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {sortedBUsForAdmin.map((bu) => (
              <div className="card" key={bu.id} style={{ padding: "10px", marginBottom: "2px", backgroundColor: "rgba(255,255,255,0.01)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 240 }}>
                    <span 
                      style={{ 
                        fontSize: ".68rem", 
                        fontWeight: 600, 
                        padding: "3px 8px", 
                        borderRadius: "4px",
                        backgroundColor: bu.bg,
                        color: bu.text,
                        border: `1px solid ${bu.color}33`
                      }}
                    >
                      {bu.label}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>ID: {bu.id}</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="btn btn--sm btn--outline" style={{ width: 30, height: 30, padding: 0 }} onClick={() => openBUForm(bu)}>
                      ✏️
                    </button>
                    <button className="btn--danger" style={{ width: 30, height: 30, padding: 0 }} onClick={() => handleDeleteBU(bu.id, bu.label)}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MATA-MATA SUB-TAB --- */}
      {adminSubTab === "matamata" && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontFamily: "Unbounded, sans-serif", fontSize: ".8rem" }}>Placa do Mata-Mata</h3>
            <button className="btn btn--sm" onClick={handleSaveMataMata} disabled={mmLoading}>
              {mmLoading ? "Salvando..." : "Salvar Configuração"}
            </button>
          </div>

          {MM_FASES.map((f) => {
            const jogos = mmData[f.key] || Array(f.n).fill({ h: "", a: "", gh: null, ga: null });

            return (
              <div key={f.key} style={{ marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                <div style={{ fontFamily: "Unbounded,sans-serif", fontSize: ".68rem", fontWeight: 900, color: "var(--gold)", marginBottom: "7px" }}>
                  {f.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {Array(f.n).fill(null).map((_, idx) => {
                    const j = jogos[idx] || { h: "", a: "", gh: null, ga: null };

                    return (
                      <div key={idx} style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        <input 
                          className="score-input" 
                          style={{ width: "130px", padding: "4px 8px" }} 
                          placeholder="Time Casa"
                          value={j.h || ""}
                          onChange={(e) => handleMmValueChange(f.key, idx, "h", e.target.value)}
                        />
                        <input 
                          className="score-input" 
                          type="number"
                          style={{ width: "42px", textAlign: "center" }} 
                          value={j.gh !== null && j.gh !== undefined ? j.gh : ""}
                          onChange={(e) => handleMmValueChange(f.key, idx, "gh", e.target.value)}
                        />
                        <span style={{ color: "var(--muted)" }}>×</span>
                        <input 
                          className="score-input" 
                          type="number"
                          style={{ width: "42px", textAlign: "center" }} 
                          value={j.ga !== null && j.ga !== undefined ? j.ga : ""}
                          onChange={(e) => handleMmValueChange(f.key, idx, "ga", e.target.value)}
                        />
                        <input 
                          className="score-input" 
                          style={{ width: "130px", padding: "4px 8px" }} 
                          placeholder="Time Fora"
                          value={j.a || ""}
                          onChange={(e) => handleMmValueChange(f.key, idx, "a", e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MATCHES SUB-TAB --- */}
      {adminSubTab === "matches" && (
        <div>
          {/* Config integrations panel */}
          <div className="card" style={{ marginBottom: "12px" }}>
            <h3 style={{ fontFamily: "Unbounded, sans-serif", fontSize: ".8rem", marginBottom: 12 }}>Integração API-Sports</h3>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input 
                className="score-input" 
                style={{ flex: 1, textAlign: "left", padding: "8px", fontSize: "0.75rem" }} 
                placeholder="URL da Cloud Function..."
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
              <button className="btn btn--sm" onClick={handleSaveApiUrl}>
                Salvar URL
              </button>
            </div>
            <button className="btn btn--outline btn--sm" style={{ width: "100%" }} onClick={handleImportFromAPI} disabled={apiLoading}>
              {apiLoading ? "Importando..." : "🌐 Importar Rodada da API Oficial"}
            </button>
          </div>

          {/* Match form card */}
          {(isAddingMatch || editingMatch) && (
            <div className="card" style={{ marginBottom: "16px", border: "1px solid var(--border)" }}>
              <h3 id="match-form-title" style={{ fontFamily: "Unbounded, sans-serif", fontSize: ".8rem", marginBottom: 12 }}>
                {isAddingMatch ? "Adicionar Partida" : `Editar Partida #${mfId}`}
              </h3>
              
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <div className="form-group" style={{ width: "80px", marginBottom: 0 }}>
                  <label>ID</label>
                  <input type="number" value={mfId} onChange={(e) => setMfId(e.target.value)} disabled={!!editingMatch} />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Kickoff (Local)</label>
                  <input type="datetime-local" value={mfKo} onChange={(e) => setMfKo(e.target.value)} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Time Casa (Chave)</label>
                  <input type="text" value={mfHome} onChange={(e) => setMfHome(e.target.value)} placeholder="brazil" />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Time Fora (Chave)</label>
                  <input type="text" value={mfAway} onChange={(e) => setMfAway(e.target.value)} placeholder="argentina" />
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Grupo</label>
                  <input type="text" value={mfGroup} onChange={(e) => setMfGroup(e.target.value)} placeholder="A" />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Filtro Rodada</label>
                  <input type="text" value={mfRod} onChange={(e) => setMfRod(e.target.value)} placeholder="R1" />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Nome Rodada</label>
                  <input type="text" value={mfRound} onChange={(e) => setMfRound(e.target.value)} placeholder="Teste 1" />
                </div>
              </div>

              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="checkbox" id="mf-test-chk" checked={mfTest} onChange={(e) => setMfTest(e.target.checked)} />
                <label htmlFor="mf-test-chk" style={{ cursor: "pointer", marginBottom: 0 }}>Partida de Teste (Simulador)</label>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn--sm" onClick={handleSaveMatch}>
                  Salvar
                </button>
                <button className="btn btn--sm btn--outline" onClick={() => { setIsAddingMatch(false); setEditingMatch(null); }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button className="btn btn--sm" onClick={() => openMatchForm(null)}>
              ➕ Criar Nova Partida
            </button>
            <button className="btn btn--sm btn--outline" onClick={handleRestoreDefaultMatches}>
              🌱 Restaurar Tabela Padrão
            </button>
          </div>

          <div id="admin-matches-list">
            {sortedMatchesForAdmin.map(m => {
              const r = results[m.id];
              const scoreDefined = r && r.home !== null;
              const hs = scoreDefined ? r.home.toString() : "";
              const as = scoreDefined ? r.away.toString() : "";

              const homeFlag = getFlagUrl(m.h);
              const awayFlag = getFlagUrl(m.a);
              const nh = TN(m.h);
              const na = TN(m.a);

              const op = isOpen(m);
              const lk = lockLbl(m);
              
              const statusPill = op ? (
                <span style={{ fontSize: ".62rem", color: "#4ade80", fontWeight: 700 }}>
                  {lk || t("adm_open") || "Aberto"}
                </span>
              ) : scoreDefined ? (
                <span style={{ fontSize: ".62rem", color: "var(--muted)" }}>
                  {t("adm_ended") || "Finalizado"}
                </span>
              ) : (
                <span style={{ fontSize: ".62rem", color: "var(--red)", fontWeight: 700 }}>
                  {t("adm_closed") || "Bloqueado"}
                </span>
              );

              const badge = m.test ? (
                <span className="match-card__tag" style={{ backgroundColor: "#5b21b6", color: "#ddd", padding: "2px 6px", borderRadius: "4px", fontSize: "0.6rem" }}>
                  TESTE
                </span>
              ) : (
                <span className="match-card__tag" style={{ backgroundColor: "var(--border)", color: "var(--muted)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.6rem" }}>
                  Grupo {m.g}
                </span>
              );

              const scoresVal = matchResultInputs[m.id] || { home: "", away: "" };

              return (
                <div className="card" key={m.id} style={{ padding: "10px", marginBottom: "6px", backgroundColor: "rgba(255,255,255,0.01)" }}>
                  {/* Metadata Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "var(--muted)" }}>
                      <strong style={{ color: "var(--text)" }}>#{m.id}</strong>
                      <span>·</span>
                      <span>{fmtDT(m.ko).d} · {fmtDT(m.ko).t} · {m.rod}</span>
                      <span>·</span>
                      {badge}
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      {statusPill}
                    </div>
                  </div>

                  {/* Main Row: Teams & Actions */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    {/* Teams, Flags & Score */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flex: 1, minWidth: "280px", fontSize: "0.85rem" }}>
                      {scoreDefined ? (
                        <>
                          <span style={{ fontWeight: 600, flex: 1, textAlign: "right" }}>
                            {nh} {homeFlag && <img src={homeFlag} style={{ marginLeft: 6, verticalAlign: "middle" }} alt="" />}
                          </span>
                          <span style={{ fontWeight: 700, color: "var(--gold)", fontSize: "1rem", margin: "0 12px" }}>
                            {hs} × {as}
                          </span>
                          <span style={{ fontWeight: 600, flex: 1, textAlign: "left" }}>
                            {awayFlag && <img src={awayFlag} style={{ marginRight: 6, verticalAlign: "middle" }} alt="" />} {na}
                          </span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontWeight: 600, flex: 1, textAlign: "right" }}>
                            {nh} {homeFlag && <img src={homeFlag} style={{ marginLeft: 6, verticalAlign: "middle" }} alt="" />}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", margin: "0 8px" }}>
                            <input 
                              className="score-input" 
                              type="number" 
                              value={scoresVal.home}
                              onChange={(e) => handleScoreResultChange(m.id, "home", e.target.value)}
                              style={{ width: "42px", padding: "4px", textAlign: "center" }} 
                            />
                            <span style={{ color: "var(--muted)" }}>×</span>
                            <input 
                              className="score-input" 
                              type="number" 
                              value={scoresVal.away}
                              onChange={(e) => handleScoreResultChange(m.id, "away", e.target.value)}
                              style={{ width: "42px", padding: "4px", textAlign: "center" }} 
                            />
                          </div>
                          <span style={{ fontWeight: 600, flex: 1, textAlign: "left" }}>
                            {awayFlag && <img src={awayFlag} style={{ marginRight: 6, verticalAlign: "middle" }} alt="" />} {na}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", width: "110px", flexShrink: 0 }}>
                      {scoreDefined ? (
                        <button className="btn--danger" style={{ width: 30, height: 30, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", borderRadius: "4px" }} onClick={() => handleClearMatchResult(m.id)} title={t("adm_clear_score") || "Limpar resultado"}>
                          ✕
                        </button>
                      ) : (
                        <>
                          <button className="btn btn--sm" style={{ width: 30, height: 30, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", borderRadius: "4px" }} onClick={() => handleSaveMatchResult(m.id)} title={t("btn_save") || "Salvar resultado"}>
                            💾
                          </button>
                          <button className="btn btn--sm btn--outline" style={{ width: 30, height: 30, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", borderRadius: "4px", borderColor: "var(--border)" }} onClick={() => openMatchForm(m)} title={t("profile_btn_edit") || "Editar partida"}>
                            ✏️
                          </button>
                          <button className="btn--danger" style={{ width: 30, height: 30, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", borderRadius: "4px" }} onClick={() => handleDeleteMatch(m.id)} title="Remover Partida">
                            🗑
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
