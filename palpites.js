import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { MX } from "./matches.js";
import { $, FL, TN, isOpen, lockLbl, pSt, pts } from "./helpers.js";
import { state } from "./state.js";
import { getTranslation } from "./i18n.js";

let db;
export function initPalpites(dbInstance) { db = dbInstance; }

export function renderMatches() {
  const el = $("ml"); if (!el) return;
  const sorted = [...MX].filter(m => !m.test).sort((a, b) => {
    if (a.g < b.g) return -1; if (a.g > b.g) return 1;
    if (a.rod < b.rod) return -1; if (a.rod > b.rod) return 1;
    return 0;
  });
  let html = "", lastG = "";
  sorted.forEach(m => {
    if (m.g !== lastG) {
      if (lastG !== "") html += "</div>";
      html += '<div class="section-title" style="margin-top:18px">' + getTranslation("pred_group") + m.g + '</div><div style="display:flex;flex-direction:column;gap:5px">';
      lastG = m.g;
    }
    const r = state.RES[m.id], done = r && r.home !== null, live = r?.live;
    const hs = done ? r.home : "–", as = done ? r.away : "–";
    const st = pSt(m.id, state.PRD, state.RES), pred = state.PRD[m.id];
    const fh = FL(m.h), fa = FL(m.a), nh = TN(m.h), na = TN(m.a);
    let badge = "";
    if (pred) {
      if (st === "e") badge = '<span class="bet-badge bet-badge--exact">' + getTranslation("pred_exact") + '</span>';
      else if (st === "w") badge = '<span class="bet-badge bet-badge--win">' + getTranslation("pred_win") + '</span>';
      else if (st === "l") badge = '<span class="bet-badge bet-badge--loss">' + getTranslation("pred_loss") + '</span>';
      else badge = '<span class="bet-badge bet-badge--pending">⏳ ' + pred.home + '×' + pred.away + '</span>';
    }
    const rodLabel = m.rod === "R1" ? getTranslation("pred_r1") : m.rod === "R2" ? getTranslation("pred_r2") : getTranslation("pred_r3");
    html += '<div class="match-card">' +
      '<div class="match-card__team match-card__team--home"><span class="match-card__flag">' + fh + '</span> ' + nh + '</div>' +
      '<div class="match-card__score">' + (live ? '<span class="live-dot"></span>' : '') + hs + ' × ' + as + '</div>' +
      '<div class="match-card__team match-card__team--away">' + na + ' <span class="match-card__flag">' + fa + '</span></div>' +
      '<div class="match-card__info">' +
      '<div class="mst ' + (done && !live ? "done" : live ? "live" : "") + '">' + (live ? getTranslation("pred_live") : done ? getTranslation("pred_ended") : rodLabel) + '</div>' +
      '<div>' + badge + '</div>' +
      '</div></div>';
  });
  if (lastG !== "") html += "</div>";
  el.innerHTML = html;
}

export function cardPalpite(m) {
  const r = state.RES[m.id], done = r && r.home !== null, pred = state.PRD[m.id], st = pSt(m.id, state.PRD, state.RES);
  const op = isOpen(m), lk = lockLbl(m);
  const fh = FL(m.h), fa = FL(m.a), nh = TN(m.h), na = TN(m.a);
  let badge = "";
  if (pred) {
    if (st === "e") badge = '<span class="bet-badge bet-badge--exact">' + getTranslation("pred_pts_5") + '</span>';
    else if (st === "w") badge = '<span class="bet-badge bet-badge--win">' + getTranslation("pred_pts_3") + '</span>';
    else if (st === "l") badge = '<span class="bet-badge bet-badge--loss">' + getTranslation("pred_pts_0") + '</span>';
    else badge = '<span class="bet-badge bet-badge--pending">' + getTranslation("pred_pending") + '</span>';
  }
  let inp = "";
  if (done) {
    inp = '<div style="font-size:.78rem;color:var(--muted)">' + getTranslation("pred_result") + '<strong style="color:var(--text)">' + r.home + ' × ' + r.away + '</strong></div>';
  } else if (!state.ME) {
    if (op) {
      inp = '<div style="font-size:.76rem;color:var(--muted)">🔒 <a onclick="GT(\'conta\')" style="color:var(--gold);cursor:pointer;text-decoration:underline">' + getTranslation("pred_login_link") + '</a>' + getTranslation("pred_login_text") + '</div>';
    } else {
      inp = '<div style="font-size:.75rem;color:var(--red);font-weight:600">' + getTranslation("pred_closed") + '</div>';
    }
  } else if (op) {
    const pv = pred ? pred.home : "", pa2 = pred ? pred.away : "";
    const btn = pred ? getTranslation("btn_update") : getTranslation("btn_save");
    const lks = lk ? '<span style="font-size:.65rem;color:var(--gold)">' + lk + '</span>' : "";
    inp = '<div class="score-input-row">' + getTranslation("pred_label") + ' <input class="score-input" type="number" min="0" max="20" id="ph' + m.id + '" value="' + pv + '" placeholder="0"> <span style="color:var(--muted)">×</span> <input class="score-input" type="number" min="0" max="20" id="pa' + m.id + '" value="' + pa2 + '" placeholder="0"> <button class="btn btn--sm" onclick="SP(' + m.id + ')">' + btn + '</button>' + lks + '</div>';
  } else {
    const pp = pred ? '<div style="font-size:.7rem;color:var(--muted);margin-top:2px">' + getTranslation("pred_your_label") + '<strong>' + pred.home + ' × ' + pred.away + '</strong></div>' : "";
    inp = '<div style="font-size:.75rem;color:var(--red);font-weight:600">' + getTranslation("pred_closed") + '</div>' + pp;
  }
  const testBorder = m.test ? ";border-color:#6b3fa0" : "";
  const testBadge = m.test ? '<span class="admin-pill" style="background:#6b3fa0;font-size:.48rem;margin-left:5px">' + getTranslation("history_test_badge") + '</span>' : "";
  return '<div class="card" style="padding:13px' + testBorder + '">' +
    '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:5px;margin-bottom:8px">' +
    '<div style="font-weight:700">' + fh + ' ' + nh + ' <span style="color:var(--muted)">×</span> ' + na + ' ' + fa + testBadge + '</div>' +
    '<div style="font-size:.7rem;color:var(--muted)">' + m.d + ' · ' + m.t + ' · ' + m.v + '</div></div>' +
    inp + '<div style="margin-top:6px">' + badge + '</div></div>';
}

