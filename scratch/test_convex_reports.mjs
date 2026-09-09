import { ConvexHttpClient } from "convex/browser";
import { api } from "../src/convex/_generated/api.js";

const client = new ConvexHttpClient("http://127.0.0.1:3210");

async function test() {
  console.log("Testing getUserReports unauthenticated...");
  try {
    const unauthReports = await client.query(api.reports.getUserReports);
    console.log("Unauth getUserReports result:", unauthReports);
  } catch (e) {
    console.error("Error running unauth reports:", e);
  }
}

test();
