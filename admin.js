import { doc, setDoc, getDoc, getDocs, deleteDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { MX } from "./matches.js";
import { ADMINS } from "./admins.js";
import { $, TN, FL, isOpen, lockLbl, pts } from "./helpers.js";
import { state } from "./state.js";

let db;
export function initAdmin(dbInstance) { db = dbInstance; }

export function renderAR() {
  const el = $("ar"); if (!el) return;
  el.innerHTML = MX.map(m => {
    const r = state.RES[m.id], hs = r && r.home !== null ? r.home : "", as = r && r.away !== null ? r.away : "";
    const fh = FL(m.h), fa = FL(m.a), nh = TN(m.h), na = TN(m.a);
    const op = isOpen(m), lk = lockLbl(m);
    const sl = op ? `<span style="font-size:.62rem;color:#4ade80;font-weight:700">${lk || "Aberto"}</span>` : r && r.home !== null ? `<span style="font-size:.62rem;color:var(--muted)">✅ Encerrado</span>` : `<span style="font-size:.62rem;color:var(--red);font-weight:700">🔒 Fechado</span>`;
    return `<div class="card" style="padding:10px;margin-bottom:6px"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="flex:1;font-size:.8rem;font-weight:600">${fh} ${nh} × ${na} ${fa} <span style="color:var(--muted);font-size:.7rem">${m.d}</span></span>${sl}<input class="si2" type="number" id="rh${m.id}" value="${hs}" placeholder="0" style="width:42px"><span style="color:var(--muted)">×</span><input class="si2" type="number" id="ra${m.id}" value="${as}" placeholder="0" style="width:42px"><button class="btn btn-sm" onclick="AS(${m.id})">✅ Salvar</button>${r && r.home !== null ? `<button class="btn-r" onclick="AC(${m.id})">🗑</button>` : ""}</div></div>`;
  }).join("");
}

export function renderAL() {
  const el = $("al"); if (!el) return;
  el.innerHTML = ADMINS.map(e => `<div class="lr" style="margin-bottom:5px"><div class="av" style="font-size:.9rem">⚙️</div><div class="ri"><div class="rn">${e}</div></div><span class="apill">ADMIN</span></div>`).join("");
}

export function renderAS() {
  const el = $("as"); if (!el) return;
  const done = Object.values(state.RES).filter(r => r.home !== null).length;
  const un = [...new Set(state.USERS.map(u => u.unit).filter(Boolean))].length;
  el.innerHTML = `<div class="asc"><div class="asn">${state.USERS.length}</div><div class="asl">Participantes</div></div><div class="asc"><div class="asn">${done}</div><div class="asl">Jogos encerrados</div></div><div class="asc"><div class="asn">${MX.length - done}</div><div class="asl">Jogos restantes</div></div><div class="asc"><div class="asn">${un}</div><div class="asl">Unidades ativas</div></div>`;
}

let PS = null;
window.AS = id => {
  const h = parseInt($(`rh${id}`)?.value), a = parseInt($(`ra${id}`)?.value);
  if (isNaN(h) || isNaN(a) || h < 0 || a < 0) { window.SM("⚠️ Placar inválido!", null); return; }
  const m = MX.find(x => x.id === id), nh = TN(m.h), na = TN(m.a);
  PS = { id, h, a };
  window.SM(`Confirmar resultado?<br><br><span style="font-size:1.1rem;font-weight:900;color:var(--gold)">${nh} ${h} × ${a} ${na}</span><br><br><span style="font-size:.75rem;color:var(--muted)">Isso recalcula os pontos de todos.</span>`, async () => {
    await setDoc(doc(db, "results", String(PS.id)), { home: PS.h, away: PS.a, live: false, updatedAt: serverTimestamp() });
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
  await setDoc(doc(db, "results", String(id)), { home: null, away: null, live: false });
};

// INVITES
window.AI = async () => {
  const e = $("iinput")?.value.trim(); if (!e) return;
  $("iinput").value = ""; $("ist").innerHTML = `<span style="color:var(--muted)">Gerando...</span>`; $("ilb").style.display = "none";
  const key = e.toLowerCase();
  const ex = await getDoc(doc(db, "invites", key));
  if (ex.exists()) { $("ist").innerHTML = `<span style="color:var(--gold)">⚠️ E-mail já convidado.</span>`; return; }
  const tok = btoa(key + "|" + Date.now()).replace(/=/g, "");
  await setDoc(doc(db, "invites", key), { email: key, token: tok, status: "pending", invitedAt: serverTimestamp() });
  const link = `${location.origin}${location.pathname}?convite=${encodeURIComponent(tok)}`;
  $("ist").innerHTML = `<span style="color:#4ade80">✅ Convite gerado para ${e}</span>`;
  const box = $("ilb"); box.style.display = "block";
  box.innerHTML = `<div style="background:#0a1a0d;border:1px solid #2d6a4f;border-radius:8px;padding:11px"><div style="font-size:.7rem;color:var(--muted);margin-bottom:6px">Copie o link e envie como preferir:</div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><input readonly value="${link}" onclick="this.select()" style="flex:1;min-width:130px;background:#0f0f0f;border:1px solid var(--border);border-radius:5px;color:var(--gold);font-size:.7rem;padding:5px 8px;font-family:monospace"><button class="btn btn-sm" id="cpb" onclick="navigator.clipboard.writeText('${link}').then(()=>{document.getElementById('cpb').textContent='✅ Copiado!';setTimeout(()=>document.getElementById('cpb').textContent='📋 Copiar',2000)})">📋 Copiar</button></div></div>`;
  loadINV();
};

export async function loadINV() {
  const sn = await getDocs(collection(db, "invites"));
  state.INVS = []; sn.forEach(d => state.INVS.push({ id: d.id, ...d.data() }));
  renderINV();
}

export function renderINV() {
  const el = $("il"); if (!el) return;
  if (!state.INVS.length) { el.innerHTML = `<div style="color:var(--muted);font-size:.78rem;padding:8px 0">Nenhum convite ainda.</div>`; return; }
  const jd = new Set(state.USERS.map(u => (u.email || "").toLowerCase()));
  el.innerHTML = [...state.INVS].sort((a, b) => (b.invitedAt?.seconds || 0) - (a.invitedAt?.seconds || 0)).map(inv => {
    const ok = jd.has(inv.email);
    return `<div class="ir"><div style="font-size:1rem">${ok ? "✅" : "📧"}</div><div class="ie">${inv.email}</div><span class="is ${ok ? "ij" : "ip"}">${ok ? "Entrou" : "Pendente"}</span>${!ok ? `<button class="btn-r" onclick="RI('${inv.email}')">Revogar</button>` : ""}</div>`;
  }).join("");
}

window.RI = async e => {
  await deleteDoc(doc(db, "invites", e.toLowerCase()));
  loadINV();
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
    html += '<div style="margin-bottom:14px"><div style="font-family:Unbounded,sans-serif;font-size:.68rem;font-weight:900;color:var(--gold);margin-bottom:7px">' + f.label + '</div>';
    for (let i = 0; i < f.n; i++) {
      const j = jogos[i] || { h: "", a: "", gh: null, ga: null };
      html += '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:5px">' +
        '<input class="si2" style="width:130px;text-align:left;padding:4px 8px" placeholder="Time casa" id="mm_' + f.key + '_h' + i + '" value="' + (j.h || '') + '">' +
        '<input class="si2" style="width:42px" placeholder="0" id="mm_' + f.key + '_gh' + i + '" value="' + (j.gh !== null ? j.gh : '') + '">' +
        '<span style="color:var(--muted)">×</span>' +
        '<input class="si2" style="width:42px" placeholder="0" id="mm_' + f.key + '_ga' + i + '" value="' + (j.ga !== null ? j.ga : '') + '">' +
        '<input class="si2" style="width:130px;text-align:left;padding:4px 8px" placeholder="Time visitante" id="mm_' + f.key + '_a' + i + '" value="' + (j.a || '') + '">' +
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
  window.SM("✅ Mata-mata salvo!", null);
};
