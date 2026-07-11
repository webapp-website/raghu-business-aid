import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, Info, MessageCircle } from "lucide-react";

const items = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/plans", label: "Plans", Icon: LayoutGrid },
  { to: "/about", label: "About", Icon: Info },
  { to: "/chat", label: "Chat", Icon: MessageCircle },
] as const;

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex w-full max-w-6xl items-stretch justify-around px-2 py-2">
        {items.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: to === "/" }}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
