import type { PresetId } from '../core/presets';
import type { Constraint, State } from '../core/types';

export type ItemId = 'item1' | 'item2' | 'item4';

export interface ItemRequestBase {
  requestId: string;
  preset: PresetId;
  seed: number;
  init: State;
  constraints: Constraint[];
}

export interface ItemResponseBase {
  requestId: string;
  itemId: ItemId;
}
