import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public', { recursive: true })

// Ikon: brand mark "gem/layers" cream di atas latar champagne (full-bleed, aman untuk maskable)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#9a7636"/>
  <g transform="translate(256 256) scale(13.5) translate(-12 -12)" fill="none" stroke="#fbf1da" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 8l7-4 7 4-7 4-7-4z"/>
    <path d="M5 12l7 4 7-4"/>
    <path d="M5 16l7 4 7-4"/>
  </g>
</svg>`

const buf = Buffer.from(svg)
const out = [
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
  ['public/icon-maskable.png', 512],
  ['public/apple-touch-icon.png', 180],
  ['public/favicon.png', 48],
]

for (const [file, size] of out) {
  await sharp(buf).resize(size, size).png().toFile(file)
  console.log('generated', file, size)
}
console.log('done')
