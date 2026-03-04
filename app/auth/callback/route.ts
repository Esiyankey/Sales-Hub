import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // Handle error
            }
          },
        },
      },
    );

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Exchange code error:", error.message);
        return NextResponse.redirect(
          new URL("/?error=Email confirmation failed", requestUrl.origin),
        );
      }

      console.log("Email confirmed successfully");
      return NextResponse.redirect(new URL("/", requestUrl.origin));
    } catch (error) {
      console.error("Callback error:", error);
      return NextResponse.redirect(
        new URL("/?error=Confirmation error", requestUrl.origin),
      );
    }
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
