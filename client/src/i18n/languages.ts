export type TLanguageCode = "it" | "en";

export interface ILanguage {
  code: TLanguageCode;
  label: string;
  flag: string;
}

export const AVAILABLE_LANGUAGES: ILanguage[] = [
  {
    code: "it",
    label: "Italiano",
    flag: "🇮🇹",
  },
  {
    code: "en",
    label: "English",
    flag: "🇬🇧",
  },
];
