import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "nayabandhu-theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(KEY, dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-8 w-8 place-items-center rounded-full border border-current/30 opacity-80 transition hover:opacity-100"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function themeInitScript() {
  return `try{if(localStorage.getItem("${KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;
}
