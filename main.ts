// Copies the finished front-page image (entry.png) into the output
// directory, checking it meets the competition limits first.
// Standard library only, no network.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1_048_576;
const MAX_SIDE = 1024;

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const destPath = join(outDir, "entry.png");

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

if (!existsSync(sourcePath)) {
  fail(`entry.png not found next to main.ts (${sourcePath})`);
}

const bytes = readFileSync(sourcePath);

if (bytes.length > MAX_BYTES) {
  fail(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}

// PNG signature, then the IHDR chunk: width at offset 16 and height at
// offset 20, each a 4-byte big-endian integer.
const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
if (!signature.every((b, i) => bytes[i] === b)) {
  fail("entry.png does not start with a PNG signature");
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) {
  fail(`entry.png is ${width}x${height}, over the 1024x1024 limit`);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(destPath, bytes);

// Read the copy back and make sure it matches the source byte for byte.
const written = readFileSync(destPath);
if (!written.equals(bytes)) {
  fail(`${destPath} differs from ${sourcePath} after writing`);
}

console.log(
  `entry.png -> ${destPath}: ${width}x${height}, ${bytes.length} bytes, verified identical`,
);
