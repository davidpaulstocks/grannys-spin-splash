/**
 * Granny + Gun carousels, vault display, PLAY (CLAUDE.md §7.2, §10,
 * story 5.3). First scene the player ever sees; GameOverScene's Play
 * Again returns here too (full loop: splash → game → game over → splash,
 * Sprint 5 exit criteria) so progression/unlocks are always visible
 * between runs, not just once at boot.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { SPRITE_KEYS } from '../assets/keys';
import { GRANNY_DEFS } from '../entities/granny/granny.data';
import { GUN_DEFS } from '../entities/gun/gun.data';
import { WORLD_DEFS } from '../entities/world/world.data';
import { worldBackgroundKey } from '../entities/world/worldBackgrounds';
import { adManager } from '../systems/AdManager';
import { AD_MUTE_HOOKS } from '../audio/AudioBus';
import { saveManager } from '../systems/SaveManager';
import { UnlockManager } from '../systems/UnlockManager';
import { createButton } from '../ui/Button';
import type { CarouselItem } from '../ui/Carousel';
import { createControlsLegend } from '../ui/ControlsLegend';
import { drawStarIcon } from '../ui/icons';
import { LoadoutStage } from '../ui/LoadoutStage';
import { ThumbnailSelector } from '../ui/ThumbnailSelector';
import { showToast } from '../ui/Toast';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { textStyle } from '../utils/typography';

/** Placeholder swatch colours standing in for real world backdrop thumbnails — one hero colour per world's vibe. */
const WORLD_SWATCH: Readonly<Record<string, number>> = {
  garden: COLOUR.mintGreen,
  workshop: COLOUR.heatOrange,
  kitchen: COLOUR.sunnyGold,
  funfair: COLOUR.grannyPink,
  disco: COLOUR.waterBlue,
};

const CAROUSEL_Y = 405;
/**
 * 2026-09-12, second pass: moved in from 170/1110 alongside CompactSelector
 * and LoadoutStage switching their arrows to an inset design. With three
 * flanking arrow-clusters, 1280px only fits them without overlap once each
 * cluster's own footprint shrinks to its component's own width (see both
 * components' doc comments) — these values leave a genuine ~35px gap on
 * every seam, confirmed live via screenshot after the fix (the previous
 * values had the Granny/Gun selectors' inner arrows physically overlapping
 * the World stage's own arrows, hiding whichever was added to the scene
 * first — this was the literal cause of the reported "no button to switch
 * world").
 */
const GRANNY_CAROUSEL_X = 150;
const WORLD_CAROUSEL_X = GAME_WIDTH * 0.5;
const GUN_CAROUSEL_X = GAME_WIDTH - 150;
/** Random-unlock reward pool cap — a random gun at or below the player's current highest tier (CLAUDE.md §11.1). */
const REWARD_MAX_TIER = 4;

/** Where unlock/select feedback toasts appear — a shared anchor above PLAY, not per-carousel (CLAUDE.md §10). */
const SELECT_TOAST_Y = GAME_HEIGHT * 0.68;

/**
 * Title lockup — the illustrated flourish wreath sits behind the drippy
 * wordmark, both centred at the same point (CLAUDE.md §3 rule 6 bans
 * studio splash screens, not the game's own stylised title on its own
 * menu). Re-sized 2026-09-12 on direct user feedback: the flourish now
 * reads as a real background element (~520px wide) instead of a small
 * tight frame — everything below it (vault, carousels, buttons) got
 * pushed down/enlarged to match the bigger carousel cards.
 */
const TITLE_CENTRE_Y = 110;
const TITLE_WORDMARK_HEIGHT = 120;
const VAULT_Y = 205;
const PLAY_Y = 604;
/**
 * The row under PLAY holds exactly one thing. For a first-time player it's
 * CLAUDE.md §6.5's hint; for everyone after, the rewarded-ad offer. They
 * swap rather than stack because there is no free band left between the
 * loadout card (ends at 575) and the bottom edge — squeezing both in put the
 * hint on top of PLAY's own edge and pushed the ad row flush against the
 * canvas edge. Swapping also makes the first impression a line telling a
 * new player what to do, rather than an ad offer for a gun they have no
 * context for yet.
 */
