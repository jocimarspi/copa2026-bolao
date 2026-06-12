import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { pts } from "../helpers";

interface AccountTabProps {
  setCurrentTab: (tab: string) => void;
}

const EMOJI_CATEGORIES = [
  {
    key: "emoji_cat_sports",
    emojis: ["⚽", "🏆", "🥇", "🥈", "🥉", "👑", "🎯", "🔥", "💪", "⚡", "🌟"]
  },
  {
    key: "emoji_cat_cats",
    emojis: ["🐱", "🐈", "🐈‍⬛", "😻", "😸", "🦁", "🐯", "🐆"]
  },
  {
    key: "emoji_cat_animals",
    emojis: [
      "🐶", "🐕", "🦮", "🐕‍🦺", "🐩", "🐺", "🦊", "🦝", "🐴", "🫏", "🐎", "🦄", "🦓", "🦌", "🦬", "🐮", "🐂", "🐃", "🐄", "🐷", "🐖", "🐗", "🐽", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘", "🦣", "🦏", "🦛", "🐭", "🐁", "🐀", "🐹", "🐰", "🐇", "🐿️", "🦫", "🦔", "🦇", "🐻", "🐻‍❄️", "🐨", "🐼", "🦥", "🦦", "🦨", "🦘", "🦡", "🐵", "🐒", "🦍", "🦧",
      "🦅", "🦆", "🦢", "🦉", "🦤", "🦩", "🦚", "🦜", "🕊️", "🐓", "🐔", "🐣", "🐤", "🐥", "🐧", "🪿", "🦃",
      "🐸", "🐊", "🐢", "🦎", "🐍", "🦖", "🦕",
      "🐳", "🐋", "🐬", "🦭", "🐟", "🐠", "🐡", "🦈", "🐙", "🐚", "🪼", "🦀", "🦞", "🦐", "🦑",
      "🐌", "🦋", "🐛", "🐜", "🐝", "🪲", "🐞", "🦗", "🕷️", "🕸️", "🦂", "🦟", "🪰", "🪱", "🪳"
    ]
  },
  {
    key: "emoji_cat_flags",
    emojis: [
      "🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️",
      "🇦🇨", "🇦🇩", "🇦🇪", "🇦🇫", "🇦🇬", "🇦🇮", "🇦🇱", "🇦🇲", "🇦🇴", "🇦🇶", "🇦🇷", "🇦🇸", "🇦🇹", "🇦🇺", "🇦🇼", "🇦🇽", "🇦🇿",
      "🇧🇦", "🇧🇧", "🇧🇩", "🇧🇪", "🇧🇫", "🇧🇬", "🇧🇭", "🇧🇮", "🇧🇯", "🇧🇱", "🇧🇲", "🇧🇳", "🇧🇴", "🇧🇶", "🇧🇷", "🇧🇸", "🇧🇹", "🇧🇻", "🇧🇼", "🇧🇾", "🇧🇿",
      "🇨🇦", "🇨🇨", "🇨🇩", "🇨🇫", "🇨🇬", "🇨🇭", "🇨🇮", "🇨🇰", "🇨🇱", "🇨🇲", "🇨🇳", "🇨🇴", "🇨🇵", "🇨🇷", "🇨🇺", "🇨🇻", "🇨🇼", "🇨🇽", "🇨🇾", "🇨🇿",
      "🇩🇪", "🇩🇬", "🇩🇯", "🇩🇰", "🇩🇲", "🇩🇴", "🇩🇿",
      "🇪🇦", "🇪🇨", "🇪🇪", "🇪🇬", "🇪🇭", "🇪🇷", "🇪🇸", "🇪🇹", "🇪🇺",
      "🇫🇮", "🇫🇯", "🇫🇰", "🇫🇲", "🇫🇴", "🇫🇷",
      "🇬🇦", "🇬🇧", "🇬🇩", "🇬🇪", "🇬🇫", "🇬🇬", "🇬🇭", "🇬🇮", "🇬🇱", "🇬🇲", "🇬🇳", "🇬🇵", "🇬🇶", "🇬🇷", "🇬🇸", "🇬🇹", "🇬🇺", "🇬🇼", "🇬🇾",
      "🇭🇰", "🇭🇲", "🇭🇳", "🇭🇷", "🇭🇹", "🇭🇺",
      "🇮🇨", "🇮🇩", "🇮🇪", "🇮🇱", "🇮🇲", "🇮🇳", "🇮🇴", "🇮🇶", "🇮🇷", "🇮🇸", "🇮🇹",
      "🇯🇪", "🇯🇲", "🇯🇴", "🇯🇵",
      "🇰🇪", "🇰🇬", "🇰🇭", "🇰🇮", "🇰🇲", "🇰🇳", "🇰🇵", "🇰🇷", "🇰🇼", "🇰🇾", "🇰🇿",
      "🇱🇦", "🇱🇧", "🇱🇨", "🇱🇮", "🇱🇰", "🇱🇷", "🇱🇸", "🇱🇹", "🇱🇺", "🇱🇻", "🇱🇾",
      "🇲🇦", "🇲🇨", "🇲🇩", "🇲🇪", "🇲🇫", "🇲🇬", "🇲🇭", "🇲🇰", "🇲🇱", "🇲🇲", "🇲🇳", "🇲🇴", "🇲🇵", "🇲🇶", "🇲🇷", "🇲🇸", "🇲🇹", "🇲🇺", "🇲🇻", "🇲🇼", "🇲🇽", "🇲🇾", "🇲🇿",
      "🇳🇦", "🇳🇨", "🇳🇪", "🇳🇫", "🇳🇬", "🇳🇮", "🇳🇱", "🇳🇴", "🇳🇵", "🇳🇷", "🇳🇺", "🇳🇿",
      "🇴🇲",
      "🇵🇦", "🇵🇪", "🇵🇫", "🇵🇬", "🇵🇭", "🇵🇰", "🇵🇱", "🇵🇲", "🇵🇳", "🇵🇷", "🇵🇸", "🇵🇹", "🇵🇼", "🇵🇾",
      "🇶🇦",
      "🇷🇪", "🇷🇴", "🇷🇸", "🇷🇺", "🇷🇼",
      "🇸🇦", "🇸🇧", "🇸🇨", "🇸🇩", "🇸🇪", "🇸🇬", "🇸🇭", "🇸🇮", "🇸🇯", "🇸🇰", "🇸🇱", "🇸🇲", "🇸🇳", "🇸🇴", "🇸🇷", "🇸🇸", "🇸🇹", "🇸🇻", "🇸🇽", "🇸🇾", "🇸🇿",
      "🇹🇦", "🇹🇨", "🇹🇩", "🇹🇫", "🇹🇬", "🇹🇭", "🇹🇯", "🇹🇰", "🇹🇱", "🇹🇲", "🇹🇳", "🇹🇴", "🇹🇷", "🇹🇹", "🇹🇻", "🇹🇼", "🇹🇿",
      "🇺🇦", "🇺🇬", "🇺🇲", "🇺🇳", "🇺🇸", "🇺🇾", "🇺🇿", "🇻🇦", "🇻🇨", "🇻🇪", "🇻🇬", "🇻🇮", "🇻🇳", "🇻🇺", "🇼🇫", "🇼🇸", "🇽🇰", "🇾🇪", "🇾🇹", "🇿🇦", "🇿🇲", "🇿🇼",
      "🏴\u200d󠁢󠁥󠁮󠁧󠁿", "🏴\u200d󠁢󠁳󠁣󠁴󠁿", "🏴\u200d󠁢󠁷󠁬󠁳󠁿"
    ]
  }
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
    setAuthError,
    isAdmin
  } = useAuth();
  const { businessUnits, predictions, results, matches } = useData();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [emoji, setEmoji] = useState<string>("⚽");
  const [saving, setSaving] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>("");
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>("emoji_cat_sports");

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
    setShowPicker(false);
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

            {/* Centered Avatar Picker */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
              <label style={{ marginBottom: "8px" }}>{t("profile_avatar")}</label>
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                disabled={saving}
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  fontSize: "2.5rem",
                  background: "var(--card2)",
                  border: "2px dashed var(--gold)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  outline: "none"
                }}
                title="Alterar Avatar"
                className="avatar-picker-btn"
              >
                {emoji}
                <div style={{
                  position: "absolute",
                  bottom: "-2px",
                  right: "-2px",
                  background: "var(--gold)",
                  color: "#000",
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
                }}>
                  ✏️
                </div>
              </button>
            </div>

            {/* Expandable Grid Emoji Picker */}
            {showPicker && (
              <div 
                className="emoji-grid-picker" 
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  background: "var(--card2, rgba(255, 255, 255, 0.02))",
                  padding: "12px",
                  marginBottom: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}
              >
                {/* Tabs */}
                <div style={{ display: "flex", gap: "6px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                  {EMOJI_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      style={{
                        flex: 1,
                        padding: "6px 0",
                        borderRadius: "4px",
                        border: "none",
                        background: activeCategory === cat.key ? "var(--gold)" : "rgba(255, 255, 255, 0.05)",
                        color: activeCategory === cat.key ? "#000" : "#fff",
                        fontSize: "1.1rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                      title={t(cat.key)}
                    >
                      {cat.key === "emoji_cat_sports" && "🏆"}
                      {cat.key === "emoji_cat_cats" && "🐱"}
                      {cat.key === "emoji_cat_animals" && "🦁"}
                      {cat.key === "emoji_cat_flags" && "🏳️"}
                    </button>
                  ))}
                </div>

                {/* Grid */}
                <div 
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(8, 1fr)",
                    gap: "8px",
                    maxHeight: "180px",
                    overflowY: "auto",
                    paddingRight: "4px"
                  }}
                >
                  {EMOJI_CATEGORIES.find(c => c.key === activeCategory)?.emojis.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        setEmoji(em);
                      }}
                      style={{
                        fontSize: "1.5rem",
                        background: emoji === em ? "var(--gold)" : "transparent",
                        border: "none",
                        borderRadius: "6px",
                        padding: "4px 0",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      className="emoji-item"
                    >
                      {em}
                    </button>
                  ))}
                </div>
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
                readOnly={!isAdmin}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
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
