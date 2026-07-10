import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Plus, Trash2, Image as ImageIcon, X, MessageSquare } from "lucide-react";

import {
  listThreads,
  createThread,
  deleteThread,
  getThreadMessages,
  sendMessage,
} from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LANGUAGES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = useParams({ from: "/_authenticated/chat/$threadId" });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const deleteFn = useServerFn(deleteThread);
  const messagesFn = useServerFn(getThreadMessages);
  const sendFn = useServerFn(sendMessage);

  const threadsQ = useQuery({
    queryKey: ["threads"],
    queryFn: () => listFn(),
    staleTime: 10_000,
  });

  const msgsQ = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => messagesFn({ data: { threadId } }),
  });

  const [input, setInput] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState("en");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgsQ.data?.messages.length]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  const sendM = useMutation({
    mutationFn: (vars: { text: string; imageDataUrl: string | null }) =>
      sendFn({
        data: {
          threadId,
          text: vars.text,
          imageDataUrl: vars.imageDataUrl ?? undefined,
        },
      }),
    onMutate: () => {
      setInput("");
      setImageDataUrl(null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["thread", threadId] });
      qc.invalidateQueries({ queryKey: ["threads"] });
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    },
  });

  async function handleFile(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image too large. Max 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sendM.isPending) return;
    sendM.mutate({ text, imageDataUrl });
  }

  async function newThread() {
    const t = await createFn({ data: { language } });
    qc.invalidateQueries({ queryKey: ["threads"] });
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  }

  async function removeThread(id: string) {
    if (!confirm("Delete this conversation?")) return;
    await deleteFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["threads"] });
    const remaining = (threadsQ.data ?? []).filter((t) => t.id !== id);
    if (id === threadId) {
      if (remaining[0]) {
        navigate({ to: "/chat/$threadId", params: { threadId: remaining[0].id } });
      } else {
        navigate({ to: "/chat" });
      }
    }
  }

  const messages = msgsQ.data?.messages ?? [];

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-6xl gap-4 px-2 py-4 sm:px-4">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col rounded-3xl border border-border bg-sidebar p-3 md:flex">
        <div className="flex items-center gap-2 px-2 pb-2">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-8 rounded-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="icon" className="rounded-full" onClick={newThread} title="New chat">
            <Plus />
          </Button>
        </div>
        <div className="mt-2 flex-1 overflow-y-auto">
          {(threadsQ.data ?? []).map((t) => {
            const active = t.id === threadId;
            return (
              <div
                key={t.id}
                className={`group flex items-center gap-1 rounded-full px-2 py-1.5 text-sm transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/50"
                }`}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  className="flex-1 truncate rounded-full px-2 py-1"
                >
                  <MessageSquare className="mr-2 inline h-3.5 w-3.5 opacity-60" />
                  {t.title || "New conversation"}
                </Link>
                <button
                  onClick={() => removeThread(t.id)}
                  className="rounded-full p-1.5 opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">
              {msgsQ.data?.thread.title || "Chat with Raghu"}
            </h2>
            <p className="text-xs text-muted-foreground">
              AI business consultant · multilingual
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full md:hidden"
            onClick={newThread}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> New
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-8">
          {messages.length === 0 && !sendM.isPending && (
            <EmptyState onPick={(s) => setInput(s)} />
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} m={m} />
          ))}
          {sendM.isPending && (
            <div className="text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-google-blue" />
                Raghu is thinking…
              </span>
            </div>
          )}
          <div ref={listEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-border p-3 sm:p-4"
        >
          {imageDataUrl && (
            <div className="mb-2 flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs">
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="truncate">Image attached</span>
              <button
                type="button"
                onClick={() => setImageDataUrl(null)}
                className="ml-auto rounded-full p-1 hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-3xl border border-border bg-background px-2 py-1.5">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
            >
              <ImageIcon />
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask Raghu anything about your business…"
              className="min-h-[44px] max-h-40 flex-1 resize-none border-0 bg-transparent focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-full"
              disabled={sendM.isPending || !input.trim()}
            >
              Send
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Raghu can make mistakes. Verify important decisions.
          </p>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  const prompts = [
    "I'm opening a tiffin service in Hyderabad. Where do I start?",
    "నా చిన్న ఫ్యాషన్ దుకాణం అమ్మకాలు తగ్గుతున్నాయి — ఏం చేయాలి?",
    "मेरे कपड़े के ब्रांड के लिए एक लोगो का सुझाव दो",
  ];
  return (
    <div className="mx-auto max-w-lg py-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-google-blue via-google-red to-google-yellow text-2xl font-bold text-white">
        R
      </div>
      <h3 className="text-lg font-semibold">Hi, I'm Raghu.</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell me about your business or upload a photo to get started.
      </p>
      <div className="mt-6 grid gap-2">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="rounded-2xl border border-border bg-background p-3 text-left text-sm hover:bg-accent"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

type Msg = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  image_url: string | null;
  generated_image_url: string | null;
};

function MessageBubble({ m }: { m: Msg }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl bg-primary px-4 py-2.5 text-primary-foreground">
          {m.image_url && (
            <img
              src={m.image_url}
              alt="uploaded"
              className="mb-2 max-h-64 rounded-2xl"
            />
          )}
          <div className="whitespace-pre-wrap text-sm">{m.content}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-google-blue via-google-red to-google-yellow text-sm font-bold text-white">
        R
      </div>
      <div className="max-w-[85%] flex-1">
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_h1]:mt-3 [&_h2]:mt-3 [&_h3]:mt-3">
          <ReactMarkdown>{m.content}</ReactMarkdown>
        </div>
        {m.generated_image_url && (
          <img
            src={m.generated_image_url}
            alt="Raghu's visual suggestion"
            className="mt-3 max-w-md rounded-2xl border border-border"
          />
        )}
      </div>
    </div>
  );
}
