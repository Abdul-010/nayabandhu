import { useI18n } from "@/lib/i18n";

// The whole site shares one language: changing it here translates every page.
export function useLanguage() {
  const { language, setLanguage } = useI18n();
  return [language, setLanguage] as const;
}
