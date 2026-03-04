import fs from "node:fs";
import path from "node:path";

const DEFAULT_MAX_LINES = 300;
const DEFAULT_MODE = "strict";
const ROOT = path.resolve(process.cwd(), "src");
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);
const IGNORE_DIRS = new Set([".next", "node_modules", "dist", "build", "coverage"]);
const DEFAULT_BASELINE_PATH = path.resolve(process.cwd(), "scripts/max-lines-baseline.json");

function parseArgs(argv) {
  const args = {
    mode: DEFAULT_MODE,
    maxLines: DEFAULT_MAX_LINES,
    baselinePath: DEFAULT_BASELINE_PATH,
    writeBaseline: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }

    const [flag, inlineValue] = token.split("=");
    const nextValue = inlineValue ?? argv[i + 1];
    const consumesNext = inlineValue === undefined;

    if (flag === "--mode" && nextValue) {
      args.mode = nextValue;
      if (consumesNext) i += 1;
      continue;
    }

    if (flag === "--max-lines" && nextValue) {
      args.maxLines = Number(nextValue);
      if (consumesNext) i += 1;
      continue;
    }

    if (flag === "--baseline" && nextValue) {
      args.baselinePath = path.resolve(process.cwd(), nextValue);
      if (consumesNext) i += 1;
      continue;
    }

    if (flag === "--write-baseline") {
      args.writeBaseline = true;
    }
  }

  return args;
}

function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        walk(fullPath, results);
      }
      continue;
    }

    const ext = path.extname(entry.name);
    if (SOURCE_EXTENSIONS.has(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

function countLines(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  if (content.length === 0) {
    return 0;
  }
  return content.split(/\r?\n/).length;
}

function createOffenderList(maxLines) {
  return walk(ROOT)
    .map((filePath) => {
      const lines = countLines(filePath);
      return {
        filePath,
        relativePath: path.relative(process.cwd(), filePath).replaceAll("\\", "/"),
        lines,
      };
    })
    .filter((item) => item.lines > maxLines)
    .sort((a, b) => b.lines - a.lines);
}

function printOffenders(header, offenders) {
  console.error(header);
  for (const offender of offenders) {
    console.error(`${String(offender.lines).padStart(4, " ")}  ${offender.relativePath}`);
  }
}

function loadBaseline(baselinePath) {
  if (!fs.existsSync(baselinePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    if (!parsed || typeof parsed !== "object" || typeof parsed.offenders !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeBaselineFile({ baselinePath, maxLines, offenders }) {
  const offenderMap = Object.fromEntries(
    offenders.map((item) => [item.relativePath, item.lines]).sort((a, b) => a[0].localeCompare(b[0]))
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    maxLines,
    offenders: offenderMap,
  };

  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Line baseline written: ${path.relative(process.cwd(), baselinePath).replaceAll("\\", "/")}`);
}

function runStrictMode({ offenders, maxLines }) {
  if (offenders.length > 0) {
    printOffenders(`Max lines check failed (mode=strict, limit=${maxLines})`, offenders);
    process.exit(1);
  }

  console.log(`Max lines check passed (mode=strict, limit=${maxLines})`);
}

function runRatchetMode({ offenders, baselinePath, maxLines }) {
  const baseline = loadBaseline(baselinePath);
  if (!baseline) {
    console.error(
      `Ratchet mode requires a valid baseline file at: ${path.relative(process.cwd(), baselinePath).replaceAll("\\", "/")}`
    );
    console.error("Create it with: node scripts/check-max-lines.mjs --mode ratchet --write-baseline");
    process.exit(1);
  }

  const baselineOffenders = baseline.offenders ?? {};
  const violations = [];

  for (const offender of offenders) {
    const baselineLines = baselineOffenders[offender.relativePath];
    if (baselineLines === undefined) {
      violations.push({
        ...offender,
        reason: "new offender",
      });
      continue;
    }

    if (offender.lines > baselineLines) {
      violations.push({
        ...offender,
        reason: `line count increased (baseline=${baselineLines})`,
      });
    }
  }

  if (violations.length > 0) {
    console.error(`Max lines check failed (mode=ratchet, limit=${maxLines})`);
    for (const violation of violations) {
      console.error(
        `${String(violation.lines).padStart(4, " ")}  ${violation.relativePath}  [${violation.reason}]`
      );
    }
    process.exit(1);
  }

  const currentCount = offenders.length;
  const baselineCount = Object.keys(baselineOffenders).length;
  console.log(
    `Max lines check passed (mode=ratchet, limit=${maxLines}, offenders now=${currentCount}, baseline=${baselineCount})`
  );
}

const args = parseArgs(process.argv.slice(2));

if (!fs.existsSync(ROOT)) {
  console.error(`Source directory not found: ${ROOT}`);
  process.exit(1);
}

if (!Number.isInteger(args.maxLines) || args.maxLines <= 0) {
  console.error(`Invalid --max-lines value: ${args.maxLines}`);
  process.exit(1);
}

if (!["strict", "ratchet"].includes(args.mode)) {
  console.error(`Invalid --mode value: ${args.mode}. Use \"strict\" or \"ratchet\".`);
  process.exit(1);
}

const offenders = createOffenderList(args.maxLines);

if (args.writeBaseline) {
  writeBaselineFile({
    baselinePath: args.baselinePath,
    maxLines: args.maxLines,
    offenders,
  });
}

if (args.mode === "strict") {
  runStrictMode({ offenders, maxLines: args.maxLines });
} else {
  runRatchetMode({
    offenders,
    baselinePath: args.baselinePath,
    maxLines: args.maxLines,
  });
}
