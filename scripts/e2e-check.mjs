const routes = [
  "/login",
  "/quick-duty",
  "/temperature",
  "/reports/export",
  "/approvals",
];

async function check() {
  console.log("Checking local routes...");
  for (const r of routes) {
    try {
      const res = await fetch("http://localhost:3000" + r);
      console.log(`Route ${r} -> Status ${res.status}`);
      if (res.status === 200) {
        const text = await res.text();
        console.log(`  Content length: ${text.length} chars. Title match: ${text.includes("BỆNH VIỆN QUÂN Y 103") || text.includes("103")}`);
      }
    } catch (e) {
      console.log(`Route ${r} -> Error: ${e.message}`);
    }
  }
}

check();
