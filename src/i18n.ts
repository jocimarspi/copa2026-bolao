import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "./i18n-dictionary";

const resources = {};
Object.entries(translations).forEach(([lang, dict]) => {
  resources[lang] = {
    translation: dict
  };
});

const defaultLang = localStorage.getItem("app_lang") || (
  navigator.language && navigator.language.startsWith("es") ? "es" :
  navigator.language && navigator.language.startsWith("en") ? "en" :
  "pt-BR"
);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLang,
    fallbackLng: "pt-BR",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
