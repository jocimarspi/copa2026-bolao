import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { pts } from "../helpers";

interface AccountTabProps {
  setCurrentTab: (tab: string) => void;
}

const EMOJI_OPTIONS = [
  "⚽", "🏆", "🎯", "🔥", "💪", "🦁", "🦅", "🐉", 
  "⚡", "🌟", "🐺", "🦊", "🇧🇷", "🇦🇷", "🏴\u200D󠁢󠁥󠁮󠁧󠁿", "🇫🇷"
];

export default function AccountTab({ setCurrentTab }: AccountTabProps) {
  const { t } = useTranslation();
  const { 
    user, 
    userProfile, 
    loginWithMicrosoft, 
    logout, 
    saveProfile,
    authError,
    setAuthError
  } = useAuth();
  const { businessUnits, predictions, results, matches } = useData();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [emoji, setEmoji] = useState<string>("⚽");
  const [saving, setSaving] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>("");

  // Sync profile values when editing starts or profile changes
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || user?.displayName || "");
      setUnit(userProfile.unit || "");
      setEmoji(userProfile.emoji || "⚽");
    } else if (user) {
      setName(user.displayName || "");
      setUnit("");
      setEmoji("⚽");
    }
  }, [userProfile, user, isEditing]);

  const handleLogin = async () => {
    try {
      await loginWithMicrosoft();
    } catch (err) {
      // Handled in context
    }
  };

  const handleSaveProfile = async () => {
    setLocalError("");
    if (!name.trim()) {
      setLocalError(t("profile_name_placeholder"));
      return;
    }
    if (!unit) {
      setLocalError(t("profile_select_unit"));
      return;
    }

    try {
      setSaving(true);
      await saveProfile(name.trim(), unit, emoji);
      setIsEditing(false);
    } catch (err: any) {
      setLocalError(err.message || "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  // 1. If not logged in, show Login Screen
  if (!user) {
    return (
      <div className="tab tab--active">
        <div className="section-title">{t("login_title")}</div>
        <div style={{ maxWidth: "410px", margin: "0 auto" }}>
          <div className="card">
            {authError && (
              <div className="alert alert--danger" style={{ marginBottom: "12px" }}>
                {t(authError) || authError}
              </div>
            )}
            <div 
              className="alert alert--info" 
              style={{ marginBottom: "20px", fontSize: ".76rem", textAlign: "center" }}
              dangerouslySetInnerHTML={{ __html: t("login_info") }}
            />
            <button 
              className="btn btn--microsoft" 
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onClick={handleLogin}
            >
              <svg width="16" height="16" viewBox="0 0 23 23">
                <path fill="#f35325" d="M0 0h11v11H0z"/>
                <path fill="#81bc06" d="M12 0h11v11H12z"/>
                <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                <path fill="#ffba08" d="M12 12h11v11H12z"/>
              </svg>
              {t("login_btn_microsoft")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. If profile is not complete (no business unit configured), force Profile Completion
  const isProfileIncomplete = !userProfile || !userProfile.unit;

  if (isProfileIncomplete || isEditing) {
    const sortedUnits = Object.values(businessUnits).sort((a, b) => 
      a.label.localeCompare(b.label)
    );

    return (
      <div className="tab tab--active">
        <div className="section-title">
          {isProfileIncomplete ? t("profile_complete_title") : t("profile_edit_title")}
        </div>
        <div style={{ maxWidth: "460px", margin: "0 auto" }}>
          <div className="card">
            {(localError || authError) && (
              <div className="alert alert--danger" style={{ marginBottom: "12px" }}>
                {localError || t(authError) || authError}
              </div>
            )}
            
            {isProfileIncomplete && (
              <div className="alert alert--info" style={{ marginBottom: "12px", fontSize: ".76rem" }}>
                {t("profile_complete_info")}
              </div>
            )}

            <div className="form-group">
              <label>{t("profile_display_name")}</label>
              <input 
                type="text" 
                placeholder={t("profile_name_placeholder")}
                value={name} 
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>{t("profile_unit")}</label>
                <select 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)}
                  disabled={saving}
                >
                  <option value="">{t("profile_select_unit")}</option>
                  {sortedUnits.map((bu) => (
                    <option key={bu.id} value={bu.id}>
                      {bu.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ width: "125px", marginBottom: 0 }}>
                <label>{t("profile_avatar")}</label>
                <select 
                  value={emoji} 
                  onChange={(e) => setEmoji(e.target.value)}
                  disabled={saving}
                >
                  {EMOJI_OPTIONS.map((em) => (
                    <option key={em} value={em}>
                      {em}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              className="btn" 
              style={{ width: "100%" }}
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? "..." : (isProfileIncomplete ? t("profile_save_start") : t("profile_save_changes"))}
            </button>

            <div style={{ textAlign: "center", marginTop: "11px" }}>
              <button 
                className="btn--danger" 
                style={{ width: "100%" }}
                onClick={() => {
                  if (isProfileIncomplete) {
                    logout();
                  } else {
                    setIsEditing(false);
                  }
                }}
                disabled={saving}
              >
                {isProfileIncomplete ? t("profile_cancel_exit") : t("profile_cancel")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Normal profile view (complete)
  const currentPoints = pts(predictions, results, matches);
  const u = businessUnits[userProfile.unit];

  return (
    <div className="tab tab--active">
      <div className="section-title">{t("profile_my_title")}</div>
      <div style={{ maxWidth: "460px", margin: "0 auto" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "13px", marginBottom: "16px" }}>
            <div className="leaderboard__avatar" style={{ width: "52px", height: "52px", fontSize: "1.7rem" }}>
              {userProfile.emoji || "⚽"}
            </div>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {userProfile.name}
              </div>
              <div style={{ color: "var(--muted)", fontSize: ".76rem" }}>
                {user?.email}
              </div>
              {u && (
                <div 
                  style={{ 
                    marginTop: "4px", 
                    display: "inline-block", 
                    padding: "3px 8px", 
                    borderRadius: "4px",
                    fontSize: "0.68rem", 
                    fontWeight: 600,
                    backgroundColor: u.bg,
                    color: u.text
                  }}
                >
                  {u.nome}
                </div>
              )}
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div className="leaderboard__points">{currentPoints}</div>
              <div className="leaderboard__points-label">{t("pts_label")}</div>
            </div>
          </div>

          <div className="divider"></div>

          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginTop: "13px" }}>
            <button className="btn btn--outline btn--sm" onClick={() => setIsEditing(true)}>
              {t("profile_btn_edit")}
            </button>
            <button className="btn btn--outline btn--sm" onClick={() => setCurrentTab("jogos")}>
              {t("profile_btn_predictions")}
            </button>
            <button className="btn--danger" onClick={logout}>
              {t("profile_btn_logout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
