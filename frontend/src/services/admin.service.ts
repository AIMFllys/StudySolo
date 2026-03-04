const ADMIN_API_BASE = '/api/admin'

export interface AdminProfile {
  id: string
  username: string
  force_change_password: boolean
}

/** Typed error that preserves the full API error body */
export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: Record<string, unknown>,
  ) {
    super((body.detail as string) || (body.error as string) || `HTTP ${status}`)
    this.name = 'AdminApiError'
  }
}

export async function adminFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${ADMIN_API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin-analysis/login'
    }
    throw new AdminApiError(401, { error: 'Unauthorized' })
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new AdminApiError(response.status, body)
  }

  return response.json()
}

// Auth helpers
export const adminLogin = (username: string, password: string) =>
  adminFetch<{ success: boolean; admin: AdminProfile }>('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

export const adminLogout = () =>
  adminFetch<{ message: string }>('/logout', { method: 'POST' })

export const adminChangePassword = (currentPassword: string, newPassword: string) =>
  adminFetch<{ message: string }>('/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
