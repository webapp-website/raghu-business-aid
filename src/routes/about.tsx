import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Legal — Launch Business" },
      {
        name: "description",
        content:
          "About Launch Business and Raghu, and the legal framework governing AI-generated business suggestions.",
      },
      { property: "og:title", content: "About & Legal — Launch Business" },
      {
        property: "og:description",
        content:
          "Learn about Raghu, the AI business consultant, and the terms, privacy and liability policies of Launch Business.",
      },
    ],
  }),
  component: About,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="prose prose-sm mt-3 max-w-none text-foreground/90 [&_p]:my-2">
        {children}
      </div>
    </section>
  );
}

function About() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">About Launch Business</h1>
      <p className="mt-4 text-muted-foreground">
        Launch Business is an AI-powered consulting platform. Our AI, Raghu, is designed to help
        small businesses, founders and operators solve real-world problems through structured
        questioning, visual analysis and generated suggestions — in five Indian languages.
      </p>

      <div className="mt-8 space-y-4">
        <Section title="What Raghu does">
          <p>
            Raghu is a fluent, multilingual AI business consultant. Raghu asks clarifying
            questions, analyzes uploaded images of your business (storefronts, product packaging,
            inventory, layouts), and generates AI images to demonstrate suggestions, branding
            improvements or new layouts.
          </p>
        </Section>

        <Section title="Content and safety">
          <p>
            Toxic, hateful, explicit or abusive inputs are automatically blocked. Uploaded
            images that contain inappropriate, explicit, illegal or harmful content are rejected
            before Raghu processes them.
          </p>
        </Section>

        <Section title="No liability / no responsibility">
          <p>
            Launch Business and its AI ("Raghu") provide automated business suggestions based on
            data analysis. <strong>We accept zero responsibility</strong> for the financial,
            legal or operational outcomes of your business.
          </p>
        </Section>

        <Section title="No affiliation / no blame">
          <p>
            We do not link or partner with your business operations. The user retains{" "}
            <strong>100% ownership and liability</strong> for any risks or decisions executed
            based on the AI's suggestions. Raghu will not accept blame for business downturns.
          </p>
        </Section>

        <Section title="Privacy">
          <p>
            Your conversations and uploaded images are stored securely to power your chat
            history. Uploads are scoped to your account and are not shared with third parties
            other than the AI inference provider used to generate responses. Delete your
            conversations at any time from the chat interface.
          </p>
        </Section>

        <Section title="Payments">
          <p>
            Subscriptions are processed by Razorpay. Launch Business does not store your card
            details. Refunds and disputes are handled per Razorpay's standard terms combined
            with the Launch Business subscription terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For support or legal enquiries, contact the operator of your Launch Business
            deployment.
          </p>
        </Section>

        <Section title="Disclaimer">
          <p>
            This automated website tool does not provide professional financial or legal advice.
            All business decisions are made solely at the user's risk, with no guarantees of
            success or revenue. AI outputs may contain errors, and users must verify all
            generated content. By paying and using this software, you agree that the platform
            and its developers hold zero liability for any business losses or financial damages.
          </p>
        </Section>
      </div>
    </div>
  );
}
