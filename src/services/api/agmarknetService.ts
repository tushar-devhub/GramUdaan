export interface MandiPriceRecord {
  source: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  date: string;
  status: "VERIFIED_EXTERNAL" | "UNAVAILABLE";
  isWholesaleNotice: boolean;
}

export interface AgmarknetQueryResult {
  status: "VERIFIED_EXTERNAL" | "UNAVAILABLE";
  records: MandiPriceRecord[];
  messageHi: string;
  noticeHi: string;
}

const agmarknetCache = new Map<string, AgmarknetQueryResult>();

const DATA_GOV_API_KEY = "579b464db66ec23bdd000001a6e54809f221467e56646515a97a4988";

export async function getAgmarknetMandiPrices(
  state: string,
  district: string,
  commodity?: string,
  convexClient?: any,
): Promise<AgmarknetQueryResult> {
  const cacheKey = `${state}:${district}:${commodity || ""}`;
  if (agmarknetCache.has(cacheKey)) {
    return agmarknetCache.get(cacheKey)!;
  }

  const defaultNotice = "⚠️ यह थोक मंडी मूल्य (Wholesale Mandi Data) है। यह किसान या रिटेल मूल्य की गारंटी नहीं देता है।";

  try {
    const resourceId = "9ef84268-d588-465a-a308-a864a43d0070";
    const url = new URL(`https://api.data.gov.in/resource/${resourceId}`);
    url.searchParams.set("api-key", DATA_GOV_API_KEY);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "20");
    if (state) url.searchParams.set("filters[state]", state);
    if (district) url.searchParams.set("filters[district]", district);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) });
    if (!res.ok) {
      return {
        status: "UNAVAILABLE",
        records: [],
        messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
        noticeHi: defaultNotice,
      };
    }

    const json = (await res.json()) as { records?: Record<string, unknown>[] };
    const rawRecords = json.records || [];

    if (rawRecords.length === 0) {
      return {
        status: "UNAVAILABLE",
        records: [],
        messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
        noticeHi: defaultNotice,
      };
    }

    const normalizedRecords: MandiPriceRecord[] = rawRecords.map((r: any) => ({
      source: "AGMARKNET / data.gov.in (Resource 9ef84268-d588-465a-a308-a864a43d0070)",
      state: String(r.state || state),
      district: String(r.district || district),
      market: String(r.market || "Mandi"),
      commodity: String(r.commodity || commodity || "Produce"),
      variety: String(r.variety || "Standard"),
      minPrice: Number(r.min_price || r.minPrice || 0),
      maxPrice: Number(r.max_price || r.maxPrice || 0),
      modalPrice: Number(r.modal_price || r.modalPrice || 0),
      unit: String(r.unit || "₹/Quintal"),
      date: String(r.arrival_date || new Date().toISOString().split("T")[0]),
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
  } catch (err) {
    console.warn("[agmarknetService] Direct fetch notice:", err);
    return {
      status: "UNAVAILABLE",
      records: [],
      messageHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
      noticeHi: defaultNotice,
    };
  }
}
