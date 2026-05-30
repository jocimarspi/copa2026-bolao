import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ModalProvider, useModal } from "./contexts/ModalContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DataProvider, useData } from "./contexts/DataContext";
import Header from "./components/Header";
import LeaderboardTab from "./components/LeaderboardTab";
import MatchesTab from "./components/MatchesTab";
import AccountTab from "./components/AccountTab";
import FaqTab from "./components/FaqTab";
import HistoryTab from "./components/HistoryTab";
import AdminTab from "./components/AdminTab";

function MainAppLayout() {
  const { t } = useTranslation();
  const { user, userProfile, isAdmin, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();
  const [currentTab, setCurrentTab] = useState<string>("ranking");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  const isProfileIncomplete = !authLoading && user && (!userProfile || !userProfile.unit);

  // Force incomplete profiles to the account tab
  useEffect(() => {
    if (isProfileIncomplete) {
      setCurrentTab("conta");
    }
  }, [isProfileIncomplete]);

  if (authLoading || dataLoading) {
    return (
      <div 
        style={{ 
          height: "100vh", 
          display: "flex", 
          flexDirection: "column",
          alignItems: "center", 
          justifyContent: "center",
          backgroundColor: "var(--bg)"
        }}
      >
        <div className="live-dot" style={{ width: 24, height: 24, marginBottom: 12 }}></div>
        <div style={{ fontFamily: "Unbounded, sans-serif", fontSize: "0.8rem", color: "var(--muted)" }}>
          Carregando Bolão Copa 2026...
        </div>
      </div>
    );
  }

  const navigateTo = (tab: string) => {
    setCurrentTab(tab);
    setMobileDrawerOpen(false);
  };

  const renderActiveTab = () => {
    // Force profile complete if incomplete
    if (isProfileIncomplete) {
      return <AccountTab setCurrentTab={setCurrentTab} />;
    }

    switch (currentTab) {
      case "ranking":
        return <LeaderboardTab />;
      case "jogos":
        return <MatchesTab setCurrentTab={setCurrentTab} />;
      case "conta":
        return <AccountTab setCurrentTab={setCurrentTab} />;
      case "duvidas":
        return <FaqTab />;
      case "historico":
        return <HistoryTab />;
      case "admin":
        return isAdmin ? <AdminTab /> : <LeaderboardTab />;
      default:
        return <LeaderboardTab />;
    }
  };

  return (
    <div className="app-container">
      {/* 1. Header component */}
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* 2. Main content container */}
      <main className="container">
        {renderActiveTab()}
      </main>

      {/* 3. Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`bottom-nav__btn nav__btn nav__btn--ranking ${currentTab === "ranking" ? "is-active" : ""}`}
          onClick={() => navigateTo("ranking")}
          disabled={!!isProfileIncomplete}
        >
          <span className="bottom-nav__icon">🏆</span>
          <span className="bottom-nav__label">{t("nav_ranking_label")}</span>
        </button>
        <button 
          className={`bottom-nav__btn nav__btn nav__btn--games ${currentTab === "jogos" ? "is-active" : ""}`}
          onClick={() => navigateTo("jogos")}
          disabled={!!isProfileIncomplete}
        >
          <span className="bottom-nav__icon">⚽</span>
          <span className="bottom-nav__label">{t("nav_games_label")}</span>
        </button>
        <button 
          className={`bottom-nav__btn nav__btn nav__btn--account ${currentTab === "conta" ? "is-active" : ""}`}
          onClick={() => navigateTo("conta")}
        >
          <span className="bottom-nav__icon">👤</span>
          <span className="bottom-nav__label">{t("nav_account_label")}</span>
        </button>
        <button 
          className={`bottom-nav__btn ${["duvidas", "historico", "admin"].includes(currentTab) ? "is-active" : ""}`}
          id="mobile-menu-btn"
          onClick={() => setMobileDrawerOpen(true)}
          disabled={!!isProfileIncomplete}
        >
          <span className="bottom-nav__icon">☰</span>
          <span className="bottom-nav__label">{t("nav_menu_label")}</span>
        </button>
      </nav>

      {/* 4. Mobile Drawer Menu (Sandwich) */}
      <div 
        id="mobile-drawer" 
        className={`drawer ${mobileDrawerOpen ? "is-open" : ""}`}
      >
        <div className="drawer__overlay" onClick={() => setMobileDrawerOpen(false)} />
        <div className="drawer__content">
          <div className="drawer__header">
            <div className="drawer__title">{t("nav_menu_label")}</div>
            <button className="drawer__close" onClick={() => setMobileDrawerOpen(false)}>×</button>
          </div>
          <div className="drawer__body">
            <button 
              className={`drawer__btn nav__btn nav__btn--faq ${currentTab === "duvidas" ? "is-active" : ""}`}
              onClick={() => navigateTo("duvidas")}
            >
              <span className="drawer__btn-icon">❓</span>
              <span className="drawer__btn-text">{t("nav_faq_label")}</span>
            </button>
            <button 
              className={`drawer__btn nav__btn nav__btn--history ${currentTab === "historico" ? "is-active" : ""}`}
              onClick={() => navigateTo("historico")}
            >
              <span className="drawer__btn-icon">📅</span>
              <span className="drawer__btn-text">{t("nav_history_label")}</span>
            </button>
            {isAdmin && (
              <button 
                className={`drawer__btn nav__btn nav__btn--admin drawer__btn--admin is-visible ${currentTab === "admin" ? "is-active" : ""}`}
                onClick={() => navigateTo("admin")}
                id="drawer-nav-adm"
              >
                <span className="drawer__btn-icon">⚙️</span>
                <span className="drawer__btn-text">{t("nav_admin_label")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ModalProvider>
      <AuthProvider>
        <DataProvider>
          <MainAppLayout />
        </DataProvider>
      </AuthProvider>
    </ModalProvider>
  );
}
