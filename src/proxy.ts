import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  if (!req.cookies.get("anonUserId")) {
    res.cookies.set("anonUserId", crypto.randomUUID(), {
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === "production",
      httpOnly: process.env.NODE_ENV === "production",
    });
  }

  return res;
}
