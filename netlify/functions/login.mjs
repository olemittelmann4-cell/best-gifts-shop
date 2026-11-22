import { verifyPassword, signToken, json } from "../lib/auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Methode nicht erlaubt" }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Ungültige Anfrage" }, 400); }
  await new Promise((r) => setTimeout(r, 700)); // bremst Passwort-Raten
  if (!verifyPassword(body.password)) return json({ error: "Falsches Passwort" }, 401);
  return json(signToken());
};

export const config = { path: "/api/login" };
