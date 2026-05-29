/**
 * Generates required Expo PNG assets from scratch using only Node.js built-ins.
 * No npm packages needed.
 */
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

// ── CRC32 (IEEE 802.3) ───────────────────────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeB = Buffer.from(type, 'ascii')
  const crcIn = Buffer.concat([typeB, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcIn))
  return Buffer.concat([len, typeB, data, crc])
}

// ── PNG writer ───────────────────────────────────────────────────────────────
function makePNG(width, height, fillRGB) {
  const [r, g, b] = fillRGB

  // Build raw image: each row = filter byte (0) + RGB pixels
  const rowBytes = 1 + width * 3
  const raw = Buffer.alloc(height * rowBytes)
  for (let y = 0; y < height; y++) {
    const off = y * rowBytes
    raw[off] = 0 // filter None
    for (let x = 0; x < width; x++) {
      raw[off + 1 + x * 3] = r
      raw[off + 1 + x * 3 + 1] = g
      raw[off + 1 + x * 3 + 2] = b
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 })

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8  // bit depth
  ihdrData[9] = 2  // colour type: RGB
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG sig
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Draw a rounded-rect "A" logo on a dark indigo background ─────────────────
// For simplicity: solid colour blocks (no anti-aliasing needed for build assets)

function makeAppIcon(size) {
  // Dark indigo bg: #0F0E17, accent: #4F46E5
  const bg  = [15,  14, 23]
  const acc = [79, 70, 229]

  const [br, bg2, bb] = bg
  const [ar, ag, ab]  = acc

  const rowBytes = 1 + size * 3
  const raw = Buffer.alloc(size * rowBytes)

  const cx = size / 2
  const cy = size / 2
  const outerR = size * 0.38   // accent circle radius
  const innerR = size * 0.22   // cut-out radius (makes a ring + letter feel)

  for (let y = 0; y < size; y++) {
    const off = y * rowBytes
    raw[off] = 0
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      let r, g, b
      if (dist < outerR && dist > innerR) {
        // accent ring
        r = ar; g = ag; b = ab
      } else if (dist <= innerR * 0.6) {
        // inner dot
        r = ar; g = ag; b = ab
      } else {
        r = br; g = bg2; b = bb
      }
      raw[off + 1 + x * 3]     = r
      raw[off + 1 + x * 3 + 1] = g
      raw[off + 1 + x * 3 + 2] = b
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 })
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8; ihdrData[9] = 2

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Splash: full dark bg with centred accent bar ─────────────────────────────
function makeSplash(w, h) {
  const bg  = [15, 14, 23]
  const acc = [79, 70, 229]

  const rowBytes = 1 + w * 3
  const raw = Buffer.alloc(h * rowBytes)
  const cx = w / 2, cy = h / 2
  const barW = w * 0.12, barH = h * 0.008

  for (let y = 0; y < h; y++) {
    const off = y * rowBytes
    raw[off] = 0
    for (let x = 0; x < w; x++) {
      const inBar = Math.abs(x - cx) < barW && Math.abs(y - cy) < barH
      const [r, g, b] = inBar ? acc : bg
      raw[off + 1 + x * 3]     = r
      raw[off + 1 + x * 3 + 1] = g
      raw[off + 1 + x * 3 + 2] = b
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 })
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(w, 0)
  ihdrData.writeUInt32BE(h, 4)
  ihdrData[8] = 8; ihdrData[9] = 2

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Write files ───────────────────────────────────────────────────────────────
const assetsDir = path.join(__dirname, '..', 'assets')
fs.mkdirSync(assetsDir, { recursive: true })

const files = [
  ['icon.png',          () => makeAppIcon(1024)],
  ['adaptive-icon.png', () => makeAppIcon(1024)],
  ['favicon.png',       () => makeAppIcon(64)],
  ['splash.png',        () => makeSplash(1284, 2778)],
  ['splash-icon.png',   () => makeAppIcon(200)],
]

for (const [name, fn] of files) {
  const out = path.join(assetsDir, name)
  fs.writeFileSync(out, fn())
  console.log(`✓ ${name}  (${fs.statSync(out).size} bytes)`)
}

console.log('\nAll assets generated successfully.')
