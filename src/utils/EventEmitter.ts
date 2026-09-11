/**
 * Minimal dependency-free pub/sub emitter. The one non-pure-function
 * export in utils/ — justified because Systems/ must stay unit-testable
 * without booting the full Phaser engine (CLAUDE.md §7.3 rule 10): importing
 * `Phaser.Events.EventEmitter` pulls in canvas feature-detection side
 * effects that jsdom can't satisfy. API shape mirrors Phaser's emitter
 * (`on`/`off`/`emit`) so call sites read the same either way.
 */

type Listener = (...args: never[]) => void;

export class EventEmitter {
  private readonly _listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): this {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event)?.add(listener);
    return this;
  }

  off(event: string, listener: Listener): this {
    this._listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: string, ...args: never[]): void {
    for (const listener of this._listeners.get(event) ?? []) listener(...args);
  }

  removeAllListeners(): void {
    this._listeners.clear();
  }
}
