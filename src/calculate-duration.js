import { localTimeToEpochMilliseconds } from "./timezone.js";

export function calculateDurationMinutes({
  departureDate,
  departureTime,
  departureTimeZone,
  arrivalDate,
  arrivalTime,
  arrivalTimeZone,
}) {
  const departure = localTimeToEpochMilliseconds(
    departureDate,
    departureTime,
    departureTimeZone,
  );
  const arrival = localTimeToEpochMilliseconds(
    arrivalDate,
    arrivalTime,
    arrivalTimeZone,
  );
  return Math.floor((arrival - departure) / 60_000);
}
