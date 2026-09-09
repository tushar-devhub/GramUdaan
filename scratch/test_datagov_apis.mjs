const API_KEY = process.env.DATA_GOV_API_KEY || "579b464db66ec23bdd000001cdd39463285f478440536c6499815777";

async function testAgmarknet() {
  console.log("\n--- TESTING 1. AGMARKNET Current Mandi Prices ---");
  const resourceId = "9ef84268-d588-465a-a308-a864a43d0070";
  
  // Test State 1: Uttar Pradesh
  const url1 = `https://api.data.gov.in/resource/${resourceId}?api-key=${API_KEY}&format=json&limit=5&filters[state]=Uttar%20Pradesh`;
  console.log(`Querying URL 1 (Uttar Pradesh)...`);
  
  try {
    const res1 = await fetch(url1);
    console.log(`HTTP Status: ${res1.status}`);
    if (res1.ok) {
      const data1 = await res1.json();
      console.log(`Records count (UP): ${data1.records?.length || 0}`);
      if (data1.records && data1.records.length > 0) {
        console.log("Sample Record (UP):", JSON.stringify(data1.records[0], null, 2));
      }
    } else {
      console.log("Error response:", await res1.text());
    }
  } catch (err) {
    console.error("Fetch failed (UP):", err.message);
  }

  // Test State 2: Punjab
  const url2 = `https://api.data.gov.in/resource/${resourceId}?api-key=${API_KEY}&format=json&limit=5&filters[state]=Punjab`;
  console.log(`\nQuerying URL 2 (Punjab)...`);
  try {
    const res2 = await fetch(url2);
    console.log(`HTTP Status: ${res2.status}`);
    if (res2.ok) {
      const data2 = await res2.json();
      console.log(`Records count (Punjab): ${data2.records?.length || 0}`);
      if (data2.records && data2.records.length > 0) {
        console.log("Sample Record (Punjab):", JSON.stringify(data2.records[0], null, 2));
      }
    }
  } catch (err) {
    console.error("Fetch failed (Punjab):", err.message);
  }
}

async function testHistoricalCrop() {
  console.log("\n--- TESTING 2. Historical Crop Prices (since 1991) ---");
  const candidateIds = [
    "35985678-0d79-46b4-9ed6-6f13308a1d24",
    "9ef84268-d588-465a-a308-a864a43d0070",
  ];

  for (const id of candidateIds) {
    const url = `https://api.data.gov.in/resource/${id}?api-key=${API_KEY}&format=json&limit=3`;
    console.log(`Testing Resource ID: ${id}`);
    try {
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Found ${data.records?.length || 0} records for resource ${id}`);
        if (data.records?.length > 0) {
          console.log("Sample record:", JSON.stringify(data.records[0], null, 2));
        }
      }
    } catch (err) {
      console.log(`Resource ${id} failed:`, err.message);
    }
  }
}

async function testCensus() {
  console.log("\n--- TESTING 3. Census 2011 Data on data.gov.in ---");
  const censusResourceIds = [
    "b8b09062-8178-4334-a15d-35f99fa4eb4e",
    "8a0885e3-4f93-41c3-8a39-7756e18f2603",
    "d04eb589-9a25-4100-b605-b062254378f5",
  ];

  for (const id of censusResourceIds) {
    const url = `https://api.data.gov.in/resource/${id}?api-key=${API_KEY}&format=json&limit=3`;
    console.log(`Testing Census Resource ID: ${id}`);
    try {
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Records count: ${data.records?.length || 0}`);
        if (data.records?.length > 0) {
          console.log("Sample Census Record:", JSON.stringify(data.records[0], null, 2));
        }
      } else {
        console.log(`Resource ${id} HTTP error ${res.status}`);
      }
    } catch (err) {
      console.log(`Census ${id} error:`, err.message);
    }
  }
}

async function run() {
  await testAgmarknet();
  await testHistoricalCrop();
  await testCensus();
}

run();
