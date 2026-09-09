import { isAgriCategory } from "@/data/businesses";
import { fetchNearbyOSMBusinesses } from "./overpassService";
import { getAgmarknetMandiPrices } from "./agmarknetService";
import { getHistoricalCropPrices } from "./cropPriceHistoryService";
import type {
  CanonicalAnalysisResult,
  MandiPriceRecord,
  HistoricalCropPriceRecord,
  CensusDataRecord,
  OSMCompetitionSummary,
  CanonicalRiskItem,
  CanonicalSchemeMatch,
  DataPoint,
} from "@/types/dataIntegration";
import type { Location } from "@/data/locations";
import type { BusinessCategory } from "@/data/businesses";
import type { BusinessSubCategory } from "@/data/businessConfig";
import { getSubCategory } from "@/data/businessConfig";

export interface DataFetchOptions {
  location: Location;
  business: BusinessCategory;
  subCategory?: BusinessSubCategory | null;
  radiusKm?: number;
  capital: number;
  placeStatus?: string;
  rentMonthly?: number;
  scaleChoice?: string;
  convexClient?: {
    action: (actionRef: any, args: any) => Promise<any>;
  } | null;
}

/**
 * Fetch and construct the Single Canonical AnalysisResult (Phase 19).
 * Every page in GramUdaan (Dashboard, Reports, Plan, Compare, Advisor, Schemes)
 * consumes this result. None recalculate independently.
 */
