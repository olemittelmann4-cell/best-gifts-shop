import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";
import { checkToken, json } from "../lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Methode nicht erlaubt" }, 405);
  if (!checkToken(req)) return json({ error: "Nicht erlaubt" }, 401);
  const type = (req.headers.get("content-type") || "").split(";")[0];
  if (!/^image\/(jpeg|png|webp)$/.test(type)) return json({ error: "Nur Bilder erlaubt" }, 400);
  const buf = await req.arrayBuffer();
  if (buf.byteLength > 2_000_000) return json({ error: "Bild zu groß" }, 413);
  const key = randomUUID();
  await getStore("images").set(key, buf, { metadata: { type } });
  return json({ url: "/api/img/" + key });
};

export const config = { path: "/api/upload" };
