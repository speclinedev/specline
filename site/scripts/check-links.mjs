import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
const files = readdirSync("dist", { recursive: true }).filter((file) => file.endsWith(".html"));
let links = 0;
for (const file of files) {
  const source = readFileSync(join("dist", file), "utf8");
  const base = new URL(file.replace(/index\.html$/, ""), "https://specline.dev/");
  for (const match of source.matchAll(/href="([^"]+)"/g)) {
    const href = match[1].replaceAll("&amp;", "&");
    const url = new URL(href, base);
    if (url.origin !== base.origin) continue;
    const path = join("dist", decodeURIComponent(url.pathname));
    const target = existsSync(join(path, "index.html")) ? join(path, "index.html") : path;
    assert.ok(existsSync(target), `${file}: missing target ${href}`);
    if (url.hash && target.endsWith(".html")) {
      const html = readFileSync(target, "utf8");
      const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
      assert.ok(ids.includes(decodeURIComponent(url.hash.slice(1))), `${file}: missing fragment ${href}`);
    }
    links++;
  }
}
console.log(`Checked ${links} internal links across ${files.length} pages.`);
