export function validateLegDuration(durationMinutes, isLongDurationConfirmed) {
  if (durationMinutes < 0) {
    return { error: "Arrival is before departure", requiresConfirmation: false };
  }
  if (durationMinutes === 0) {
    return { error: "Departure and arrival are the same", requiresConfirmation: false };
  }
  if (durationMinutes > 24 * 60 && !isLongDurationConfirmed) {
    return { error: "", requiresConfirmation: true };
  }
  return { error: "", requiresConfirmation: false };
}

if (typeof window !== "undefined") {
  window.validateLegDuration = validateLegDuration;
}
