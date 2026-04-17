/**
 * Supabase Auth Callback Handler
 *
 * Handles two flows:
 *   1. Email verification: user clicks link → code exchange → redirect to /login?verified=true
 *   2. OAuth login (GitHub/Google): provider redirects → code exchange → upsert user_profiles
 *      → call backend /api/auth/sync-session server-side → redirect directly to /workspace
 *
 * Flow:
 *   1. Supabase redirects to /auth/callback?code=xxx&next=yyy
 *   2. This route exchanges the code for a session (PKCE)
 *   3. For OAuth users, upserts user_profiles so the profile row exists
 *   4. Calls backend sync-session to set HttpOnly cookies in the same response
 *   5. Redirects directly to `next` param (defaults to /workspace for OAuth)
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const BACKEND_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', origin)
    )
  }

  // For email verification (no `next` param), keep the old flow.
  const isOAuth = !!rawNext
  const finalDestination = isOAuth ? (rawNext || '/workspace') : '/login?verified=true'

  // We need a mutable response to carry Supabase session cookies forward.
  const supabaseResponse = NextResponse.redirect(new URL(finalDestination, origin))

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

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', origin)
    )
  }

  // Get the freshly-exchanged session.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!session || !user) {
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', origin)
    )
  }

  // Ensure user_profiles row exists for OAuth users.
  try {
    const meta = user.user_metadata ?? {}
    const displayName =
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      meta.preferred_username ||
      ''

    await supabase
      .from('user_profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? '',
          nickname: displayName,
          avatar_url: meta.avatar_url || meta.picture || '',
          registered_from: 'studysolo',
          tier: 'free',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )
  } catch {
    console.warn('[auth/callback] user_profiles upsert failed (non-fatal)')
  }

  // For OAuth flows: sync the Supabase session into backend HttpOnly cookies
  // server-side, so the browser lands on /workspace already authenticated.
  if (isOAuth) {
    try {
      const syncRes = await fetch(`${BACKEND_URL}/api/auth/sync-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          remember_me: true,
        }),
      })

      if (syncRes.ok) {
        // Forward the backend's Set-Cookie headers (access_token, refresh_token, remember_me)
        // onto our redirect response so the browser receives them in one round-trip.
        const setCookieHeaders = syncRes.headers.getSetCookie?.() ?? []
        for (const cookie of setCookieHeaders) {
          supabaseResponse.headers.append('Set-Cookie', cookie)
        }
      } else {
        console.warn('[auth/callback] backend sync-session failed, falling back to client-side sync')
        // Fallback: route through /login so AuthSessionBridge can retry client-side.
        return NextResponse.redirect(
          new URL(`/login?next=${encodeURIComponent(finalDestination)}&oauth=1`, origin)
        )
      }
    } catch (err) {
      console.warn('[auth/callback] backend sync-session error:', err)
      // Fallback: route through /login so AuthSessionBridge can retry client-side.
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(finalDestination)}&oauth=1`, origin)
      )
    }
  }

  return supabaseResponse
}
