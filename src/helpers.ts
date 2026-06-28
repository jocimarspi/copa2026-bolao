import i18n from "./i18n";

// SCORING
export const sgn = n => n > 0 ? 1 : n < 0 ? -1 : 0;

export function pts(preds: Record<string, any>, RES: Record<string, any>, MX?: any[], includeTest = false) {
  let p = 0;
  for (const [mid, pred] of Object.entries(preds || {})) {
    const r = RES[mid]; if (!r || r.home === null) continue;
    const m = MX ? MX.find(x => String(x.id) === String(mid)) : null;
    if (m?.test && !includeTest) continue;
    if (pred.home === r.home && pred.away === r.away) { p += 5; continue; }
    if (sgn(pred.home - pred.away) === sgn(r.home - r.away)) p += 3;
  }
  return p;
}

export function getUserPredictionStats(preds: Record<string, any>, RES: Record<string, any>, MX?: any[], includeTest = false) {
  let ptsVal = 0;
  let exactCount = 0;
  let outcomeCount = 0;
  let wrongCount = 0;

  for (const [mid, pred] of Object.entries(preds || {})) {
    const r = RES[mid]; if (!r || r.home === null || r.home === undefined) continue;
    const m = MX ? MX.find(x => String(x.id) === String(mid)) : null;
    if (m?.test && !includeTest) continue;
    
    if (pred.home === r.home && pred.away === r.away) {
      ptsVal += 5;
      exactCount += 1;
    } else if (sgn(pred.home - pred.away) === sgn(r.home - r.away)) {
      ptsVal += 3;
      outcomeCount += 1;
    } else {
      wrongCount += 1;
    }
  }

  return { pts: ptsVal, exactCount, outcomeCount, wrongCount };
}

export function sortUsers(usersList: any[]) {
  return [...usersList].sort((a, b) => {
    if ((b.pts || 0) !== (a.pts || 0)) {
      return (b.pts || 0) - (a.pts || 0);
    }
    if ((b.exactCount || 0) !== (a.exactCount || 0)) {
      return (b.exactCount || 0) - (a.exactCount || 0);
    }
    if ((b.outcomeCount || 0) !== (a.outcomeCount || 0)) {
      return (b.outcomeCount || 0) - (a.outcomeCount || 0);
    }
    return (a.wrongCount || 0) - (b.wrongCount || 0);
  });
}

export function getUsersWithRanks(sortedUsersList: any[]) {
  let currentRank = 1;
  return sortedUsersList.map((user, idx) => {
    if (idx > 0) {
      const prev = sortedUsersList[idx - 1];
      const isTied = (user.pts || 0) === (prev.pts || 0) &&
                     (user.exactCount || 0) === (prev.exactCount || 0) &&
                     (user.outcomeCount || 0) === (prev.outcomeCount || 0) &&
                     (user.wrongCount || 0) === (prev.wrongCount || 0);
      if (!isTied) {
        currentRank = idx + 1;
      }
    }
    return { ...user, displayRank: currentRank };
  });
}

export function ptsRound(preds, roundName, RES, MX) {
  let p = 0;
  const mids = MX.filter(x => x.round === roundName).map(x => String(x.id));
  for (const mid of mids) {
    const pred = preds[mid], r = RES[mid]; if (!pred || !r || r.home === null) continue;
    if (pred.home === r.home && pred.away === r.away) { p += 5; continue; }
    if (sgn(pred.home - pred.away) === sgn(r.home - r.away)) p += 3;
  }
  return p;
}

export function parseKoDate(ko) {
  if (!ko) return new Date(NaN);
  if (ko instanceof Date) return ko;
  if (ko && typeof ko.toDate === "function") return ko.toDate();
  if (typeof ko === "string") {
    const sliceStart = ko.includes("T") ? ko.indexOf("T") : 10;
    const hasTz = /[Z+-]/.test(ko.slice(sliceStart));
    return new Date(hasTz ? ko : ko + "Z");
  }
  return new Date(ko);
}

