import { render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';

import SplitFlapDisplay from '../src/lib/SplitFlapDisplay.svelte';

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

describe('SplitFlapDisplay', () => {
	it('renders a fixed number of cells regardless of text length', () => {
		const { container } = render(SplitFlapDisplay, { text: 'HI', length: 6 });
		expect(container.querySelectorAll('.sf-unit')).toHaveLength(6);
	});

	it('exposes the final text to screen readers and hides the animated row', () => {
		const { container } = render(SplitFlapDisplay, { text: 'HELLO', length: 8 });
		expect(container.querySelector('.sf-sr-only')?.textContent).toBe('HELLO');
		expect(container.querySelector('.sf-row')?.getAttribute('aria-hidden')).toBe('true');
	});

	it('snaps straight to the final text when reduced motion is requested', () => {
		setMatchMedia((query) => ({ matches: query.includes('reduce') }));
		const { container } = render(SplitFlapDisplay, { text: 'GO', length: 4 });
		flushSync();

		const chars = [...container.querySelectorAll('.sf-char')].map((el) => el.textContent);
		expect(chars).toEqual(['G', 'O', ' ', ' ']);
	});
});
