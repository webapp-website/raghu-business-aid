import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLANS, type CurrencyId, type PlanId } from "@/lib/constants";

const CreateOrderInput = z.object({
  plan: z.enum(["monthly", "quarterly", "premium"]),
  currency: z.enum(["INR", "USD"]),
});

function planConfig(plan: PlanId) {
  const p = PLANS.find((x) => x.id === plan);
  if (!p) throw new Error("Unknown plan");
  return p;
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateOrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay is not configured");

    const p = planConfig(data.plan);
    const amount = p.amount[data.currency as CurrencyId];

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const receipt = `lb_${context.userId.slice(0, 8)}_${Date.now()}`.slice(0, 40);

    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: data.currency,
        receipt,
        notes: { user_id: context.userId, plan: data.plan },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Razorpay create order failed", resp.status, text);
      throw new Error("Failed to create payment order");
    }

    const order = (await resp.json()) as {
      id: string;
      amount: number;
      currency: string;
    };

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    };
  });

const VerifyInput = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  plan: z.enum(["monthly", "quarterly", "premium"]),
  currency: z.enum(["INR", "USD"]),
});

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => VerifyInput.parse(input))
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay is not configured");

    const { createHmac } = await import("crypto");
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    if (expected !== data.razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    const p = PLANS.find((x) => x.id === data.plan)!;
    const amount = p.amount[data.currency as CurrencyId];
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + p.durationDays * 24 * 60 * 60 * 1000);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("subscriptions").insert({
      user_id: context.userId,
      plan: data.plan,
      currency: data.currency,
      amount_paise: amount,
      status: "active",
      razorpay_order_id: data.razorpay_order_id,
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_signature: data.razorpay_signature,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    });
    if (error) {
      console.error("Failed to persist subscription", error);
      throw new Error("Payment succeeded but recording failed. Contact support.");
    }

    return { ok: true, expiresAt: expiresAt.toISOString() };
  });

export const getActiveSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subscriptions")
      .select("id, plan, currency, status, starts_at, expires_at")
      .eq("user_id", context.userId)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error(error);
      return { active: false as const, subscription: null };
    }
    if (!data) return { active: false as const, subscription: null };
    return { active: true as const, subscription: data };
  });