export async function buildCanonicalAnalysisResult(
  options: DataFetchOptions,
): Promise<CanonicalAnalysisResult> {
  const { location, business, subCategory: rawSubCat, radiusKm = 5, capital, placeStatus = "unsure", rentMonthly = 0 } = options;
  const isAgri = isAgriCategory(business.id);
  const subCat = rawSubCat || getSubCategory(business.id);

  // 1. Fetch External Data Sources in Parallel (Zero Blocking / Non-Hanging Architecture)
  const [osmSettled, mandiSettled, histSettled] = await Promise.allSettled([
    fetchNearbyOSMBusinesses(location.lat, location.lng, radiusKm),
    isAgri && options.convexClient
      ? getAgmarknetMandiPrices(location.state, location.district, business.name, options.convexClient)
      : Promise.resolve(null),
    isAgri && options.convexClient
      ? getHistoricalCropPrices(business.name, location.state, options.convexClient)
      : Promise.resolve(null),
  ]);

  // Extract OSM Overpass result cleanly
  let osmData: OSMCompetitionSummary;
  if (osmSettled.status === "fulfilled" && osmSettled.value) {
    osmData = osmSettled.value;
  } else {
    osmData = {
      radiusKm,
      totalMappedBusinesses: 0,
      densityCategory: "LOW",
      densityCategoryHi: "डेटा उपलब्ध नहीं",
      businesses: [],
      source: "OpenStreetMap",
      status: "UNAVAILABLE",
      displayLabelHi: "आस-पास के दर्ज व्यवसाय",
    };
  }

  // 2. Prepare Census 2011 Record
  const censusRecord: CensusDataRecord = {
    source: "Census of India 2011",
    year: 2011,
    state: location.state,
    district: location.district,
    villageOrTown: location.name,
    population: location.population,
    households: location.households,
    status: "VERIFIED_EXTERNAL",
    displayLabelHi: "जनसंख्या — जनगणना 2011",
  };

  // 3. Extract Mandi & Historical Crop Price results cleanly
  let mandiResult: { records: MandiPriceRecord[]; status: "VERIFIED_EXTERNAL" | "UNAVAILABLE"; statusTextHi: string } = {
    records: [],
    status: "UNAVAILABLE",
    statusTextHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
  };
  if (mandiSettled.status === "fulfilled" && mandiSettled.value && mandiSettled.value.status === "VERIFIED_EXTERNAL" && mandiSettled.value.records.length > 0) {
    mandiResult = {
      records: mandiSettled.value.records,
      status: "VERIFIED_EXTERNAL",
      statusTextHi: mandiSettled.value.messageHi,
    };
  }

  let historicalResult: { records: HistoricalCropPriceRecord[]; status: "VERIFIED_EXTERNAL" | "UNAVAILABLE"; statusTextHi: string } = {
    records: [],
    status: "UNAVAILABLE",
    statusTextHi: "विश्वसनीय डेटा उपलब्ध नहीं है।",
  };
  if (histSettled.status === "fulfilled" && histSettled.value && histSettled.value.status === "VERIFIED_EXTERNAL" && histSettled.value.records.length > 0) {
    historicalResult = {
      records: histSettled.value.records,
      status: "VERIFIED_EXTERNAL",
      statusTextHi: histSettled.value.messageHi,
    };
  }

  // 4. Deterministic Financial & Feasibility Engine Calculations
  const costWeights = subCat?.costWeights || {
    land: 0.1,
    construction: 0.15,
    equipment: 0.25,
    inventory: 0.3,
    workingCapital: 0.15,
    licensing: 0.02,
    other: 0.03,
  };

  // Setup Cost calculations
  const rawSetupEstimate = subCat?.monthlyFixedCosts ? subCat.monthlyFixedCosts * 10 : capital > 0 ? capital : 100000;
  const targetCost = capital > 0 ? capital : rawSetupEstimate;

  const placeCostVal = placeStatus === "buy" ? Math.round(targetCost * costWeights.land) : 0;
  const constructionCostVal = placeStatus === "build" ? Math.round(targetCost * costWeights.construction) : 0;
  const equipmentCostVal = Math.round(targetCost * costWeights.equipment);
  const inventoryCostVal = Math.round(targetCost * costWeights.inventory);
  const workingCapitalVal = Math.round(targetCost * costWeights.workingCapital);
  const licensingCostVal = Math.round(targetCost * (costWeights.licensing || 0.02));
  
  const totalSetupCost = placeCostVal + constructionCostVal + equipmentCostVal + inventoryCostVal + workingCapitalVal + licensingCostVal;

  // Monthly Operating Expenses
  const baseFixedCost = subCat?.monthlyFixedCosts || Math.round(targetCost * 0.08);
  const placeRent = placeStatus === "rent" ? (rentMonthly > 0 ? rentMonthly : 5000) : 0;
  const monthlyFixedTotal = baseFixedCost + placeRent;

  // Demand scaling factor derived from Census 2011 population anchor
  const popFactor = censusRecord.population > 50000 ? 1.2 : censusRecord.population > 20000 ? 1.0 : censusRecord.population > 5000 ? 0.85 : 0.7;
  
  // Competition adjustment factor derived from OSM Overpass mapped business density
  const compFactor = osmData.densityCategory === "HIGH" ? 0.85 : osmData.densityCategory === "MEDIUM" ? 0.95 : 1.1;

  const baseRevRange: [number, number] = subCat?.monthlyRevenue || [Math.round(targetCost * 0.3), Math.round(targetCost * 0.6)];
  const revMin = Math.round(baseRevRange[0] * popFactor * compFactor);
  const revMax = Math.round(baseRevRange[1] * popFactor * compFactor);

  const varRatio = subCat?.variableCostRatio || 0.6;
  const monthlyVarCostAvg = Math.round(((revMin + revMax) / 2) * varRatio);
  const totalMonthlyExpenses = monthlyFixedTotal + monthlyVarCostAvg;

  const monthlyProfitMin = Math.max(0, revMin - totalMonthlyExpenses);
  const monthlyProfitMax = Math.max(0, revMax - totalMonthlyExpenses);
  const avgProfit = (monthlyProfitMin + monthlyProfitMax) / 2;
  const avgRev = (revMin + revMax) / 2;
  const marginPct = avgRev > 0 ? Math.round((avgProfit / avgRev) * 100) : 0;

  const breakEvenRevenue = monthlyFixedTotal / (1 - Math.min(0.9, varRatio));
  const monthsToBreakEven = avgProfit > 0 ? Math.min(18, Math.max(2, Math.ceil(totalSetupCost / avgProfit))) : 18;

  // Capital Fit
  const fundingGap = Math.max(0, totalSetupCost - capital);
  const surplus = Math.max(0, capital - totalSetupCost);

  // Mandi Price Volatility Factor (Agri Only)
  let mandiVolatilityRiskHi: string | null = null;
  let mandiVolatilityScoreAdj = 0;
  if (isAgri && mandiResult.status === "VERIFIED_EXTERNAL" && mandiResult.records.length > 0) {
    const primaryRecord = mandiResult.records[0];
    if (primaryRecord.maxPrice > 0 && primaryRecord.minPrice > 0) {
      const spread = (primaryRecord.maxPrice - primaryRecord.minPrice) / primaryRecord.modalPrice;
      if (spread > 0.3) {
        mandiVolatilityRiskHi = `मंडी भाव में उच्च उतार-चढ़ाव: ${primaryRecord.commodity} का न्यूनतम भाव ₹${primaryRecord.minPrice} और अधिकतम ₹${primaryRecord.maxPrice} प्रति क्विंटल दर्ज है।`;
        mandiVolatilityScoreAdj = -5;
      } else {
        mandiVolatilityScoreAdj = 5;
      }
    }
  }

  // Phase 10: Deterministic Feasibility Score (0-100) — STRICTLY LLM INDEPENDENT
  let score = 50; // base score
  
  // 1. Census Population Factor (+5 to +15)
  if (censusRecord.population > 30000) score += 15;
  else if (censusRecord.population > 10000) score += 10;
  else if (censusRecord.population > 3000) score += 5;

  // 2. OSM Competition Factor (+0 to +15)
  if (osmData.densityCategory === "LOW") score += 15;
  else if (osmData.densityCategory === "MEDIUM") score += 8;

  // 3. Capital Fit Factor (+0 to +20)
  if (fundingGap <= 0) score += 20;
  else if (fundingGap < capital * 0.5) score += 10;

  // 4. Profit Margin Factor (+0 to +10)
  if (marginPct >= 25) score += 10;
  else if (marginPct >= 15) score += 5;

  // 5. Mandi Volatility Factor (-5 to +5)
  score += mandiVolatilityScoreAdj;

  // Clamp deterministic score between 35 and 95
  score = Math.min(95, Math.max(35, score));

  // Phase 12: Decision Matrix Engine
  let decisionCode: "START" | "PROCEED_CAREFULLY" | "RETHINK" = "PROCEED_CAREFULLY";
  let decisionHi: "शुरू करें" | "सावधानी से आगे बढ़ें" | "पुनर्विचार करें" = "सावधानी से आगे बढ़ें";
  let decisionEn: "START" | "PROCEED CAREFULLY" | "RETHINK" = "PROCEED CAREFULLY";

  if (score >= 70) {
    decisionCode = "START";
    decisionHi = "शुरू करें";
    decisionEn = "START";
  } else if (score < 50) {
    decisionCode = "RETHINK";
    decisionHi = "पुनर्विचार करें";
    decisionEn = "RETHINK";
  }

  // Phase 11: Risk Matrix Engine
  const risks: CanonicalRiskItem[] = [
    {
      id: "competition_risk",
      severity: osmData.densityCategory === "HIGH" ? "HIGH" : "MEDIUM",
      severityHi: osmData.densityCategory === "HIGH" ? "उच्च जोखिम" : "मध्यम जोखिम",
      what: "Local Competition Density",
      whatHi: "स्थानीय प्रतिस्पर्धा घनत्व",
      why: `${location.name} में दर्ज व्यवसाय: ${osmData.totalMappedBusinesses}`,
      whyHi: `${location.name} क्षेत्र में OpenStreetMap के अनुसार ${osmData.totalMappedBusinesses} व्यवसाय दर्ज हैं।`,
      impact: "ग्राहक प्रतिधारण और मार्जिन पर दबाव",
      impactHi: "स्थानीय प्रतिस्पर्धा के कारण बिक्री और मार्जिन पर दबाव पड़ सकता है।",
      action: "विशिष्ट गुणवत्ता, व्यक्तिगत सेवा और डिजिटल भुगतान सुविधा प्रदान करें।",
      actionHi: "गुणवत्ता, बेहतर पैकेजिंग और उधारी प्रबंधन पर ध्यान दें।",
    },
    {
      id: "capital_risk",
      severity: fundingGap > 0 ? "MEDIUM" : "LOW",
      severityHi: fundingGap > 0 ? "मध्यम जोखिम" : "कम जोखिम",
      what: "Funding & Capital Gap",
      whatHi: "पूंजी एवं फंड का अंतर",
      why: fundingGap > 0 ? `₹${fundingGap.toLocaleString("en-IN")} का अंतर है` : "उपलब्ध पूंजी पर्याप्त है",
      whyHi: fundingGap > 0 ? `अनुमानित लागत (₹${totalSetupCost.toLocaleString("en-IN")}) के लिए ₹${fundingGap.toLocaleString("en-IN")} अतिरिक्त चाहिए।` : "आपकी उपलब्ध पूंजी प्रारंभिक लागत को कवर करती है।",
      impact: "शुरुआती संचालन एवं स्टॉक खरीद में बाधा",
      impactHi: "वर्किंग कैपिटल और शुरुआती स्टॉक खरीद में कमी आ सकती है।",
      action: "सरकारी ऋण योजना (PMEGP / Mudra) में आवेदन करें।",
      actionHi: "PMEGP या मुद्रा योजना के तहत सब्सिडी वाला बैंक लोन प्राप्त करें।",
    },
  ];

  if (mandiVolatilityRiskHi) {
    risks.push({
      id: "mandi_price_volatility",
      severity: "MEDIUM",
      severityHi: "मध्यम जोखिम",
      what: "Mandi Price Volatility",
      whatHi: "मंडी भाव में उतार-चढ़ाव",
      why: "AGMARKNET थोक मंडी डेटा में न्यूनतम एवं अधिकतम मूल्यों में अंतर है।",
      whyHi: mandiVolatilityRiskHi,
      impact: "कच्चे माल की खरीद लागत और लाभप्रदता में उतार-चढ़ाव",
      impactHi: "थोक खरीद मूल्य बदलने से मासिक शुद्ध लाभ प्रभावित हो सकता है।",
      action: "स्थानीय किसानों से सीधे अनुबंध करें और मूल्य हेजिंग पर विचार करें।",
      actionHi: "सीधे खेत से खरीद और न्यूनतम स्टॉक बफर बनाए रखें।",
    });
  }

  // Phase 13: Government Scheme Matcher Engine
  const schemes: CanonicalSchemeMatch[] = [
    {
      schemeId: "pmegp",
      schemeName: "PMEGP (Prime Minister Employment Generation Programme)",
      schemeNameHi: "PMEGP — प्रधानमंत्री रोजगार सृजन कार्यक्रम",
      matchLevel: totalSetupCost <= 2500000 ? "HIGH" : "POSSIBLE",
      matchLevelHi: totalSetupCost <= 2500000 ? "उच्च योग्यता" : "संभावित योग्यता",
      maxFunding: 2500000,
      subsidyRate: "15% - 35%",
      subsidyRateHi: "15% से 35% तक सब्सिडी (ग्रामीण क्षेत्र हेतु 35%)",
      keyConditionHi: "न्यूनतम 8वीं पास (10 लाख से अधिक निर्माण/सेवा प्रोजेक्ट के लिए)",
      disclaimerHi: "सरकारी नियमों और बैंक स्वीकृति के अधीन। कोई स्वचालित गारंटी नहीं है।",
    },
    {
      schemeId: "mudra-kishore-tarun",
      schemeName: "Mudra Loan (Kishore / Tarun)",
      schemeNameHi: "मुद्रा ऋण योजना (किशोर एवं तरुण श्रेणियां)",
      matchLevel: "HIGH",
      matchLevelHi: "उच्च योग्यता",
      maxFunding: 1000000,
      subsidyRate: "बिना कोलैटरल लोन",
      subsidyRateHi: "बिना किसी बैंक गारंटी के 10 लाख तक का लोन",
      keyConditionHi: "सत्यापित प्रोजेक्ट रिपोर्ट, आधार कार्ड एवं बैंक खाता आवश्यक",
      disclaimerHi: "ऋण स्वीकृति संबंधित बैंक के क्रेडिट मूल्यांकन पर निर्भर करेगी। सरकारी नियमों और बैंक स्वीकृति के अधीन। कोई स्वचालित गारंटी नहीं है।",
    },
  ];

  if (business.id === "food-processing") {
    schemes.unshift({
      schemeId: "pmfme",
      schemeName: "PMFME (PM Formalisation of Micro Food Processing Enterprises)",
      schemeNameHi: "PMFME — सूक्ष्म खाद्य उद्योग उन्नयन योजना",
      matchLevel: "HIGH",
      matchLevelHi: "उच्च योग्यता",
      maxFunding: 1000000,
      subsidyRate: "35% क्रेडिट-लिंक्ड सब्सिडी",
      subsidyRateHi: "कुल लागत का 35% (अधिकतम ₹10 लाख)",
      keyConditionHi: "खाद्य प्रसंस्करण इकाइयां, स्वयं सहायता समूह (SHG) या व्यक्तिगत उद्यमी",
      disclaimerHi: "जिला संसाधन व्यक्ति (DRP) के माध्यम से आवेदन एवं सत्यापन आवश्यक। सरकारी नियमों और बैंक स्वीकृति के अधीन। कोई स्वचालित गारंटी नहीं है।",
    });
  }

  if (business.id === "dairy") {
    schemes.unshift({
      schemeId: "didf-nabard",
      schemeName: "Dairy Processing & Infrastructure Development Fund (DIDF)",
      schemeNameHi: "नाबार्ड डेयरी इंफ्रास्ट्रक्चर डेवलपमेंट फंड (DIDF)",
      matchLevel: "HIGH",
      matchLevelHi: "उच्च योग्यता",
      maxFunding: 1500000,
      subsidyRate: "2.5% ब्याज छूट एवं सब्सिडी",
      subsidyRateHi: "सब्सिडीयुक्त ब्याज दर एवं बैंक लोन सहायता",
      keyConditionHi: "डेयरी प्रोसेसिंग एवं दुग्ध संग्रह केंद्र स्थापित करने हेतु",
      disclaimerHi: "नाबार्ड और प्राथमिक कृषि ऋण समितियों (PACS) के माध्यम से उपलब्ध। सरकारी नियमों और बैंक स्वीकृति के अधीन। कोई स्वचालित गारंटी नहीं है।",
    });
  }

  // Data Sources tracking provenance
  const sources = [
    {
      name: "Census of India 2011",
      status: censusRecord.status as any,
      statusLabelHi: "सत्यापित डेटा — जनगणना 2011",
      datasetName: "Census 2011 Village/Town Directory",
    },
    {
      name: "OpenStreetMap / Overpass API",
      status: osmData.status as any,
      statusLabelHi: osmData.status === "MAPPED" ? "सत्यापित मैपिंग डेटा" : "अनुमानित डेटा",
      datasetName: "OSM Commercial Nodes",
    },
  ];

  if (isAgri) {
    sources.push({
      name: "AGMARKNET (data.gov.in)",
      status: mandiResult.status as any,
      statusLabelHi: mandiResult.status === "VERIFIED_EXTERNAL" ? "सत्यापित थोक मंडी भाव" : "उपलब्ध नहीं",
      datasetName: "Resource 9ef84268-d588-465a-a308-a864a43d0070",
    });
  }

  const result: CanonicalAnalysisResult = {
    businessId: business.id,
    businessName: business.name,
    businessNameHi: business.nameHi,
    businessType: subCat?.name || business.name,
    businessTypeHi: subCat?.nameHi || business.nameHi,
    isAgriBusiness: isAgri,
    
    location: {
      id: location.id,
      name: location.name,
      district: location.district,
      state: location.state,
      pincode: location.pincode,
      lat: location.lat,
      lng: location.lng,
    },

    population: {
      value: location.population,
      source: "Census of India 2011",
      status: "VERIFIED_EXTERNAL",
      labelHi: "जनसंख्या — जनगणना 2011",
      labelEn: "Population — Census 2011",
    },

    demographics: {
      households: {
        value: location.households,
        source: "Census of India 2011",
        status: "VERIFIED_EXTERNAL",
        labelHi: "कुल परिवार",
      },
      targetConsumers: {
        value: Math.round(location.population * 0.35),
        source: "Calculated from Catchment",
        status: "CALCULATED",
        labelHi: "अनुमानित ग्राहक संख्या",
      },
      tierLabelHi: location.type === "village" ? "गांव / ग्रामीण" : location.type === "town" ? "कस्बा / छोटा शहर" : "शहर / जिला केंद्र",
    },

    nearbyBusinesses: osmData,
    mandiData: mandiResult,
    historicalPrices: historicalResult,

    costs: {
      placeOption: placeStatus as any,
      placeOptionLabelHi:
        placeStatus === "own"
          ? "खुद की जगह (कोई खरीद लागत नहीं)"
          : placeStatus === "rent"
            ? "किराये की जगह (मासिक किराया)"
            : placeStatus === "buy"
              ? "खरीदी जाएगी"
              : placeStatus === "build"
                ? "निर्माण किया जाएगा"
                : "अलग जगह की आवश्यकता नहीं",
      placeCost: { value: placeCostVal, source: "Engine", status: "CALCULATED", unit: "₹" },
      equipmentCost: { value: equipmentCostVal, source: "Engine", status: "ESTIMATED", unit: "₹" },
      inventoryCost: { value: inventoryCostVal, source: "Engine", status: "ESTIMATED", unit: "₹" },
      workingCapital: { value: workingCapitalVal, source: "Engine", status: "ESTIMATED", unit: "₹" },
      constructionCost: { value: constructionCostVal, source: "Engine", status: "CALCULATED", unit: "₹" },
      licensingCost: { value: licensingCostVal, source: "Engine", status: "ESTIMATED", unit: "₹" },
      totalSetupCost: { value: totalSetupCost, source: "Engine", status: "CALCULATED", unit: "₹" },
      monthlyOperatingExpenses: { value: totalMonthlyExpenses, source: "Engine", status: "CALCULATED", unit: "₹/माह" },
    },

    revenue: {
      monthlyRevenueEstimateMin: { value: revMin, source: "Census & OSM Demand Model", status: "CALCULATED", unit: "₹/माह" },
      monthlyRevenueEstimateMax: { value: revMax, source: "Census & OSM Demand Model", status: "CALCULATED", unit: "₹/माह" },
      revenueDriverHi: `स्थानीय जनसंख्या (Census 2011: ${location.population.toLocaleString("en-IN")}) एवं प्रतिस्पर्धा घनत्व (${osmData.densityCategoryHi}) पर आधारित`,
      rampUpMonths: subCat?.rampMonths || 3,
    },

    expenses: {
      monthlyFixedCost: { value: baseFixedCost, source: "Model Benchmark", status: "ESTIMATED", unit: "₹" },
      monthlyVariableCostRatio: { value: varRatio, source: "Model Benchmark", status: "ESTIMATED", unit: "%" },
      monthlyRentCost: { value: placeRent, source: "User/Model", status: placeRent > 0 ? "USER_PROVIDED" : "CALCULATED", unit: "₹" },
    },

    profit: {
      monthlyNetProfitMin: { value: monthlyProfitMin, source: "Engine", status: "CALCULATED", unit: "₹/माह" },
      monthlyNetProfitMax: { value: monthlyProfitMax, source: "Engine", status: "CALCULATED", unit: "₹/माह" },
      netMarginPercent: { value: marginPct, source: "Engine", status: "CALCULATED", unit: "%" },
    },

    breakEven: {
      monthsToBreakEven: { value: monthsToBreakEven, source: "Engine", status: "CALCULATED", unit: "माह" },
      breakEvenMonthlyRevenue: { value: Math.round(breakEvenRevenue), source: "Engine", status: "CALCULATED", unit: "₹/माह" },
    },

    capitalFit: {
      userCapital: { value: capital, source: "User Entry", status: "USER_PROVIDED", unit: "₹" },
      targetInvestment: { value: options.capital, source: "User Entry", status: "USER_PROVIDED", unit: "₹" },
      otherFunding: { value: 0, source: "User Entry", status: "USER_PROVIDED", unit: "₹" },
      totalAvailableCapital: { value: capital, source: "Engine", status: "CALCULATED", unit: "₹" },
      requiredCapital: { value: totalSetupCost, source: "Engine", status: "CALCULATED", unit: "₹" },
      fundingGap: { value: fundingGap, source: "Engine", status: "CALCULATED", unit: "₹" },
      surplusOrDeficit: { value: surplus > 0 ? surplus : -fundingGap, source: "Engine", status: "CALCULATED", unit: "₹" },
      capitalFitStatusHi:
        fundingGap <= 0
          ? "आपकी उपलब्ध पूंजी इस व्यवसाय को शुरू करने के लिए पर्याप्त है।"
          : `अनुमानित लागत को पूरा करने के लिए ₹${fundingGap.toLocaleString("en-IN")} की बाहरी पूंजी/ऋण की आवश्यकता होगी।`,
      surplusExplanationHi:
        surplus > 0
          ? `आपके पास ₹${surplus.toLocaleString("en-IN")} का सरप्लस (अतिरिक्त बचत) है, जिसे वर्किंग कैपिटल में रखा जा सकता है।`
          : "गैप को सरकारी क्रेडिट योजनाओं के ज़रिए पूरा किया जा सकता है।",
    },

    risks,

    feasibilityScore: {
      value: score,
      source: "GramUdaan Engine",
      status: "CALCULATED",
      unit: "/ 100",
    },

    decision: {
      code: decisionCode,
      labelEn: decisionEn,
      labelHi: decisionHi,
      summaryHi:
        decisionCode === "START"
          ? `${location.name} में ${business.nameHi} व्यवसाय के लिए स्थितियां अनुकूल हैं। जनसंख्या मांग अच्छी है और पूंजी की आवश्यकताएं पूरी होती हैं।`
          : decisionCode === "PROCEED_CAREFULLY"
            ? `${location.name} में यह व्यवसाय संभव है, लेकिन लागत और प्रतिस्पर्धा का सही प्रबंधन आवश्यक है।`
            : `वर्तमान परिस्थितियों में ${location.name} में इस व्यवसाय में जोखिम अधिक है। वैकल्पिक विकल्पों पर विचार करें।`,
      whyPointsHi: [
        `जनसंख्या मांग आधार (Census 2011): ${location.population.toLocaleString("en-IN")} निवासी`,
        `दर्ज प्रतिस्पर्धा स्तर (OSM): ${osmData.densityCategoryHi}`,
        fundingGap <= 0 ? "उपलब्ध पूंजी पर्याप्त है — बाहरी बैंक ऋण की आवश्यकता नहीं" : `अनुमानित ऋण अंतर: ₹${fundingGap.toLocaleString("en-IN")}`,
      ],
      watchOutsHi: [
        "कच्चे माल और आपूर्ति श्रृंखला की मौसमी निर्भरता",
        "स्थानीय ग्राहकों के लिए उचित क्रेडिट और उधारी नीति बनाए रखें",
      ],
    },

    alternatives: [
      {
        businessId: "grocery",
        businessNameHi: "किराना दुकान",
        score: Math.min(92, score + 5),
        reasonHi: "दैनिक मांग और लगातार कैश फ्लो",
      },
      {
        businessId: "mobile-repair",
        businessNameHi: "मोबाइल रिपेयर एवं रिचार्ज",
        score: Math.min(88, score + 3),
        reasonHi: "कम शुरुआती निवेश और उच्च मार्जिन",
      },
    ],

    schemes,
    sources,
    assumptionsHi: [
      "सभी वित्तीय आंकड़े सांकेतिक अनुमान हैं, वास्तविक अनुबंध बाजार दरों पर निर्भर करेंगे।",
      "मंडी भाव Wholesale Mandi आंकड़े हैं, जो रिटेल खरीद मूल्य से भिन्न हो सकते हैं।",
      "जनसंख्या आंकड़े Census 2011 आधिकारिक रिकॉर्ड पर आधारित हैं।",
    ],
    timestamp: new Date().toISOString(),
  };

  return result;
}

