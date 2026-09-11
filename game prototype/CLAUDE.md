# Granny's Spin Splash — Claude Code Project

## Project Brief
Build a browser-based 2D arcade game called **Granny's Spin Splash**. A tiny old granny wields an oversized water gun and shoots at a wall of spinning targets (pinwheels, cogs, fans, etc.). Hitting spinners makes them spin faster and earns gold stars. The goal is to get every spinner on the wall whirring at full speed simultaneously for a "SPLASH FRENZY!" bonus.

## Tech Stack
- **Language:** TypeScript
- **Framework:** Phaser 3 (npm: `phaser`)
- **Build Tool:** Vite
- **Audio:** Phaser's built-in audio (Web Audio API)
- **Target:** Static web app, 60fps, desktop + mobile browser

## Project Setup (run these commands first)
```bash
npm create vite@latest granny-spin-splash -- --template vanilla-ts
cd granny-spin-splash
npm install phaser
npm run dev
```

Replace `src/main.ts` with the Phaser game bootstrap.

---

## Architecture

### File Structure
```
src/
  main.ts               # Phaser game config + boot
  scenes/
    BootScene.ts        # Asset preloading
    MenuScene.ts        # Main menu (game box selection)
    GameScene.ts        # Core gameplay
    HUDScene.ts         # Overlay HUD (stars, timer, combo, water)
    PauseScene.ts       # Pause menu
  objects/
    Spinner.ts          # Spinner base class
    WaterStream.ts      # Water gun stream + particles
    Granny.ts           # Player 1 character
    Granddad.ts         # Player 2 character
    PowerUp.ts          # Power-up pickups
    Obstacle.ts         # Umbrella, cat, rubber duck, washing line
  data/
    levels.ts           # Level definitions (worlds, spinner layouts)
    spinnerTypes.ts     # Spinner type configs
  utils/
    InputManager.ts     # Unified keyboard/gamepad/mouse input
    AudioManager.ts     # Sound effect helpers
    SaveManager.ts      # localStorage wrapper
```

---

## Core Systems (build in this order)

### Phase 1 — Core Loop (Sessions 1–2)
**Goal:** Granny on screen, wall of pinwheels, click to shoot and spin them.

1. **GameScene skeleton**
   - Canvas 1280×720
   - Background: wooden fence texture (drawn with Phaser Graphics if no assets yet)
   - Granny sprite at bottom-centre

2. **Granny movement**
   - Arrow keys → move left/right along bottom of screen
   - Clamp to screen edges
   - Speed: 300px/s

3. **Crosshair aiming**
   - Track mouse pointer position on the wall
   - Show a small crosshair sprite at pointer position

4. **WaterStream**
   - Hold Space / Left Mouse → fire continuous stream from Granny toward crosshair
   - Implement as a line of small circle particles that travel along a slightly arced path (parabolic arc, gravity ~50)
   - Use Phaser's particle emitter or manual update loop
   - Stream reaches wall in ~0.3 seconds

5. **Spinner class**
   - Properties: `type`, `x`, `y`, `currentSpeed` (0–100), `maxSpeed` (100), `decayRate`, `starValue`, `state` (STOPPED/SLOW/MEDIUM/FULL)
   - Each frame: `currentSpeed -= decayRate * delta`
   - On water hit: `currentSpeed += hitPower` (clamp to maxSpeed)
   - State thresholds: STOPPED=0, SLOW>0, MEDIUM>40, FULL>80
   - Visual: rotate the sprite by `currentSpeed * delta * rotationFactor`
   - State colours: STOPPED=grey, SLOW=bronze tint, MEDIUM=silver tint, FULL=gold tint + particle glow

6. **Wall layout**
   - Hard-code a 3×3 grid of Pinwheel spinners for Phase 1
   - Spinners sit in the top two-thirds of the screen

7. **Collision**
   - Each water particle checks overlap with spinner hitboxes
   - On overlap: apply hit to spinner, destroy particle, spawn a small splash effect

---

### Phase 2 — Juice (Sessions 3–4)
**Goal:** Scoring, combo, sound, water tank.

8. **Gold star scoring**
   - On spinner state upgrade: spawn animated star(s) that float up to score counter
   - Star values per state transition:
     - STOPPED→SLOW: base starValue
     - SLOW→MEDIUM: +1 bonus
     - MEDIUM→FULL: +1 bonus
   - If spinner at FULL for 10+ seconds: +1 star every 5 seconds

9. **Combo system**
   - Hit different spinners within 2 seconds → combo increments (max x5)
   - Same spinner twice in a row or miss → reset
   - Combo multiplier applied to all stars earned
   - Display as bouncing text above Granny's head

10. **SPLASH FRENZY**
    - When ALL spinners simultaneously reach FULL state:
      - Play fanfare sound
      - Show "SPLASH FRENZY!" banner centre screen
      - Award 25 bonus stars
      - Lock all spinners at FULL for 5 seconds
      - Screen-wide confetti + water splash VFX

