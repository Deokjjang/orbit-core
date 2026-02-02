// tools/fix-esm-imports.mjs
// 목적: dist-cloudrun 안의 .js 산출물만 대상으로
//  - import/export specifier가 확장자 없이 상대경로면 ".js"를 붙여 ESM 런타임을 통과시킨다.
//  - TS 소스는 절대 건드리지 않는다.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv[2] ?? "dist-cloudrun";
const rootAbs = path.resolve(process.cwd(), ROOT);

const isRelative = (s) => s.startsWith("./") || s.startsWith("../");
const hasExt = (s) => /\.(js|mjs|cjs|json|node)($|\?)/.test(s);

const shouldSkip = (s) =>
  !isRelative(s) ||
  hasExt(s) ||
  s.endsWith("/") ||
  s.includes("?") ||
  s.includes("#");

function existsAsJs(fromFileAbs, spec) {
  const base = path.resolve(path.dirname(fromFileAbs), spec);
  return fs.existsSync(base + ".js") || fs.existsSync(path.join(base, "index.js"));
}

function patchFile(fileAbs) {
  const before = fs.readFileSync(fileAbs, "utf8");

  // import ... from "x"
  // export ... from "x"
  // export * from "x"
  // import("x")
  const re =
    /(from\s+["']([^"']+)["'])|(import\s*\(\s*["']([^"']+)["']\s*\))/g;

  let changed = false;
  const after = before.replace(re, (m, _fromFull, fromSpec, _dynFull, dynSpec) => {
    const spec = fromSpec ?? dynSpec;
    if (!spec || shouldSkip(spec)) return m;

    if (!existsAsJs(fileAbs, spec)) return m;

    // "./x" -> "./x.js"
    const patched = spec + ".js";
    changed = true;

    if (fromSpec) return m.replace(fromSpec, patched);
    return m.replace(dynSpec, patched);
  });

  if (changed) {
    fs.writeFileSync(fileAbs, after, "utf8");
    return 1;
  }
  return 0;
}

function walk(dirAbs) {
  const ents = fs.readdirSync(dirAbs, { withFileTypes: true });
  let files = [];
  for (const e of ents) {
    const p = path.join(dirAbs, e.name);
    if (e.isDirectory()) files = files.concat(walk(p));
    else if (e.isFile() && p.endsWith(".js")) files.push(p);
  }
  return files;
}

if (!fs.existsSync(rootAbs)) {
  console.error(`[fix-esm-imports] missing: ${rootAbs}`);
  process.exit(2);
}

const files = walk(rootAbs);
let touched = 0;
for (const f of files) touched += patchFile(f);

console.log(`[fix-esm-imports] scanned=${files.length} patched=${touched}`);
