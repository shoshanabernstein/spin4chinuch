/* eslint-disable @typescript-eslint/no-require-imports */
// Run after editing app/icon.svg: node scripts/generate-icons.cjs
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
async function main() {
  const root = path.resolve(__dirname, "..");
  const source = path.join(root, "app/icon.svg");
  const sizes = [16, 32, 48, 64];
  const images = await Promise.all(sizes.map(size => sharp(source, { density: 384 }).resize(size, size).png().toBuffer()));
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((png, index) => {
    const entry = 6 + index * 16;
    header[entry] = sizes[index];
    header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  await fs.writeFile(path.join(root, "app/favicon.ico"), Buffer.concat([header, ...images]));
  await sharp(source, { density: 384 }).resize(180, 180).png().toFile(path.join(root, "app/apple-icon.png"));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
