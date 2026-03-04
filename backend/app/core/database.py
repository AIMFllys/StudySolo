"""Supabase AsyncClient singletons.

Two clients are maintained:
- **service_role** (`get_db`): bypasses RLS, used for admin operations and
  internal queries that need full access.
- **anon** (`get_anon_db`): uses the public anon key, used for user-facing
  auth operations (sign_up / sign_in) so that Supabase email verification,
  rate-limiting and other auth policies are respected.
"""

from supabase import AsyncClient, create_async_client

from app.core.config import get_settings

# Module-level singletons (lazy-initialised on first async call)
_service_client: AsyncClient | None = None
_anon_client: AsyncClient | None = None


async def get_db() -> AsyncClient:
    """Return the shared Supabase AsyncClient with **service_role** key."""
    global _service_client
    if _service_client is None:
        settings = get_settings()
        _service_client = await create_async_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _service_client


async def get_anon_db() -> AsyncClient:
    """Return the shared Supabase AsyncClient with **anon** key.

    This client respects Supabase Auth policies (email verification,
    password strength, rate limits) and should be used for all
    user-facing auth endpoints.
    """
    global _anon_client
    if _anon_client is None:
        settings = get_settings()
        _anon_client = await create_async_client(
            settings.supabase_url,
            settings.supabase_anon_key,
        )
    return _anon_client