export const isOpen = m => Date.now() < parseKoDate(m.ko).getTime() - 1800000;

export function lockLbl(m) {
  const d = parseKoDate(m.ko).getTime() - 1800000 - Date.now();
  if (d <= 0) return null;
  const h = Math.floor(d / 3600000), mn = Math.floor((d % 3600000) / 60000);
  if (h > 24) return `${i18n.t("helper_closes_in")}${Math.floor(d / 86400000)}d`;
  if (h > 0) return `⚠️ ${h}h ${mn}min`;
  return mn > 0 ? `⚠️ ${mn}min!` : i18n.t("helper_closing");
}

export function pSt(mid, PRD, RES) {
  const p = PRD[mid], r = RES[mid];
  if (!p) return null;
  if (!r || r.home === null) return "pend";
  if (p.home === r.home && p.away === r.away) return "e";
  if (sgn(p.home - p.away) === sgn(r.home - r.away)) return "w";
  return "l";
}

export const RI = (i: number) => {
  if (i === 0) return "🥇";
  if (i === 1) return "🥈";
  if (i === 2) return "🥉";
  const rank = i + 1;
  const lang = i18n.language || "pt-BR";
  if (lang === "en") {
    const j = rank % 10;
    const k = rank % 100;
    if (j === 1 && k !== 11) {
      return `${rank}st`;
    }
    if (j === 2 && k !== 12) {
      return `${rank}nd`;
    }
    if (j === 3 && k !== 13) {
      return `${rank}rd`;
    }
    return `${rank}th`;
  }
  return `${rank}º`;
};
export const RC = i => i === 0 ? "leaderboard__rank--gold" : i === 1 ? "leaderboard__rank--silver" : i === 2 ? "leaderboard__rank--bronze" : "";

export function fmtName(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : name;
}

export function TN(key) {
  return i18n.t(key) || key;
}

const _FM = {
  "mexico":"mx","south_africa":"za","south_korea":"kr","czech_rep":"cz",
  "canada":"ca","bosnia":"ba","qatar":"qa","switzerland":"ch",
  "brazil":"br","morocco":"ma","haiti":"ht","scotland":"gb-sct",
  "usa":"us","paraguay":"py","australia":"au","turkey":"tr",
  "germany":"de","curacao":"cw","ivory_coast":"ci","ecuador":"ec",
  "netherlands":"nl","japan":"jp","sweden":"se","tunisia":"tn",
  "belgium":"be","egypt":"eg","iran":"ir","new_zealand":"nz",
  "spain":"es","cape_verde":"cv","saudi_arabia":"sa","uruguay":"uy",
  "france":"fr","senegal":"sn","iraq":"iq","norway":"no",
  "argentina":"ar","algeria":"dz","austria":"at","jordan":"jo",
  "portugal":"pt","dr_congo":"cd","uzbekistan":"uz","colombia":"co",
  "england":"gb-eng","croatia":"hr","ghana":"gh","panama":"pa",
  "united_states_of_america":"us","united_states":"us","czech_republic":"cz","czechia":"cz",
  "bosnia_and_herzegovina":"ba","bosnia_herzegovina":"ba","korea_republic":"kr","cabo_verde":"cv","cape_verde_islands":"cv",
  "democratic_republic_of_the_congo":"cd","congo_dr":"cd",
  "cote_d_ivoire":"ci","cote_divoire":"ci","cote_d'ivoire":"ci",
  "turkiye":"tr","ir_iran":"ir"
};

