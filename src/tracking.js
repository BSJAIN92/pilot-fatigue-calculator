import { ConvexHttpClient } from "convex/browser";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (convexUrl) {
  const client = new ConvexHttpClient(convexUrl);
  const anonymousId = getOrCreateId(localStorage, "fatigue_anonymous_id");
  const sessionId = getOrCreateId(sessionStorage, "fatigue_session_id");

  function getOrCreateId(storage, key) {
    let id = storage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      storage.setItem(key, id);
    }
    return id;
  }

  function track(event, details) {
    client
      .mutation("analytics:track", {
        anonymousId,
        sessionId,
        event,
        page: location.pathname,
        ...(details ? { details } : {}),
      })
      .catch((error) => console.warn("Anonymous tracking failed:", error));
  }

  track("page_view");

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const eventNames = {
      "add-btn": "add_leg",
      "clear-btn": "clear_requested",
      "confirm-yes": "clear_confirmed",
      "confirm-no": "clear_cancelled",
    };

    if (button.classList.contains("remove-btn")) {
      track("remove_leg");
    } else if (eventNames[button.id]) {
      track(eventNames[button.id]);
    }
  });

  let calculationTimer;
  document.addEventListener("change", (event) => {
    if (!event.target.closest(".time-row")) return;
    clearTimeout(calculationTimer);
    calculationTimer = setTimeout(() => {
      const legs = [...document.querySelectorAll(".time-row")].map((row) => ({
        operator: row.querySelector(".operator-select").value === "-1" ? "subtract" : "add",
        departureCountry: row.querySelector(".country-select-start").value,
        departureAirport: row.querySelector(".city-select-start").selectedOptions[0]?.text ?? "",
        departureTimeZone: row.querySelector(".city-select-start").value,
        departureDate: row.querySelector(".time-date-start").value,
        departureTime: row.querySelector(".time-time-start").value,
        arrivalCountry: row.querySelector(".country-select-end").value,
        arrivalAirport: row.querySelector(".city-select-end").selectedOptions[0]?.text ?? "",
        arrivalTimeZone: row.querySelector(".city-select-end").value,
        arrivalDate: row.querySelector(".time-date-end").value,
        arrivalTime: row.querySelector(".time-time-end").value,
        duration: row.querySelector(".row-duration").textContent,
      }));

      track("calculation_updated", {
        legCount: legs.length,
        totalDuration: document.getElementById("total-display").textContent,
        legs,
      });
    }, 800);
  });
} else {
  console.info("Anonymous tracking is disabled until VITE_CONVEX_URL is configured.");
}
