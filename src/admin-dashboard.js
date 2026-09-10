const form = document.getElementById("login-form");
const errorElement = document.getElementById("error");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorElement.textContent = "";
  const password = document.getElementById("admin-key").value;

  const response = await fetch("/api/analytics", {
    headers: { "x-admin-key": password },
  });
  const data = await response.json();
  if (!response.ok) {
    errorElement.textContent = data.error || "Dashboard could not be opened.";
    return;
  }

  const cards = [
    ["Anonymous devices", data.summary.anonymousDevices],
    ["Page views", data.summary.pageViews],
    ["Calculation updates", data.summary.calculationUpdates],
    ["All events", data.summary.totalEvents],
  ];
  document.getElementById("summary").innerHTML = cards
    .map(([label, value]) => `<div class="card"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`)
    .join("");
  document.getElementById("routes").innerHTML = data.popularRoutes
    .map((route) => `<tr><td>${escapeHtml(route.departureAirport)}</td><td>${escapeHtml(route.arrivalAirport)}</td><td>${route.count}</td></tr>`)
    .join("") || '<tr><td colspan="3">No route data yet.</td></tr>';
  const regionNames = new Intl.DisplayNames([navigator.language], { type: "region" });
  document.getElementById("countries").innerHTML = data.visitorCountries
    .map((country) => {
      const name = country.countryCode === "ZZ" ? "Unknown" : regionNames.of(country.countryCode);
      return `<tr><td>${escapeHtml(name)} (${escapeHtml(country.countryCode)})</td><td>${country.anonymousDevices}</td><td>${country.pageViews}</td></tr>`;
    })
    .join("") || '<tr><td colspan="3">No country data yet.</td></tr>';
  document.getElementById("events").innerHTML = data.recentEvents
    .map((item) => `<tr><td>${escapeHtml(item.event)}</td><td>${new Date(item.createdAt).toLocaleString()}</td></tr>`)
    .join("") || '<tr><td colspan="2">No activity yet.</td></tr>';
  const testRun = data.latestTestRun;
  document.getElementById("tests").textContent = testRun
    ? `${testRun.passed} passed, ${testRun.failed} failed — IANA ${testRun.timezoneDataVersion}`
    : "No stored test run yet.";

  form.hidden = true;
  document.getElementById("dashboard").hidden = false;
});
