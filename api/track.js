import { ConvexHttpClient } from "convex/browser";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  const contentLength = Number(request.headers["content-length"] || 0);
  if (contentLength > 100_000) {
    return response.status(413).json({ error: "Analytics event is too large" });
  }

  const rawCountryCode = request.headers["x-vercel-ip-country"];
  const countryCode = typeof rawCountryCode === "string" && /^[A-Z]{2}$/.test(rawCountryCode)
    ? rawCountryCode
    : "ZZ";

  try {
    const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL);
    await convex.mutation("analytics:track", {
      ...request.body,
      countryCode,
      ingestKey: process.env.CONVEX_ANALYTICS_INGEST_KEY,
    });
    response.setHeader("Cache-Control", "no-store");
    return response.status(204).end();
  } catch (error) {
    console.error("Analytics tracking failed:", error);
    return response.status(400).json({ error: "Analytics event was rejected" });
  }
}
