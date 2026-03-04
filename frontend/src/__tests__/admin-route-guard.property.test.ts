/**
 * Property 6: Admin 路由守卫重定向逻辑
 * Feature: admin-panel, Property 6: Admin route guard redirect logic
 *
 * Validates: Requirements 4.1, 4.2, 4.5
 *
 * Tests the core redirect logic extracted from frontend/src/middleware.ts:
 * - Any /admin-analysis/* path (except login) without token → redirect to /admin-analysis/login
 * - /admin-analysis/login with token → redirect to /admin-analysis
 * - /admin-analysis/login without token → next (no redirect)
 * - Any /admin-analysis/* path with token → next (no redirect)
 * - Non-admin paths → always next (regardless of token)
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ── Pure logic extracted from middleware.ts ──────────────────────────────────

function adminRouteGuard(
  pathname: string,
  hasAdminToken: boolean
): { action: 'redirect' | 'next'; destination?: string } {
  if (!pathname.startsWith('/admin-analysis')) {
    return { action: 'next' }
  }
  if (pathname === '/admin-analysis/login') {
    if (hasAdminToken) return { action: 'redirect', destination: '/admin-analysis' }
    return { action: 'next' }
  }
  if (!hasAdminToken) return { action: 'redirect', destination: '/admin-analysis/login' }
  return { action: 'next' }
}

// ── Generators ───────────────────────────────────────────────────────────────

/** Generates a safe path segment like "foo", "bar-baz", "abc123" */
const segmentArb = fc.stringMatching(/^[a-z0-9][a-z0-9_-]*$/)

/** Generates a sub-path like "/users", "/users/123", "" */
const subPathArb = fc
  .array(segmentArb, { minLength: 0, maxLength: 3 })
  .map((parts) => (parts.length === 0 ? '' : '/' + parts.join('/')))

/**
 * Generates an admin path that is NOT the login page.
 * e.g. /admin-analysis, /admin-analysis/users, /admin-analysis/users/123
 */
const adminNonLoginPathArb = subPathArb.map((sub) => '/admin-analysis' + sub).filter(
  (p) => p !== '/admin-analysis/login'
)

/** Generates a path that is completely outside /admin-analysis */
const nonAdminPathArb = fc.oneof(
  fc.constant('/'),
  fc.constant('/login'),
  fc.constant('/workspace'),
  fc.constant('/settings'),
  fc.constant('/history'),
  fc.constant('/about'),
  // paths that start similarly but are NOT /admin-analysis
  fc.constant('/admin'),
  fc.constant('/admin-panel'),
  fc.constant('/admin_analysis'),
  subPathArb.map((sub) => '/dashboard' + sub),
)

// ── Property Tests ────────────────────────────────────────────────────────────

describe('Feature: admin-panel, Property 6: Admin 路由守卫重定向逻辑', () => {

  /**
   * Property 6a: Any /admin-analysis/* path (except login) without token
   * → redirect to /admin-analysis/login
   * Validates: Requirements 4.1, 4.5
   */
  it('P6a: admin path (non-login) without token → redirect to /admin-analysis/login', () => {
    fc.assert(
      fc.property(adminNonLoginPathArb, (pathname) => {
        const result = adminRouteGuard(pathname, false)
        expect(result.action).toBe('redirect')
        expect(result.destination).toBe('/admin-analysis/login')
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6b: /admin-analysis/login with token → redirect to /admin-analysis
   * Validates: Requirements 4.2
   */
  it('P6b: /admin-analysis/login with token → redirect to /admin-analysis', () => {
    const result = adminRouteGuard('/admin-analysis/login', true)
    expect(result.action).toBe('redirect')
    expect(result.destination).toBe('/admin-analysis')
  })

  /**
   * Property 6c: /admin-analysis/login without token → next (no redirect)
   * Validates: Requirements 4.1
   */
  it('P6c: /admin-analysis/login without token → next (no redirect)', () => {
    const result = adminRouteGuard('/admin-analysis/login', false)
    expect(result.action).toBe('next')
    expect(result.destination).toBeUndefined()
  })

  /**
   * Property 6d: Any /admin-analysis/* path with token → next (no redirect)
   * Validates: Requirements 4.1, 4.5
   */
  it('P6d: admin path (non-login) with token → next (no redirect)', () => {
    fc.assert(
      fc.property(adminNonLoginPathArb, (pathname) => {
        const result = adminRouteGuard(pathname, true)
        expect(result.action).toBe('next')
        expect(result.destination).toBeUndefined()
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6e: Non-admin paths → always next regardless of token
   * Validates: Requirements 4.5
   */
  it('P6e: non-admin paths → always next regardless of token', () => {
    fc.assert(
      fc.property(nonAdminPathArb, fc.boolean(), (pathname, hasToken) => {
        const result = adminRouteGuard(pathname, hasToken)
        expect(result.action).toBe('next')
        expect(result.destination).toBeUndefined()
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Combined: token presence is the sole determinant for non-login admin paths
   * Validates: Requirements 4.1, 4.5
   */
  it('P6f: token presence determines redirect for any non-login admin path', () => {
    fc.assert(
      fc.property(adminNonLoginPathArb, fc.boolean(), (pathname, hasToken) => {
        const result = adminRouteGuard(pathname, hasToken)
        if (hasToken) {
          expect(result.action).toBe('next')
        } else {
          expect(result.action).toBe('redirect')
          expect(result.destination).toBe('/admin-analysis/login')
        }
      }),
      { numRuns: 100 }
    )
  })
})
