/**
 * A tiny global concurrency limiter shared by every flip cell on the page.
 *
 * A board can have hundreds of cells; without a limit they all animate at once
 * and saturate low-end devices. Cells acquire a slot before each character step
 * and release it when that step finishes, so the cascade runs in bounded waves.
 */

function defaultLimit(): number {
	if (typeof navigator === 'undefined') return 8;
	const cores = navigator.hardwareConcurrency ?? 4;
	return Math.max(8, Math.min(32, cores * 4));
}

let limit = defaultLimit();
let active = 0;
const waiting: Array<() => void> = [];

export function setConcurrencyLimit(next: number): void {
	if (!Number.isFinite(next) || next < 1) return;

	limit = Math.floor(next);

	while (active < limit && waiting.length > 0) {
		const next = waiting.shift();
		if (next) next();
	}
}

export function getConcurrencyLimit(): number {
	return limit;
}

/** Resolves with a release function once a slot is free. */
export function requestSlot(): Promise<() => void> {
	return new Promise((resolve) => {
		const grant = () => {
			active += 1;
			let released = false;

			resolve(() => {
				if (released) return;
				released = true;
				active -= 1;

				const next = waiting.shift();
				if (next) next();
			});
		};

		if (active < limit) {
			grant();
		} else {
			waiting.push(grant);
		}
	});
}
