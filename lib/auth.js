import crypto from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "qs_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Mock user directory — stands in for real accounts until there's a
 * database. Passwords come from BOSS_PASSWORD / SALES_PASSWORD env vars —
 * REQUIRED in any real deployment. The hardcoded fallback below exists
 * only so local dev doesn't hard-fail with nothing configured; since this
 * file is committed to a (possibly public) repo, that fallback must never
 * be the actual password anywhere real data is reachable.
 */
function getUsers() {
  return [
    {
      username: "boss",
      password: process.env.BOSS_PASSWORD || "boss-demo-2026",
      name: "Michelle",
      role: "boss",
    },
    {
      username: "sales",
      password: process.env.SALES_PASSWORD || "sales-demo-2026",
      name: "Alex (Sales)",
      role: "sales",
    },
  ];
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set. Add it to .env.local before logging in.");
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

/** Checks a username/password against the mock user directory. Returns the
 * user (without the password) on success, or null on failure. */
export function checkCredentials(username, password) {
  const user = getUsers().find((u) => u.username === username);
  if (!user) return null;

  const expectedBuf = Buffer.from(user.password);
  const candidateBuf = Buffer.from(password ?? "");
  const match =
    expectedBuf.length === candidateBuf.length &&
    crypto.timingSafeEqual(expectedBuf, candidateBuf);

  if (!match) return null;
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

/** Creates a signed "<payload>.<signature>" session token carrying the
 * user's username/name/role and an expiry. */
export function createSessionToken(user) {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = Buffer.from(
    JSON.stringify({ username: user.username, name: user.name, role: user.role, expires })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Verifies a session token's signature and expiry, returning the decoded
 * user info or null if invalid/expired/missing. */
export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  let expectedBuf, actualBuf;
  try {
    expectedBuf = Buffer.from(sign(payload), "hex");
    actualBuf = Buffer.from(signature, "hex");
  } catch {
    return null;
  }
  if (expectedBuf.length !== actualBuf.length) return null;
  if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!Number.isFinite(decoded.expires) || Date.now() > decoded.expires) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Server-only helper: reads and verifies the session cookie for the
 * current request. Returns the decoded user info, or null if not logged in.
 * Use in Server Components / layouts — NOT in proxy.js (which reads
 * request.cookies directly instead of next/headers). */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
