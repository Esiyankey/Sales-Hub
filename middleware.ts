import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_FILE = /\.(.*)$/;

function isPublicPath(pathname: string) {
  if (pathname === "/") return true; // home handles auth client-side
  if (pathname.startsWith("/auth")) return true;

  // PWA/service worker + static assets must never be blocked
  if (pathname === "/manifest.json") return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/icons")) return true;
  if (pathname.startsWith("/images")) return true;
  if (pathname.startsWith("/workbox")) return true;
  if (pathname.startsWith("/sw")) return true;
  if (pathname.startsWith("/service-worker")) return true;
  if (PUBLIC_FILE.test(pathname)) return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  // If env is missing, don't hard-break navigation (avoid blank PWA shell)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.next();

  let response = NextResponse.next();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

