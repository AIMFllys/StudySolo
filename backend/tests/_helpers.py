from fastapi.testclient import TestClient

TEST_JWT_SECRET = "test-secret-for-property-tests-32-bytes-long"


def make_client_with_cookie(
    app,
    cookie_name: str,
    cookie_value: str,
    *,
    raise_server_exceptions: bool = False,
) -> TestClient:
    """Return a TestClient preloaded with a cookie, avoiding per-request cookie warnings."""
    client = TestClient(app, raise_server_exceptions=raise_server_exceptions)
    client.cookies.set(cookie_name, cookie_value)
    return client
