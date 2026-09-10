import moment from "moment-timezone";

export function localTimeToEpochMilliseconds(dateStr, timeStr, timeZone) {
  const localDateTime = `${dateStr} ${timeStr}`;
  const parsedWallTime = moment.utc(localDateTime, "YYYY-MM-DD HH:mm", true);
  const zone = moment.tz.zone(timeZone);

  if (!parsedWallTime.isValid() || !zone) {
    throw new RangeError("The local date, time, or timezone is incomplete.");
  }

  const wallTimeAsUtc = parsedWallTime.valueOf();
  const possibleOffsets = [...new Set(zone.offsets)];
  const matchingInstants = possibleOffsets
    .map((offsetMinutes) => wallTimeAsUtc + offsetMinutes * 60_000)
    .filter((instant) =>
      zone.utcOffset(instant) * 60_000 + wallTimeAsUtc === instant &&
      moment.tz(instant, timeZone).format("YYYY-MM-DD HH:mm") === localDateTime
    );

  if (matchingInstants.length !== 1) {
    throw new RangeError(
      matchingInstants.length === 0
        ? "This local time does not exist because the clocks changed."
        : "This local time occurred twice because the clocks changed.",
    );
  }

  return matchingInstants[0];
}

export function getTimezoneDataVersion() {
  return moment.tz.dataVersion;
}
