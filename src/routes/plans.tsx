import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, formatPrice, type CurrencyId } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/razorpay.functions";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Plans — Launch Business" },
      {
        name: "description",
        content:
          "Subscribe to Launch Business. Monthly, Quarterly and Premium plans in INR or USD, powered by Razorpay.",
      },
      { property: "og:title", content: "Plans — Launch Business" },
      {
        property: "og:description",
        content: "Pick a plan and start chatting with Raghu, your AI business consultant.",
      },
    ],
  }),
  component: Plans,
});

function Plans() {
  const [currency, setCurrency] = useState<CurrencyId>("INR");
  const [loading, setLoading] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean>(false);
  const createOrder = useServerFn(createRazorpayOrder);
  const verify = useServerFn(verifyRazorpayPayment);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function subscribe(planId: "monthly" | "quarterly" | "premium") {
    if (!authed) {
      toast.info("Please sign in to subscribe.");
      navigate({ to: "/auth", search: { redirect: "/plans" } as never });
      return;
    }
    if (!window.Razorpay) {
      toast.error("Payment SDK is still loading. Please try again in a moment.");
      return;
    }
    setLoading(planId);
    try {
      const order = await createOrder({ data: { plan: planId, currency } });
      const { data: userRes } = await supabase.auth.getUser();
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Launch Business",
        description: `${planId} plan`,
        order_id: order.orderId,
        prefill: {
          email: userRes.user?.email ?? "",
          name: (userRes.user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? "",
        },
        theme: { color: "#4285F4" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verify({
              data: {
                ...response,
                plan: planId,
                currency,
              },
            });
            toast.success("Payment verified. Welcome aboard!");
            navigate({ to: "/chat" });
          } catch (err) {
            console.error(err);
            toast.error("Payment verification failed. Contact support if amount was debited.");
          }
        },
        modal: {
          ondismiss: () => setLoading(null),
        },
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to start payment");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Choose your plan</h1>
        <p className="mt-4 text-muted-foreground">
          Unlock chat with Raghu, image analysis and AI-generated suggestions.
        </p>

        <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
          {(["INR", "USD"] as CurrencyId[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                currency === c
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={`relative flex flex-col rounded-3xl border p-8 shadow-sm ${
              p.highlight
                ? "border-primary bg-gradient-to-br from-primary/5 to-accent/40 shadow-lg"
                : "border-border bg-card"
            }`}
          >
            {p.highlight ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Most popular
              </span>
            ) : null}
            <h3 className="text-xl font-semibold">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold">{formatPrice(p.amount[currency], currency)}</span>
              <span className="text-sm text-muted-foreground">
                / {p.durationDays === 30 ? "month" : `${p.durationDays / 30} months`}
              </span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-google-green">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="mt-8 rounded-full"
              size="lg"
              variant={p.highlight ? "default" : "outline"}
              disabled={loading === p.id}
              onClick={() => subscribe(p.id)}
            >
              {loading === p.id ? "Opening Razorpay…" : `Subscribe — ${formatPrice(p.amount[currency], currency)}`}
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Payments are securely processed by Razorpay in your account's live mode
        (based on the API keys configured on the server).
      </p>

    </div>
  );
}
