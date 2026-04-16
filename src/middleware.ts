import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // PROTECTED ROUTES LOGIC
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/counselor")) {
    if (!user) {
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    // Role-based check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (url.pathname.startsWith("/admin") && profile?.role !== "admin") {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    if (url.pathname.startsWith("/counselor")) {
      // Admins are allowed to see counselor dashboard 
      if (profile?.role !== "counselor" && profile?.role !== "admin") {
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }
    }
  }

  // LOGIN PAGE LOGIC (If already logged in, redirect away from login)
  if (url.pathname === "/auth/login" && user) {
     const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
      
     if (profile?.role === "admin") url.pathname = "/admin";
     else url.pathname = "/counselor";
     return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
