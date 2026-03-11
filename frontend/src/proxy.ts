import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

const PROTECTED_ROUTES = ['/workspace', '/settings', '/history', '/profile'];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

const TRUSTED_DOMAINS = ['studyflow.1037solo.com', 'platform.1037solo.com'];

function isProtected(pathname: string) {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      TRUSTED_DOMAINS.some(
        (domain) =>
          parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      )
    );
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin-analysis')) {
    const adminToken = request.cookies.get('admin_token');

    if (pathname === '/admin-analysis/login') {
      if (adminToken) {
        return NextResponse.redirect(new URL('/admin-analysis', request.url));
      }
      return NextResponse.next();
    }

    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin-analysis/login', request.url));
    }

    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  let authenticatedUser = user;
  if (!authenticatedUser) {
    const backendToken = request.cookies.get('access_token')?.value;
    if (backendToken) {
      try {
        const { createServerClient } = await import('@supabase/ssr');
        const fallbackSupabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
        );
        const { data } = await fallbackSupabase.auth.getUser(backendToken);
        authenticatedUser = data?.user ?? null;
      } catch {
        authenticatedUser = null;
      }
    }
  }

  if (isProtected(pathname) && !authenticatedUser) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = `next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute(pathname) && authenticatedUser) {
    const next = request.nextUrl.searchParams.get('next');
    let redirectTo = '/workspace';

    if (next) {
      if (next.startsWith('/')) {
        redirectTo = next;
      } else if (isValidRedirectUrl(next)) {
        return NextResponse.redirect(new URL(next));
      }
    }

    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
