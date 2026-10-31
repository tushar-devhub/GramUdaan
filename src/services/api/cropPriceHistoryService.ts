export interface HistoricalCropPriceRecord {
  source: string;
  commodity: string;
  variety: string;
  year: number;
  price: number;
  unit: string;
  status: "VERIFIED_EXTERNAL" | "UNAVAILABLE";
}

export interface CropPriceHistoryQueryResult {
  status: "VERIFIED_EXTERNAL" | "UNAVAILABLE";
  records: HistoricalCropPriceRecord[];
  messageHi: string;
  historicalNoticeHi: string;
}

const cropHistoryCache = new Map<string, CropPriceHistoryQueryResult>();

const DATA_GOV_API_KEY = "579b464db66ec23bdd000001a6e54809f221467e56646515a97a4988";

export async function getHistoricalCropPrices(
  commodity: string,
  state?: string,
  convexClient?: any,
): Promise<CropPriceHistoryQueryResult> {
  const cacheKey = `${commodity}:${state || ""}`;
  if (cropHistoryCache.has(cacheKey)) {
    return cropHistoryCache.get(cacheKey)!;
  }

  const notice = "📜 यह ऐतिहासिक फ़सल मूल्य डेटा (1991 से 2023) है। इसे वर्तमान मंडी भाव के रूप में उपयोग न करें।";

  try {
    const resourceId = "35985678-0d79-46b4-9ed6-6f13308a1d24";
    const url = new URL(`https://api.data.gov.in/resource/${resourceId}`);
    url.searchParams.set("api-key", DATA_GOV_API_KEY);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "20");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) });
    if (!res.ok) {
      return {
        status: "UNAVAILABLE",
        records: [],
        messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
        historicalNoticeHi: notice,
      };
    }

    const json = (await res.json()) as { records?: Record<string, unknown>[] };
    const rawRecords = json.records || [];

    if (rawRecords.length === 0) {
      return {
        status: "UNAVAILABLE",
        records: [],
        messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
        historicalNoticeHi: notice,
      };
    }

    const normalizedRecords: HistoricalCropPriceRecord[] = rawRecords.map((r: any) => ({
      source: "AGMARKNET / Historical Data (Resource 35985678-0d79-46b4-9ed6-6f13308a1d24)",
      commodity: String(r.commodity || commodity),
      variety: String(r.variety || "Standard"),
      year: Number(r.year || 2020),
      price: Number(r.modal_price || r.price || 0),
      unit: String(r.unit || "₹/Quintal"),
      status: "VERIFIED_EXTERNAL",
    }));

    const result: CropPriceHistoryQueryResult = {
      status: "VERIFIED_EXTERNAL",
      records: normalizedRecords,
      messageHi: "सत्यापित ऐतिहासिक फ़सल मूल्य (1991 से 2023)",
      historicalNoticeHi: notice,
    };

    cropHistoryCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn("[cropPriceHistoryService] Direct fetch notice:", err);
    return {
      status: "UNAVAILABLE",
      records: [],
      messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
      historicalNoticeHi: notice,
    };
  }
}
