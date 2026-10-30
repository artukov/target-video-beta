#!/usr/bin/env node
// Pulls the Home screen artwork out of FLASH.svg into assets/posters/.
// Usage: node scripts/extract-posters.mjs [path/to/FLASH.svg]
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const svgFile = process.argv[2] ?? path.join(root, 'FLASH.svg');
const rawDir = path.join(root, 'media-src', 'figma-images');
const outDir = path.join(root, 'assets', 'posters');

const frame = { x: 4150, y: 25 };
const tolerance = 3;
// ffmpeg's mjpeg qscale is not a libjpeg quality: 4 gives quant tables close to libjpeg 86 (3 is ~90, 5 is ~82).
const qscale = 4;

const rails = [
  [794, ['der-ceo-und-ich', 'mein-geheimes-leben', 'liebe-auf-umwegen']],
  [1129, ['blutige-rosen', 'schattenkuss', 'dunkle-begierde']],
  [1516, ['racheengel', 'schicksalsband', 'zweite-chance']],
];

// Frame-relative boxes in points: [x, y, w, h]. A rail poster is drawn 1pt
// inside its 130x195 slot, which the tolerance absorbs.
// The design's Blutige Rosen picture (image20_0_1) has no known source or licence, so
// assets/ ships a stand-in title card for it instead (see CREDITS.md) and it is skipped here.
const targets = [
  { name: 'verbotene-liebe', box: [0, 95, 390, 520], ratio: [3, 4], size: [1170, 1560] },
  { name: 'avatar', box: [342, 51.5, 32, 32], ratio: [1, 1], size: [120, 120] },
  ...rails.flatMap(([y, names]) =>
    names.map((name, i) => ({ name, box: [i * 146, y, 130, 195], ratio: [2, 3], size: [390, 585] })),
  ),
].filter((target) => target.name !== 'blutige-rosen');

const text = readFileSync(svgFile, 'utf8');
const svg = parseSvg(text);
const byId = new Map();
indexIds(svg);

const fills = [];
let skipped = 0;
walk(svg, [1, 0, 0, 1, 0, 0], []);

mkdirSync(rawDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const rows = [['file', 'slot', 'image', 'source', 'crop', 'output', 'kb', 'note']];
const used = new Set();

for (const target of targets) {
  const fill = nearest(target.box);
  if (!fill) throw new Error(`no image fill near ${target.name} ${target.box}`);
  if (used.has(fill.el)) throw new Error(`${target.name} matched an element that is already taken`);
  used.add(fill.el);

  const { image, use } = resolve(fill.pattern);
  const raw = saveImage(image);
  const [sw, sh] = pixelSize(raw);
  if (sw !== Number(image.attrs.width) || sh !== Number(image.attrs.height)) {
    throw new Error(`${image.attrs.id}: file is ${sw}x${sh}, svg says ${image.attrs.width}x${image.attrs.height}`);
  }

  const seen = designCrop(use);
  const crop = fit(seen, target.ratio, sw, sh);
  const out = crop.w >= target.size[0] ? target.size : [crop.w, crop.h];

  const file = path.join(outDir, `${target.name}.jpg`);
  encode(raw, crop, out, file);
  const [ow, oh] = pixelSize(file);
  if (ow !== out[0] || oh !== out[1]) throw new Error(`${file}: wrote ${ow}x${oh}, wanted ${out.join('x')}`);

  const [bx, by, bx1, by1] = fill.box;
  rows.push([
    `${target.name}.jpg`,
    `${round(bx - frame.x)},${round(by - frame.y)} ${round(bx1 - bx)}x${round(by1 - by)}`,
    image.attrs.id,
    `${sw}x${sh}`,
    `${crop.x},${crop.y} ${crop.w}x${crop.h}`,
    `${ow}x${oh}`,
    Math.round(statSync(file).size / 1024),
    [clippedBy(fill), outsideImage(seen, sw, sh)].filter(Boolean).join('; '),
  ]);
}

console.log(`${path.basename(svgFile)}: ${fills.length + skipped} image fills, ${skipped} ignored (not a rect or circle)`);
printTable(rows);

function parseSvg(src) {
  const top = { name: '', attrs: {}, kids: [], up: null };
  let node = top;
  for (const m of src.matchAll(/<(\/?)([A-Za-z][\w:-]*)([^>]*?)(\/?)>/g)) {
    const [, closing, name, rest, selfClosing] = m;
    if (closing) {
      node = node.up;
      continue;
    }
    // Long values (embedded images, path data) stay in the source text.
    const base = m.index + 1 + name.length;
    const attrs = {};
    for (const a of rest.matchAll(/([\w:-]+)="([^"]*)"/g)) {
      attrs[a[1]] = a[2].length > 1000 ? { at: base + a.index + a[1].length + 2, len: a[2].length } : a[2];
    }
    const el = { name, attrs, kids: [], up: node };
    node.kids.push(el);
    if (!selfClosing) node = el;
  }
  if (node !== top) throw new Error('unbalanced svg');
  return top.kids[0];
}

