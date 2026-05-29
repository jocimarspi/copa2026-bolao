import { UNITS } from "./state.js";
import { $, RI, RC, fmtName, escapeHTML } from "./helpers.js";
import { state } from "./state.js";
import { getTranslation } from "./i18n.js";
import { collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let db;
export function initLeaderboard(dbInstance) {
  db = dbInstance;
}

const expandedUnits = new Set();
const membersCache = {};

export function renderLB() { renderLBG(); renderLBU(); }

// ── Ranking Geral ─────────────────────────────────────────────────────────────
export function renderLBG() {
  const el = $("lb-g"); if (!el) return;
  if (!state.USERS.length) {
    el.innerHTML = `<div style="color:var(--muted);text-align:center;padding:36px">${getTranslation("lb_empty")}</div>`;
    return;
  }
  const s = [...state.USERS].sort((a, b) => (b.pts || 0) - (a.pts || 0)).slice(0, 10);
  el.innerHTML = s.map((u, i) => {
    const me = state.ME && u.uid === state.ME.uid;
    const u2 = UNITS[u.unit];
    const youText = getTranslation("user_you").toLowerCase();
    const escapedName = escapeHTML(u.name);
    const escapedDisplayName = escapeHTML(fmtName(u.name));
    const escapedEmoji = escapeHTML(u.emoji || "⚽");
    return `<div class="leaderboard__row${me ? " leaderboard__row--me" : ""}">
      <div class="leaderboard__rank ${RC(i)}">${RI(i)}</div>
      <div class="leaderboard__avatar">${escapedEmoji}</div>
      <div class="leaderboard__info">
        <div class="leaderboard__name" title="${escapedName}">${escapedDisplayName}${me ? ` <span style="color:var(--gold);font-size:.68rem">(${youText})</span>` : ""}</div>
        ${u2 ? `<div class="leaderboard__unit-tag" style="background:${u2.bg};color:${u2.text}">${u2.label}</div>` : ""}
      </div>
      <div class="leaderboard__points-col">
        <div class="leaderboard__points">${u.pts || 0}</div>
        <div class="leaderboard__points-label">${getTranslation("pts_label")}</div>
      </div>
    </div>`;
  }).join("");
}

// ── Auxiliares de Renderização e Cache ───────────────────────────────────────
function renderMembersHtml(users, meUser) {
  return users.map((u2, j) => {
    const me = meUser && u2.uid === meUser.uid;
    const youText = getTranslation("user_you").toLowerCase();
    const escapedName = escapeHTML(u2.name);
    const escapedDisplayName = escapeHTML(fmtName(u2.name));
    const escapedEmoji = escapeHTML(u2.emoji || "⚽");
    return `<div class="leaderboard__row leaderboard__row--member${me ? " leaderboard__row--me" : ""}">
      <div class="leaderboard__rank ${RC(j)}">${RI(j)}</div>
      <div class="leaderboard__avatar" style="font-size:1rem">${escapedEmoji}</div>
      <div class="leaderboard__info">
        <div class="leaderboard__name" title="${escapedName}" style="font-size:.82rem">${escapedDisplayName}${me ? ` <span style="color:var(--gold);font-size:.65rem">(${youText})</span>` : ""}</div>
      </div>
      <div class="leaderboard__points-col">
        <div class="leaderboard__points" style="font-size:1rem">${u2.pts || 0}</div>
        <div class="leaderboard__points-label">${getTranslation("pts_label")}</div>
      </div>
    </div>`;
  }).join("");
}

async function renderMembersOnDemand(id, unitKey, forceFetch = false) {
  console.log("renderMembersOnDemand chamado:", id, unitKey, "db existe:", !!db);
  const panel = document.getElementById(id);
  if (!panel) return;

  if (membersCache[unitKey] && !forceFetch) {
    panel.innerHTML = renderMembersHtml(membersCache[unitKey], state.ME);
    return;
  }

  if (!panel.innerHTML || panel.innerHTML.trim() === "") {
    panel.innerHTML = `<div style="text-align:center;padding:12px;color:var(--muted);font-size:0.75rem">Carregando participantes...</div>`;
  }

  try {
    // Consulta simples sem ordenar no banco para evitar necessidade de índice composto
    const q = query(
      collection(db, "users"),
      where("unit", "==", unitKey)
    );
    const snap = await getDocs(q);
    const usersInUnit = [];
    snap.forEach(doc => {
      usersInUnit.push({ uid: doc.id, ...doc.data() });
    });

    // Ordenar e extrair os top 5 na memória do cliente
    usersInUnit.sort((a, b) => (b.pts || 0) - (a.pts || 0));
    const topUsers = usersInUnit.slice(0, 5);

    membersCache[unitKey] = topUsers;

    // Buscar o painel atualizado no DOM após o await (evita referências a elementos destruídos/desanexados)
    const activePanel = document.getElementById(id);
    if (activePanel) {
      // Atualizar as contadores e médias no cabeçalho dinamicamente
      const btn = activePanel.previousElementSibling;
      if (btn) {
        const count = usersInUnit.length;
        const totalPts = usersInUnit.reduce((acc, curr) => acc + (curr.pts || 0), 0);
        const avgPts = count ? Math.round(totalPts / count) : 0;

        // Atualiza média e total de pontos
        const ptsCol = btn.querySelector(".leaderboard__points-col");
        if (ptsCol) {
          const avgEl = ptsCol.querySelector(".leaderboard__points");
          if (avgEl) avgEl.textContent = avgPts;

          const totalEl = ptsCol.querySelector(".leaderboard__total-points");
          if (totalEl) totalEl.textContent = `${totalPts} ${getTranslation("lb_total_pts")}`;
        }
      }

      if (usersInUnit.length === 0) {
        if (expandedUnits.has(id)) {
          activePanel.innerHTML = `<div style="text-align:center;padding:12px;color:var(--muted);font-size:0.75rem">Nenhum participante nesta unidade.</div>`;
        }
        return;
      }

      if (expandedUnits.has(id)) {
        activePanel.innerHTML = renderMembersHtml(topUsers, state.ME);
      }
    }
  } catch (err) {
    console.error("Erro ao buscar participantes da unidade:", err);
    const activePanel = document.getElementById(id);
    if (activePanel) {
      activePanel.innerHTML = `<div style="text-align:center;padding:12px;color:var(--red);font-size:0.75rem">Erro ao carregar: ${escapeHTML(err.message || String(err))}</div>`;
    }
  }
}

// ── Ranking por Unidade (Sanfona / Accordion) ─────────────────────────────────
export function renderLBU() {
  const el = $("lb-u"); if (!el) return;

  // Limpar cache local quando renderLBU for chamado por novo snapshot
  for (const key in membersCache) {
    delete membersCache[key];
  }

  // Mapear unidades cadastradas utilizando suas estatísticas pré-calculadas e filtrar as vazias
  const arr = Object.entries(UNITS)
    .filter(([k, v]) => (v.memberCount || 0) > 0)
    .map(([k, v]) => ({
      k,
      u: v,
      avg: v.avg || 0,
      total: v.totalPts || 0,
      count: v.memberCount || 0,
    }))
    .sort((a, b) => b.avg - a.avg);

  if (!arr.length) {
    el.innerHTML = `<div style="color:var(--muted);padding:18px;text-align:center">${getTranslation("lb_units_empty")}</div>`;
    return;
  }

  const mx = arr[0].avg || 1;

  el.innerHTML = arr.map((x, i) => {
    const bw = Math.round((x.avg / mx) * 100);
    const accordionId = `lbu-acc-${i}`;
    const isOpen = expandedUnits.has(accordionId);

    const ecoTag = x.u?.eco
      ? `<span style="font-size:.55rem;font-weight:700;letter-spacing:.03em;color:${x.u.text};background:${x.u.bg};border:1px solid ${x.u.color}33;padding:1px 6px;border-radius:3px;margin-left:6px;vertical-align:middle;white-space:nowrap">${x.u.eco}</span>`
      : "";

    return `<div class="leaderboard__unit-accordion" style="border-left:3px solid ${x.u?.color || "#888"};border-radius:6px;margin-bottom:2px;overflow:hidden">
      <button class="leaderboard__row leaderboard__unit-header" style="width:100%;background:none;border:none;cursor:pointer;text-align:left;padding:0"
        data-onclick="toggleUnitAccordion" data-args='["${accordionId}", "${x.k}"]' aria-expanded="${isOpen ? "true" : "false"}" aria-controls="${accordionId}">
        <div class="leaderboard__rank ${RC(i)}">${RI(i)}</div>
        <div class="leaderboard__info" style="flex:1">
          <div style="font-weight:700;font-size:.88rem;margin-bottom:3px;display:flex;align-items:center;flex-wrap:wrap;gap:2px">
            ${x.u?.label || x.k}${ecoTag}
          </div>
          <div class="leaderboard__bar-bg" style="margin-top:6px">
            <div class="leaderboard__bar" style="width:${bw}%;background:${x.u?.color || "#888"}"></div>
          </div>
        </div>
        <div class="leaderboard__points-col">
          <div class="leaderboard__points" style="font-size:1.3rem">${Math.round(x.avg)}</div>
          <div class="leaderboard__points-label">${getTranslation("lb_avg")}</div>
          <div class="leaderboard__total-points" style="font-size:.6rem;color:var(--muted);margin-top:1px">${x.total} ${getTranslation("lb_total_pts")}</div>
        </div>
        <div class="leaderboard__accordion-arrow" style="font-size:.75rem;color:var(--muted);margin-left:8px;transition:transform .25s${isOpen ? ";transform:rotate(180deg)" : ""}">▼</div>
      </button>
      <div id="${accordionId}" class="leaderboard__members" style="${isOpen ? "display:block" : "display:none"};padding:0 4px 4px">
      </div>
    </div>`;
  }).join("");

  // Manter os accordions que já estavam abertos preenchidos e abertos
  arr.forEach((x, i) => {
    const accordionId = `lbu-acc-${i}`;
    if (expandedUnits.has(accordionId)) {
      renderMembersOnDemand(accordionId, x.k);
    }
  });
}

// ── Toggle de Sanfona ─────────────────────────────────────────────────────────
window.toggleUnitAccordion = function (id, unitKey) {
  console.log("toggleUnitAccordion chamado:", id, unitKey);
  const panel = document.getElementById(id);
  const btn = panel?.previousElementSibling;
  if (!panel || !btn) return;

  const isOpen = panel.style.display !== "none";
  const arrow = btn.querySelector(".leaderboard__accordion-arrow");

  if (isOpen) {
    expandedUnits.delete(id);
    panel.style.display = "none";
    btn.setAttribute("aria-expanded", "false");
    if (arrow) arrow.style.transform = "";
    panel.innerHTML = "";
  } else {
    expandedUnits.add(id);
    panel.style.display = "block";
    btn.setAttribute("aria-expanded", "true");
    if (arrow) arrow.style.transform = "rotate(180deg)";
    
    renderMembersOnDemand(id, unitKey, false);
  }
};
