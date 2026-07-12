import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="text-base font-semibold tracking-tight">Launch Business</div>
        <ul className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <li><Link to="/" className="hover:text-foreground">Home</Link></li>
          <li><Link to="/plans" className="hover:text-foreground">Plans</Link></li>
          <li><Link to="/about" className="hover:text-foreground">About</Link></li>
          <li><Link to="/chat" className="hover:text-foreground">Chat</Link></li>
        </ul>
      </div>
    </footer>
  );
}
