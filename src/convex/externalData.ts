import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Server-side Convex actions to fetch official data from data.gov.in securely.
 * Credentials stay server-side (`process.env.DATA_GOV_API_KEY`).
 * Never exposed to browser bundle / network tab.
 */

function getApiKey(): string | undefined {
  const g = globalThis as { process?: { env?: Record<string, string> } };
  return g.process?.env?.DATA_GOV_API_KEY;
}

export const fetchAgmarknetMandiPrices = action({
  args: {
    state: v.string(),
    district: v.string(),
    commodity: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        status: "UNAVAILABLE",
        records: [],
        messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है। (API keys not configured)",
      };
    }

    try {
      const resourceId = "9ef84268-d588-465a-a308-a864a43d0070";
      const url = new URL(`https://api.data.gov.in/resource/${resourceId}`);
      url.searchParams.set("api-key", apiKey);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "50");
      if (args.state) url.searchParams.set("filters[state]", args.state);
      if (args.district) url.searchParams.set("filters[district]", args.district);

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        return {
          status: "UNAVAILABLE",
          records: [],
          messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
        };
      }

      const json = (await res.json()) as { records?: Record<string, unknown>[] };
      const rawRecords = json.records || [];

      if (rawRecords.length === 0) {
        return {
          status: "UNAVAILABLE",
          records: [],
          messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
        };
      }

      const normalized = rawRecords.map((r) => ({
        source: "AGMARKNET / data.gov.in",
        state: String(r.state || args.state),
        district: String(r.district || args.district),
        market: String(r.market || "Mandi"),
        commodity: String(r.commodity || args.commodity || "Agricultural Produce"),
        variety: String(r.variety || "Standard"),
        minPrice: Number(r.min_price || r.minPrice || 0),
        maxPrice: Number(r.max_price || r.maxPrice || 0),
        modalPrice: Number(r.modal_price || r.modalPrice || 0),
        unit: String(r.unit || "₹/Quintal"),
        date: String(r.arrival_date || new Date().toISOString().split("T")[0]),
        status: "VERIFIED_EXTERNAL" as const,
        isWholesaleNotice: true,
      }));

      return {
        status: "VERIFIED_EXTERNAL",
        records: normalized,
        messageHi: "सत्यापित थोक मंडी भाव (data.gov.in / AGMARKNET)",
      };
    } catch (err) {
      console.error("[externalData] AGMARKNET fetch failed:", err);
      return {
        status: "UNAVAILABLE",
        records: [],
        messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
      };
    }
  },
});

export const fetchHistoricalCropPrices = action({
  args: {
    commodity: v.string(),
    state: v.optional(v.string()),
  },
  handler: async (_ctx, _args) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      return {
        status: "UNAVAILABLE",
        records: [],
        messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
      };
    }

    try {
      // Resource ID for historical agricultural prices
      const resourceId = "35985678-0d79-46b4-9ed6-6f13308a1d24";
      const url = new URL(`https://api.data.gov.in/resource/${resourceId}`);
      url.searchParams.set("api-key", apiKey);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "30");

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        return { status: "UNAVAILABLE", records: [], messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।" };
      }

      const json = (await res.json()) as { records?: Record<string, unknown>[] };
      const rawRecords = json.records || [];

      if (rawRecords.length === 0) {
        return { status: "UNAVAILABLE", records: [], messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।" };
      }

      const normalized = rawRecords.map((r) => ({
        source: "AGMARKNET / Historical Data (1991-2023)",
        commodity: String(r.commodity || _args.commodity),
        variety: String(r.variety || "Standard"),
        year: Number(r.year || 2020),
        price: Number(r.modal_price || r.price || 0),
        unit: String(r.unit || "₹/Quintal"),
        status: "VERIFIED_EXTERNAL" as const,
      }));

      return {
        status: "VERIFIED_EXTERNAL",
        records: normalized,
        messageHi: "ऐतिहासिक मूल्य डेटा (1991 से)",
      };
    } catch {
      return { status: "UNAVAILABLE", records: [], messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।" };
    }
  },
});
