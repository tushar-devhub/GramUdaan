const API_KEY = "579b464db66ec23bdd000001a6e54809f221467e56646515a97a4988";
const resourceId = "9ef84268-d588-465a-a308-a864a43d0070";

async function verifyLiveKey() {
  console.log("--- VERIFYING LIVE DATA.GOV.IN API KEY ---");
  
  // Test query 1: Uttar Pradesh
  const url1 = `https://api.data.gov.in/resource/${resourceId}?api-key=${API_KEY}&format=json&limit=3&filters[state]=Uttar%20Pradesh`;
  console.log("Querying AGMARKNET dataset for Uttar Pradesh...");
  
  try {
    const res1 = await fetch(url1);
    console.log(`HTTP Response Status: ${res1.status}`);
    if (res1.ok) {
      const data1 = await res1.json();
      console.log(`[SUCCESS] Returned ${data1.records?.length || 0} real records for Uttar Pradesh!`);
      if (data1.records?.length > 0) {
        console.log("Sample Record fields:", Object.keys(data1.records[0]));
        console.log("Commodity:", data1.records[0].commodity, "| Market:", data1.records[0].market, "| Modal Price:", data1.records[0].modal_price);
      }
    } else {
      console.log("[FAILURE] Error text:", await res1.text());
    }
  } catch (err) {
    console.error("Request error:", err.message);
  }

  // Test query 2: Punjab
  const url2 = `https://api.data.gov.in/resource/${resourceId}?api-key=${API_KEY}&format=json&limit=3&filters[state]=Punjab`;
  console.log("\nQuerying AGMARKNET dataset for Punjab...");
  
  try {
    const res2 = await fetch(url2);
    console.log(`HTTP Response Status: ${res2.status}`);
    if (res2.ok) {
      const data2 = await res2.json();
      console.log(`[SUCCESS] Returned ${data2.records?.length || 0} real records for Punjab!`);
      if (data2.records?.length > 0) {
        console.log("Commodity:", data2.records[0].commodity, "| Market:", data2.records[0].market, "| Modal Price:", data2.records[0].modal_price);
      }
    }
  } catch (err) {
    console.error("Request error:", err.message);
  }
}

verifyLiveKey();
