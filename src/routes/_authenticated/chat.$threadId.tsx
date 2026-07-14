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
import {
  Plus,
  Trash2,
  Paperclip,
  X,
  MessageSquare,
  ArrowLeft,
  Menu,
} from "lucide-react";

import {
  listThreads,
  createThread,
  deleteThread,
  getThreadMessages,
  sendMessage,
} from "@/lib/chat.functions";
import { getActiveSubscription } from "@/lib/razorpay.functions";
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
const brandOrb = { url: "/brand-orb.png" };

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
  const subFn = useServerFn(getActiveSubscription);

  const subQ = useQuery({
    queryKey: ["subscription"],
    queryFn: () => subFn(),
    staleTime: 60_000,
  });

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
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [language, setLanguage] = useState("en");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      setAttachedFileName(null);
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
      toast.error("File too large. Max 8MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported right now.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result));
      setAttachedFileName(file.name);
    };
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
    setSidebarOpen(false);
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

  // Subscription gate — only show upgrade screen once we KNOW the user has no sub.
  // Don't block the initial render on the sub query loading.
  if (subQ.data && !subQ.data.active) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <img src={brandOrb.url} alt="" className="h-24 w-24 rounded-full shadow-lg" />
        <h1 className="mt-6 text-2xl font-semibold">Unlock chat with Raghu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a plan to start business consulting, image analysis and
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

  const messages = msgsQ.data?.messages ?? [];

  return (
    <div className="fixed inset-0 flex bg-background">
      {/* Sidebar (desktop) */}
      <aside
        className={`${
          sidebarOpen ? "flex" : "hidden"
        } absolute inset-y-0 left-0 z-30 w-72 flex-col border-r border-border bg-sidebar p-3 md:static md:flex md:w-64`}
      >
        <div className="flex items-center gap-2 px-1 pb-2">
          <Link to="/" className="rounded-full p-2 hover:bg-accent" title="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-8 flex-1 rounded-full text-xs">
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
          <Button size="icon" className="rounded-full brand-gradient-bg text-white hover:opacity-90" onClick={newThread} title="New chat">
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
                    ? "brand-gradient-bg text-white"
                    : "hover:bg-sidebar-accent/50"
                }`}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  onClick={() => setSidebarOpen(false)}
                  className="flex-1 truncate rounded-full px-2 py-1"
                >
                  <MessageSquare className="mr-2 inline h-3.5 w-3.5 opacity-60" />
                  {t.title || "New conversation"}
                </Link>
                <button
                  onClick={() => removeThread(t.id)}
                  className={`rounded-full p-1.5 opacity-0 transition group-hover:opacity-100 ${active ? "hover:bg-white/20" : "hover:bg-destructive/10 hover:text-destructive"}`}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="absolute inset-0 z-20 bg-black/30 md:hidden"
        />
      )}

      {/* Main chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-full p-2 hover:bg-accent md:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src={brandOrb.url} alt="" className="h-8 w-8 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {msgsQ.data?.thread.title || "Chat with Raghu"}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full md:hidden"
            onClick={newThread}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> New
          </Button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-8">
          {messages.length === 0 && !sendM.isPending && (
            <EmptyState onPick={(s) => setInput(s)} />
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} m={m} />
          ))}
          {sendM.isPending && (
            <div className="flex items-center gap-3">
              <img
                src={brandOrb.url}
                alt=""
                className="h-10 w-10 animate-pulse rounded-full shadow-md"
                style={{ animationDuration: "1.5s" }}
              />
              <span className="text-sm text-muted-foreground">Raghu is thinking…</span>
            </div>
          )}
          <div ref={listEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-border p-3 sm:p-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          {imageDataUrl && (
            <div className="mb-2 flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs">
              <Paperclip className="h-3.5 w-3.5" />
              <span className="truncate">{attachedFileName ?? "File attached"}</span>
              <button
                type="button"
                onClick={() => {
                  setImageDataUrl(null);
                  setAttachedFileName(null);
                }}
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
              title="Attach file"
            >
              <Paperclip />
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
              className="rounded-full brand-gradient-bg text-white hover:opacity-90"
              disabled={sendM.isPending || !input.trim()}
            >
              Send
            </Button>
          </div>
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
      <img src={brandOrb.url} alt="" className="mx-auto mb-4 h-20 w-20 rounded-full shadow-lg" />
      <h3 className="text-lg font-semibold">Hi, I'm Raghu.</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell me your business name, category (online, offline or other) and the
        problem you want to solve. Upload a photo or share a URL for deeper
        analysis.
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
      <img src={brandOrb.url} alt="" className="mt-1 h-9 w-9 shrink-0 rounded-full shadow-sm" />
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
