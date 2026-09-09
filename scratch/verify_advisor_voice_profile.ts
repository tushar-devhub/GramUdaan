import { en } from "../src/i18n/translations/en";
import { hi } from "../src/i18n/translations/hi";

// Test key parity for advisor, voice, and profile
const targetPrefixes = ["advisor.", "voice.", "profile."];

console.log("=== CHECKING KEY PARITY FOR ADVISOR, VOICE & PROFILE ===");

let enKeys = Object.keys(en).filter((k) => targetPrefixes.some((p) => k.startsWith(p)));
let hiKeys = Object.keys(hi).filter((k) => targetPrefixes.some((p) => k.startsWith(p)));

console.log(`Found ${enKeys.length} keys in en.ts matching prefixes.`);
console.log(`Found ${hiKeys.length} keys in hi.ts matching prefixes.`);

let missingInHi: string[] = [];
let missingInEn: string[] = [];

for (const k of enKeys) {
  if (!(k in hi)) missingInHi.push(k);
}
for (const k of hiKeys) {
  if (!(k in en)) missingInEn.push(k);
}

if (missingInHi.length > 0) {
  console.error("Missing in hi.ts:", missingInHi);
} else {
  console.log("✓ All target keys present in hi.ts!");
}

if (missingInEn.length > 0) {
  console.error("Missing in en.ts:", missingInEn);
} else {
  console.log("✓ All target keys present in en.ts!");
}

// Check sample translations
console.log("\n=== SAMPLE TRANSLATIONS ===");
const sampleKeys = [
  "advisor.title",
  "advisor.subtitle",
  "advisor.micBanner",
  "advisor.welcomeTitle",
  "advisor.suggestedQuestions",
  "advisor.q1",
  "advisor.inputPlaceholder",
  "voice.aiAdvisor",
  "voice.panelTitle",
  "voice.listening",
  "voice.speaking",
  "voice.welcomeGreeting",
  "voice.recording",
  "profile.title",
  "profile.businessProfile",
  "profile.placeOwn",
  "profile.placeRent",
  "profile.freshAssessmentTitle",
  "profile.signOut"
];

for (const k of sampleKeys) {
  console.log(`[${k}]`);
  console.log(`  EN: ${(en as any)[k]}`);
  console.log(`  HI: ${(hi as any)[k]}`);
}