function indexIds(el) {
  if (el.attrs.id) byId.set(el.attrs.id, el);
  el.kids.forEach(indexIds);
}

function parseTransform(src = '') {
  let m = [1, 0, 0, 1, 0, 0];
  for (const [, fn, args] of src.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const n = args.trim().split(/[\s,]+/).map(Number);
    if (fn === 'matrix') m = multiply(m, n);
    else if (fn === 'translate') m = multiply(m, [1, 0, 0, 1, n[0], n[1] ?? 0]);
    else if (fn === 'scale') m = multiply(m, [n[0], 0, 0, n[1] ?? n[0], 0, 0]);
    else throw new Error(`unsupported transform: ${fn}`);
  }
  return m;
}

function multiply([a, b, c, d, e, f], [A, B, C, D, E, F]) {
  return [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
}

function localBox(el) {
  const n = (key) => Number(el.attrs[key] ?? 0);
  if (el.name === 'rect') return [n('x'), n('y'), n('x') + n('width'), n('y') + n('height')];
  if (el.name === 'circle') return [n('cx') - n('r'), n('cy') - n('r'), n('cx') + n('r'), n('cy') + n('r')];
  return null;
}

function bounds(m, [x0, y0, x1, y1]) {
  const corners = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => [
    m[0] * x + m[2] * y + m[4],
    m[1] * x + m[3] * y + m[5],
  ]);
  const xs = corners.map((p) => p[0]);
  const ys = corners.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function intersect(boxes) {
  return boxes.reduce((a, b) => [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])]);
}

