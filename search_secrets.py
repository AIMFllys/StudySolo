import subprocess
import re

patterns = [
    r'sk-[a-zA-Z0-9]{24,}',
    r'eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}',
    r'ghp_[a-zA-Z0-9]{36}',
    r'github_pat_[a-zA-Z0-9_]{40,}',
    r'sbp_[a-zA-Z0-9]{30,}',
    r'AKIA[0-9A-Z]{16}',
    r'[\w-]{24}\.[\w-]{6}\.[\w-]{27}', # Discord token
    r'(?i)(?:password|secret|api_key|apikey|token)["\s:=]+["\']([^"\']{10,})["\']'
]

compiled_patterns = [re.compile(p) for p in patterns]

def search_git_history():
    print("Searching git history...")
    cmd = ['git', 'log', '-p', '--all']
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', errors='replace')

    current_commit = None

    for line in process.stdout:
        if line.startswith('commit '):
            current_commit = line.strip().split()[1]

        if line.startswith('+') and not line.startswith('+++'):
            for i, p in enumerate(compiled_patterns):
                matches = p.findall(line)
                for match in matches:
                    if isinstance(match, tuple):
                        match_str = match[0]
                    else:
                        match_str = match

                    # Filter out obvious false positives like example keys
                    lower_match = match_str.lower()
                    if 'xxx' in lower_match or 'example' in lower_match or 'change-this' in lower_match or 'replace' in lower_match or 'your-' in lower_match:
                        continue

                    print(f"Commit: {current_commit}")
                    print(f"Match (Pattern {i}): {match_str}")
                    print(f"Line: {line.strip()}")
                    print("-" * 40)

search_git_history()
