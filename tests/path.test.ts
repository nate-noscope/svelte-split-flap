import { describe, expect, it } from 'vitest';

import { DEFAULT_CHARSET } from '../src/lib/charset';
import { getPath, samplePath } from '../src/lib/path';

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const SMALL = ['A', 'B', 'C', 'D'];

function range(fromChar: string, toChar: string, charSet: readonly string[]): string[] {
	const start = charSet.indexOf(fromChar);
	const end = charSet.indexOf(toChar);
	return charSet.slice(start, end + 1);
}

describe('getPath (forward only)', () => {
	it('returns intermediate chars and the target without wrapping', () => {
		const path = getPath('B', 'M', ALPHA);
		expect(path).toEqual(range('C', 'M', ALPHA));
		expect(path).toHaveLength(11);
		expect(path[0]).toBe('C');
		expect(path.at(-1)).toBe('M');
	});

	it('wraps around the end of the charset', () => {
		expect(getPath('Z', 'B', ALPHA)).toEqual(['A', 'B']);
	});

	it('returns an empty path for the same character', () => {
		expect(getPath('A', 'A', ALPHA)).toEqual([]);
		expect(getPath('M', 'M', DEFAULT_CHARSET)).toEqual([]);
	});

	it('stays forward on a nearly full lap', () => {
		const path = getPath('A', 'Z', ALPHA);
		expect(path).toHaveLength(25);
		expect(path.at(-1)).toBe('Z');
		expect(getPath('Z', 'A', ALPHA)).toEqual(['A']);
	});

	it('continues through digits/punctuation of the default charset', () => {
		const path = getPath('Z', 'B', DEFAULT_CHARSET);
		expect(path.at(-1)).toBe('B');
		expect(path.length).toBeGreaterThan(3);
		expect(path).toContain('0');
	});

	it('throws when the from character is not in the charset', () => {
		expect(() => getPath('€', 'A', ALPHA)).toThrow(/"from"/);
	});

	it('throws when the to character is not in the charset', () => {
		expect(() => getPath('A', '€', ALPHA)).toThrow(/"to"/);
	});

	it('throws on an empty charset', () => {
		expect(() => getPath('A', 'B', [])).toThrow(/non-empty/);
	});

	it('always ends at the target, excludes the source, and steps adjacently', () => {
		for (const from of SMALL) {
			for (const to of SMALL) {
				const path = getPath(from, to, SMALL);
				const fromIndex = SMALL.indexOf(from);
				const toIndex = SMALL.indexOf(to);
				const expectedLength = (toIndex - fromIndex + SMALL.length) % SMALL.length;

				expect(path).toHaveLength(expectedLength);
				expect(path).not.toContain(from);

				if (from === to) {
					expect(path).toEqual([]);
					continue;
				}

				expect(path.at(-1)).toBe(to);

				let previousIndex = fromIndex;
				for (const char of path) {
					const index = SMALL.indexOf(char);
					expect(index).toBe((previousIndex + 1) % SMALL.length);
					previousIndex = index;
				}
			}
		}
	});
});

describe('samplePath', () => {
	it('returns the full path when it is already within the limit', () => {
		const path = getPath('A', 'D', SMALL);
		expect(samplePath(path, 10)).toEqual(path);
		expect(samplePath(path, 3)).toEqual(path);
	});

	it('returns the full path when the limit is below 1', () => {
		const path = getPath('A', 'D', SMALL);
		expect(samplePath(path, 0)).toEqual(path);
		expect(samplePath(path, -5)).toEqual(path);
	});

	it('caps the path to maxSteps and always ends at the target', () => {
		const path = getPath('A', 'Z', ALPHA); // 25 steps
		const sampled = samplePath(path, 5);
		expect(sampled).toHaveLength(5);
		expect(sampled.at(-1)).toBe('Z');
		expect(path).toContain(sampled[0]);
	});

	it('collapses to just the target for maxSteps = 1', () => {
		const path = getPath('A', 'Z', ALPHA);
		expect(samplePath(path, 1)).toEqual(['Z']);
	});

	it('handles empty paths', () => {
		expect(samplePath([], 5)).toEqual([]);
	});

	it('keeps strictly forward progress when sampling', () => {
		const path = getPath('A', 'Z', ALPHA);
		const sampled = samplePath(path, 7);
		let previous = -1;
		for (const char of sampled) {
			const index = path.indexOf(char);
			expect(index).toBeGreaterThan(previous);
			previous = index;
		}
	});
});
