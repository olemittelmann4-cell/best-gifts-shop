import { getStore } from "@netlify/blobs";
import { checkToken, json } from "../lib/auth.mjs";

function clean(list) {
  if (!Array.isArray(list) || list.length > 500) return null;
  const out = [];
  for (const p of list) {
    const price = Number(p.price);
    if (!Number.isInteger(p.id) || !p.name || !isFinite(price) || price < 0) return null;
    out.push({
      id: p.id,
      name: String(p.name).slice(0, 120),
      desc: String(p.desc || "").slice(0, 300),
      long: String(p.long || "").slice(0, 3000),
      price: Math.round(price * 100) / 100,
      cat: String(p.cat || "Sonstiges").slice(0, 40),
      icon: String(p.icon || "🎁").slice(0, 8),
      imgs: Array.isArray(p.imgs)
        ? p.imgs.filter((u) => typeof u === "string" && u.length < 500).slice(0, 12)
        : [],
    });
  }
  return out;
}

export default async (req) => {
  const store = getStore("shop");
  if (req.method === "GET") {
    const products = await store.get("products", { type: "json" });
    return json({ products: products ?? null });
  }
  if (req.method === "POST") {
    if (!checkToken(req)) return json({ error: "Nicht erlaubt" }, 401);
    let body;
    try { body = await req.json(); } catch { return json({ error: "Ungültige Anfrage" }, 400); }
    const list = clean(body.products);
    if (!list) return json({ error: "Ungültige Produktdaten" }, 400);
    await store.setJSON("products", list);
    return json({ ok: true });
  }
  return json({ error: "Methode nicht erlaubt" }, 405);
};

export const config = { path: "/api/products" };
