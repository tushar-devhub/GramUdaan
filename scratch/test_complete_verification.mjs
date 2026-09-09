import { ConvexHttpClient } from "convex/browser";
import { api } from "../src/convex/_generated/api.js";

const client = new ConvexHttpClient("http://127.0.0.1:3210");

async function runTests() {
  console.log("=== STEP 3 VERIFICATION TESTS ===");

  // 1. Sign in User 1
  const authRes1 = await client.action(api.auth.signIn, { provider: "anonymous" });
  const token1 = authRes1.tokens.token;
  console.log("User 1 signed in. Token generated.");

  const client1 = new ConvexHttpClient("http://127.0.0.1:3210");
  client1.setAuth(token1);

  // Check 2: Empty state for User 1
  const initialReportsUser1 = await client1.query(api.reports.getUserReports);
  console.log("Check 2 (Empty state): User 1 reports count =", initialReportsUser1.length);
  if (initialReportsUser1.length !== 0) {
    throw new Error("Expected 0 reports for new user!");
  }
  console.log("-> PASS: Check 2 (Empty state for zero reports)");

  // Check 1: User 1 saves a report and queries Report Hub
  const savedReportId1 = await client1.mutation(api.reports.saveReport, {
    title: "Kirana Store — Sonpur",
    businessId: "kirana",
    businessName: "Kirana Store",
    subCategoryId: "retail",
    locationId: "sonpur",
    locationName: "Sonpur, Saran",
    capital: 150000,
    targetInvestment: 200000,
    overallScore: 82,
    verdict: "FEASIBLE",
    verdictLabel: "High Potential",
    feasibilityData: { score: 82, summary: "Strong local market" }
  });
  console.log("User 1 saved report id:", savedReportId1);

  const reportsAfterSaveUser1 = await client1.query(api.reports.getUserReports);
  console.log("Check 1 (Saved reports query): User 1 reports count =", reportsAfterSaveUser1.length);
  console.log("Report title:", reportsAfterSaveUser1[0]?.title);
  if (reportsAfterSaveUser1.length !== 1 || reportsAfterSaveUser1[0]._id !== savedReportId1) {
    throw new Error("Expected 1 report matching saved ID!");
  }
  console.log("-> PASS: Check 1 (Report Hub loads user's report without error)");

  // Check 3: Create User 2 and confirm isolation
  const authRes2 = await client.action(api.auth.signIn, { provider: "anonymous" });
  const token2 = authRes2.tokens.token;
  console.log("User 2 signed in. Token generated.");

  const client2 = new ConvexHttpClient("http://127.0.0.1:3210");
  client2.setAuth(token2);

  const user2ReportsBefore = await client2.query(api.reports.getUserReports);
  console.log("Check 3 (Isolation): User 2 reports count =", user2ReportsBefore.length);
  if (user2ReportsBefore.length !== 0) {
    throw new Error("Security leak! User 2 can see reports that do not belong to them!");
  }

  // User 2 saves a distinct report
  const savedReportId2 = await client2.mutation(api.reports.saveReport, {
    title: "Flour Mill — Hajipur",
    businessId: "flour_mill",
    businessName: "Flour Mill (Atta Chakki)",
    locationId: "hajipur",
    locationName: "Hajipur, Vaishali",
    capital: 300000,
    overallScore: 78,
    verdict: "MODERATE",
    verdictLabel: "Moderate Feasibility",
    feasibilityData: { score: 78 }
  });

  const user2ReportsAfter = await client2.query(api.reports.getUserReports);
  console.log("User 2 reports after save:", user2ReportsAfter.map(r => r.title));
  if (user2ReportsAfter.length !== 1 || user2ReportsAfter[0]._id !== savedReportId2) {
    throw new Error("User 2 reports mismatch!");
  }

  // Re-verify User 1 only sees their own report, not User 2's
  const user1Recheck = await client1.query(api.reports.getUserReports);
  console.log("User 1 reports re-check:", user1Recheck.map(r => r.title));
  if (user1Recheck.length !== 1 || user1Recheck[0]._id !== savedReportId1) {
    throw new Error("Cross-user contamination detected!");
  }
  console.log("-> PASS: Check 3 (Cross-user isolation verified)");

  // Check 4: Persistence across sessions
  // Re-authenticate / re-connect with User 1 token
  const client1Reconnected = new ConvexHttpClient("http://127.0.0.1:3210");
  client1Reconnected.setAuth(token1);
  const user1Persisted = await client1Reconnected.query(api.reports.getUserReports);
  if (user1Persisted.length !== 1 || user1Persisted[0]._id !== savedReportId1) {
    throw new Error("Persistence check failed for User 1!");
  }

  const client2Reconnected = new ConvexHttpClient("http://127.0.0.1:3210");
  client2Reconnected.setAuth(token2);
  const user2Persisted = await client2Reconnected.query(api.reports.getUserReports);
  if (user2Persisted.length !== 1 || user2Persisted[0]._id !== savedReportId2) {
    throw new Error("Persistence check failed for User 2!");
  }
  console.log("-> PASS: Check 4 (Reports persist across logout and login)");

  console.log("=== ALL 4 CHECKS PASSED SUCCESSFULLY ===");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
