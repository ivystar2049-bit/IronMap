// Icon generator for the PWA manifest AND the native Android launcher /
// splash source images consumed by @capacitor/assets. Draws a simple blocky
// dumbbell glyph (matching the app's industrial theme) as raw pixels via
// pngjs — no native image deps, no external assets.
//
//   node scripts/gen-icons.mjs
//   npx @capacitor/assets generate --android
import { PNG } from "pngjs";
import { writeFileSync, mkdirSync } from "node:fs";

const BG = [0x14, 0x17, 0x1c]; // C.bg
const FG = [0xff, 0x6b, 0x35]; // C.accent

function fillRect(png, x0, y0, x1, y1, [r, g, b], alpha = 255) {
  for (let y = Math.max(0, Math.round(y0)); y < Math.min(png.height, Math.round(y1)); y++) {
    for (let x = Math.max(0, Math.round(x0)); x < Math.min(png.width, Math.round(x1)); x++) {
      const idx = (png.width * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = alpha;
    }
  }
}

// draws a dumbbell centered in the canvas. `extent` is the fraction of the
// canvas width the whole glyph spans (use a smaller value for maskable
// icons so the shape sits inside the safe-zone circle). `transparent`
// leaves the background clear, for adaptive-icon foreground layers.
function drawDumbbell(size, extent, { transparent = false } = {}) {
  const png = new PNG({ width: size, height: size });
  if (transparent) fillRect(png, 0, 0, size, size, [0, 0, 0], 0);
  else fillRect(png, 0, 0, size, size, BG);

  const half = (size * extent) / 2;
  const cx = size / 2, cy = size / 2;
  const plateW = size * extent * 0.17;
  const plateH = size * extent * 0.62;
  const barH = size * extent * 0.16;

  // left plate
  fillRect(png, cx - half, cy - plateH / 2, cx - half + plateW, cy + plateH / 2, FG);
  // right plate
  fillRect(png, cx + half - plateW, cy - plateH / 2, cx + half, cy + plateH / 2, FG);
  // bar
  fillRect(png, cx - half + plateW, cy - barH / 2, cx + half - plateW, cy + barH / 2, FG);

  return png;
}

function write(png, path) {
  writeFileSync(path, PNG.sync.write(png));
  console.log("wrote", path);
}

/* ---- PWA manifest icons ---- */
write(drawDumbbell(192, 0.72), "public/icons/icon-192.png");
write(drawDumbbell(512, 0.72), "public/icons/icon-512.png");
// maskable: keep the glyph inside the ~80% safe-zone circle
write(drawDumbbell(512, 0.5), "public/icons/icon-512-maskable.png");

/* ---- source images for @capacitor/assets (native launcher + splash) ----
   It reads these from assets/ and derives every Android density itself. */
mkdirSync("assets", { recursive: true });

// flat launcher icon
write(drawDumbbell(1024, 0.72), "assets/icon.png");

// adaptive icon: Android masks the foreground to varying shapes and the
// outer ~1/3 can be cropped, so the glyph is kept well inside the safe zone
write(drawDumbbell(1024, 0.42, { transparent: true }), "assets/icon-foreground.png");
write(drawDumbbell(1024, 0, { transparent: false }), "assets/icon-background.png");

// splash: same glyph, small, on the app background. Light and dark are the
// same image — the app is dark-only (index.css sets color-scheme: dark).
const splash = drawDumbbell(2732, 0.16);
write(splash, "assets/splash.png");
write(splash, "assets/splash-dark.png");
