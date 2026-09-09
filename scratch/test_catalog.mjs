async function testCatalog() {
  const catalogUrls = [
    "https://api.data.gov.in/catalog/9ef84268-d588-465a-a308-a864a43d0070",
    "https://data.gov.in/api/1/rest/crops_price",
  ];

  for (const url of catalogUrls) {
    try {
      const res = await fetch(url);
      console.log(`URL ${url} status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        console.log("Response:", text.substring(0, 300));
      }
    } catch (e) {
      console.log("Error:", e.message);
    }
  }
}

testCatalog();
