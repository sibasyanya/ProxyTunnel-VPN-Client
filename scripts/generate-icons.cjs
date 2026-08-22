const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function makePNG(width, height, colorFn) {
  const rowSize = width * 4 + 1;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = colorFn(x, y, width, height);
      const offset = y * rowSize + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(raw);
  
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  function crc32(buf) {
    let table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      table[i] = c;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', header),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function drawVPNIcon(x, y, w, h) {
  const nx = (x / w - 0.5) * 2;
  const ny = (y / h - 0.5) * 2;
  const dist = Math.sqrt(nx*nx + ny*ny);
  
  if (dist > 0.92) {
    return [0, 0, 0, 0];
  }
  
  const grad = (ny + 1) / 2;
  let r = Math.floor(10 + grad * 15);
  let g = Math.floor(100 + grad * 120);
  let b = Math.floor(220 + grad * 35);
  let a = 255;
  
  if (dist > 0.88) {
    const edgeAlpha = Math.max(0, Math.min(1, (0.92 - dist) / 0.04));
    return [r, g, b, Math.floor(255 * edgeAlpha)];
  }

  const inEmblem = (Math.abs(nx) < 0.45 && ny > -0.4 && ny < 0.45);
  const inArch = (Math.abs(nx) < 0.28 && ny >= -0.55 && ny <= -0.2);
  const archInner = (Math.abs(nx) < 0.16 && ny >= -0.45 && ny <= -0.2);

  if ((inArch && !archInner) || inEmblem) {
    return [255, 255, 255, 255];
  }

  return [r, g, b, a];
}

function makeICO(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = 6 + (16 * count);
  const dirEntries = [];
  
  for (const { size, buffer } of pngBuffers) {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(size >= 256 ? 0 : size, 0);
    dir.writeUInt8(size >= 256 ? 0 : size, 1);
    dir.writeUInt8(0, 2);
    dir.writeUInt8(0, 3);
    dir.writeUInt16LE(1, 4);
    dir.writeUInt16LE(32, 6);
    dir.writeUInt32LE(buffer.length, 8);
    dir.writeUInt32LE(offset, 12);
    dirEntries.push(dir);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
}

const iconsDir = path.join(process.cwd(), 'src-tauri', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [16, 32, 48, 64, 128, 256, 512];
const generated = {};
const icoList = [];

for (const s of sizes) {
  const png = makePNG(s, s, drawVPNIcon);
  generated[s] = png;
  if (s <= 256) {
    icoList.push({ size: s, buffer: png });
  }
}

fs.writeFileSync(path.join(iconsDir, '32x32.png'), generated[32]);
fs.writeFileSync(path.join(iconsDir, '128x128.png'), generated[128]);
fs.writeFileSync(path.join(iconsDir, '128x128@2x.png'), generated[256]);
fs.writeFileSync(path.join(iconsDir, 'icon.png'), generated[512]);
fs.writeFileSync(path.join(iconsDir, 'Square30x30Logo.png'), generated[32]);
fs.writeFileSync(path.join(iconsDir, 'Square44x44Logo.png'), generated[48]);
fs.writeFileSync(path.join(iconsDir, 'Square71x71Logo.png'), generated[64]);
fs.writeFileSync(path.join(iconsDir, 'Square89x89Logo.png'), generated[128]);
fs.writeFileSync(path.join(iconsDir, 'Square107x107Logo.png'), generated[128]);
fs.writeFileSync(path.join(iconsDir, 'Square142x142Logo.png'), generated[128]);
fs.writeFileSync(path.join(iconsDir, 'Square150x150Logo.png'), generated[256]);
fs.writeFileSync(path.join(iconsDir, 'Square284x284Logo.png'), generated[256]);
fs.writeFileSync(path.join(iconsDir, 'Square310x310Logo.png'), generated[512]);
fs.writeFileSync(path.join(iconsDir, 'StoreLogo.png'), generated[48]);

const ico = makeICO(icoList);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), ico);
console.log('Icons generated.');
