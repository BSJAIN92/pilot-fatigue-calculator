import crypto from "node:crypto";
import { ConvexHttpClient } from "convex/browser";

function secretsMatch(received, expected) {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({ error: "Method not allowed" });
  }
  if (!secretsMatch(request.headers["x-admin-key"], process.env.ANALYTICS_ADMIN_KEY)) {
    return response.status(401).json({ error: "Incorrect dashboard password" });
  }

  try {
    const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL);
    const overview = await convex.query("dashboard:overview", {
      readKey: process.env.CONVEX_ANALYTICS_READ_KEY,
    });
    response.setHeader("Cache-Control", "no-store");
    return response.status(200).json(overview);
  } catch (error) {
    console.error("Analytics dashboard failed:", error);
    return response.status(500).json({ error: "Dashboard data could not be loaded" });
  }
}
