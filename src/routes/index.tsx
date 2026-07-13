import { createFileRoute, Link } from "@tanstack/react-router";
import { LANGUAGES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Launch Business — Meet Raghu, your AI business consultant" },
      {
        name: "description",
        content:
          "Raghu analyzes your business, asks the right questions and generates visual and text suggestions to help you launch and grow.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="bg-background">
      {/* Hero — plain background, colorful buttons */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full brand-gradient-bg" />
            AI-powered business consulting
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Meet <span className="brand-gradient-text">Raghu</span>, your AI business consultant.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Raghu asks the right questions, analyzes photos of your store, product or layout,
            and generates visual and text-based suggestions to help you launch and grow — in
            English, తెలుగు, हिंदी, தமிழ் and മലയാളം.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full brand-gradient-bg px-7 text-white hover:opacity-90">
              <Link to="/plans">See plans</Link>
            </Button>
            <Button asChild size="lg" className="rounded-full brand-gradient-bg px-7 text-white hover:opacity-90">
              <Link to="/chat">Try the chat</Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {LANGUAGES.map((l) => (
              <span
                key={l.code}
                className="rounded-full brand-gradient-bg px-3 py-1 text-xs font-medium text-white shadow-sm"
              >
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Deep discovery",
              body: "Raghu asks about your business name, category, market and roadblocks before advising.",
            },
            {
              title: "Visual & web analysis",
              body: "Upload photos or share your website URL — Raghu analyses your storefront, product or app.",
            },
            {
              title: "Generated suggestions",
              body: "Raghu creates AI-generated visuals to demonstrate layout, branding and product ideas.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 h-10 w-10 rounded-full brand-gradient-bg" aria-hidden="true" />
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center rounded-3xl border border-border brand-gradient-soft-bg p-10 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Ready to talk to Raghu?</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Pick a plan, subscribe securely with Razorpay, and start chatting in your language.
          </p>
          <Button asChild size="lg" className="mt-6 rounded-full brand-gradient-bg px-8 text-white hover:opacity-90">
            <Link to="/plans">View subscription plans</Link>
          </Button>
        </div>

        {/* Legal disclaimer */}
        <div className="mt-16 rounded-2xl border border-border bg-muted/40 p-5 text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Disclaimer:</strong> This automated website tool
          does not provide professional financial or legal advice. All business decisions are
          made solely at the user's risk, with no guarantees of success or revenue. AI outputs
          may contain errors, and users must verify all generated content. By paying and using
          this software, you agree that the platform and its developers hold zero liability for
          any business losses or financial damages. See our{" "}
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy & Liability Policy
          </Link>
          .
        </div>
      </section>
    </div>
  );
}
