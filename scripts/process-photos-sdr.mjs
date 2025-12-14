import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const inputDir = path.join(projectRoot, 'public', 'photos');
const outputDir = path.join(projectRoot, 'public', 'photos-sdr');

const supportedExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function processOne(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (!supportedExts.has(ext)) return;

  const inPath = path.join(inputDir, filename);
  const outPath = path.join(outputDir, filename);

  const inStat = await fs.stat(inPath);
  if (await fileExists(outPath)) {
    const outStat = await fs.stat(outPath);
    // Skip if output is newer than input.
    if (outStat.mtimeMs >= inStat.mtimeMs) return;
  }

  try {
    let pipeline = sharp(inPath, { limitInputPixels: false })
      // Apply EXIF orientation.
      .rotate()
      // Force SDR in sRGB.
      .toColourspace('srgb');

    // NOTE: We intentionally do NOT call `.withMetadata()`.
    // That strips HDR/gain-map metadata that can cause "flashbang" behavior on Apple HDR displays.
    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: 88, mozjpeg: true });
    } else if (ext === '.png') {
      pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 88 });
    } else if (ext === '.avif') {
      // AVIF can be HDR too; we still force sRGB and encode an SDR avif.
      pipeline = pipeline.avif({ quality: 55 });
    }

    await pipeline.toFile(outPath);
  } catch (err) {
    // Last-resort fallback: copy the original file so the site doesn't break.
    console.warn(
      `[photos:sdr] Failed to process ${filename}; copying original instead.`,
      err?.message ?? err,
    );
    await fs.copyFile(inPath, outPath);
  }
}

async function main() {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    const entries = await fs.readdir(inputDir, { withFileTypes: true });

    const files = entries
      .filter((d) => d.isFile())
      .map((d) => d.name)
      .filter((name) => supportedExts.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    // Process sequentially to avoid spiking memory on large albums.
    for (const file of files) {
      // processOne handles its own fallback on error.
      // eslint-disable-next-line no-await-in-loop
      await processOne(file);
    }

    // Optional cleanup: delete SDR files that no longer exist in `public/photos/`.
    const outEntries = await fs.readdir(outputDir, { withFileTypes: true });
    await Promise.all(
      outEntries
        .filter((d) => d.isFile())
        .map((d) => d.name)
        .filter((name) => supportedExts.has(path.extname(name).toLowerCase()))
        .filter((name) => !files.includes(name))
        .map((name) => fs.rm(path.join(outputDir, name))),
    );
  } catch (err) {
    // Keep builds resilient — if processing fails, fall back to original photos.
    console.warn('[photos:sdr] Skipping SDR generation:', err?.message ?? err);
  }
}

await main();
