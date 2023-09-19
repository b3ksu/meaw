import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import type { EAWDef } from "./lib/eaw.js";
import { readVersion, readDefs } from "./lib/eaw.js";

const DIRNAME = path.dirname(url.fileURLToPath(import.meta.url));
const SOURCE_PATH = path.resolve(DIRNAME, "../data/EastAsianWidth.txt");
const TARGET_PATH = path.resolve(DIRNAME, "../src/defs.ts");

const ENCODING = "utf-8";

const HEADER = `/*
 * Generated by script. DO NOT EDIT!
 *
 * The part between BEGIN and END is derived from Unicode Data Files
 * and provided under Unicode, Inc. License Agreement.
 */`;
const IMPORT = `import { EAWDef } from "./types";`;
const BEGIN = `/* BEGIN */`;
const END = "/* END */";

function generateJs(version: string, defs: readonly EAWDef[]): string {
  const elems = defs.map(def => `  [${def.start}, ${def.end}, "${def.prop}"],`).join("\n");
  const js =
    [
      HEADER,
      "",
      IMPORT,
      "",
      BEGIN,
      `export const defs: readonly EAWDef[] = [\n${elems}\n];`,
      END,
      "",
      `export const version: string = ${JSON.stringify(version)};`,
    ].join("\n") + "\n";
  return js;
}

async function main(): Promise<void> {
  const test = process.argv[2] === "test";
  const src = await fs.readFile(SOURCE_PATH, { encoding: ENCODING });
  const version = readVersion(src);
  const defs = readDefs(src);
  const js = generateJs(version, defs);
  if (test) {
    const trg = await fs.readFile(TARGET_PATH, { encoding: ENCODING });
    if (trg !== js) {
      throw new Error("Generated script is outdated.");
    }
  } else {
    await fs.writeFile(TARGET_PATH, js, { encoding: ENCODING });
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