export function renderPalpites() {
  const el = $("pc"); if (!el) return;
  const p = state.ME ? pts(state.PRD, state.RES) : 0;
  const mxTest = [...MX].filter(m => m.test).sort((a, b) => new Date(a.ko) - new Date(b.ko));
  const mxCopa = [...MX].filter(m => !m.test).sort((a, b) => new Date(a.ko) - new Date(b.ko));
  let html = "";
  if (state.ME) {
    html += '<div class="alert alert--info" style="margin-bottom:16px">' + getTranslation("pred_your_pts") + '<strong style="color:var(--gold);font-size:1rem">' + p + ' pts</strong>' + getTranslation("pred_your_pts_end") + '</div>';
  } else {
    html += '<div class="alert alert--info" style="margin-bottom:16px">' + getTranslation("pred_not_logged") + '<a onclick="GT(\'conta\')" style="color:var(--gold);cursor:pointer;text-decoration:underline">' + getTranslation("pred_login_account_link") + '</a>' + getTranslation("pred_not_logged_text") + '</div>';
  }
  if (mxTest.length) {
    html += '<div class="section-title" style="color:#c49de8;margin-bottom:10px">' + getTranslation("pred_test_title") + ' <span style="font-size:.6rem;color:var(--muted);font-family:Inter,sans-serif;font-weight:400;text-transform:none;letter-spacing:0">' + getTranslation("pred_test_subtitle") + '</span></div>';
    html += '<div style="display:flex;flex-direction:column;gap:9px;margin-bottom:20px">';
    mxTest.forEach(m => { html += cardPalpite(m); });
    html += '</div>';
  }
  html += '<div class="section-title" style="margin-bottom:10px">⚽ Copa 2026</div>';
  html += '<div style="display:flex;flex-direction:column;gap:9px">';
  mxCopa.forEach(m => { html += cardPalpite(m); });
  html += '</div>';
  el.innerHTML = html;
}

window.SP = async (mid) => {
  if (!state.ME) { alert(getTranslation("alert_need_login")); return; }
  const m = MX.find(x => x.id === mid); if (m && !isOpen(m)) { alert(getTranslation("alert_pred_closed")); return; }
  const h = parseInt($(`ph${mid}`)?.value), a = parseInt($(`pa${mid}`)?.value);
  if (isNaN(h) || isNaN(a) || h < 0 || a < 0) { alert(getTranslation("alert_invalid_score")); return; }
  const btn = document.querySelector(`button[onclick="SP(${mid})"]`);
  if (btn) { btn.classList.add("btn--loading"); btn.disabled = true; }
  try {
    await setDoc(doc(db, "users", state.ME.uid, "predictions", String(mid)), { home: h, away: a });
    state.PRD[mid] = { home: h, away: a };
    const p = pts(state.PRD, state.RES);
    await setDoc(doc(db, "users", state.ME.uid), { pts: p }, { merge: true });
    window.UH();
    renderPalpites();
  } catch (err) {
    alert(getTranslation("alert_error_save") + err.message);
  } finally {
    if (btn) { btn.classList.remove("btn--loading"); btn.disabled = false; }
  }
};

