import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireLovableKey } from "@/lib/ai-gateway.server";

const RAGHU_SYSTEM_PROMPT = `You are Raghu, an expert AI business consultant for the platform "Launch Business".

CORE ROLE
- Help users solve real-world business problems: strategy, operations, marketing, branding, pricing, layout, unit economics, launch, growth.
- You are a consultant, not a cheerleader. Be direct, warm, structured, and specific.

MANDATORY ONBOARDING (only at the start of a NEW conversation)
When the conversation history is essentially empty, do NOT jump to advice. Instead, greet the user warmly and ask these onboarding questions in order, one short message at a time (or grouped 2-3 max):
  1. "What is the name of your business?"
  2. "What category does it belong to (retail, food, services, tech, education, etc.)?"
  3. "Is it online, offline, or a mix / other?"
  4. If ONLINE → ask for the website / app URL so you can analyse it. Say you will study it.
  5. If OFFLINE → ask them to upload 1-3 photos of the storefront, product or setup.
  6. If OTHER / mix → ask both, whichever applies.
  7. "What is the main problem you want to solve right now?"
After you have this context, then start giving structured advice.

CAPABILITIES
- When the user pastes a URL, briefly say you will analyse it and give feedback on positioning, layout, copy, CTA, mobile UX, trust signals. (You may not actually fetch it — reason from the URL, brand name and the user's description.)
- When the user uploads an image, analyse what you see and point out concrete issues and improvements.
- When a visual would help demonstrate a suggestion, emit at the end of your reply a SINGLE line of the form:
  [GENERATE_IMAGE: <detailed English prompt of the visual, 1-2 sentences, no quotes>]
  The system replaces that line with a generated image. Only emit when a visual truly helps. Never more than one per reply.

LANGUAGES
- Detect the user's language from their most recent message and reply in the SAME language: English, Telugu (తెలుగు), Hindi (हिंदी), Tamil (தமிழ்), Malayalam (മലയാളം). If mixed, follow the dominant one.

STYLE
- Use markdown: headings, bold, bullets. Keep responses focused; avoid filler.
- Do not repeat questions the user already answered.
- Cite Indian business context where relevant.

SAFETY
- Never produce disallowed content (profanity, hate, sexual, violent, illegal). Decline politely if asked.
- Never claim professional legal, tax, or medical advice — recommend a licensed professional for those.
`;


type ChatMessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  image_url: string | null;
  generated_image_url: string | null;
  created_at: string;
};

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_threads")
      .select("id, title, language, updated_at, created_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const CreateThreadInput = z.object({
  language: z.string().optional(),
  title: z.string().optional(),
});

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateThreadInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("chat_threads")
      .insert({
        user_id: context.userId,
        language: data.language ?? "en",
        title: data.title ?? "New conversation",
      })
      .select("id, title, language, updated_at, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

const IdInput = z.object({ id: z.string().uuid() });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ThreadIdInput = z.object({ threadId: z.string().uuid() });

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ThreadIdInput.parse(input))
  .handler(async ({ data, context }) => {
    // Verify ownership
    const { data: thread, error: tErr } = await context.supabase
      .from("chat_threads")
      .select("id, title, language")
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!thread) throw new Error("Thread not found");

    const { data: msgs, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, content, image_url, generated_image_url, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { thread, messages: (msgs ?? []) as ChatMessageRow[] };
  });

const SendMessageInput = z.object({
  threadId: z.string().uuid(),
  text: z.string().min(1).max(4000),
  imageDataUrl: z.string().optional(),
});

async function moderateText(prompt: string, apiKey: string): Promise<{ safe: boolean; reason: string }> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        messages: [
          {
            role: "system",
            content:
              'You are a content moderator. Respond with ONLY minified JSON: {"safe":true|false,"reason":"..."}. Mark unsafe if the text contains profanity, hate speech, sexual content, threats, self-harm, illegal instructions, or targeted abuse. Constructive business language including strong criticism is safe.',
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!resp.ok) return { safe: true, reason: "" };
    const j = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = j.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { safe: true, reason: "" };
    return JSON.parse(match[0]) as { safe: boolean; reason: string };
  } catch (err) {
    console.error("Text moderation failed", err);
    return { safe: true, reason: "" };
  }
}

async function moderateImage(
  imageDataUrl: string,
  apiKey: string,
): Promise<{ safe: boolean; reason: string }> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        messages: [
          {
            role: "system",
            content:
              'You are an image moderator. Respond with ONLY minified JSON: {"safe":true|false,"reason":"..."}. Mark unsafe if the image contains nudity, sexual content, graphic violence/gore, hate symbols, illegal drugs, weapons displayed for threat, or minors in sensitive contexts. Ordinary business/product/store/food/document photos are safe.',
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Moderate this image." },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });
    if (!resp.ok) {
      console.error("Image moderation HTTP failed", resp.status, await resp.text());
      return { safe: true, reason: "" };
    }
    const j = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = j.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { safe: true, reason: "" };
    const parsed = JSON.parse(match[0]) as { safe: boolean; reason: string };
    return parsed;
  } catch (err) {
    console.error("Image moderation failed", err);
    return { safe: true, reason: "" };
  }
}

