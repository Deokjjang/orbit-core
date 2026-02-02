import { describe, it, expect } from 'vitest';
import { PRESETS, assertPreset } from '../src/core/presets';
import type { PresetId } from '../src/core/presets';

describe('presets guardrails', () => {
  it('all presets satisfy SSOT floors', () => {
    for (const k of Object.keys(PRESETS) as Array<keyof typeof PRESETS>) {
      expect(() => assertPreset(PRESETS[k])).not.toThrow();
    }
  });
});
