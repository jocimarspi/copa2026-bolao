import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { MX } from "./matches.js";
import { $, TN, FL } from "./helpers.js";
import { state } from "./state.js";

let db;
export function initTournament(dbInstance) { db = dbInstance; }

export function calcGrupo(g) {
  const times = {};
  const jogos = MX.filter(m => m.g === g && !m.test);
  jogos.forEach(m => {
    [m.h, m.a].forEach(t => { if (!times[t]) times[t] = { t, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 }; });
  });
  jogos.forEach(m => {
    const r = state.RES[m.id]; if (!r || r.home === null) return;
    const h = times[m.h], a = times[m.a];
    h.j++; a.j++; h.gp += r.home; h.gc += r.away; a.gp += r.away; a.gc += r.home;
    h.sg = h.gp - h.gc; a.sg = a.gp - a.gc;
    if (r.home > r.away) { h.v++; h.pts += 3; a.d++; }
    else if (r.home < r.away) { a.v++; a.pts += 3; h.d++; }
    else { h.e++; a.e++; h.pts++; a.pts++; }
  });
  return Object.values(times).sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp);
}

export function renderGrupos() {
  const el = $("t-grupos"); if (!el) return;
  const grps = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  let html = '<div class="gg">';
  grps.forEach(g => {
    const tab = calcGrupo(g);
    html += '<div class="card" style="padding:10px 8px"><div class="gl">GRUPO ' + g + '</div>';
    html += '<table class="gt"><thead><tr><th>Seleção</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>Pts</th></tr></thead><tbody>';
    tab.forEach((t, i) => {
      const cls = i < 2 ? 'style="color:#4ade80"' : i === 2 ? 'style="color:var(--gold)"' : '';
      const nm = TN(t.t), fl = FL(t.t);
      html += '<tr ' + cls + '><td>' + fl + ' ' + nm + '</td><td>' + t.j + '</td><td>' + t.v + '</td><td>' + t.e + '</td><td>' + t.d + '</td><td>' + t.gp + '</td><td>' + t.gc + '</td><td>' + (t.sg > 0 ? '+' : '') + t.sg + '</td><td style="font-weight:900">' + t.pts + '</td></tr>';
    });
    html += '</tbody></table>';
    html += '<div style="font-size:.55rem;color:var(--muted);margin-top:4px">🟢 Classificado &nbsp; 🟡 Melhor 3º</div>';
    html += '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

export function renderMM() {
  const el = $("t-matamata"); if (!el) return;
  getDoc(doc(db, "torneio", "matamata")).then(snap => {
    const mm = snap.exists() ? snap.data() : {};
    const fases = ["oitavas", "quartas", "semis", "final"];
    const nomes = { "oitavas": "⚔️ Oitavas de Final", "quartas": "🏅 Quartas de Final", "semis": "🥈 Semifinais", "final": "🏆 Final" };
    const slots = { "oitavas": 16, "quartas": 8, "semis": 4, "final": 2 };
    let html = "";
    fases.forEach(fase => {
      const jogos = mm[fase] || [];
      const total = slots[fase] / 2;
      html += '<div class="st" style="margin-top:20px">' + nomes[fase] + '</div>';
      html += '<div style="display:flex;flex-direction:column;gap:6px">';
      for (let i = 0; i < total; i++) {
        const jogo = jogos[i] || { h: "A definir", a: "A definir", gh: null, ga: null };
        const done = jogo.gh !== null && jogo.ga !== null;
        const sc = done ? jogo.gh + ' × ' + jogo.ga : '× ';
        html += '<div class="mc">' +
          '<div class="mteam ml">' + jogo.h + '</div>' +
          '<div class="msc" style="font-size:.9rem;min-width:50px">' + sc + '</div>' +
          '<div class="mteam mr">' + jogo.a + '</div>' +
          '<div class="mi"><div class="mst ' + (done ? "done" : "") + '">' +
          (done ? "✅ Encerrado" : "A definir") + '</div></div></div>';
      }
      html += '</div>';
    });
    el.innerHTML = html;
  }).catch(() => { el.innerHTML = '<div style="color:var(--muted);padding:24px;text-align:center">Mata-mata ainda não disponível.</div>'; });
}

export function renderTorneio() {
  renderGrupos();
  $("t-grupos")?.classList.add("on");
  $("t-matamata")?.classList.remove("on");
  document.querySelectorAll("#tab-torneio .fcat")[0]?.classList.add("on");
  document.querySelectorAll("#tab-torneio .fcat")[1]?.classList.remove("on");
}

window.showTorneio = function (sec, btn) {
  document.querySelectorAll(".ts").forEach(s => s.classList.remove("on"));
  document.querySelectorAll("#tab-torneio .fcat").forEach(b => b.classList.remove("on"));
  $("t-" + sec)?.classList.add("on");
  if (btn) btn.classList.add("on");
  if (sec === "grupos") renderGrupos();
  if (sec === "matamata") renderMM();
};
