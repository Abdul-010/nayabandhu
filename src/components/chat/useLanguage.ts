import { useEffect, useState } from "react";

const KEY = "nayabandhu-language";

export function useLanguage() {
  const [language, setLanguage] = useState("English");
  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved) setLanguage(saved);
  }, []);
  const set = (l: string) => {
    setLanguage(l);
    window.localStorage.setItem(KEY, l);
  };
  return [language, set] as const;
}
