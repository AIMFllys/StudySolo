import re
import subprocess
import json

def run():
    cmd = ['git', 'log', '-p', '--all']
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', errors='replace')

    current_commit = None

    for line in process.stdout:
        if line.startswith('commit '):
            current_commit = line.strip().split()[1]

        if line.startswith('+') and not line.startswith('+++'):
            # Looking for common key formats
            # generic
            if re.search(r'(?i)(password|secret|token|api_key|apikey)["\s:=]+["\']([a-zA-Z0-9_-]{12,})["\']', line):
                if not "test" in line.lower() and not "mock" in line.lower() and not "example" in line.lower() and not "your" in line.lower() and not "xxx" in line.lower() and not "change" in line.lower() and not "replace" in line.lower():
                    print(f"Commit: {current_commit}\nFound: {line.strip()}")

run()
