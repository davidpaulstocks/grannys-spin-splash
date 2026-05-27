/** AimResult + InputEvent union. CLAUDE.md §6, §7.2. */

export interface AimTarget {
  readonly id: number;
  readonly x: number;
  readonly y: number;
}

export interface AimResult {
  readonly x: number;
  readonly y: number;
  readonly target: AimTarget | null;
  readonly snapped: boolean;
}

export type InputEvent =
  | { readonly type: 'fire'; readonly x: number; readonly y: number }
  | { readonly type: 'aim'; readonly x: number; readonly y: number }
  | { readonly type: 'move'; readonly dir: -1 | 0 | 1 }
  | { readonly type: 'pause' };
