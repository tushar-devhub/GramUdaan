import type { FeasibilityData } from "@/data/feasibility-types";
import type { Location } from "@/data/locations";
import type { BusinessCategory } from "@/data/businesses";
import { formatIndianCurrency } from "@/data/assessment";

// ─── System Prompt ───
export const SYSTEM_PROMPT = `You are GramUdaan — a friendly Hindi-speaking business advisor for rural and semi-urban entrepreneurs in India.

PERSONALITY:
- Friendly, respectful, patient, practical, encouraging, honest
- Like a knowledgeable business advisor sitting beside the entrepreneur
- Not corporate, not robotic, not overly technical

LANGUAGE:
- Default: Natural conversational Hindi or Hinglish
- Use familiar English business terms when they're clearer: Loan, EMI, Market, Competition, Profit, Investment, Risk, Supplier, Business
- Keep sentences short and simple
- Avoid overly formal Hindi (no "आपके द्वारा उपलब्ध कराई गई पूंजी")

RESPONSE FORMAT:
1. Give a clear answer
2. Explain why
3. Give a practical next step

RULES:
- ALWAYS use the user's current GramUdaan context (location, business, capital, analysis scores) when available
- Never pretend estimated data is verified — say "यह एक estimated figure है"
- Never guarantee profit, loan approval or business success
- Never hallucinate government scheme details, interest rates, or competitor counts
- If information is unavailable, say "मेरे पास अभी इस बारे में पर्याप्त data नहीं है"
- Keep responses under 3-4 sentences for voice, unless the user asks for detailed explanation
- For complex topics: "मैं इसे दो हिस्सों में समझाता हूँ..."
- Financial advice must include: "Actual eligibility lender, scheme और documentation पर depend करेगी"

GOVERNMENT SCHEMES:
- PMEGP: Credit-linked subsidy scheme for business setup financing
- MUDRA: Loans up to ₹10 lakh for small businesses
- Explain in simple Hindi, never invent eligibility rules

RURAL CONTEXT:
- Understand: local customers, weekly markets, nearby villages, transport costs
- Understand: wholesale suppliers, seasonal demand, self-help groups, microfinance
- Give practical advice like: "अगर weekly haat लगता है तो वहां customer testing कर सकते हैं"

GREETING:
When greeting for the first time, say:
"नमस्ते! मैं GramUdaan हूँ। मैं आपके business analysis को समझ चुका हूँ। आप मुझसे अपने business, market, competition या finance से जुड़ा कोई भी सवाल पूछ सकते हैं।"

Never start with "How can I help you?" — be specific to their context.`;

// ─── Context Builder & Memory ───
export interface StructuredConversationContext {
  locationName?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  businessName?: string | null;
  businessCategory?: string | null;
  subCategory?: string | null;
  capital?: number | null;
  otherFunding?: number | null;
  targetInvestment?: number | null;
  placeStatus?: string | null;
  rentMonthly?: number | null;
  scaleChoice?: string | null;
  businessAnswers?: Record<string, string>;
  language?: string | null;
}

