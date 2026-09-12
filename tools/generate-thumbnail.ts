/**
 * Renders the two Poki-required thumbnails (CLAUDE.md story 5.7, §12
 * must-fix 9) straight out of a running game — a 512x384 static PNG and a
 * 5-second 512x384 silent WebM loop.
 *
 * **How to run:** start `npm run dev`, open the game, and in the browser
 * console:
 *
 * ```js
 * const { captureThumbnails } = await import('/tools/generate-thumbnail.ts');
 * await captureThumbnails();
 * ```
 *
 * Both files download; move them into `thumbnails/`. It is deliberately a
 * browser routine rather than a Node script: the only way to get a true frame
 * of this game is to render it in a real browser with WebGL, and wiring
 * `npm run thumbnail` to do that headlessly would mean taking on Playwright
 * (plus its ~300 MB browser download) as a devDependency — a dependency
 * call for the project owner, not something to adopt silently for a task
 * that runs a handful of times before submission.
 *
 * `MediaRecorder` captures an offscreen canvas the game is blitted into, so
 * the output is exactly 512x384 with no post-processing and no audio track —
 * `captureStream()` on a canvas carries video only, which is what Poki's
 * "no audio" rule needs.
 */

import type Phaser from 'phaser';

/** Poki's required thumbnail size — both assets, same dimensions (CLAUDE.md §12). */
const THUMB_WIDTH = 512;
const THUMB_HEIGHT = 384;
const CLIP_SECONDS = 5;
const FPS = 30;
const VIDEO_BITRATE = 1_600_000;

/**
 * The 4:3 window cropped out of the 1280x720 canvas. Centred on Granny and
 * the wall directly above her: wide enough to hold the whole spinner grid
 * and keep her feet in frame even while a combo shake is running.
 */
const CROP = { x: 260, y: 150, width: 760, height: 570 };

/** The run the clip is recorded from — Garden reads clearest at thumbnail size, Soaker 3000 throws the widest stream. */
const CLIP_RUN = { worldId: 'garden', gunId: 'soaker3000', grannyId: 'classic' };

/** When in the 5 s clip the wall tips into SPLASH FRENZY — late enough to show the build-up, early enough to show the payoff. */
const FRENZY_AT_MS = 3100;
/**
 * When the still is grabbed, just before Frenzy tips. The Frenzy frames are
 * the right climax for a clip but the wrong still: the screen flash washes
 * the art out and the banner covers the wall, so the static thumbnail takes
 * the moment before — Granny mid-stream against a wall of lit spinners.
 */
const STILL_AT_MS = 2600;

interface DebugGame extends Phaser.Game {
  canvas: HTMLCanvasElement;
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function croppedCanvas(game: DebugGame): {
  canvas: HTMLCanvasElement;
  blit: () => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = THUMB_WIDTH;
  canvas.height = THUMB_HEIGHT;
  const ctx = canvas.getContext('2d');
  const blit = (): void => {
    // Must run inside Phaser's own post-render, while the WebGL drawing
    // buffer is still valid — the renderer is created without
    // preserveDrawingBuffer, so reading it any later returns an empty frame.
    ctx?.drawImage(
      game.canvas,
      CROP.x,
      CROP.y,
      CROP.width,
      CROP.height,
      0,
      0,
      THUMB_WIDTH,
      THUMB_HEIGHT,
    );
  };
  return { canvas, blit };
}

/** Starts a fresh run with every other scene stopped, and returns it mid-play with auto-fire on. */
async function startClipRun(game: DebugGame): Promise<{
  spinners: { x: number; y: number; currentSpeed: number; maxOut(): void }[];
  setAim(x: number, y: number): void;
}> {
  for (const key of ['GameOverScene', 'SplashScene', 'PauseScene', 'GameScene', 'HUDScene']) {
    game.scene.stop(key);
  }
  game.scene.start('GameScene', CLIP_RUN);
  await new Promise((r) => setTimeout(r, 1200));
  // The scene's internals are reached loosely on purpose: this is a tool,
  // not game code, and it must not become a reason to widen GameScene's API.
  const s = game.scene.getScene('GameScene') as unknown as {
    _started: boolean;
    _input: { _autoFire: boolean };
    _crosshair: { setVisible(v: boolean): void; setPosition(x: number, y: number): void };
    _spinners: { x: number; y: number; currentSpeed: number; maxOut(): void }[];
  };
  s._started = true;
  s._input._autoFire = true;
  s._crosshair.setVisible(false);
  s._spinners.forEach((spinner, i) => {
    spinner.currentSpeed = 30 + (i % 4) * 12;
  });
  return {
    spinners: s._spinners,
    setAim: (x, y) => s._crosshair.setPosition(x, y),
  };
}

/** Captures both thumbnails from the live game and downloads them. */
export async function captureThumbnails(): Promise<{ pngBytes: number; webmBytes: number }> {
  const game = (window as unknown as { __gameForDebug?: DebugGame }).__gameForDebug;
  if (!game) throw new Error('__gameForDebug not found — run this on a dev build of the game');

  const run = await startClipRun(game);
  const { canvas, blit } = croppedCanvas(game);
  game.events.on('postrender', blit);

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(canvas.captureStream(FPS), {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: VIDEO_BITRATE,
  });
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const startedAt = performance.now();
  let frenzied = false;
  const still: { blob: Blob | null; requested: boolean } = { blob: null, requested: false };
  const script = setInterval(() => {
    const elapsed = performance.now() - startedAt;
    const progress = elapsed / (CLIP_SECONDS * 1000);
    const target =
      run.spinners[Math.floor(progress * run.spinners.length * 1.4) % run.spinners.length];
    if (target) run.setAim(target.x, target.y);
    for (const spinner of run.spinners) {
      if (spinner.currentSpeed < 100)
        spinner.currentSpeed = Math.min(100, spinner.currentSpeed + 1.1);
    }
    if (!still.requested && elapsed > STILL_AT_MS) {
      still.requested = true;
      canvas.toBlob((blob) => {
        still.blob = blob;
      }, 'image/png');
    }
    if (!frenzied && elapsed > FRENZY_AT_MS) {
      frenzied = true;
      for (const spinner of run.spinners) spinner.maxOut();
    }
  }, 60);

  recorder.start();
  await new Promise((r) => setTimeout(r, CLIP_SECONDS * 1000));
  recorder.stop();
  clearInterval(script);
  await new Promise((r) => {
    recorder.onstop = () => r(null);
  });

  game.events.off('postrender', blit);

  const png = still.blob;
  const webm = new Blob(chunks, { type: 'video/webm' });
  if (png) download(png, 'thumbnail-static.png');
  download(webm, 'thumbnail-animated.webm');
  return { pngBytes: png?.size ?? 0, webmBytes: webm.size };
}
