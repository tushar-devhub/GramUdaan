const candidateKeys = [
  "579b464db66ec23bdd000001cdd39463285f478440536c6499815777",
  "579b464db66ec23bdd000001c0c6c74771694f4c5409748b625a6988",
  "579b464db66ec23bdd0000019ee65e2365ee461e479c05763b655f41",
  "579b464db66ec23bdd00000115049cf135324ecfa169f46b4129ec10",
  "579b464db66ec23bdd000001a1c360dfd2944b0fb5f9d146ee5716df"
];

const resourceId = "9ef84268-d588-465a-a308-a864a43d0070";

async function testKeys() {
  for (const key of candidateKeys) {
    const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${key}&format=json&limit=2`;
    try {
      const res = await fetch(url);
      console.log(`Key ${key.substring(0, 10)}... status: ${res.status}`);
      if (res.ok) {
        const json = await res.json();
        console.log(`SUCCESS! Found ${json.records?.length || 0} records!`);
        if (json.records?.length > 0) {
          console.log("Sample Record:", JSON.stringify(json.records[0], null, 2));
        }
        return key;
      }
    } catch (e) {
      console.log("Error:", e.message);
    }
  }
  return null;
}

testKeys();
