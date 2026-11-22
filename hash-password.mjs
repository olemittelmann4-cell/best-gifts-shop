// Erzeugt den Passwort-Hash und das Token-Geheimnis für deinen Admin-Bereich.
// Benutzung:  node hash-password.mjs
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
let muted = false;
if (process.stdin.isTTY) {
  rl._writeToOutput = (s) => rl.output.write(muted ? (/[\r\n]/.test(s) ? s : "*") : s);
}
const ask = (q) => new Promise((res) => {
  process.stdout.write(q);
  muted = true;
  rl.question("", (a) => { muted = false; process.stdout.write("\n"); res(a); });
});

const pw = await ask("Neues Admin-Passwort (mindestens 12 Zeichen): ");
const pw2 = await ask("Passwort wiederholen: ");
rl.close();
if (pw !== pw2) { console.error("Die Passwörter sind nicht gleich."); process.exit(1); }
if (pw.length < 12) { console.error("Bitte mindestens 12 Zeichen verwenden."); process.exit(1); }

const salt = randomBytes(16);
const hash = scryptSync(pw, salt, 64);
console.log("\nTrage diese zwei Werte in Netlify ein (Environment variables):\n");
console.log("ADMIN_PASSWORD_HASH=scrypt$" + salt.toString("hex") + "$" + hash.toString("hex"));
console.log("ADMIN_TOKEN_SECRET=" + randomBytes(32).toString("hex"));
console.log("\nDein Passwort selbst wird nirgends gespeichert. Merke es dir gut.");
