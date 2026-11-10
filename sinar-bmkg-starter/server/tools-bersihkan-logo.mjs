// Alat sekali pakai: buang latar putih logo BMKG (flood-fill dari tepi + dilasi iteratif)
// → PNG transparan. Tahan noise JPEG. Jalankan dari folder server: node tools-bersihkan-logo.mjs
import sharp from 'sharp'

const masuk = 'C:/Users/ahmad/Downloads/logo bmkg.jpg'
const keluar = 'C:/laragon/www/APLIKASI SEMINAR BMKG/SEMINAR-bmkg-starter/client/public/logo-bmkg.png'

const { data, info } = await sharp(masuk).ensureAlpha().median(3).raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels: C } = info
const terang = (i, ambang) => data[i] > ambang && data[i + 1] > ambang && data[i + 2] > ambang

// 1) Flood-fill dari tepi dengan ambang longgar
const hapus = new Uint8Array(W * H)
const antre = []
for (let x = 0; x < W; x++) antre.push(x, (H - 1) * W + x)
for (let y = 0; y < H; y++) antre.push(y * W, y * W + W - 1)
while (antre.length) {
  const p = antre.pop()
  if (p < 0 || p >= W * H || hapus[p]) continue
  if (!terang(p * C, 190)) continue
  hapus[p] = 1
  const x = p % W
  if (x > 0) antre.push(p - 1)
  if (x < W - 1) antre.push(p + 1)
  if (p >= W) antre.push(p - W)
  if (p < W * (H - 1)) antre.push(p + W)
}

// 2) Dilasi iteratif: piksel terang yang bertetangga transparan ikut dibuang
for (let ronde = 0; ronde < 60; ronde++) {
  const tambahan = []
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x
      if (hapus[p] || !terang(p * C, 190)) continue
      const kiri = x > 0 && hapus[p - 1]
      const kanan = x < W - 1 && hapus[p + 1]
      const atas = y > 0 && hapus[p - W]
      const bawah = y < H - 1 && hapus[p + W]
      if (kiri || kanan || atas || bawah) tambahan.push(p)
    }
  }
  if (!tambahan.length) break
  for (const p of tambahan) hapus[p] = 1
}

// 3) Terapkan + haluskan pinggiran (semi transparan untuk piksel terang di tepi)
let dibuang = 0
for (let p = 0; p < W * H; p++) {
  if (hapus[p]) {
    data[p * C + 3] = 0
    dibuang++
  }
}
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const p = y * W + x
    if (hapus[p]) continue
    const i = p * C
    if (!terang(i, 200)) continue
    const tetangga =
      hapus[p - 1] || hapus[p + 1] || hapus[p - W] || hapus[p + W] ||
      hapus[p - W - 1] || hapus[p - W + 1] || hapus[p + W - 1] || hapus[p + W + 1]
    if (tetangga) data[i + 3] = 110
  }
}

await sharp(data, { raw: { width: W, height: H, channels: C } }).png().toFile(keluar)
console.log(`Selesai: ${dibuang} piksel dibuang dari ${W}x${H}`)
