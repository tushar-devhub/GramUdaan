import { useOnboarding } from "@/lib/onboarding-context";
import { Database, MapPin, Store, TrendingUp, ShieldCheck, AlertCircle, Users } from "lucide-react";
import { formatIndianCurrency } from "@/data/assessment";

function getStatusLabel(status: string): string {
  switch (status) {
    case "VERIFIED_EXTERNAL": return "सत्यापित बाह्य स्रोत";
    case "MAPPED": return "दर्ज मैपिंग";
    case "USER_PROVIDED": return "उपयोगकर्ता द्वारा दर्ज";
    case "CALCULATED": return "परिकलित";
    case "ESTIMATED": return "अनुमानित";
    case "AI_GENERATED": return "एआई जनित";
    case "UNAVAILABLE": return "अनुपलब्ध";
    default: return status;
  }
}

export default function DataIntegrationCard() {
  const { analysisResult } = useOnboarding();

  if (!analysisResult) {
    return null;
  }

  const res = analysisResult;
  const isAgri = res.isAgriBusiness;

  return (
    <section className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/20 p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif-display flex items-center gap-2">
              प्रमाणित डेटा एवं लाइव स्रोतों का विश्लेषण
            </h2>
            <p className="text-xs text-slate-600">
              {res.location.name}, {res.location.district} ({res.location.state}) · पिन कोड {res.location.pincode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" /> 100% पारदर्शी डेटा
          </span>
        </div>
      </div>

      {/* Grid of Data Provenance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Card 1: Census 2011 Population */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>{res.population.labelHi}</span>
            </div>
            <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              {getStatusLabel(res.population.status)}
            </span>
          </div>

          <div className="my-3">
            <p className="text-2xl font-extrabold text-slate-900">
              {res.population.value.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              कुल निवासी · {res.demographics.households.value.toLocaleString("en-IN")} परिवार ({res.demographics.tierLabelHi})
            </p>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>स्रोत: {res.population.source}</span>
            <span className="font-semibold text-emerald-700">जनगणना 2011 रिकॉर्ड</span>
          </div>
        </div>

        {/* Card 2: OpenStreetMap Mapped Businesses */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
              <Store className="h-4 w-4 text-emerald-600" />
              <span>{res.nearbyBusinesses.displayLabelHi}</span>
            </div>
            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              {getStatusLabel(res.nearbyBusinesses.status)}
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-slate-900">
                {res.nearbyBusinesses.totalMappedBusinesses}
              </p>
              <span className="text-xs font-semibold text-slate-600">
                दर्ज व्यावसायिक इकाइयां ({res.nearbyBusinesses.radiusKm} किमी दायरा)
              </span>
            </div>
            <p className="text-xs font-medium text-emerald-700 mt-1">
              प्रतिस्पर्धा का स्तर: {res.nearbyBusinesses.densityCategoryHi}
            </p>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>स्रोत: ओपनस्ट्रीटमैप ओवरपास</span>
            <span className="text-slate-600">आस-पास के दर्ज व्यवसाय</span>
          </div>
        </div>

        {/* Card 3: Mandi Prices / Agriculture Data or Category Scoping Notice */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between md:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span>{isAgri ? "थोक मंडी भाव (एगमार्कनेट)" : "कृषि डेटा दायरा स्थिति"}</span>
            </div>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                isAgri && res.mandiData?.status === "VERIFIED_EXTERNAL"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border border-amber-200 text-amber-800"
              }`}
            >
              {isAgri ? getStatusLabel(res.mandiData?.status || "UNAVAILABLE") : "गैर-कृषि श्रेणी"}
            </span>
          </div>

          <div className="my-3">
            {isAgri ? (
              res.mandiData?.status === "VERIFIED_EXTERNAL" && res.mandiData.records.length > 0 ? (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{res.mandiData.records[0].commodity} ({res.mandiData.records[0].variety})</span>
                    <span>₹{res.mandiData.records[0].modalPrice.toLocaleString("en-IN")} / कुंतल</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>मंडी: {res.mandiData.records[0].market}</span>
                    <span>न्यूनतम: ₹{res.mandiData.records[0].minPrice} | अधिकतम: ₹{res.mandiData.records[0].maxPrice}</span>
                  </div>
                  <p className="text-[10px] text-amber-700 font-medium bg-amber-50 rounded px-1.5 py-0.5 mt-1">
                    ⚠️ सूचना: यह थोक मंडी मूल्य है, किसान/रिटेल मूल्य भिन्न हो सकता है।
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-600 font-medium italic">
                  {res.mandiData?.statusTextHi || "विश्वसनीय डेटा उपलब्ध नहीं है।"}
                </p>
              )
            ) : (
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">
                  {res.businessNameHi} ({res.businessTypeHi}) गैर-कृषि व्यवसाय है।
                </p>
                <p className="text-slate-500 text-[11px]">
                  यह श्रेणी केवल Census 2011 जनसंख्या और OpenStreetMap मैपिंग डेटा का उपयोग करती है। (मंडी डेटा लागू नहीं है)
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>{isAgri ? "सत्यापित एगमार्कनेट" : "व्यापार मॉडल विन्यास"}</span>
            <span>{isAgri ? "data.gov.in" : "जनगणना एवं मैपिंग फ़िल्टर"}</span>
          </div>
        </div>
      </div>

      {/* Data Sources Provenance Summary */}
      <div className="rounded-xl bg-white border border-slate-200 p-4">
        <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          सक्रिय डेटा स्रोत एवं प्रामाणिकता:
        </h3>
        <div className="flex flex-wrap gap-2">
          {res.sources.map((src, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs"
            >
              <span className="font-semibold text-slate-800">{src.name}</span>
              <span
                className={`rounded-full px-2 py-0.2 text-[9px] font-bold ${
                  src.status === "VERIFIED_EXTERNAL"
                    ? "bg-emerald-100 text-emerald-800"
                    : src.status === "MAPPED"
                      ? "bg-blue-100 text-blue-800"
                      : src.status === "USER_PROVIDED"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-slate-200 text-slate-700"
                }`}
              >
                {getStatusLabel(src.status)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
