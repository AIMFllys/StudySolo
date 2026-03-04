import fs from "node:fs";
import path from "node:path";

const DEFAULT_MAX_LINES = 220;
const DEFAULT_APP_ROOT = path.resolve(process.cwd(), "src/app");
const DEFAULT_EXCEPTIONS_PATH = path.resolve(
  process.cwd(),
  "scripts/page-lines-exceptions.json"
);
const IGNORE_DIRS = new Set([".next", "node_modules", "dist", "build", "coverage"]);

function parseArgs(argv) {
  const args = {
    maxLines: DEFAULT_MAX_LINES,
    appRoot: DEFAULT_APP_ROOT,
    exceptionsPath: DEFAULT_EXCEPTIONS_PATH,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;

    const [flag, inlineValue] = token.split("=");
    const nextValue = inlineValue ?? argv[i + 1];
    const consumesNext = inlineValue === undefined;

    if (flag === "--max-lines" && nextValue) {
      args.maxLines = Number(nextValue);
      if (consumesNext) i += 1;
      continue;
    }

    if (flag === "--app-root" && nextValue) {
      args.appRoot = path.resolve(process.cwd(), nextValue);
      if (consumesNext) i += 1;
      continue;
    }

    if (flag === "--exceptions" && nextValue) {
      args.exceptionsPath = path.resolve(process.cwd(), nextValue);
      if (consumesNext) i += 1;
    }
  }

  return args;
}

function collectPageFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        collectPageFiles(fullPath, files);
      }
      continue;
    }

    if (entry.isFile() && entry.name === "page.tsx") {
      files.push(fullPath);
    }
  }

  return files;
}

function countLines(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  if (content.length === 0) return 0;
  return content.split(/\r?\n/).length;
}

function loadExceptions(exceptionsPath) {
  if (!fs.existsSync(exceptionsPath)) return {};

  try {
    const parsed = JSON.parse(fs.readFileSync(exceptionsPath, "utf8"));
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function getLimitForFile(relativePath, defaultLimit, exceptions) {
  const raw = exceptions[relativePath];
  if (typeof raw === "number" && Number.isInteger(raw) && raw > 0) {
    return raw;
  }
  if (raw && typeof raw === "object" && Number.isInteger(raw.maxLines) && raw.maxLines > 0) {
    return raw.maxLines;
  }
  return defaultLimit;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!Number.isInteger(args.maxLines) || args.maxLines <= 0) {
    console.error(`Invalid --max-lines value: ${args.maxLines}`);
    process.exit(1);
  }

  if (!fs.existsSync(args.appRoot)) {
    console.error(`App directory not found: ${args.appRoot}`);
    process.exit(1);
  }

  const exceptions = loadExceptions(args.exceptionsPath);
  const pageFiles = collectPageFiles(args.appRoot);

  const violations = pageFiles
    .map((filePath) => {
      const relativePath = path.relative(process.cwd(), filePath).replaceAll("\\", "/");
      const limit = getLimitForFile(relativePath, args.maxLines, exceptions);
      const lines = countLines(filePath);
      return { relativePath, lines, limit };
    })
    .filter((item) => item.lines > item.limit)
    .sort((a, b) => b.lines - a.lines);

  if (violations.length > 0) {
    console.error(`Page lines check failed (default limit=${args.maxLines})`);
    for (const item of violations) {
      console.error(`${String(item.lines).padStart(4, " ")}  ${item.relativePath}  [limit=${item.limit}]`);
    }
    process.exit(1);
  }

  console.log(
    `Page lines check passed (files=${pageFiles.length}, default limit=${args.maxLines})`
  );
}

main();
