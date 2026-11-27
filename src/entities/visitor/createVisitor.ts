/** Builds the right kind of visitor for a def — the one place that knows which class is which. */

import type Phaser from 'phaser';

import { BalloonsVisitor } from './BalloonsVisitor';
import { BlockerVisitor, type BlockerSpec } from './BlockerVisitor';
import { ThiefVisitor, type ThiefSpec } from './ThiefVisitor';
import { TreatVisitor } from './TreatVisitor';
import type { Visitor, VisitorSpec } from './Visitor';
import type { VisitorDef } from './visitor.types';

/** A blocker's spec: what it covers and where. */
export type PlacedSpec =
  | { readonly kind: 'blocker'; readonly spec: BlockerSpec }
  | { readonly kind: 'sitter'; readonly spec: ThiefSpec }
  | { readonly kind: 'treat'; readonly spec: VisitorSpec };

/** Makes the visitor `placed` describes. */
export function createVisitor(scene: Phaser.Scene, placed: PlacedSpec): Visitor {
  switch (placed.kind) {
    case 'blocker':
      return isBalloons(placed.spec.def)
        ? new BalloonsVisitor(scene, placed.spec)
        : new BlockerVisitor(scene, placed.spec);
    case 'sitter':
      return new ThiefVisitor(scene, placed.spec);
    case 'treat':
      return new TreatVisitor(scene, placed.spec);
  }
}

function isBalloons(def: VisitorDef): boolean {
  return def.id === 'balloons';
}
