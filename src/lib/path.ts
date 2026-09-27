export function getPath(from: string, to: string, charSet: readonly string[]): string[] {
	const size = charSet.length;

	if (size === 0) {
		throw new Error('SplitFlap: getPath requires a non-empty charset.');
	}

	const fromIndex = charSet.indexOf(from);
	if (fromIndex === -1) {
		throw new Error(
			`SplitFlap: getPath received a "from" character not present in the charset: ${JSON.stringify(from)}.`
		);
	}

	const toIndex = charSet.indexOf(to);
	if (toIndex === -1) {
		throw new Error(
			`SplitFlap: getPath received a "to" character not present in the charset: ${JSON.stringify(to)}.`
		);
	}

	const path: string[] = [];
	let index = fromIndex;

	while (index !== toIndex) {
		index = (index + 1) % size;
		path.push(charSet[index]);
	}

	return path;
}

/**
 * Reduce a path to at most `maxSteps` entries by sampling it evenly, always
 * keeping the final (target) character. A `maxSteps` below 1 means "no limit".
 */
export function samplePath(path: readonly string[], maxSteps: number): string[] {
	if (maxSteps < 1 || path.length <= maxSteps) {
		return [...path];
	}

	if (maxSteps === 1) {
		return [path[path.length - 1]];
	}

	const last = path.length - 1;
	const sampled: string[] = [];

	for (let i = 0; i < maxSteps; i++) {
		sampled.push(path[Math.round((i * last) / (maxSteps - 1))]);
	}

	return sampled;
}
