import { describe, expect, it } from 'vitest';

import { DEFAULT_CHARSET, sanitizeText, validateText } from '../src/lib/charset';

describe('sanitizeText', () => {
	it('uppercases and keeps valid characters', () => {
		expect(sanitizeText('hello world')).toBe('HELLO WORLD');
	});

	it('replaces characters not in the charset with a space', () => {
		expect(sanitizeText('A(1)#B')).toBe('A 1  B');
	});

	it('allows a custom replacement', () => {
		expect(sanitizeText('A(1)', DEFAULT_CHARSET, '-')).toBe('A-1-');
	});

	it('produces text that passes validateText', () => {
		const input = 'Café (test) #1 — 20°';
		expect(() => validateText(sanitizeText(input))).not.toThrow();
	});
});
