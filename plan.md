1. **Explore issue.** Identify what needs to be fixed. The objective is to identify all potential security issues in this soon-to-be open-sourced project, particularly focusing on leaked secrets/keys/passwords in the codebase and commit history, and write a detailed issue report (not fix them directly).
2. **Examine results.** I have already run several commands (like `gitleaks`) and `grep` to find leaked sensitive info.
    - Found hardcoded `TEST_JWT_SECRET = "test-secret-for-property-tests-32-bytes-long"` in `backend/tests/_helpers.py`. (Though it's named test secret, it might be used in production if defaults are not overridden, and should be noted).
    - Found default environment variables missing strong defaults or containing weak defaults.
    - Checked `git log` and found no major leaks of real `sk-xxx` API keys (only placeholders).
    - Found hardcoded `cors_origin: str = "http://localhost:2037"` in `backend/app/core/config.py` which could be a security issue if deployed to prod without changing.
    - Found lack of secure defaults for some environment variables.
    - Found JWT generation logic that might be vulnerable if `JWT_SECRET` isn't securely managed.
3. **Draft the issue.** Create a detailed markdown issue outlining the findings.
4. **Pre-commit step.** Run `pre_commit_instructions` to fulfill the task requirements.
5. **Submit.**
