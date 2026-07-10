// Razorpay TEST key ID is a publishable value used by the browser checkout script.
// The secret is stored server-side only.
export const RAZORPAY_KEY_ID = "rzp_test_TBsbZijh4LsFW4";

export type PlanId = "monthly" | "quarterly" | "premium";
export type CurrencyId = "INR" | "USD";

export interface PlanConfig {
  id: PlanId;
  name: string;
  tagline: string;
  durationDays: number;
  // Amount in the smallest currency unit (paise for INR, cents for USD)
  amount: Record<CurrencyId, number>;
  features: string[];
  highlight?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: "monthly",
    name: "Monthly",
    tagline: "Get started with Raghu",
    durationDays: 30,
    amount: { INR: 2000_00, USD: 24_00 },
    features: [
      "Unlimited chat with Raghu",
      "Business image analysis",
      "AI-generated visual suggestions",
      "5 languages: EN / TE / HI / TA / ML",
    ],
  },
  {
    id: "quarterly",
    name: "Quarterly",
    tagline: "Best value for growing businesses",
    durationDays: 90,
    amount: { INR: 5000_00, USD: 60_00 },
    features: [
      "Everything in Monthly",
      "Priority responses",
      "Save ~17% vs monthly",
      "Multi-thread strategy planning",
    ],
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "For enterprise & serious operators",
    durationDays: 30,
    amount: { INR: 20000_00, USD: 240_00 },
    features: [
      "Everything in Quarterly",
      "Deep operational reviews",
      "Advanced enterprise strategy",
      "Extended context memory",
    ],
  },
];

export const CURRENCY_SYMBOL: Record<CurrencyId, string> = { INR: "₹", USD: "$" };

export function formatPrice(amountMinor: number, currency: CurrencyId): string {
  const major = amountMinor / 100;
  return `${CURRENCY_SYMBOL[currency]}${major.toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
    maximumFractionDigits: 0,
  })}`;
}

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "te", label: "తెలుగు" },
  { code: "hi", label: "हिंदी" },
  { code: "ta", label: "தமிழ்" },
  { code: "ml", label: "മലയാളം" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
