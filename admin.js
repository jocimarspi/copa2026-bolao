import { doc, setDoc, getDoc, getDocs, collection, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ADMINS } from "./admins.js";
import { $, TN, FL, isOpen, lockLbl, pts, fmtDT } from "./helpers.js";
import { state } from "./state.js";
import { getTranslation } from "./i18n.js";

let db;
export function initAdmin(dbInstance) { db = dbInstance; }

export function renderAR() {
  const el = $("ar"); if (!el) return;
  el.innerHTML = state.MX.map(m => {
    const r = state.RES[m.id], hs = r && r.home !== null ? r.home : "", as = r && r.away !== null ? r.away : "";
    const fh = FL(m.h), fa = FL(m.a), nh = TN(m.h), na = TN(m.a);
    const op = isOpen(m), lk = lockLbl(m);
    const sl = op ? `<span style="font-size:.62rem;color:#4ade80;font-weight:700">${lk || getTranslation("adm_open")}</span>` : r && r.home !== null ? `<span style="font-size:.62rem;color:var(--muted)">${getTranslation("adm_ended")}</span>` : `<span style="font-size:.62rem;color:var(--red);font-weight:700">${getTranslation("adm_closed")}</span>`;
    return `<div class="card" style="padding:10px;margin-bottom:6px"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="flex:1;font-size:.8rem;font-weight:600">${fh} ${nh} × ${na} ${fa} <span style="color:var(--muted);font-size:.7rem">${fmtDT(m.ko).d} · ${fmtDT(m.ko).t}</span></span>${sl}<input class="score-input" type="number" id="rh${m.id}" value="${hs}" placeholder="0" style="width:42px"><span style="color:var(--muted)">×</span><input class="score-input" type="number" id="ra${m.id}" value="${as}" placeholder="0" style="width:42px"><button class="btn btn--sm" onclick="AS(${m.id})">${getTranslation("btn_save")}</button>${r && r.home !== null ? `<button class="btn--danger" onclick="AC(${m.id})">🗑</button>` : ""}</div></div>`;
  }).join("");
}

export function renderAL() {
  const el = $("al"); if (!el) return;
  el.innerHTML = ADMINS.map(e => `<div class="leaderboard__row" style="margin-bottom:5px"><div class="leaderboard__avatar" style="font-size:.9rem">⚙️</div><div class="leaderboard__info"><div class="leaderboard__name">${e}</div></div><span class="admin-pill">ADMIN</span></div>`).join("");
}

export function renderAS() {
  const el = $("as"); if (!el) return;
  const done = Object.values(state.RES).filter(r => r.home !== null).length;
  const un = [...new Set(state.USERS.map(u => u.unit).filter(Boolean))].length;
  el.innerHTML = `<div class="admin-stats__item"><div class="admin-stats__number">${state.USERS.length}</div><div class="admin-stats__label">${getTranslation("adm_stats_users")}</div></div><div class="admin-stats__item"><div class="admin-stats__number">${done}</div><div class="admin-stats__label">${getTranslation("adm_stats_ended")}</div></div><div class="admin-stats__item"><div class="admin-stats__number">${state.MX.length - done}</div><div class="admin-stats__label">${getTranslation("adm_stats_remaining")}</div></div><div class="admin-stats__item"><div class="admin-stats__number">${un}</div><div class="admin-stats__label">${getTranslation("adm_stats_units")}</div></div>`;
}

let PS = null;
window.AS = id => {
  const h = parseInt($(`rh${id}`)?.value), a = parseInt($(`ra${id}`)?.value);
  if (isNaN(h) || isNaN(a) || h < 0 || a < 0) { window.SM(getTranslation("adm_invalid_score"), null); return; }
  const m = state.MX.find(x => x.id === id), nh = TN(m.h), na = TN(m.a);
  PS = { id, h, a };
  window.SM(`${getTranslation("adm_confirm_res")}<br><br><span style="font-size:1.1rem;font-weight:900;color:var(--gold)">${nh} ${h} × ${a} ${na}</span><br><br><span style="font-size:.75rem;color:var(--muted)">${getTranslation("adm_recalc_warning")}</span>`, async () => {
    await setDoc(doc(db, "results", String(PS.id)), { 
      home: PS.h, 
      away: PS.a, 
      live: false, 
      kickoffTime: new Date(m.ko),
      updatedAt: serverTimestamp() 
    });
    const sn = await getDocs(collection(db, "users"));
    for (const ud of sn.docs) {
      const ps = await getDocs(collection(db, "users", ud.id, "predictions"));
      const pp = {}; ps.forEach(d => { pp[d.id] = d.data(); });
      await setDoc(doc(db, "users", ud.id), { pts: pts(pp, state.RES) }, { merge: true });
    }
    PS = null;
  });
};

window.AC = async id => {
  const m = state.MX.find(x => x.id === id);
  await setDoc(doc(db, "results", String(id)), { 
    home: null, 
    away: null, 
    live: false,
    kickoffTime: m ? new Date(m.ko) : null
  });
};

