import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// translations
import en from "./locales/en.json";
import it from "./locales/it.json";
import messagesIt from "./locales/messages.it.json";
import messagesEn from "./locales/messages.en.json";

// types
import type { TLanguageCode } from "./languages";

const LANGUAGE_STORAGE_KEY: string = "expenses-language";

const deviceLanguage: TLanguageCode = navigator.language.startsWith("it")
  ? "it"
  : "en";

const storedLanguage: string | null =
  localStorage.getItem(LANGUAGE_STORAGE_KEY);

const initialLanguage: TLanguageCode =
  storedLanguage === "it" || storedLanguage === "en"
    ? storedLanguage
    : deviceLanguage;

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en, messages: messagesEn,
    },
    it: {
      translation: it, messages: messagesIt,
    },
  },
  lng: initialLanguage,
  ns: ["translation", "messages"],
  defaultNS: "translation",
  fallbackLng: "en",
  supportedLngs: ["it", "en"],
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language: string): void => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  document.documentElement.lang = language;
});

export default i18n;

export const tr = (message: string, values: Record<string, unknown> = {}): string => {
 const match = message.match(/^(.+): inserisci da 1 a (\d+) caratteri\.$/);
 if (match) return tr('{{field}}: inserisci da 1 a {{max}} caratteri.', {field:tr(match[1]), max:match[2]});
 return String(i18n.t(message, { ...values, ns:'messages', keySeparator:false, defaultValue:message }));
};
export const locale = () => i18n.resolvedLanguage === 'it' ? 'it-IT' : 'en-US';

document.documentElement.lang = initialLanguage;
