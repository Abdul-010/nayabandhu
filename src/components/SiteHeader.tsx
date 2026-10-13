import { Link } from "@tanstack/react-router";
import { useT, useI18n } from "@/lib/i18n";
import { Scale } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LANGUAGES } from "@/lib/legal";

export function SiteHeader() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useI18n();
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-gold text-gold">
            <Scale className="h-4 w-4" />
          </span>
          <span className="font-display text-lg">Nayabandhu</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-4">
          <Link to="/roadmap" className="px-2 opacity-80 hover:opacity-100" activeProps={{ className: "text-gold opacity-100" }}>
            {t("Roadmaps")}
          </Link>
          <Link to="/learn" className="px-2 opacity-80 hover:opacity-100" activeProps={{ className: "text-gold opacity-100" }}>
            {t("Learn")}
          </Link>
          <Link to="/analyze" className="px-2 opacity-80 hover:opacity-100" activeProps={{ className: "text-gold opacity-100" }}>
            {t("Documents")}
          </Link>
          <Link to="/emergency" className="px-2 opacity-80 hover:opacity-100" activeProps={{ className: "text-gold opacity-100" }}>
            {t("Emergency rights")}
          </Link>
          <select aria-label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-md border border-gold/40 bg-primary px-2 py-1 text-sm text-primary-foreground">
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <ThemeToggle />
          <Button asChild size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Link to={user ? "/chat" : "/auth"}>{t(user ? "Open chat" : "Sign in")}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