// MATA-MATA ADMIN
const MM_FASES = [
  { key: "oitavas", label: "Oitavas de Final", n: 8 },
  { key: "quartas", label: "Quartas de Final", n: 4 },
  { key: "semis", label: "Semifinais", n: 2 },
  { key: "final", label: "Final", n: 1 }
];
let MM_DATA = {};

export async function loadMM() {
  try { const s = await getDoc(doc(db, "torneio", "matamata")); if (s.exists()) MM_DATA = s.data(); } catch (e) { }
  renderMMA();
}

function renderMMA() {
  const el = $("mm-admin"); if (!el) return;
  let html = "";
  MM_FASES.forEach(f => {
    const jogos = MM_DATA[f.key] || Array(f.n).fill({ h: "", a: "", gh: null, ga: null });
    html += '<div style="margin-bottom:14px"><div style="font-family:Unbounded,sans-serif;font-size:.68rem;font-weight:900;color:var(--gold);margin-bottom:7px">' + getTranslation(f.key) + '</div>';
    for (let i = 0; i < f.n; i++) {
      const j = jogos[i] || { h: "", a: "", gh: null, ga: null };
      html += '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:5px">' +
        '<input class="score-input" style="width:130px;text-align:left;padding:4px 8px" placeholder="' + getTranslation("adm_home_team") + '" id="mm_' + f.key + '_h' + i + '" value="' + (j.h || '') + '">' +
        '<input class="score-input" style="width:42px" placeholder="0" id="mm_' + f.key + '_gh' + i + '" value="' + (j.gh !== null ? j.gh : '') + '">' +
        '<span style="color:var(--muted)">×</span>' +
        '<input class="score-input" style="width:42px" placeholder="0" id="mm_' + f.key + '_ga' + i + '" value="' + (j.ga !== null ? j.ga : '') + '">' +
        '<input class="score-input" style="width:130px;text-align:left;padding:4px 8px" placeholder="' + getTranslation("adm_away_team") + '" id="mm_' + f.key + '_a' + i + '" value="' + (j.a || '') + '">' +
        '</div>';
    }
    html += '</div>';
  });
  el.innerHTML = html;
}

window.saveMM = async () => {
  const data = {};
  MM_FASES.forEach(f => {
    data[f.key] = [];
    for (let i = 0; i < f.n; i++) {
      const h = $('mm_' + f.key + '_h' + i)?.value.trim() || "A definir";
      const a = $('mm_' + f.key + '_a' + i)?.value.trim() || "A definir";
      const ghv = $('mm_' + f.key + '_gh' + i)?.value;
      const gav = $('mm_' + f.key + '_ga' + i)?.value;
      const gh = ghv !== "" ? parseInt(ghv) : null;
      const ga = gav !== "" ? parseInt(gav) : null;
      data[f.key].push({ h, a, gh, ga });
    }
  });
  await setDoc(doc(db, "torneio", "matamata"), data);
  MM_DATA = data;
  window.SM(getTranslation("adm_mm_saved"), null);
};

// GERENCIAMENTO DE PARTIDAS
export function renderAM() {
  const el = $("admin-matches-list"); if (!el) return;
  el.innerHTML = state.MX.map(m => {
    const fh = FL(m.h), fa = FL(m.a), nh = TN(m.h), na = TN(m.a);
    const badge = m.test ? `<span class="match-card__tag" style="background:#5b21b6;color:#ddd;padding:2px 6px;border-radius:4px;font-size:0.6rem">TESTE</span>` : `<span class="match-card__tag" style="background:var(--border);color:var(--muted);padding:2px 6px;border-radius:4px;font-size:0.6rem">Grupo ${m.g}</span>`;
    return `
      <div class="card" style="padding:10px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(255,255,255,0.01)">
        <div style="display:flex;flex-direction:column;gap:4px;flex:1">
          <div style="display:flex;align-items:center;gap:6px;font-size:0.8rem;font-weight:600">
            <span>${m.id}.</span>
            ${fh} ${nh} × ${na} ${fa}
            ${badge}
          </div>
          <div style="color:var(--muted);font-size:0.7rem">
            ${fmtDT(m.ko).d} · ${fmtDT(m.ko).t} · ${m.rod}
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn--sm" style="padding:4px 8px" onclick="showMatchForm(${m.id})">✏️</button>
          <button class="btn--danger" style="padding:4px 8px;border-radius:4px" onclick="deleteMatch(${m.id})">🗑</button>
        </div>
      </div>
    `;
  }).join("");
}

window.showMatchForm = (id) => {
  const container = $("match-form-container");
  if (!container) return;
  
  if (id) {
    const m = state.MX.find(x => x.id === id);
    if (!m) return;
    $("match-form-title").innerText = "Editar Partida #" + id;
    $("mf-id").value = m.id;
    $("mf-num").value = m.id;
    $("mf-num").disabled = true;
    $("mf-home").value = m.h;
    $("mf-away").value = m.a;
    $("mf-group").value = m.g || "";
    $("mf-rod").value = m.rod || "";
    $("mf-test").checked = !!m.test;
    
    if (m.ko) {
      try {
        const d = new Date(m.ko);
        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        $("mf-ko").value = iso;
      } catch (e) {
        $("mf-ko").value = "";
      }
    } else {
      $("mf-ko").value = "";
    }
  } else {
    $("match-form-title").innerText = "Adicionar Partida";
    $("mf-id").value = "";
    $("mf-num").value = "";
    $("mf-num").disabled = false;
    $("mf-home").value = "";
    $("mf-away").value = "";
    $("mf-group").value = "";
    $("mf-rod").value = "";
    $("mf-test").checked = false;
    $("mf-ko").value = "";
  }
  container.style.display = "block";
};

