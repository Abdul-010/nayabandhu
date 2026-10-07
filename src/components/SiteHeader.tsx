import { Link } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user } = useAuth();
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
          <Link to="/emergency" className="px-2 opacity-80 hover:opacity-100" activeProps={{ className: "text-gold opacity-100" }}>
            Emergency rights
          </Link>
          <Button asChild size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Link to={user ? "/chat" : "/auth"}>{user ? "Open chat" : "Sign in"}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
