import type { HistoricalCropPriceRecord } from "@/types/dataIntegration";

export interface CropPriceHistoryQueryResult {
  status: "VERIFIED_EXTERNAL" | "UNAVAILABLE";
  records: HistoricalCropPriceRecord[];
  messageHi: string;
  historicalNoticeHi: string;
}

/**
 * Historical Crop Price Service (Phase 4 Spec)
 * Resource ID: 35985678-0d79-46b4-9ed6-6f13308a1d24
 *
 * Strictly normalizes to:
 * { source, commodity, variety, year, price, unit, status: "VERIFIED_EXTERNAL" }
 *
 * RULE: Never show as current price. Kept strictly separate from Phase 3 mandi data.
 * NO-FABRICATION RULE: If API fails or yields no records, returns status = "UNAVAILABLE"
 * with "विश्वसनीय डेटा उपलब्ध नहीं है।".
 */
const cropHistoryCache = new Map<string, CropPriceHistoryQueryResult>();

export async function getHistoricalCropPrices(
  commodity: string,
  state?: string,
  convexClient?: { action: (actionName: string, args: any) => Promise<any> },
): Promise<CropPriceHistoryQueryResult> {
  const cacheKey = `${commodity}:${state || ""}`;
  if (cropHistoryCache.has(cacheKey)) {
    return cropHistoryCache.get(cacheKey)!;
  }

  const notice = "📜 यह ऐतिहासिक फ़सल मूल्य डेटा (1991 से 2023) है। इसे वर्तमान मंडी भाव के रूप में उपयोग न करें।";

  if (!convexClient) {
    return {
      status: "UNAVAILABLE",
      records: [],
      messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
      historicalNoticeHi: notice,
    };
  }

  try {
    const res = await convexClient.action("externalData:fetchHistoricalCropPrices", {
      commodity,
      state,
    });

    if (res && res.status === "VERIFIED_EXTERNAL" && Array.isArray(res.records) && res.records.length > 0) {
      const normalizedRecords: HistoricalCropPriceRecord[] = res.records.map((r: any) => ({
        source: "AGMARKNET / Historical Data (Resource 35985678-0d79-46b4-9ed6-6f13308a1d24)",
        commodity: r.commodity || commodity,
        variety: r.variety || "Standard",
        year: Number(r.year || 2020),
        price: Number(r.price || r.modalPrice || 0),
        unit: r.unit || "₹/Quintal",
        status: "VERIFIED_EXTERNAL",
      }));

      const result: CropPriceHistoryQueryResult = {
        status: "VERIFIED_EXTERNAL",
        records: normalizedRecords,
        messageHi: "सत्यापित ऐतिहासिक फ़सल मूल्य (1991 से)",
        historicalNoticeHi: notice,
      };
      cropHistoryCache.set(cacheKey, result);
      return result;
    }

    const fallback: CropPriceHistoryQueryResult = {
      status: "UNAVAILABLE",
      records: [],
      messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
      historicalNoticeHi: notice,
    };
    cropHistoryCache.set(cacheKey, fallback);
    return fallback;
  } catch (err) {
    console.warn("[CropPriceHistoryService] Fetch failed:", err);
    return {
      status: "UNAVAILABLE",
      records: [],
      messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
      historicalNoticeHi: notice,
    };
  }
}