export const TEAM_FLAGS: Record<string, string> = {
  mexico: "🇲🇽", south_africa: "🇿🇦", south_korea: "🇰🇷", czech_rep: "🇨🇿",
  canada: "🇨🇦", bosnia: "🇧🇦", qatar: "🇶🇦", switzerland: "🇨🇭",
  brazil: "🇧🇷", morocco: "🇲🇦", haiti: "🇭🇹", scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  usa: "🇺🇸", paraguay: "🇵🇾", australia: "🇦🇺", turkey: "🇹🇷",
  germany: "🇩🇪", curacao: "🇨🇼", ivory_coast: "🇨🇮", ecuador: "🇪🇨",
  netherlands: "🇳🇱", japan: "🇯🇵", sweden: "🇸🇪", tunisia: "🇹🇳",
  belgium: "🇧🇪", egypt: "🇪🇬", iran: "🇮🇷", new_zealand: "🇳🇿",
  spain: "🇪🇸", cape_verde: "🇨🇻", saudi_arabia: "🇸🇦", uruguay: "🇺🇾",
  france: "🇫🇷", senegal: "🇸🇳", iraq: "🇮🇶", norway: "🇳🇴",
  argentina: "🇦🇷", algeria: "🇩🇿", austria: "🇦🇹", jordan: "🇯🇴",
  portugal: "🇵🇹", dr_congo: "🇨🇩", uzbekistan: "🇺🇿", colombia: "🇨🇴",
  england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", croatia: "🇭🇷", ghana: "🇬🇭", panama: "🇵🇦",
  tbd: "🏳️"
};

export function getFlagEmoji(key: string): string {
  if (!key) return "🏳️";
  const normalized = key.trim().toLowerCase();
  
  if (TEAM_FLAGS[normalized]) {
    return TEAM_FLAGS[normalized];
  }

  const code = _FM[normalized];
  if (!code) return "🏳️";

  if (code === "gb-eng") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (code === "gb-sct") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";

  if (code.length === 2) {
    const codePoints = code
      .toUpperCase()
      .split("")
      .map(char => 127397 + char.charCodeAt(0));
    try {
      return String.fromCodePoint(...codePoints);
    } catch (_) {
      return "🏳️";
    }
  }

  return "🏳️";
}

export function getFlagUrl(key) {
  const c = _FM[key];
  if (!c) return null;
  const code = c.replace('gb-sct', 'gb').replace('gb-eng', 'gb');
  return `https://flagcdn.com/w20/${code}.png`;
}

export function fmtDT(ko) {
  const d = parseKoDate(ko);
  if (isNaN(d.getTime())) return { d: "", t: "" };

  const locale = i18n.language || "pt-BR";

  const dateStr = d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  const timeStr = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });

  let tzLabel = "";
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZoneName: "short" }).formatToParts(d);
    const tzPart = parts.find(p => p.type === "timeZoneName");
    if (tzPart) tzLabel = ` (${tzPart.value})`;
  } catch (_) {}

  return { d: dateStr, t: timeStr + tzLabel };
}

export function getEcosystemStyles(eco) {
  const e = (eco || "").toUpperCase().trim();
  if (e.includes("CHRISTIAN TECH")) {
    return {
      color: "#a855f7",
      bg: "rgba(168,85,247,.15)",
      text: "#c084fc",
    };
  }
  if (e.includes("TECHFIN")) {
    return {
      color: "#10b981",
      bg: "rgba(16,185,129,.15)",
      text: "#34d399",
    };
  }
  if (e.includes("DIGITAL TRANSFORMATION")) {
    return {
      color: "#3b82f6",
      bg: "rgba(59,130,246,.15)",
      text: "#60a5fa",
    };
  }
  if (e.includes("E-COMMERCE")) {
    return {
      color: "#f47c20",
      bg: "rgba(244,124,32,.15)",
      text: "#f9a55c",
    };
  }
  if (e.includes("HOLDING")) {
    return {
      color: "#06b6d4",
      bg: "rgba(6,182,212,.15)",
      text: "#67e8f9",
    };
  }
  if (e.includes("DB1 LABS")) {
    return {
      color: "#ec4899",
      bg: "rgba(236,72,153,.15)",
      text: "#f472b6",
    };
  }
  return {
    color: "#94a3b8",
    bg: "rgba(148,163,184,.15)",
    text: "#cbd5e1",
  };
}
