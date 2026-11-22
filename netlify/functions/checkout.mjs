import Stripe from "stripe";
import { getStore } from "@netlify/blobs";
import { json } from "../lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Methode nicht erlaubt" }, 405);
  if (!process.env.STRIPE_SECRET_KEY) return json({ error: "Stripe ist noch nicht eingerichtet." }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Ungültige Anfrage" }, 400); }

  // Preise kommen IMMER vom Server, nie vom Browser
  const products = await getStore("shop").get("products", { type: "json" });
  if (!products) {
    return json({ error: "Der Shop ist noch nicht veröffentlicht. Speichere im Admin-Bereich einmal deine Produkte." }, 409);
  }

  const line_items = [];
  for (const it of Array.isArray(body.items) ? body.items.slice(0, 50) : []) {
    const p = products.find((x) => x.id === it.id);
    const qty = Math.min(20, Math.floor(Number(it.qty)));
    if (!p || !(qty >= 1)) continue;
    line_items.push({
      quantity: qty,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(p.price * 100),
        product_data: { name: p.name },
      },
    });
  }
  if (!line_items.length) return json({ error: "Dein Warenkorb ist leer." }, 400);

  const origin = req.headers.get("origin") || process.env.URL || new URL(req.url).origin;
  const shipping = Math.round(Number(process.env.SHIPPING_EUR ?? 4.9) * 100);

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      locale: "de",
      shipping_address_collection: { allowed_countries: ["DE", "AT", "CH"] },
      shipping_options: [{
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shipping, currency: "eur" },
          display_name: "Standardversand",
        },
      }],
      success_url: origin + "/?bestellung=ok",
      cancel_url: origin + "/?bestellung=abbruch",
    });
    return json({ url: session.url });
  } catch (e) {
    console.error(e);
    return json({ error: "Die Kasse ist gerade nicht erreichbar." }, 502);
  }
};

export const config = { path: "/api/checkout" };
