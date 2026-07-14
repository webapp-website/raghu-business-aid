import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
const logoAsset = { url: "/launch-business-logo.png" };

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <img
        src={logoAsset.url}
        alt="Launch Business logo"
        className="h-9 w-9 rounded-full object-cover"
      />
    </div>
  );
}

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="rounded-full">
          <BrandMark />
        </Link>

        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-medium tracking-tight text-foreground"
          style={{ fontFamily: "'Google Sans', 'Google Sans Text', 'Product Sans', 'Roboto', system-ui, sans-serif" }}
        >
          Launch Business
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { to: "/", label: "Home" },
            { to: "/plans", label: "Plans" },
            { to: "/about", label: "About" },
            { to: "/chat", label: "Chat" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "brand-gradient-bg !text-white shadow-sm" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>


        <div className="flex items-center gap-2">
          {email ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
              <Button
                onClick={signOut}
                variant="outline"
                className="rounded-full"
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
