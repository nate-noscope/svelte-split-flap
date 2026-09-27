export const DEFAULT_CHARSET: readonly string[] = [
	' ',
	...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
	...'0123456789',
	...".,!?:'-/&"
];

export function validateText(text: string, charSet: readonly string[] = DEFAULT_CHARSET): void {
	const allowed = new Set(charSet);
	const invalid = [...new Set([...text].filter((char) => !allowed.has(char)))];

	if (invalid.length > 0) {
		const list = invalid.map((char) => JSON.stringify(char)).join(', ');
		throw new Error(
			`SplitFlap: text contains character(s) not present in the charset: ${list}. ` +
				'Add them to the charSet or remove them from the text.'
		);
	}
}

/**
 * Uppercase `text` and replace any character not present in `charSet` with
 * `replacement`, so it can be shown without `validateText` throwing.
 */
export function sanitizeText(
	text: string,
	charSet: readonly string[] = DEFAULT_CHARSET,
	replacement = ' '
): string {
	const allowed = new Set(charSet);
	return [...text.toUpperCase()].map((char) => (allowed.has(char) ? char : replacement)).join('');
}
