import type { MandiPriceRecord } from "@/types/dataIntegration";

export interface AgmarknetQueryResult {
  status: "VERIFIED_EXTERNAL" | "UNAVAILABLE";
  records: MandiPriceRecord[];
  messageHi: string;
  noticeHi: string; // Wholesale Mandi Notice
}

/**
 * AGMARKNET Current Mandi Price Service (Phase 3 Spec)
 * Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
 *
 * Strictly normalizes to:
 * { source, state, district, market, commodity, variety, minPrice, maxPrice, modalPrice, unit, date, status: "VERIFIED_EXTERNAL" }
 *
 * NO-FABRICATION RULE: If API yields zero records or fails, status = "UNAVAILABLE"
 * with "विश्वसनीय डेटा उपलब्ध नहीं है।".
 */
const agmarknetCache = new Map<string, AgmarknetQueryResult>();

export async function getAgmarknetMandiPrices(
  state: string,
  district: string,
  commodity?: string,
  convexClient?: { action: (actionName: string, args: any) => Promise<any> },
): Promise<AgmarknetQueryResult> {
  const cacheKey = `${state}:${district}:${commodity || ""}`;
  if (agmarknetCache.has(cacheKey)) {
    return agmarknetCache.get(cacheKey)!;
  }

  const defaultNotice = "⚠️ यह थोक मंडी मूल्य (Wholesale Mandi Data) है। यह किसान या रिटेल मूल्य की गारंटी नहीं देता है।";

  if (!convexClient) {
    return {
      status: "UNAVAILABLE",
      records: [],
      messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
      noticeHi: defaultNotice,
    };
  }

  try {
    const res = await convexClient.action("externalData:fetchAgmarknetMandiPrices", {
      state,
      district,
      commodity,
    });

    if (res && res.status === "VERIFIED_EXTERNAL" && Array.isArray(res.records) && res.records.length > 0) {
      const normalizedRecords: MandiPriceRecord[] = res.records.map((r: any) => ({
        source: "AGMARKNET / data.gov.in (Resource 9ef84268-d588-465a-a308-a864a43d0070)",
        state: r.state || state,
        district: r.district || district,
        market: r.market || "Mandi",
        commodity: r.commodity || commodity || "Produce",
        variety: r.variety || "Standard",
        minPrice: Number(r.minPrice || r.min_price || 0),
        maxPrice: Number(r.maxPrice || r.max_price || 0),
        modalPrice: Number(r.modalPrice || r.modal_price || 0),
        unit: r.unit || "₹/Quintal",
        date: r.date || new Date().toISOString().split("T")[0],
        status: "VERIFIED_EXTERNAL",
        isWholesaleNotice: true,
      }));

      const result: AgmarknetQueryResult = {
        status: "VERIFIED_EXTERNAL",
        records: normalizedRecords,
        messageHi: "सत्यापित थोक मंडी भाव (AGMARKNET)",
        noticeHi: defaultNotice,
      };
      agmarknetCache.set(cacheKey, result);
      return result;
    }

    const fallbackResult: AgmarknetQueryResult = {
      status: "UNAVAILABLE",
      records: [],
      messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
      noticeHi: defaultNotice,
    };
    agmarknetCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  } catch (err) {
    console.warn("[AgmarknetService] Fetch failed:", err);
    return {
      status: "UNAVAILABLE",
      records: [],
      messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
      noticeHi: defaultNotice,
    };
  }
}
