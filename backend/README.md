# StudySolo Backend

## Test Setup

Install runtime and test dependencies into the backend virtual environment:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt -r requirements-dev.txt
```

Run the backend test suite:

```powershell
.\.venv\Scripts\python.exe -m pytest tests
```
