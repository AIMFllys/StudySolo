/**
 * Supabase Auth Callback Handler
 *
 * Handles the redirect from Supabase email verification links.
 * Supabase sends a `code` query parameter that must be exchanged
 * for a session via the PKCE flow.
 *
 * Flow:
 *   1. User clicks verification link in email
 *   2. Supabase redirects to /auth/callback?code=xxx
 *   3. This route exchanges the code for a session
 *   4. Redirects to /login?verified=true on success
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/login?verified=true'

  if (code) {
    const supabaseResponse = NextResponse.redirect(new URL(next, origin))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return supabaseResponse
    }
  }

  // If code exchange failed or no code provided, redirect to login with error
  return NextResponse.redirect(
    new URL('/login?error=verification_failed', origin)
  )
}
