// Render PlantUML files to PNG/SVG via the public PlantUML server.
// Usage: node render.js <file1.puml> [file2.puml ...]
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function encode6bit(b) {
  if (b < 10) return String.fromCharCode(48 + b);
  b -= 10;
  if (b < 26) return String.fromCharCode(65 + b);
  b -= 26;
  if (b < 26) return String.fromCharCode(97 + b);
  b -= 26;
  if (b === 0) return '-';
  if (b === 1) return '_';
  return '?';
}

function append3bytes(b1, b2, b3) {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3f;
  return (
    encode6bit(c1 & 0x3f) +
    encode6bit(c2 & 0x3f) +
    encode6bit(c3 & 0x3f) +
    encode6bit(c4 & 0x3f)
  );
}

function encode64(data) {
  let r = '';
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) r += append3bytes(data[i], data[i + 1], 0);
    else if (i + 1 === data.length) r += append3bytes(data[i], 0, 0);
    else r += append3bytes(data[i], data[i + 1], data[i + 2]);
  }
  return r;
}

function encodePlantuml(text) {
  const compressed = zlib.deflateRawSync(Buffer.from(text, 'utf8'), { level: 9 });
  return encode64(compressed);
}

async function renderOne(pumlPath) {
  const text = fs.readFileSync(pumlPath, 'utf8');
  const enc = encodePlantuml(text);
  const base = path.basename(pumlPath, '.puml');
  const dir = path.dirname(pumlPath);
  for (const fmt of ['png', 'svg']) {
    const url = `https://www.plantuml.com/plantuml/${fmt}/${enc}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      console.error(`[FAIL] ${base}.${fmt} -> ${res.status} ${res.statusText}\n${body.slice(0, 400)}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const out = path.join(dir, `${base}.${fmt}`);
    fs.writeFileSync(out, buf);
    console.log(`[OK]   ${out} (${buf.length} bytes)`);
  }
}

(async () => {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('No .puml files given.');
    process.exit(1);
  }
  for (const f of files) {
    try {
      await renderOne(f);
    } catch (e) {
      console.error(`[ERR] ${f}: ${e.message}`);
    }
  }
})();
