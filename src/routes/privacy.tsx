import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & Liability — Launch Business" },
      {
        name: "description",
        content:
          "Business & AI Liability Disclaimer and Limitation of Liability for Launch Business.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        ⚖️ Business &amp; AI Liability Disclaimer
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Disclaimer &amp; Limitation of Liability
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold">1. For Informational Purposes Only</h2>
          <p className="mt-2">
            The business advice, suggestions, analysis, and recommendations provided by this AI
            assistant (including visual feedback, layout reviews, and text-based insights) are
            generated automatically for informational and educational purposes only. They do not
            constitute professional financial, legal, tax, or corporate management advice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. No Guarantee of Outcomes or Earnings</h2>
          <p className="mt-2">
            Running a business involves inherent risks. This application does not guarantee any
            specific business success, revenue growth, or financial outcomes. Any actions taken
            based on the AI's suggestions are done entirely at the user's own risk and
            discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Limitation of AI Liability</h2>
          <p className="mt-2">
            Artificial Intelligence models can occasionally produce inaccurate, incomplete, or
            outdated information. By using this service, you agree that the platform, its
            developers, and its parent entity cannot be held liable, legally or financially, for
            any losses, damages, business interruptions, or negative outcomes resulting from the
            use or misuse of the AI's suggestions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Independent Verification Recommended</h2>
          <p className="mt-2">
            Users are strongly advised to independently verify all AI-generated suggestions,
            cross-reference market data, and consult with qualified human professionals (such as
            legal advisors, certified accountants, or business consultants) before making
            critical financial or legal commitments.
          </p>
        </section>
      </div>
    </div>
  );
}
