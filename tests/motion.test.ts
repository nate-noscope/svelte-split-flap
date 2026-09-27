import { afterEach, describe, expect, it } from 'vitest';

import { prefersReducedMotion, staggerDelay } from '../src/lib/motion';

type MatchMedia = ((query: string) => { matches: boolean }) | undefined;

function setMatchMedia(value: MatchMedia) {
	Object.defineProperty(window, 'matchMedia', {
		configurable: true,
		writable: true,
		value
	});
}

afterEach(() => {
	setMatchMedia(undefined);
});

describe('prefersReducedMotion', () => {
	it('returns false when matchMedia is unavailable', () => {
		setMatchMedia(undefined);
		expect(prefersReducedMotion()).toBe(false);
	});

	it('reflects the operating system setting', () => {
		setMatchMedia((query) => ({ matches: query.includes('reduce') }));
		expect(prefersReducedMotion()).toBe(true);

		setMatchMedia(() => ({ matches: false }));
		expect(prefersReducedMotion()).toBe(false);
	});
});

describe('staggerDelay', () => {
	it('multiplies the index by the stagger', () => {
		expect(staggerDelay(0, 40)).toBe(0);
		expect(staggerDelay(3, 40)).toBe(120);
	});
});
