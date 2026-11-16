#!/usr/bin/env node
/**
 * Builds an /access link that signs the opener in.
 *
 *   node tools/access-link.mjs https://app.jeneviv.com judge@example.com 'the-password'
 *
 * Anything after the credentials is passed through as the hash, so the values
 * stay out of server logs and `Referer` headers. The page strips them from the
 * address bar as soon as it reads them, but the person you send it to still has
 * the link in their chat history — treat it as a password, not a URL.
 */
const [, , originArg, emailArg, passwordArg] = process.argv;

if (!originArg || !emailArg || !passwordArg) {
  console.error(
    "usage: node tools/access-link.mjs <origin> <email> <password>\n" +
      "  e.g. node tools/access-link.mjs https://app.jeneviv.com judge@example.com 's3cret'",
  );
  process.exit(1);
}

const origin = originArg.replace(/\/+$/, "").replace(/\/access$/, "");
const email = emailArg.trim();

const params = new URLSearchParams({ email, password: passwordArg });
const link = `${origin}/access#${params.toString()}`;

console.log(link);
console.log("");
console.log("Send this as-is. Notes:");
console.log("  • the demo link is gone; this signs in to the real backend");
console.log("  • use a dedicated account with the viewer role, not your own");
console.log("  • rotate its password after the defence — the link keeps working until you do");
