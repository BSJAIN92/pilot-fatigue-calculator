export function formatUtcDateTime(epochMilliseconds) {
  const iso = new Date(epochMilliseconds).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}
