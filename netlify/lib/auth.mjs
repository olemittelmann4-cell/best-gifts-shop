import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

const secret = () => process.env.ADMIN_TOKEN_SECRET || "";

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

// Passwort gegen den gespeicherten scrypt-Hash prüfen (Format: scrypt$salt$hash)
export function verifyPassword(pw) {
  const [alg, saltHex, hashHex] = (process.env.ADMIN_PASSWORD_HASH || "").split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const got = scryptSync(String(pw ?? ""), Buffer.from(saltHex, "hex"), expected.length);
  return got.length === expected.length && timingSafeEqual(got, expected);
}

// Zwei Stunden gültiges, signiertes Anmelde-Token
export function signToken() {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
  const body = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return { token: body + "." + sig, exp };
}

export function checkToken(req) {
  const h = req.headers.get("authorization") || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  const [body, sig] = t.split(".");
  if (!body || !sig || !secret()) return false;
  const good = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(good);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()).exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