export function updateStructuredContext(
  prev: StructuredConversationContext,
  parsed: {
    businesses?: BusinessCategory[];
    capital?: number | null;
    location?: Location | null;
    unknownPlace?: string | null;
    lang?: string;
  },
  onboardingState?: {
    placeStatus?: string;
    rentMonthly?: number;
    scaleChoice?: string;
    subCategory?: { name: string } | null;
    businessAnswers?: Record<string, string>;
    otherFunding?: number;
  }
): StructuredConversationContext {
  const next: StructuredConversationContext = { ...prev };

  // 1. Business update (explicit new mention updates business; retains if unmentioned)
  if (parsed.businesses && parsed.businesses.length > 0) {
    const topBiz = parsed.businesses[0];
    next.businessName = topBiz.name;
    next.businessCategory = topBiz.category;
  }

  // 2. Location update (known or raw location mention)
  if (parsed.location) {
    next.locationName = parsed.location.name;
    next.district = parsed.location.district;
    next.state = parsed.location.state;
    next.pincode = parsed.location.pincode;
  } else if (parsed.unknownPlace) {
    next.locationName = parsed.unknownPlace;
  }

  // 3. Capital update
  if (parsed.capital !== null && parsed.capital !== undefined && parsed.capital > 0) {
    next.capital = parsed.capital;
  }

  // 4. Language preference update
  if (parsed.lang) {
    next.language = parsed.lang;
  }

  // 5. Context state fallback from onboarding if present
  if (onboardingState) {
    if (onboardingState.placeStatus && onboardingState.placeStatus !== "unsure") {
      next.placeStatus = onboardingState.placeStatus;
    }
    if (onboardingState.rentMonthly) {
      next.rentMonthly = onboardingState.rentMonthly;
    }
    if (onboardingState.scaleChoice) {
      next.scaleChoice = onboardingState.scaleChoice;
    }
    if (onboardingState.subCategory?.name) {
      next.subCategory = onboardingState.subCategory.name;
    }
    if (onboardingState.otherFunding) {
      next.otherFunding = onboardingState.otherFunding;
    }
    if (onboardingState.businessAnswers && Object.keys(onboardingState.businessAnswers).length > 0) {
      next.businessAnswers = { ...(next.businessAnswers || {}), ...onboardingState.businessAnswers };
    }
  }

  return next;
}

export function buildStructuredContextString(
  ctx: StructuredConversationContext,
  feasibility?: FeasibilityData | null,
  currentPage?: string
): string {
  const lines: string[] = [];

  lines.push("CURRENT GRAMUDAAN CONTEXT:");

  if (ctx.businessName) {
    lines.push(`Business: ${ctx.businessName}${ctx.businessCategory ? ` (${ctx.businessCategory})` : ""}`);
  } else {
    lines.push("Business: Not specified yet");
  }

  if (ctx.subCategory) {
    lines.push(`Subcategory: ${ctx.subCategory}`);
  }

  if (ctx.locationName) {
    const locParts = [ctx.locationName];
    if (ctx.district && ctx.district !== ctx.locationName) locParts.push(`District: ${ctx.district}`);
    if (ctx.state) locParts.push(`State: ${ctx.state}`);
    if (ctx.pincode) locParts.push(`PIN: ${ctx.pincode}`);
    lines.push(`Location: ${locParts.join(", ")}`);
  } else {
    lines.push("Location: Not specified yet");
  }

  if (ctx.capital !== null && ctx.capital !== undefined) {
    lines.push(`Capital: ${formatIndianCurrency(ctx.capital)}`);
  } else {
    lines.push("Capital: Not specified yet");
  }

  if (ctx.otherFunding) {
    lines.push(`Other Funding: ${formatIndianCurrency(ctx.otherFunding)}`);
  }

  if (ctx.placeStatus && ctx.placeStatus !== "unsure") {
    lines.push(`Workspace: ${ctx.placeStatus}${ctx.rentMonthly ? ` (Rent: ${formatIndianCurrency(ctx.rentMonthly)}/month)` : ""}`);
  }

  if (ctx.scaleChoice) {
    lines.push(`Scale: ${ctx.scaleChoice}`);
  }

  if (ctx.language) {
    lines.push(`Preferred Language: ${ctx.language}`);
  }

  if (feasibility) {
    lines.push(`\nANALYSIS SCORES:`);
    lines.push(`Overall Score: ${feasibility.overallScore}/100 (${feasibility.verdictLabel})`);
    lines.push(`Market Score: ${feasibility.subScores.marketScore}/100`);
    lines.push(`Opportunity Score: ${feasibility.subScores.opportunityScore}/100`);
    lines.push(`Competition Score: ${feasibility.subScores.competitionScore}/100`);
    lines.push(`Risk Score: ${feasibility.subScores.riskScore}/100`);
    lines.push(`Financial Fit: ${feasibility.subScores.financialFitScore}/100`);

    if (feasibility.financial) {
      lines.push(`\nFINANCIAL DATA:`);
      lines.push(`Total Project Cost: ${formatIndianCurrency(feasibility.financial.totalProjectCost)}`);
      lines.push(`Agency Funding: ${formatIndianCurrency(feasibility.financial.potentialLoan)}`);
      lines.push(`Scheme: ${feasibility.financial.recommendedScheme}`);
    }
  }

  if (currentPage) {
    lines.push(`\nUser is viewing: ${currentPage}`);
  }

  return lines.join("\n");
}

