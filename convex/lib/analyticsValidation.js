const ALLOWED_EVENTS = new Set([
  "page_view",
  "add_leg",
  "deduction_requested",
  "deduction_added",
  "deduction_removed",
  "remove_leg",
  "clear_requested",
  "clear_confirmed",
  "clear_cancelled",
  "calculation_updated",
]);

const LEG_STRING_LIMITS = {
  operator: 8,
  departureCountry: 80,
  departureAirport: 240,
  departureTimeZone: 80,
  departureDate: 10,
  departureTime: 5,
  arrivalCountry: 80,
  arrivalAirport: 240,
  arrivalTimeZone: 80,
  arrivalDate: 10,
  arrivalTime: 5,
  duration: 40,
};

function requireBoundedString(value, field, maximumLength) {
  if (typeof value !== "string" || value.length === 0 || value.length > maximumLength) {
    throw new Error(`${field} is invalid.`);
  }
  return value;
}

export function validateAndCleanAnalytics(args) {
  requireBoundedString(args.anonymousId, "anonymousId", 64);
  requireBoundedString(args.sessionId, "sessionId", 64);
  requireBoundedString(args.page, "page", 200);

  if (!ALLOWED_EVENTS.has(args.event)) {
    throw new Error("Unknown analytics event.");
  }
  const countryCode = args.countryCode || "ZZ";
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error("countryCode is invalid.");
  }
  const cleanedBase = {
    anonymousId: args.anonymousId,
    sessionId: args.sessionId,
    event: args.event,
    page: args.page,
    countryCode,
  };

  if (args.event !== "calculation_updated") {
    if (args.details !== undefined) {
      throw new Error("This event must not contain details.");
    }
    return { ...cleanedBase, details: undefined };
  }

  const details = args.details;
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    throw new Error("Calculation details are required.");
  }
  if (!Number.isInteger(details.legCount) || details.legCount < 1 || details.legCount > 50) {
    throw new Error("legCount is invalid.");
  }
  requireBoundedString(details.totalDuration, "totalDuration", 40);
  if (!Array.isArray(details.legs) || details.legs.length !== details.legCount) {
    throw new Error("The leg list is invalid.");
  }

  const legs = details.legs.map((leg, index) => {
    if (!leg || typeof leg !== "object" || Array.isArray(leg)) {
      throw new Error(`Leg ${index + 1} is invalid.`);
    }
    const cleanedLeg = {};
    for (const [field, maximumLength] of Object.entries(LEG_STRING_LIMITS)) {
      cleanedLeg[field] = requireBoundedString(
        leg[field],
        `legs[${index}].${field}`,
        maximumLength,
      );
    }
    if (!new Set(["add", "subtract"]).has(cleanedLeg.operator)) {
      throw new Error(`Leg ${index + 1} has an invalid operator.`);
    }
    return cleanedLeg;
  });

  return {
    ...cleanedBase,
    details: {
      legCount: details.legCount,
      totalDuration: details.totalDuration,
      legs,
    },
  };
}
