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
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
          <div className="absolute -top-40 left-1/2 h-96 w-[600px] -translate-x-1/2 rounded-full bg-google-blue/20 blur-3xl" />
          <div className="absolute top-40 -right-32 h-72 w-72 rounded-full bg-google-red/20 blur-3xl" />
          <div className="absolute top-64 -left-32 h-72 w-72 rounded-full bg-google-yellow/25 blur-3xl" />
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-google-green" />
            AI-powered business consulting
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Meet{" "}
            <span className="bg-gradient-to-r from-google-blue via-google-red to-google-yellow bg-clip-text text-transparent">
              Raghu
            </span>
            , your AI business consultant.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Raghu asks the right questions, analyzes photos of your store, product or layout,
            and generates visual and text-based suggestions to help you launch and grow — in
            English, తెలుగు, हिंदी, தமிழ் and മലയാളം.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link to="/plans">See plans</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link to="/chat">Try the chat</Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {LANGUAGES.map((l) => (
              <span
                key={l.code}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80"
              >
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              color: "bg-google-blue/10 text-google-blue",
              title: "Deep discovery",
              body: "Raghu asks clarifying questions about your business, market and roadblocks before advising.",
            },
            {
              color: "bg-google-red/10 text-google-red",
              title: "Visual analysis",
              body: "Upload photos of your storefront, packaging, inventory or layout — Raghu spots issues instantly.",
            },
            {
              color: "bg-google-green/10 text-google-green",
              title: "Generated suggestions",
              body: "Raghu creates AI-generated visuals to demonstrate layout, branding and product ideas.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full ${f.color} text-lg font-bold`}>
                ✦
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center rounded-3xl border border-border bg-gradient-to-br from-google-blue/5 via-transparent to-google-yellow/10 p-10 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Ready to talk to Raghu?</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Pick a plan, subscribe securely with Razorpay, and start chatting in your language.
          </p>
          <Button asChild size="lg" className="mt-6 rounded-full px-8">
            <Link to="/plans">View subscription plans</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