const BOTTOM_ROW_Y = 684;
/**
 * CLAUDE.md §11.3: the standard continue button must be "larger or equal"
 * to the rewarded button beside/above it. The reward button's own label —
 * "Watch an ad for a free gun" — plus its new video icon is wider than
 * PLAY's own short label would naturally render, so PLAY needs an explicit
 * floor rather than relying on its text to win that comparison (found by
 * spec audit: PLAY's old 300 was narrower than the reward button's 340).
 */
const PLAY_BUTTON_MIN_WIDTH = 400;
const REWARD_BUTTON_MIN_WIDTH = 340;

export class SplashScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  private _grannySelector!: ThumbnailSelector;
  private _loadoutStage!: LoadoutStage;
  private _gunSelector!: ThumbnailSelector;
  private _vaultText!: Phaser.GameObjects.Text;
  private _isStartingRun = false;

  constructor() {
    super('SplashScene');
  }

  create(): void {
    // Phaser REUSES the scene instance, so every `private _x = ...` field
    // initialiser runs once at construction and never again — `create()` is
    // the only per-visit reset. Without this line `_isStartingRun` stayed
    // true after the first run for the lifetime of the page, and PLAY did
    // nothing at all from the second visit onward: the game was a one-round
    // game (direct user report, 2026-09-12: "the play button after having
    // played once does not work").
    this._isStartingRun = false;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud).setOrigin(0);
    this._buildTitle();
    this._buildVaultDisplay();

    this._grannySelector = new ThumbnailSelector(
      this,
      GRANNY_CAROUSEL_X,
      CAROUSEL_Y,
      this._grannyItems(),
      this._unlocks.getSelectedGrannyId(),
      (id) => this._onTapGranny(id),
    );
    this._loadoutStage = new LoadoutStage(
      this,
      WORLD_CAROUSEL_X,
      CAROUSEL_Y,
      this._worldItems(),
      this._unlocks.getSelectedWorldId(),
      (id) => this._onTapWorld(id),
    );
    this._gunSelector = new ThumbnailSelector(
      this,
      GUN_CAROUSEL_X,
      CAROUSEL_Y,
      this._gunItems(),
      this._unlocks.getSelectedGunId(),
      (id) => this._onTapGun(id),
    );
    this._loadoutStage.setGrannyTexture(
      SPRITE_KEYS.grannyPose(this._unlocks.getSelectedGrannyId(), 'front'),
    );
    this._loadoutStage.setGunTexture(SPRITE_KEYS.gunAngle(this._unlocks.getSelectedGunId(), 0));

    createButton(this, {
      x: GAME_WIDTH / 2,
      y: PLAY_Y,
      label: 'PLAY',
      variant: 'primary',
      // Wide enough to stay ≥ the reward button below it even with its
      // longer label + video icon (CLAUDE.md §11.3: "standard continue
      // button: Mint Green, larger or equal") — see PLAY_BUTTON_MIN_WIDTH.
      minWidth: PLAY_BUTTON_MIN_WIDTH,
      onClick: () => void this._onPlay(),
    });

    if (saveManager.load().hasPlayed) this._buildRewardButton();
    else this._buildFirstRunHint();

    createControlsLegend(this, 24, GAME_HEIGHT - 106);
  }

  /**
   * CLAUDE.md §6.5: no tutorial screen — a first-time player gets one line
   * naming the verb, and nothing after that. Shown only while the save says
   * they've never fired a shot, so it's replaced by the rewarded-ad row for
   * good after their first run rather than nagging a returning player.
   */
  private _buildFirstRunHint(): void {
    this.add
      .text(
        GAME_WIDTH / 2,
        BOTTOM_ROW_Y,
        'Tap the wall to soak the spinners!',
        textStyle('bodyL', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);
  }

  private _grannyItems(): CarouselItem[] {
    return GRANNY_DEFS.map((g) => ({
      id: g.id,
      label: g.name,
      unlocked: this._unlocks.isGrannyUnlocked(g.id),
      cost: g.unlockCost,
      swatchColour: COLOUR.grannyPink,
      swatchTextureKey: SPRITE_KEYS.grannyPose(g.id, 'front'),
    }));
  }

  private _gunItems(): CarouselItem[] {
    return GUN_DEFS.map((g) => ({
      id: g.id,
      label: g.name,
      unlocked: this._unlocks.isGunUnlocked(g.id),
      cost: g.cost,
      swatchColour: COLOUR.waterBlue,
      swatchTextureKey: SPRITE_KEYS.gunAngle(g.id, 0),
    }));
  }

  private _worldItems(): CarouselItem[] {
    return WORLD_DEFS.map((w) => {
      const bgKey = worldBackgroundKey(w.id);
      return {
        id: w.id,
        label: w.name,
        unlocked: this._unlocks.isWorldUnlocked(w.id),
        cost: w.unlockThreshold,
        swatchColour: WORLD_SWATCH[w.id] ?? COLOUR.softSlate,
        ...(bgKey ? { swatchTextureKey: bgKey } : {}),
      };
    });
  }

  /** CLAUDE.md §10: tapping a locked item spends vault stars to unlock it if affordable, else nudges to earn more. */
  private _onTapGranny(id: string): void {
    const def = GRANNY_DEFS.find((g) => g.id === id);
    if (!def) return;
    this._attemptUnlock({
      alreadyUnlocked: this._unlocks.isGrannyUnlocked(id),
      cost: def.unlockCost,
      name: def.name,
      unlock: () => this._unlocks.unlockGranny(id),
      select: () => this._unlocks.selectGranny(id),
      refresh: () => this._grannySelector.setItems(this._grannyItems()),
    });
    // Always re-derive from the authoritative selection, not the tapped id
    // — an unaffordable locked tap doesn't actually change what's equipped.
    this._loadoutStage.setGrannyTexture(
      SPRITE_KEYS.grannyPose(this._unlocks.getSelectedGrannyId(), 'front'),
    );
  }

  private _onTapWorld(id: string): void {
    const def = WORLD_DEFS.find((w) => w.id === id);
    if (!def) return;
    this._attemptUnlock({
      alreadyUnlocked: this._unlocks.isWorldUnlocked(id),
      cost: def.unlockThreshold,
      name: def.name,
      unlock: () => this._unlocks.unlockWorld(id),
      select: () => this._unlocks.selectWorld(id),
      refresh: () => this._loadoutStage.setItems(this._worldItems()),
    });
  }

  private _onTapGun(id: string): void {
    const def = GUN_DEFS.find((g) => g.id === id);
    if (!def) return;
    this._attemptUnlock({
      alreadyUnlocked: this._unlocks.isGunUnlocked(id),
      cost: def.cost,
      name: def.name,
      unlock: () => this._unlocks.unlockGun(id),
      select: () => this._unlocks.selectGun(id),
      refresh: () => this._gunSelector.setItems(this._gunItems()),
    });
    this._loadoutStage.setGunTexture(SPRITE_KEYS.gunAngle(this._unlocks.getSelectedGunId(), 0));
  }

  /**
   * Shared by all three carousels: an already-unlocked item just gets
   * selected. A locked one is an unlock *attempt* — spend vault stars and
   * select on success, or show how many more stars are needed.
   */
  private _attemptUnlock(item: {
    readonly alreadyUnlocked: boolean;
    readonly cost: number;
    readonly name: string;
    readonly unlock: () => boolean;
    readonly select: () => void;
    readonly refresh: () => void;
  }): void {
    if (item.alreadyUnlocked) {
      item.select();
      return;
    }
    if (item.unlock()) {
      item.select();
      item.refresh();
      this._refreshVaultText();
      showToast(this, GAME_WIDTH / 2, SELECT_TOAST_Y, `Unlocked ${item.name}!`);
      return;
    }
    const short = item.cost - this._unlocks.getVault();
    showToast(this, GAME_WIDTH / 2, SELECT_TOAST_Y, `Earn ${short}★ more to unlock ${item.name}`);
  }

  /**
   * The flourish wreath is the page's frame (2026-09-12 redesign, direct
   * user feedback — "make it the framing for the entire landscape screen,
   * everything else lives within it"): scaled to fill the whole 1280×720
   * canvas, sitting behind every other element as one continuous decorative
   * border. Its own painted ring occupies roughly the outer ~13-18% on each
   * edge with a large soft-transparent centre (by design, since it was
   * composed as a wreath) — every opaque card/button drawn on top of it
   * (Carousel's cloud-coloured cards, the pill buttons) simply masks the
   * art directly behind it, so legibility is never at risk; the wreath
   * shows through only in what would otherwise be empty cream margin,
   * which is exactly the "too much dead white space" complaint this also
   * answers. The wordmark sits near the top, independently sized, as the
   * actual title lockup. Falls back to plain styled text if either image
   * failed to load, rather than showing nothing.
   */
  private _buildTitle(): void {
    const hasArt =
      this.textures.exists(SPRITE_KEYS.titleFlourish) &&
      this.textures.exists(SPRITE_KEYS.titleWordmark);
    if (!hasArt) {
      this.add
        .text(
          GAME_WIDTH / 2,
          TITLE_CENTRE_Y + 10,
          "GRANNY'S SPIN SPLASH",
          textStyle('displayXL', COLOUR_HEX.grannyPink, COLOUR_HEX.ink),
        )
        .setOrigin(0.5);
      return;
    }

    const frame = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, SPRITE_KEYS.titleFlourish);
    frame.setScale(Math.max(GAME_WIDTH / frame.width, GAME_HEIGHT / frame.height));

    const wordmark = this.add.image(GAME_WIDTH / 2, TITLE_CENTRE_Y, SPRITE_KEYS.titleWordmark);
    wordmark.setScale(TITLE_WORDMARK_HEIGHT / wordmark.height);
  }

  private _buildVaultDisplay(): void {
    const y = VAULT_Y;
    const starGfx = this.add.graphics().setPosition(GAME_WIDTH / 2 - 70, y);
    drawStarIcon(starGfx, 14, COLOUR.sunnyGold);
    this._vaultText = this.add
      .text(GAME_WIDTH / 2 - 48, y, '', textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud))
      .setOrigin(0, 0.5);
    this._refreshVaultText();
  }

  private _refreshVaultText(): void {
    this._vaultText.setText(`${this._unlocks.getVault()} in the vault`);
  }

  /** CLAUDE.md §11.1/§11.3: rewarded button must never be Mint Green, must be visible alongside PLAY, one reward per ad. */
  private _buildRewardButton(): void {
    createButton(this, {
      x: GAME_WIDTH / 2,
      y: BOTTOM_ROW_Y,
      label: 'Watch an ad for a free gun',
      variant: 'secondary',
      minWidth: REWARD_BUTTON_MIN_WIDTH,
      showPlayIcon: true,
      // The only button in the game that keeps its hit zone at its drawn
      // size. PLAY sits directly above with an expanded (88px) zone, and an
      // expanded zone here would overlap it — and win, because this button is
      // added later. A child aiming at PLAY and landing low would get a
      // full-screen rewarded ad instead of a game (spec audit, 2026-09-12).
      expandHitArea: false,
      onClick: () => void this._onWatchAdForGun(),
    });
  }

  private async _onWatchAdForGun(): Promise<void> {
    const reward = this._unlocks.pickRandomLockedGun(REWARD_MAX_TIER);
    if (!reward) {
      showToast(this, GAME_WIDTH / 2, BOTTOM_ROW_Y - 50, 'All eligible guns already unlocked!');
      return;
    }

    const watched = await adManager.playRewarded('large', AD_MUTE_HOOKS);
    if (!watched) return;

    this._unlocks.grantGun(reward);
    this._gunSelector.setItems(this._gunItems());
    const unlockedName = GUN_DEFS.find((g) => g.id === reward)?.name ?? reward;
    showToast(this, GAME_WIDTH / 2, BOTTOM_ROW_Y - 50, `Unlocked ${unlockedName}!`);
  }

  /** CLAUDE.md §11.1: a commercial break shows before every *2nd* "Play Again" — AdManager tracks the cadence. */
  private async _onPlay(): Promise<void> {
    if (this._isStartingRun) return; // guards against a double-tap firing two commercial breaks
    this._isStartingRun = true;

    if (adManager.shouldShowCommercialBreak()) {
      await adManager.playCommercialBreak(AD_MUTE_HOOKS);
    }

    this.scene.start('GameScene', {
      grannyId: this._unlocks.getSelectedGrannyId(),
      gunId: this._unlocks.getSelectedGunId(),
      worldId: this._unlocks.getSelectedWorldId(),
    });
  }
}
