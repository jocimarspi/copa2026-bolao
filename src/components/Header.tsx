import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  let nameToUse = name;
  if (!nameToUse && email) {
    nameToUse = email.split("@")[0].replace(/\./g, " ");
  }
  if (!nameToUse) return "⚽";
  const parts = nameToUse.trim().split(/\s+/);
  if (parts.length === 0) return "⚽";
  if (parts.length === 1) {
    const single = parts[0];
    return single.length >= 2 ? (single[0] + single[1]).toUpperCase() : single.toUpperCase();
  }
  const first = parts[0][0] || "";
  const last = parts[parts.length - 1][0] || "";
  return (first + last).toUpperCase();
}

function getOrdinalRank(rank: number, lang: string): string {
  if (lang === "en") {
    const j = rank % 10;
    const k = rank % 100;
    if (j === 1 && k !== 11) {
      return `${rank}st place`;
    }
    if (j === 2 && k !== 12) {
      return `${rank}nd place`;
    }
    if (j === 3 && k !== 13) {
      return `${rank}rd place`;
    }
    return `${rank}th place`;
  }
  return `${rank}º lugar`;
}

export default function Header({ currentTab, setCurrentTab }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { user, isAdmin, userProfile } = useAuth();
  const { users } = useData();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const sortedAllUsers = [...users].sort((a, b) => (b.pts || 0) - (a.pts || 0));
  const myRankIndex = user ? sortedAllUsers.findIndex(u => u.uid === user.uid) : -1;
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : null;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const navigateTo = (tab: string) => {
    setCurrentTab(tab);
    setDropdownOpen(false);
  };

  const initials = user ? getInitials(user.displayName, user.email) : "";

  return (
    <header>
      <div className="header__inner">
        <div className="header__logo" onClick={() => navigateTo("ranking")} style={{ cursor: "pointer" }}>
          WE ARE <span>DB1</span>
          <small>{t("logo_sub")}</small>
        </div>

        <nav id="nav">
          <button 
            className={`nav__btn nav__btn--ranking ${currentTab === "ranking" ? "is-active" : ""}`}
            onClick={() => navigateTo("ranking")}
          >
            {t("nav_ranking")}
          </button>
          <button 
            className={`nav__btn nav__btn--games ${currentTab === "jogos" ? "is-active" : ""}`}
            onClick={() => navigateTo("jogos")}
          >
            {t("nav_games")}
          </button>

          <div className="nav__dropdown">
            <button 
              className={`nav__btn nav__btn--more ${["conta", "duvidas", "historico", "admin"].includes(currentTab) ? "is-active" : ""}`}
              id="nav-more-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {t("nav_more")}
            </button>
            {dropdownOpen && (
              <div className="nav__dropdown-content" style={{ display: "block" }}>
                <button className="nav__btn nav__btn--account" onClick={() => navigateTo("conta")}>
                  {t("nav_account")}
                </button>
                <button className="nav__btn nav__btn--faq" onClick={() => navigateTo("duvidas")}>
                  {t("nav_faq")}
                </button>
                <button className="nav__btn nav__btn--history" onClick={() => navigateTo("historico")}>
                  {t("nav_history")}
                </button>
                {isAdmin && (
                  <button className="nav__btn nav__btn--admin is-visible" onClick={() => navigateTo("admin")}>
                    {t("nav_admin")}
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>

        <div id="us" className={user ? "is-logged-in" : ""}>
          {user ? (
            <div className="header__avatar" onClick={() => navigateTo("conta")}>
              {initials}
            </div>
          ) : (
            <button className="btn btn--sm" onClick={() => navigateTo("conta")}>
              {t("btn_login")}
            </button>
          )}
        </div>

        {user && userProfile !== undefined && (
          <div className="header__points" onClick={() => navigateTo("conta")}>
            {myRank !== null && (
              <>
                <span className="header__points-rank">{getOrdinalRank(myRank, i18n.language)}</span>
                <span className="header__points-divider">|</span>
              </>
            )}
            <span className="header__points-value">{userProfile?.pts ?? 0}</span>
            <span className="header__points-label"> {t("pts_label") || "pts"}</span>
          </div>
        )}

        <select id="lang-switcher" value={i18n.language} onChange={handleLanguageChange}>
          <option value="pt-BR">🇧🇷</option>
          <option value="es">🇪🇸</option>
          <option value="en">🇺🇸</option>
        </select>
      </div>
    </header>
  );
}
