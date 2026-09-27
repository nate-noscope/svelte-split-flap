import { afterEach, describe, expect, it } from 'vitest';

import { QUALITY_PROFILES, getQuality, setQuality } from '../src/lib/quality';
import { getConcurrencyLimit } from '../src/lib/scheduler';

afterEach(() => setQuality('medium'));

function enabledLayers(profile: (typeof QUALITY_PROFILES)['low']): number {
	return Object.values(profile.layers).filter(Boolean).length;
}

describe('quality profiles', () => {
	it('exposes a profile per level', () => {
		expect(Object.keys(QUALITY_PROFILES).sort()).toEqual(['high', 'low', 'medium']);
	});

	it('high has more layers than medium, and medium more than low', () => {
		expect(enabledLayers(QUALITY_PROFILES.high)).toBeGreaterThan(
			enabledLayers(QUALITY_PROFILES.medium)
		);
		expect(enabledLayers(QUALITY_PROFILES.medium)).toBeGreaterThan(
			enabledLayers(QUALITY_PROFILES.low)
		);
	});

	it('setQuality updates the level and the scheduler concurrency', () => {
		setQuality('low');
		expect(getQuality()).toBe('low');
		expect(getConcurrencyLimit()).toBe(QUALITY_PROFILES.low.concurrency);

		setQuality('high');
		expect(getQuality()).toBe('high');
		expect(getConcurrencyLimit()).toBe(QUALITY_PROFILES.high.concurrency);
	});
});