window.hideMatchForm = () => {
  const container = $("match-form-container");
  if (container) container.style.display = "none";
};

window.saveMatch = async () => {
  const idStr = $("mf-id").value;
  const numVal = parseInt($("mf-num").value);
  const home = $("mf-home").value.trim().toLowerCase();
  const away = $("mf-away").value.trim().toLowerCase();
  const group = $("mf-group").value.trim().toUpperCase();
  const rod = $("mf-rod").value.trim().toUpperCase();
  const test = $("mf-test").checked;
  const koVal = $("mf-ko").value;
  
  if (isNaN(numVal) || numVal <= 0) { alert("ID do jogo inválido!"); return; }
  if (!home || !away) { alert("Preencha os times!"); return; }
  if (!koVal) { alert("Preencha a data do kickoff!"); return; }
  
  const ko = new Date(koVal).toISOString();
  
  const mData = {
    g: group,
    rod: rod,
    h: home,
    a: away,
    ko: ko,
  };
  if (test) mData.test = true;
  
  try {
    await setDoc(doc(db, "matches", String(numVal)), mData);
    window.hideMatchForm();
    window.SM("Partida salva com sucesso!", null);
  } catch (e) {
    alert("Erro ao salvar partida: " + e.message);
  }
};

window.deleteMatch = async (id) => {
  window.SM(`Deseja realmente remover a partida #${id}? Esta ação é irreversível e removerá também palpites e resultados deste jogo.`, async () => {
    try {
      await deleteDoc(doc(db, "matches", String(id)));
      await deleteDoc(doc(db, "results", String(id)));
      window.SM("Partida removida com sucesso!", null);
    } catch (e) {
      alert("Erro ao deletar partida: " + e.message);
    }
  });
};

window.confirmResetMatches = () => {
  window.SM("Deseja realmente restaurar todas as partidas padrão do arquivo? Isso substituirá as modificações atuais no banco de dados.", async () => {
    try {
      const { DEFAULT_MATCHES: defaultMatches } = await import("./state.js");
      for (const m of defaultMatches) {
        const mData = {
          g: m.g || "",
          rod: m.rod || "",
          h: m.h || "",
          a: m.a || "",
          ko: m.ko || "",
        };
        if (m.test !== undefined) mData.test = m.test;
        if (m.round !== undefined) mData.round = m.round;
        await setDoc(doc(db, "matches", String(m.id)), mData);
      }
      window.SM("Partidas restauradas com sucesso!", null);
    } catch (e) {
      alert("Erro ao restaurar partidas: " + e.message);
    }
  });
};

export async function loadApiUrl() {
  const el = $("mf-api-url");
  if (!el) return;
  try {
    const s = await getDoc(doc(db, "system", "config"));
    if (s.exists() && s.data().apiUrl) {
      el.value = s.data().apiUrl;
    } else {
      el.value = "";
    }
  } catch (e) {
    console.error("Erro ao carregar URL da API:", e);
  }
}

window.saveApiUrl = async () => {
  const url = $("mf-api-url")?.value.trim() || "";
  try {
    await setDoc(doc(db, "system", "config"), { apiUrl: url }, { merge: true });
    window.SM(getTranslation("adm_api_url_saved") || "URL salva com sucesso!", null);
  } catch (e) {
    alert("Erro ao salvar URL: " + e.message);
  }
};

window.importMatchesFromAPI = async () => {
  const urlEl = $("mf-api-url");
  const url = urlEl ? urlEl.value.trim() : "";
  if (!url) {
    window.SM("Por favor, configure e salve a URL da Cloud Function primeiro.", null);
    return;
  }

  const confirmMsg = getTranslation("adm_import_confirm") ||
    "Deseja realmente importar as partidas da API oficial? Isso irá atualizar ou adicionar jogos na coleção 'matches'.";

  window.SM(confirmMsg, async () => {
    try {
      const btn = document.querySelector('button[onclick="importMatchesFromAPI()"]');
      let originalText = "";
      if (btn) {
        originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = "⏳ Importando...";
      }

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }

      const count = data.count || 0;
      let successMsg = getTranslation("adm_import_success") ||
        "Partidas importadas com sucesso! {count} jogos atualizados.";
      successMsg = successMsg.replace("{count}", count);

      window.SM(successMsg, () => {
        window.location.reload();
      });
    } catch (e) {
      const btn = document.querySelector('button[onclick="importMatchesFromAPI()"]');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = "🌐 Importar da API";
      }
      alert("Erro ao importar partidas: " + e.message);
    }
  });
};
