# Security Issues Report

As the project is preparing to be open-sourced, several potential security issues related to secrets, keys, and environment variables have been identified. Below is a detailed breakdown of findings and recommended actions.

## 1. Hardcoded Secrets in Codebase

*   **File:** `backend/tests/_helpers.py`
    *   **Finding:** A hardcoded JSON Web Token secret was found.
        ```python
        TEST_JWT_SECRET = "test-secret-for-property-tests-32-bytes-long"
        ```
    *   **Risk:** While named as a test secret, if the application ever falls back to this in a production environment due to a missing environment variable, it could allow attackers to forge valid JWTs. Attackers reading the open-sourced code would easily find this string.
    *   **Action Required:** Ensure that the application *fails to start* in production if `JWT_SECRET` is not set, rather than falling back to a default value. Even test secrets should ideally not be committed, though they are less critical.

*   **File:** `backend/app/core/config.py`
    *   **Finding:** A hardcoded local URL is used as the default CORS origin.
        ```python
        cors_origin: str = "http://localhost:2037"
        ```
    *   **Risk:** While not a leaked secret, this relies on developers to explicitly override it. If deployed to production without overriding, it might break functionality or, if altered to `*` by developers frustrated with CORS issues, could open up cross-origin vulnerabilities.

## 2. Secrets Found in Git History

The Git history was scanned for sensitive keys and tokens using standard tools (like `gitleaks`) and custom pattern matching.

*   **Leaked `TEST_JWT_SECRET`:**
    *   The `test-secret-for-property-tests-32-bytes-long` string appears in multiple historical commits (e.g., `1baec914ad8`, `ecf31e78496`, `9649f65a84d`, `f589a943a25`, `c1d2243c286`, `9cf98217e7a`). Gitleaks flags these as `generic-api-key`.
    *   *Action Required:* If this secret was ever used for any live environment or developer setup that is public, it must be rotated.

*   **General API Key Practices in Commit History:**
    *   Multiple documentation and markdown files contain placeholders (like `sk-xxx`, `your-api-key-here`, `eyJhbGciOi...`). While these are harmless placeholders, their presence indicates discussions and examples around sensitive credentials.
    *   Extensive scanning using regular expressions for AWS keys, Slack tokens, Stripe keys, GitHub PATs, and generic `sk-[a-zA-Z0-9]{32,}` patterns did not reveal any obvious exposed production credentials in the commit history.

## 3. Empty Defaults for Security Variables

*   **File:** `backend/app/core/config.py`
    *   **Finding:** Several critical security-related variables have empty string defaults.
        ```python
        captcha_secret: str = ""
        smtp_user: str = ""
        smtp_pass: str = ""
        ```
    *   **Risk:** If the application relies on these for security (e.g., CAPTCHA verification), having empty defaults might lead to bypassed security checks if the logic doesn't explicitly validate that the secret is a non-empty, strong value.
    *   **Action Required:** The application should explicitly validate these configurations at startup and throw an error if they are not configured securely (e.g., `AssertionError: CAPTCHA_SECRET is required`).

## Summary of Recommendations before Open Sourcing

1.  **Enforce Strict Configuration:** Update `backend/app/core/config.py` to remove defaults for sensitive variables (like `jwt_secret`, `captcha_secret`, etc.). Use Pydantic's required fields (no default value) so the app fails fast if they are missing.
2.  **Remove Hardcoded Secrets:** Remove `TEST_JWT_SECRET` from `backend/tests/_helpers.py` and rely on environment variables injected during the test run (e.g., via `pytest.ini` or `.env.test`).
3.  **Clean Git History (Optional but Recommended):** If the `TEST_JWT_SECRET` was ever used in a non-test capacity, or to simply have a pristine open-source release, consider using a tool like `git filter-repo` or BFG Repo-Cleaner to remove the string from the entire history before publishing.