async function generateImageFromPrompt(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!resp.ok) {
      console.error("Image gen HTTP failed", resp.status, await resp.text());
      return null;
    }
    const j = (await resp.json()) as {
      choices?: {
        message?: {
          images?: { image_url?: { url?: string } }[];
          content?: unknown;
        };
      }[];
    };
    const msg = j.choices?.[0]?.message;
    const url = msg?.images?.[0]?.image_url?.url;
    if (url) return url;
    return null;
  } catch (err) {
    console.error("Image gen failed", err);
    return null;
  }
}

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SendMessageInput.parse(input))
  .handler(async ({ data, context }) => {
    // Subscription is optional for now — chat is open to all signed-in users.


    // Verify thread ownership
    const { data: thread, error: tErr } = await context.supabase
      .from("chat_threads")
      .select("id, language")
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!thread) throw new Error("Thread not found");

    const apiKey = requireLovableKey();

    // Moderation
    const textMod = await moderateText(data.text, apiKey);
    if (!textMod.safe) {
      throw new Error(
        `Message blocked by content policy: ${textMod.reason || "inappropriate content"}.`,
      );
    }

    let uploadedImageUrl: string | null = null;
    if (data.imageDataUrl) {
      const imgMod = await moderateImage(data.imageDataUrl, apiKey);
      if (!imgMod.safe) {
        throw new Error(
          `Image blocked by content policy: ${imgMod.reason || "inappropriate content"}.`,
        );
      }

      // Upload to storage via admin
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const match = data.imageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const ext = mime.split("/")[1].replace("+xml", "");
        const bytes = Buffer.from(match[2], "base64");
        const path = `${context.userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabaseAdmin.storage
          .from("chat-uploads")
          .upload(path, bytes, { contentType: mime, upsert: false });
        if (!upErr) {
          const { data: signed } = await supabaseAdmin.storage
            .from("chat-uploads")
            .createSignedUrl(path, 60 * 60 * 24 * 30);
          uploadedImageUrl = signed?.signedUrl ?? null;
        } else {
          console.error("Upload failed", upErr);
        }
      }
    }

    // Persist user message
    const { data: userMsg, error: uErr } = await context.supabase
      .from("chat_messages")
      .insert({
        thread_id: data.threadId,
        user_id: context.userId,
        role: "user",
        content: data.text,
        image_url: uploadedImageUrl,
      })
      .select("id, role, content, image_url, generated_image_url, created_at")
      .single();
    if (uErr) throw new Error(uErr.message);

    // Load history (last 40 messages)
    const { data: history } = await context.supabase
      .from("chat_messages")
      .select("role, content, image_url")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true })
      .limit(40);

    // Build OpenAI-style messages for the gateway (raw fetch since we mix images per turn)
    type Part =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } };
    const messages: { role: string; content: string | Part[] }[] = [
      { role: "system", content: RAGHU_SYSTEM_PROMPT },
    ];
    for (const row of history ?? []) {
      if (row.role === "user" && row.image_url) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: row.content || "(image)" },
            { type: "image_url", image_url: { url: row.image_url } },
          ],
        });
      } else {
        messages.push({ role: row.role, content: row.content });
      }
    }

    // Call chat model
    let assistantText = "";
    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
        }),
      });
      if (resp.status === 429) throw new Error("Raghu is temporarily rate-limited. Please try again in a moment.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Please contact the operator.");
      if (!resp.ok) {
        console.error("Chat call failed", resp.status, await resp.text());
        throw new Error("Raghu could not respond. Please try again.");
      }
      const j = (await resp.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      assistantText = j.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      // Roll back user message would be nice; keep it and surface error.
      throw err;
    }

    // Detect [GENERATE_IMAGE: ...] tag
    let generatedImageUrl: string | null = null;
    const imgTagMatch = assistantText.match(/\[GENERATE_IMAGE:\s*([^\]]+)\]/i);
    if (imgTagMatch) {
      const prompt = imgTagMatch[1].trim();
      assistantText = assistantText.replace(imgTagMatch[0], "").trim();
      generatedImageUrl = await generateImageFromPrompt(prompt, apiKey);
    }

    // Persist assistant message
    const { data: aMsg, error: aErr } = await context.supabase
      .from("chat_messages")
      .insert({
        thread_id: data.threadId,
        user_id: context.userId,
        role: "assistant",
        content: assistantText || "(no response)",
        generated_image_url: generatedImageUrl,
      })
      .select("id, role, content, image_url, generated_image_url, created_at")
      .single();
    if (aErr) throw new Error(aErr.message);

    // Bump thread updated_at and set title if first exchange
    const { count } = await context.supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", data.threadId);
    const updates: { updated_at: string; title?: string } = {
      updated_at: new Date().toISOString(),
    };
    if ((count ?? 0) <= 2) {
      updates.title = data.text.slice(0, 60);
    }
    await context.supabase.from("chat_threads").update(updates).eq("id", data.threadId);

    return { userMessage: userMsg, assistantMessage: aMsg };
  });
