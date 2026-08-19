import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/auth";

/**
 * Who am I? Read by the client session provider so the navbar can show the
 * account menu without making every page dynamic (calling `cookies()` in the
 * root layout would opt the whole static site out of prerendering).
 */
export async function GET() {
  const student = await getCurrentStudent();
  return NextResponse.json(
    { student },
    { headers: { "cache-control": "no-store, private" } },
  );
}