11. **Water tank**
    - Tank = 100 units, shown as blue bar next to Granny
    - Drain rate: 5 units/second while firing
    - When empty: stop stream, play pump animation for 2 seconds, then refill to 100
    - Water pickup (blue droplet) occasionally drops from wall → shoot to collect, refills 40 units

12. **Sound effects** (use Phaser's audio; generate simple tones with Web Audio API if no audio files)
    - Water stream: looping "pssshhh" noise while firing
    - Spinner hit: rising pitch whirr (higher pitch at higher speed)
    - Star collect: bright chime
    - Combo: increasingly excited dings (pitch step up per combo level)
    - Splash Frenzy fanfare
    - Pump click on refill

---

### Phase 3 — Full Spinner Variety + 2 Worlds (Sessions 5–7)

13. **All 8 spinner types** (see table below)
14. **Spinner state visuals** — distinct look per type and state
15. **World 1: Garden** (wooden fence, 5–8 spinners, Pinwheels + Fans)
16. **World 2: Workshop** (pegboard, 8–12 spinners, Cogs + Windmills)
17. **Obstacles** (from World 3 onwards):
    - **Cat:** Sits on a spinner, stops it spinning. Squirt to shoo. Returns after 10s.
    - **Umbrella:** Opens/closes, blocks water stream.
    - **Rubber Duck:** Bounces around, deflects stream if hit.
    - **Washing Line:** Clothes drift across screen blocking shots.

---

### Phase 4 — Two Player (Sessions 8–9)

18. **Granddad character** — right side of screen
19. **Split input:** P1 = arrows + mouse + space; P2 = WASD + shift (keyboard aim or gamepad)
20. **Co-op mode:** shared star pool, both players' streams can hit any spinner
21. **Versus mode:** track individual stars, display split score at end
22. **More spinners on wall** in 2P mode (20% more)

---

### Phase 5 — Polish + Full Game (Sessions 10–12)

23. **Main menu** — two game boxes on a shelf, click to choose 1P or 2P
24. **All 5 worlds** with full level progression
25. **Power-ups:** Super Soaker, Turbo Pump, Spin Lock, Golden Splash, Double Stars
26. **End-of-level rating:** 1–3 stars + GOLDEN GRANNY achievement
27. **Animations:** idle character sway, victory dance, FULL speed particle glow
28. **Save system:** localStorage for star counts, unlocks, level progress
29. **Pause menu:** Resume, Restart, Settings, Quit to Menu

---

## Spinner Type Reference

| Spinner     | Decay Rate | Hit Power | Stars | Special Behaviour                          |
|-------------|-----------|-----------|-------|--------------------------------------------|
| Pinwheel    | 8/s       | 25        | 1     | Easiest; starts from one hit               |
| Fan         | 15/s      | 30        | 1     | Spins fast but decays quickly              |
| Windmill    | 4/s       | 20        | 2     | Needs 2 hits (40 power) to reach SLOW     |
| Cog         | 5/s       | 15        | 2     | Small hitbox ("teeth"); precise aim needed |
| Propeller   | 3/s       | 12        | 3     | Needs 3+ hits to reach FULL               |
| Whirligig   | 6/s       | 20        | 3     | Deflects water 30% of the time            |
| Disco Ball  | 2/s       | 18        | 5     | Emits light flares when spinning          |
| Golden      | 20/s      | 50        | 10    | Appears for 6 seconds, then vanishes      |

---

## Visual Style Guidelines
- **Art style:** Hand-drawn, warm, slightly wobbly — watercolour with thick outlines
- **Palette:** Bright primaries for spinners; warm pastels for backgrounds; gold sparkle for rewards
- **Water:** Vivid cheerful blue, white foam splashes
- **Characters:** Exaggerated proportions — Granny tiny with huge head, Granddad tall and skinny
- Use Phaser Graphics API for placeholder art during development; swap in illustrated sprites later

---

## Key Phaser 3 Patterns to Use
```typescript
// Spinner rotation
spinner.setAngularVelocity(spinner.currentSpeed * 2);

// Particle splash on hit
this.add.particles(x, y, 'water-drop', {
  speed: { min: 50, max: 150 },
  lifespan: 400,
  quantity: 8,
  scale: { start: 0.5, end: 0 }
});

// Object pooling for water particles
this.waterPool = this.add.group({ classType: WaterParticle, maxSize: 50, runChildUpdate: true });

// Input
this.cursors = this.input.keyboard!.createCursorKeys();
this.aimPointer = this.input.activePointer;
```

---

## Performance Targets
- 60fps on mid-range desktop
- Water stream: pool max 50 particles, reuse on destroy
- Stars: pool max 30 star sprites
- No per-frame `new` allocations in hot paths

---

## Build & Run
```bash
npm run dev       # Development server
npm run build     # Production build → dist/
```

Deploy the `dist/` folder to Netlify / Vercel / GitHub Pages.

---

## Current Phase
**Start with Phase 1.** Get Granny moving, the crosshair tracking the mouse, and pinwheels spinning when hit. Get that core satisfying "squirt → spin" loop feeling great before adding anything else.
