import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { listThreads, createThread } from "@/lib/chat.functions";

import { getActiveSubscription } from "@/lib/razorpay.functions";
import { Button } from "@/components/ui/button";
import brandOrb from "@/assets/brand-orb.png.asset.json";

export const Route = createFileRoute("/_authenticated/chat/")({
  loader: async () => {
    const sub = await getActiveSubscription();
    if (!sub.active) return { needsUpgrade: true as const };
    const threads = await listThreads();
    if (threads.length > 0) {
      throw redirect({
        to: "/chat/$threadId",
        params: { threadId: threads[0].id },
      });
    }
    const created = await createThread({ data: {} });
    throw redirect({
      to: "/chat/$threadId",
      params: { threadId: created.id },
    });
  },
  component: UpgradeGate,
});

function UpgradeGate() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <img src={brandOrb.url} alt="" className="h-24 w-24 rounded-full shadow-lg" />
      <h1 className="mt-6 text-2xl font-semibold">Unlock chat with Raghu</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose a plan to start advanced business consulting, image analysis and
        AI-generated visual suggestions.
      </p>
      <Button asChild size="lg" className="mt-6 rounded-full brand-gradient-bg px-8 text-white hover:opacity-90">
        <Link to="/plans">Upgrade your plan</Link>
      </Button>
      <Link to="/" className="mt-4 text-xs text-muted-foreground hover:text-foreground">
        ← Back home
      </Link>
    </div>
  );
}

