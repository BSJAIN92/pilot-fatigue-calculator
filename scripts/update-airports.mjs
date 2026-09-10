import { mkdir, rm, writeFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import tzLookup from "tz-lookup";

const AIRPORTS_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";
const COUNTRIES_URL = "https://davidmegginson.github.io/ourairports-data/countries.csv";
const outputDirectory = new URL("../public/airports/", import.meta.url);

const [airportsResponse, countriesResponse] = await Promise.all([
  fetch(AIRPORTS_URL),
  fetch(COUNTRIES_URL),
]);

if (!airportsResponse.ok || !countriesResponse.ok) {
  throw new Error("Could not download the current OurAirports data.");
}

const airports = parse(await airportsResponse.text(), {
  columns: true,
  skip_empty_lines: true,
});
const countries = parse(await countriesResponse.text(), {
  columns: true,
  skip_empty_lines: true,
});

const countryNames = new Map(countries.map((country) => [country.code, country.name]));
const airportsByCountry = new Map();

for (const airport of airports) {
  if (airport.type === "closed" || !airport.iso_country) continue;

  const latitude = Number(airport.latitude_deg);
  const longitude = Number(airport.longitude_deg);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

  let timeZone;
  try {
    timeZone = tzLookup(latitude, longitude);
  } catch {
    continue;
  }

  const codes = [...new Set([
    airport.iata_code,
    airport.icao_code,
    airport.gps_code,
    airport.local_code,
    airport.ident,
  ].filter(Boolean))];

  const record = {
    name: airport.name,
    municipality: airport.municipality || "",
    codes,
    timeZone,
  };

  if (!airportsByCountry.has(airport.iso_country)) {
    airportsByCountry.set(airport.iso_country, []);
  }
  airportsByCountry.get(airport.iso_country).push(record);
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const index = [...airportsByCountry.entries()]
  .map(([code, countryAirports]) => ({
    code,
    name: countryNames.get(code) || code,
    airportCount: countryAirports.length,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

await Promise.all([
  writeFile(new URL("index.json", outputDirectory), JSON.stringify(index)),
  ...[...airportsByCountry.entries()].map(([code, countryAirports]) => {
    countryAirports.sort((a, b) => a.name.localeCompare(b.name));
    return writeFile(
      new URL(`${code}.json`, outputDirectory),
      JSON.stringify(countryAirports),
    );
  }),
]);

console.log(`Generated ${airportsByCountry.size} country files containing ${airportsByCountry.values().reduce((total, list) => total + list.length, 0)} active airports.`);
