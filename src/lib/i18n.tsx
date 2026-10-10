import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const LANG_KEY = "nayabandhu-language";
const CACHE_PREFIX = "nayabandhu-tr-";
const HTML_LANG: Record<string, string> = { English: "en", Kannada: "kn", Hindi: "hi", Tamil: "ta", Telugu: "te", Malayalam: "ml" };

type Ctx = { language: string; setLanguage: (l: string) => void; t: (s: string) => string };
const I18nContext = createContext<Ctx>({ language: "English", setLanguage: () => {}, t: (s) => s });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState("English");
  const [dict, setDict] = useState<Record<string, string>>({});
  const pending = useRef<Set<string>>(new Set());
  const inflight = useRef<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[language] ?? "en";
    pending.current.clear();
    inflight.current.clear();
    if (language === "English") return setDict({});
    try {
      setDict(JSON.parse(window.localStorage.getItem(CACHE_PREFIX + language) || "{}"));
    } catch {
      setDict({});
    }
  }, [language]);

  const flush = useCallback(async (lang: string) => {
    const strings = [...pending.current].filter((s) => !inflight.current.has(s)).slice(0, 80);
    strings.forEach((s) => { pending.current.delete(s); inflight.current.add(s); });
    if (!strings.length) return;
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, strings }),
      });
      if (!res.ok) return;
      const { translations } = (await res.json()) as { translations: string[] };
      setDict((prev) => {
        const next = { ...prev };
        strings.forEach((s, i) => { if (translations[i]) next[s] = translations[i]; });
        window.localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(next));
        return next;
      });
    } finally {
      strings.forEach((s) => inflight.current.delete(s));
      if (pending.current.size) timer.current = setTimeout(() => void flush(lang), 50);
    }
  }, []);

  const t = useCallback(
    (s: string) => {
      if (language === "English" || !s) return s;
      const hit = dict[s];
      if (hit) return hit;
      if (typeof window !== "undefined" && !inflight.current.has(s) && !pending.current.has(s)) {
        pending.current.add(s);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(language), 30);
      }
      return s;
    },
    [language, dict, flush],
  );

  const setLanguage = (l: string) => {
    setLang(l);
    window.localStorage.setItem(LANG_KEY, l);
  };

  return <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;
