import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ADMINS } from "./admins.js";
import { UNITS } from "./units.js";
import { $ } from "./helpers.js";
import { state } from "./state.js";

let auth, db;

export function initAuth(authInstance, dbInstance) {
  auth = authInstance;
  db = dbInstance;
}

export const isAdm = e => ADMINS.includes((e || "").toLowerCase());

function SA(msg, cls = "") {
  const el = $("aa");
  if (!el) return;
  el.innerHTML = msg ? `<div class="alert ${cls}">${msg}</div>` : "";
}

window.doLogin = async () => {
  const e = $("le")?.value.trim(), p = $("lp")?.value;
  SA("", "");
  if (!e || !p) { SA("Preencha e-mail e senha!", "ae"); return; }
  try { await signInWithEmailAndPassword(auth, e, p); window.GT("ranking"); }
  catch { SA("E-mail ou senha incorretos 😬", "ae"); }
};

window.doReg = async () => {
  const n = $("rn")?.value.trim(), e = $("re")?.value.trim(), p = $("rp")?.value, em = $("rem")?.value, un = $("ru")?.value;
  SA("");
  if (!n || !e || !p || !un) { SA("Preencha todos os campos!", "ae"); return; }
  const inv = await getDoc(doc(db, "invites", e.toLowerCase()));
  if (!inv.exists()) { SA("🔒 Acesso por convite. E-mail não está na lista — fale com o organizador!", "ae"); return; }
  try {
    const c = await createUserWithEmailAndPassword(auth, e, p);
    await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").then(m => m.updateProfile(c.user, { displayName: n, photoURL: em || "⚽" }));
    await setDoc(doc(db, "users", c.user.uid), { name: n, email: e.toLowerCase(), emoji: em || "⚽", unit: un, pts: 0 });
    await setDoc(doc(db, "invites", e.toLowerCase()), { status: "joined", joinedAt: serverTimestamp() }, { merge: true });
    state.MU = un;
    window.GT("ranking");
  } catch (err) { SA(err.code === "auth/email-already-in-use" ? "E-mail já cadastrado!" : err.message, "ae"); }
};

window.doReset = async () => {
  const e = $("le")?.value.trim(); SA("");
  if (!e) { SA("Digite seu e-mail primeiro 👆", "ae"); return; }
  try { await sendPasswordResetEmail(auth, e); SA("✅ Link enviado! Verifique sua caixa (e spam).", "ao"); }
  catch { SA("E-mail não encontrado.", "ae"); }
};

window.doLogout = async () => {
  await signOut(auth);
  state.PRD = {};
  state.MU = "";
  window.GT("ranking");
};
