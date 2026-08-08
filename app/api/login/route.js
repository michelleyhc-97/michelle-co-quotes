import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  checkCredentials,
  createSessionToken,
} from "@/lib/auth";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const user = checkCredentials(body?.username, body?.password);

  if (!user) {
    return Response.json(
      { ok: false, error: "Incorrect username or password." },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user), SESSION_COOKIE_OPTIONS);

  return Response.json({ ok: true, user });
}