function refId(value = '') {
  return /^url\(#(.+)\)$/.exec(value)?.[1];
}

function walk(el, parent, clips) {
  if (el.name === 'defs') return;
  const m = multiply(parent, parseTransform(el.attrs.transform));
  const clip = byId.get(refId(el.attrs['clip-path']));
  if (clip) clips = [...clips, clipBox(clip, m)].filter(Boolean);

  const pattern = byId.get(refId(el.attrs.fill));
  if (pattern?.name === 'pattern') {
    const local = localBox(el);
    if (local) fills.push({ el, pattern, box: bounds(m, local), clips });
    else skipped++;
  }
  for (const kid of el.kids) walk(kid, m, clips);
}

function clipBox(clip, m) {
  const rect = clip.kids.find((k) => k.name === 'rect');
  return rect && bounds(multiply(m, parseTransform(rect.attrs.transform)), localBox(rect));
}

function nearest(box) {
  const want = [frame.x + box[0], frame.y + box[1], frame.x + box[0] + box[2], frame.y + box[1] + box[3]];
  let best;
  for (const fill of fills) {
    const gap = Math.max(...fill.box.map((v, i) => Math.abs(v - want[i])));
    if (gap <= tolerance && (!best || gap < best.gap)) best = { ...fill, gap };
  }
  return best;
}

function resolve(pattern) {
  const { patternContentUnits, width, height } = pattern.attrs;
  if (patternContentUnits !== 'objectBoundingBox' || width !== '1' || height !== '1') {
    throw new Error(`${pattern.attrs.id}: only whole-box bounding-box patterns are handled`);
  }
  const use = pattern.kids.find((k) => k.name === 'use');
  const image = use && byId.get((use.attrs['xlink:href'] ?? use.attrs.href).slice(1));
  if (image?.name !== 'image') throw new Error(`${pattern.attrs.id}: expected pattern > use > image`);
  return { use, image };
}

function attrText(value) {
  return typeof value === 'string' ? value : text.slice(value.at, value.at + value.len);
}

function saveImage(image) {
  const uri = attrText(image.attrs['xlink:href'] ?? image.attrs.href);
  const comma = uri.indexOf(',');
  const mime = /^data:([^;,]+);base64$/.exec(uri.slice(0, comma))?.[1];
  const ext = { 'image/png': 'png', 'image/jpeg': 'jpg' }[mime];
  if (!ext) throw new Error(`${image.attrs.id}: unexpected data uri (${uri.slice(0, 30)})`);
  const file = path.join(rawDir, `${image.attrs.id}.${ext}`);
  writeFileSync(file, Buffer.from(uri.slice(comma + 1), 'base64'));
  return file;
}

// The use matrix maps image pixels to bounding-box units, so the box (0..1)
// covers image pixels from -e/a to (1-e)/a.
function designCrop(use) {
  const [a, b, c, d, e, f] = parseTransform(use.attrs.transform);
  if (b || c) throw new Error('rotated or skewed image fill');
  return [-e / a, -f / d, (1 - e) / a, (1 - f) / d];
}

// Largest whole-pixel box of the wanted ratio centred inside the design crop.
// The matrix is rounded to about six digits, hence the small allowance.
function fit([x0, y0, x1, y1], [rw, rh], width, height) {
  const sx0 = Math.max(x0, 0);
  const sy0 = Math.max(y0, 0);
  const sx1 = Math.min(x1, width);
  const sy1 = Math.min(y1, height);
  const k = Math.floor(Math.min((sx1 - sx0) / rw, (sy1 - sy0) / rh) + 0.01);
  const w = k * rw;
  const h = k * rh;
  const clamp = (v, max) => Math.min(Math.max(v, 0), max);
  return {
    x: clamp(Math.round((sx0 + sx1) / 2 - w / 2), width - w),
    y: clamp(Math.round((sy0 + sy1) / 2 - h / 2), height - h),
    w,
    h,
  };
}

function clippedBy(fill) {
  const seen = intersect([fill.box, ...fill.clips]);
  const sides = ['left', 'top', 'right', 'bottom'];
  const cut = [seen[0] - fill.box[0], seen[1] - fill.box[1], fill.box[2] - seen[2], fill.box[3] - seen[3]];
  const parts = cut.flatMap((v, i) => (v > 0.5 ? [`${sides[i]} ${round(v)}pt`] : []));
  return parts.length ? `frame clips ${parts.join(', ')}` : '';
}

function outsideImage([x0, y0, x1, y1], width, height) {
  const over = Math.max(-x0, -y0, x1 - width, y1 - height);
  return over > 1 ? `design reaches ${round(over)}px past the image` : '';
}

// Without -pix_fmt ffmpeg picks 4:4:0 chroma for RGB input.
function encode(src, crop, out, dest) {
  const resize = out[0] === crop.w ? '' : `,scale=${out[0]}:${out[1]}:flags=lanczos`;
  execFileSync('ffmpeg', [
    '-v', 'error', '-y', '-i', src,
    '-vf', `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y}${resize}`,
    '-pix_fmt', 'yuvj420p', '-q:v', String(qscale), '-frames:v', '1', '-update', '1', dest,
  ]);
}

function pixelSize(file) {
  const args = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file];
  return execFileSync('ffprobe', args, { encoding: 'utf8' }).trim().split(',').map(Number);
}

function round(v) {
  return Math.round(v * 10) / 10;
}

function printTable(table) {
  const widths = table[0].map((_, i) => Math.max(...table.map((r) => String(r[i]).length)));
  for (const r of table) console.log(r.map((cell, i) => String(cell).padEnd(widths[i])).join('  ').trimEnd());
}
