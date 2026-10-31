import { useState, useRef, useEffect, useCallback } from "react";
import { useOnboarding } from "@/lib/onboarding-context";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Send,
  Bot,
  User,
  ArrowUpRight,
  Sparkles,
  Mic,
  Check,
  Loader2,
} from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { generateAdvisorReply, runFeasibility } from "@/services/advisor/engine";
import { parseMessage } from "@/services/advisor/parse";
import {
  buildStructuredContextString,
  updateStructuredContext,
  type StructuredConversationContext,
} from "@/services/aiContext";
import { sendAdvisorChatMessage } from "@/services/aiAdvisorService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  appliedNote?: string | null;
  timestamp: Date;
}

export default function Advisor() {
  const { t } = useLanguage();
  const {
    feasibility, analysisResult, location, business, capital, radius,
    placeStatus, rentMonthly, scaleChoice, subCategory, businessAnswers, otherFunding,
    setLocation, setBusiness, setCapital, setFeasibility,
  } = useOnboarding();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Structured Conversation Context (memory across turn-by-turn advisor chat)
  const [structCtx, setStructCtx] = useState<StructuredConversationContext>(() => ({
    locationName: location?.name ?? null,
    district: location?.district ?? null,
    state: location?.state ?? null,
    pincode: location?.pincode ?? null,
    businessName: business?.name ?? null,
    businessCategory: business?.category ?? null,
    capital: capital > 0 ? capital : null,
    placeStatus: placeStatus !== "unsure" ? placeStatus : null,
    rentMonthly: rentMonthly > 0 ? rentMonthly : null,
    scaleChoice,
    otherFunding: otherFunding > 0 ? otherFunding : null,
    subCategory: subCategory?.name ?? null,
    businessAnswers,
  }));

  const defaultSuggestions = [
    t("advisor.q1"),
    t("advisor.q2"),
    t("advisor.q3"),
    t("advisor.q4"),
    t("advisor.q5"),
    t("advisor.q6"),
  ];

  const [customSuggestions, setCustomSuggestions] = useState<string[] | null>(null);
  const suggestions = customSuggestions ?? defaultSuggestions;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const businessName = structCtx.businessName || business?.name || "your business";
  const locationName = structCtx.locationName || (location ? `${location.name}, ${location.district}` : "your location");

  const handleSend = useCallback(async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setCustomSuggestions([]);
    setIsLoading(true);

    try {
      // 1. Parse user message for updated business/location/capital entities
      const parsed = parseMessage(question, !!structCtx.locationName);

      // 2. Accumulate turn-by-turn memory into structured context
      const updatedCtx = updateStructuredContext(structCtx, parsed, {
        placeStatus,
        rentMonthly,
        scaleChoice,
        subCategory,
        businessAnswers,
        otherFunding,
      });
      setStructCtx(updatedCtx);

      // 3. Sync newly asserted entities into shared OnboardingContext if present
      if (parsed.businesses.length > 0) setBusiness(parsed.businesses[0]);
      if (parsed.location) setLocation(parsed.location);
      if (parsed.capital && parsed.capital > 0) setCapital(parsed.capital);

      const activeBiz = parsed.businesses[0] ?? business ?? null;
      const activeLoc = parsed.location ?? location ?? null;
      const activeCap = (parsed.capital && parsed.capital > 0) ? parsed.capital : capital;
      const activeFeasibility = runFeasibility(activeBiz, activeCap, activeLoc, radius) || feasibility;

      // 4. Format structured context for Gemini backend
      const contextString = buildStructuredContextString(updatedCtx, activeFeasibility);

      // 5. Format recent conversation history (last 10 messages)
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // 6. Call AI backend service with graceful local fallback
      const result = await sendAdvisorChatMessage({
        message: question,
        history,
        context: contextString,
      });

      let replyContent = result?.text;
      let appliedNote: string | null = null;

      if (!replyContent || result.error) {
        // Fallback to local deterministic advisor on missing/errored backend
        const fallbackReply = generateAdvisorReply({
          message: question,
          context: { location: activeLoc, business: activeBiz, capital: activeCap, feasibility: activeFeasibility, analysisResult, radius },
        });
        replyContent = fallbackReply.text;
        appliedNote = fallbackReply.apply?.summary ?? null;

        if (fallbackReply.apply?.recompute) {
          if (fallbackReply.apply.business) setBusiness(fallbackReply.apply.business);
          if (fallbackReply.apply.capital !== undefined) setCapital(fallbackReply.apply.capital);
          if (fallbackReply.apply.location) setLocation(fallbackReply.apply.location);
          const b = fallbackReply.apply.business ?? activeBiz;
          const c = fallbackReply.apply.capital !== undefined ? fallbackReply.apply.capital : activeCap;
          const l = fallbackReply.apply.location ?? activeLoc;
          const f = runFeasibility(b, c, l, radius);
          if (f) setFeasibility(f);
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: replyContent,
        appliedNote,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setCustomSuggestions(defaultSuggestions.slice(0, 4));
    } catch (err) {
      console.error("[Advisor] Convex action error, using local fallback:", err);
      const fallbackReply = generateAdvisorReply({
        message: question,
        context: { location, business, capital, feasibility, analysisResult, radius },
      });
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallbackReply.text,
        appliedNote: fallbackReply.apply?.summary ?? null,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setCustomSuggestions(defaultSuggestions.slice(0, 4));
    } finally {
      setIsLoading(false);
    }
  }, [
    input, isLoading, messages, structCtx, location, business, capital, feasibility, analysisResult, radius,
    placeStatus, rentMonthly, scaleChoice, subCategory, businessAnswers, otherFunding,
    defaultSuggestions, setBusiness, setCapital, setLocation, setFeasibility
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleVoiceDraft = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t("advisor.title")}</h1>
              <p className="text-xs text-muted-foreground">
                {t("advisor.subtitle").replace("{business}", businessName).replace("{location}", locationName)}
              </p>
            </div>
          </div>
          <div className="mt-2 rounded-xl border border-border/70 bg-white px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            {t("advisor.micBanner")}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col rounded-2xl border border-border bg-white overflow-hidden mb-4">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-[400px] max-h-[60vh]">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                  <Bot className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">
                  {t("advisor.welcomeTitle")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {t("advisor.welcomeDesc")}
                </p>
                {feasibility && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-700">
                      {t("advisor.loaded")} {business?.name ?? "—"} · {feasibility.overallScore}/100 ({feasibility.verdictLabel})
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0 mt-1">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  {msg.appliedNote && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold">
                      <Check className="h-3 w-3" />
                      {msg.appliedNote} — {t("advisor.analysisUpdated")}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0 mt-1">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Thinking / Loading State */}
            {isLoading && (
              <div className="flex gap-3 justify-start items-center text-xs text-muted-foreground py-2 animate-pulse">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-2 bg-muted px-4 py-2.5 rounded-2xl rounded-bl-md text-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>GramUdaan is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !isLoading && (
            <div className="px-4 pb-3 border-t border-border/50 pt-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                {t("advisor.suggestedQuestions")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    disabled={isLoading}
                    className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={isLoading ? "GramUdaan is thinking..." : t("advisor.inputPlaceholder")}
                disabled={isLoading}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-colors disabled:opacity-50",
                  input.trim() && !isLoading
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground",
                )}
                aria-label={t("advisor.sendQuestion")}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={handleVoiceDraft}
              disabled={isLoading}
              className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Mic className="h-3 w-3" />
              {t("advisor.voiceHint")}
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center gap-3 mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            {t("advisor.backToDashboard")}
          </Link>
          <Link
            to="/what-if"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("advisor.tryWhatIf")}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

    </div>
  );
}
