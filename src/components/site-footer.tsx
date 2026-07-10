import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="text-base font-semibold tracking-tight">Launch Business</div>
          <p className="mt-2 text-sm text-muted-foreground">
            AI-powered business consulting with Raghu. Automated suggestions, visual analysis
            and strategic direction in your language.
          </p>
        </div>
        <div className="text-sm">
          <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            Explore
          </div>
          <ul className="space-y-1">
            <li><Link to="/" className="hover:underline">Home</Link></li>
            <li><Link to="/plans" className="hover:underline">Plans</Link></li>
            <li><Link to="/about" className="hover:underline">About & Legal</Link></li>
            <li><Link to="/chat" className="hover:underline">Chat with Raghu</Link></li>
          </ul>
        </div>
        <div className="text-xs text-muted-foreground">
          <div className="mb-2 text-xs uppercase tracking-widest">Important</div>
          <p>
            Launch Business and Raghu provide automated suggestions only. We accept zero
            responsibility for the financial, legal or operational outcomes of your business.
            You retain 100% ownership and liability for any decisions or risks. See{" "}
            <Link to="/about" className="underline">About & Legal</Link> for full terms.
          </p>
          <p className="mt-4">© {new Date().getFullYear()} Launch Business. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