export interface AssistantContext {
  location: { name: string; district: string; state: string } | null;
  business: { name: string; category: string } | null;
  capital: number;
  analysis: {
    overallScore: number;
    verdict: string;
    marketScore?: number;
    opportunityScore?: number;
    competitionScore?: number;
    riskScore?: number;
    financialFitScore?: number;
  } | null;
  financial?: {
    projectCost: number;
    loanAmount: number;
    scheme: string;
    monthlyRepayment: string;
    affordability: string;
  };
  competition?: {
    total: number;
    density: string;
  };
  risks?: string[];
  currentPage?: string;
}

export function buildContext(params: {
  location: Location | null;
  business: BusinessCategory | null;
  capital: number;
  feasibility: FeasibilityData | null;
  currentPage?: string;
}): string {
  const { location, business, capital, feasibility, currentPage } = params;

  const structCtx: StructuredConversationContext = {
    locationName: location?.name,
    district: location?.district,
    state: location?.state,
    pincode: location?.pincode,
    businessName: business?.name,
    businessCategory: business?.category,
    capital: capital > 0 ? capital : null,
  };

  return buildStructuredContextString(structCtx, feasibility, currentPage);
}

// ─── Page-specific quick prompts ───
export interface QuickPrompt {
  text: string;
  hindi: string;
}

export const GENERAL_PROMPTS: QuickPrompt[] = [
  { text: "Which business is best for me?", hindi: "मेरे लिए कौन सा business अच्छा है?" },
  { text: "Explain my risks", hindi: "मेरा risk समझाओ" },
  { text: "What's my EMI?", hindi: "मेरी EMI बताओ" },
  { text: "How much competition?", hindi: "Competition कितना है?" },
  { text: "Government schemes?", hindi: "मुझे government scheme बताओ" },
  { text: "Should I start this business?", hindi: "क्या मुझे यह business शुरू करना चाहिए?" },
];

export const FINANCIAL_PROMPTS: QuickPrompt[] = [
  { text: "Explain my EMI", hindi: "मेरी EMI समझाओ" },
  { text: "How much loan should I take?", hindi: "Loan कितना लेना चाहिए?" },
  { text: "How is my cash flow?", hindi: "Cash flow कैसा है?" },
  { text: "Can I repay this loan?", hindi: "क्या मैं loan repay कर पाऊँगा?" },
];

export const COMPETITION_PROMPTS: QuickPrompt[] = [
  { text: "Is competition too high?", hindi: "Competition ज्यादा है?" },
  { text: "How can I stand out?", hindi: "मैं अलग कैसे दिखूं?" },
  { text: "Who are my competitors?", hindi: "मेरे competitors कौन हैं?" },
];

export const DECISION_PROMPTS: QuickPrompt[] = [
  { text: "Why did you say Good to Go?", hindi: "आपने Good to Go क्यों कहा?" },
  { text: "What's the biggest risk?", hindi: "सबसे बड़ा risk क्या है?" },
  { text: "What should I do first?", hindi: "अब मुझे क्या करना चाहिए?" },
];

export function getQuickPrompts(page?: string): QuickPrompt[] {
  if (!page) return GENERAL_PROMPTS;
  if (page.includes("financial")) return FINANCIAL_PROMPTS;
  if (page.includes("competition")) return COMPETITION_PROMPTS;
  if (page.includes("decision")) return DECISION_PROMPTS;
  return GENERAL_PROMPTS;
}
