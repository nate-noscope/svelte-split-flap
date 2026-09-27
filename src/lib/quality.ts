import { get, writable, type Readable } from 'svelte/store';
import { setConcurrencyLimit } from './scheduler.js';
import type { Quality, QualityLayers } from './types.js';

export interface QualityProfile {
	layers: QualityLayers;
	/** Cells allowed to flip at once. */
	concurrency: number;
	/** Default number of intermediate characters per transition. */
	maxSteps: number;
}

export const QUALITY_PROFILES: Record<Quality, QualityProfile> = {
	low: {
		layers: {
			topFlap: true,
			topReveal: true,
			bottomFlap: false,
			bottomReveal: false,
			shade: false,
			highlight: false,
			perspective: false
		},
		concurrency: 8,
		maxSteps: 3
	},
	medium: {
		layers: {
			topFlap: true,
			topReveal: true,
			bottomFlap: true,
			bottomReveal: true,
			shade: false,
			highlight: false,
			perspective: true
		},
		concurrency: 24,
		maxSteps: 6
	},
	high: {
		layers: {
			topFlap: true,
			topReveal: true,
			bottomFlap: true,
			bottomReveal: true,
			shade: true,
			highlight: true,
			perspective: true
		},
		concurrency: 48,
		maxSteps: 12
	}
};

function isQuality(value: unknown): value is Quality {
	return value === 'low' || value === 'medium' || value === 'high';
}

function detect(): Quality {
	if (typeof navigator === 'undefined') return 'medium';

	if (
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	) {
		return 'low';
	}

	const cores = navigator.hardwareConcurrency ?? 4;
	const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;

	let score = 0;
	if (cores >= 8) score += 2;
	else if (cores >= 4) score += 1;

	if (memory !== undefined) {
		if (memory >= 8) score += 2;
		else if (memory >= 4) score += 1;
	}

	if (score >= 3) return 'high';
	if (score >= 1) return 'medium';
	return 'low';
}

function initial(): Quality {
	if (typeof location !== 'undefined') {
		const fromQuery = new URLSearchParams(location.search).get('sfQuality');
		if (isQuality(fromQuery)) return fromQuery;
	}

	if (typeof document !== 'undefined') {
		const fromAttribute = document.documentElement.getAttribute('data-sf-quality');
		if (isQuality(fromAttribute)) return fromAttribute;
	}

	return detect();
}

const internal = writable<Quality>(initial());

/** Reactive quality level; subscribe with `$quality` in Svelte. */
export const quality: Readable<Quality> = { subscribe: internal.subscribe };

function apply(next: Quality): void {
	internal.set(next);
	setConcurrencyLimit(QUALITY_PROFILES[next].concurrency);
}

/** The globally active quality level. */
export function getQuality(): Quality {
	return get(internal);
}

/** Globally change the quality of every board (call this from your own switcher). */
export function setQuality(next: Quality): void {
	if (isQuality(next)) apply(next);
}

// Seed the scheduler's concurrency from the initial level.
setConcurrencyLimit(QUALITY_PROFILES[get(internal)].concurrency);

let probed = false;

/**
 * One-shot frame-rate probe. Runs ~40 frames after the first board mounts and
 * downgrades one level if the device is clearly struggling. Safe to call often;
 * it only runs once.
 */
export function probeQuality(): void {
	if (probed || typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') {
		return;
	}
	probed = true;

	const samples: number[] = [];
	let last = performance.now();

	const tick = (now: number) => {
		samples.push(now - last);
		last = now;

		if (samples.length < 40) {
			requestAnimationFrame(tick);
			return;
		}

		const sorted = [...samples].sort((a, b) => a - b);
		const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 16;

		if (p95 > 30) {
			const current = getQuality();
			if (current === 'high') setQuality('medium');
			else if (current === 'medium') setQuality('low');
		}
	};

	requestAnimationFrame(tick);
}
