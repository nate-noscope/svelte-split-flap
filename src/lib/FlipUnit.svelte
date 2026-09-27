<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import FlipLeaf from './FlipLeaf.svelte';
	import { getPath, samplePath } from './path.js';
	import { prefersReducedMotion } from './motion.js';
	import { requestSlot } from './scheduler.js';
	import type { FlipUnitProps } from './types.js';

	let {
		target,
		charSet,
		stepMs,
		delay,
		intro = true,
		maxSteps = Infinity
	}: FlipUnitProps = $props();

	const blank = untrack(() => (charSet.includes(' ') ? ' ' : charSet[0]));
	let displayed = $state(untrack(() => (intro ? blank : target)));
	let leaf = $state<{ from: string; to: string } | null>(null);
	let animating = $state(false);

	let queue: string[] = [];
	let startTimer: ReturnType<typeof setTimeout> | undefined;
	// Held for the whole queue so only `limit` cells have a FlipLeaf mounted at once.
	let queueRelease: (() => void) | null = null;
	let acquiring = false;
	let disposed = false;

	function clearStartTimer() {
		if (startTimer !== undefined) {
			clearTimeout(startTimer);
			startTimer = undefined;
		}
	}

	function releaseQueue() {
		const release = queueRelease;
		queueRelease = null;
		if (release) release();
	}

	function settle(value: string) {
		queue = [];
		animating = false;
		clearStartTimer();
		releaseQueue();
		leaf = null;
		displayed = value;
	}

	async function startNextStep() {
		if (animating || acquiring || queue.length === 0) return;

		const next = queue.shift();
		if (next === undefined) return;

		if (!queueRelease) {
			acquiring = true;
			const release = await requestSlot();
			acquiring = false;

			if (disposed || prefersReducedMotion()) {
				release();
				if (!disposed) settle(target);
				return;
			}

			queueRelease = release;
		}

		animating = true;
		leaf = { from: displayed, to: next };
	}

	function beginQueue(from: string, to: string, respectDelay: boolean) {
		queue = samplePath(getPath(from, to, charSet), maxSteps);
		if (queue.length === 0) {
			releaseQueue();
			return;
		}

		if (respectDelay && delay > 0) {
			clearStartTimer();
			startTimer = setTimeout(() => void startNextStep(), delay);
		} else {
			void startNextStep();
		}
	}

	function handleStepComplete() {
		animating = false;

		if (!leaf) return;

		if (prefersReducedMotion()) {
			settle(target);
			return;
		}

		displayed = leaf.to;

		if (queue.length > 0) {
			void startNextStep();
		} else {
			leaf = null;
			releaseQueue();
		}
	}

	$effect(() => {
		const next = target;
		const { from, busy } = untrack(() => ({
			from: leaf ? leaf.to : displayed,
			busy: leaf !== null
		}));

		if (next === from) {
			queue = [];
			clearStartTimer();
			return;
		}

		if (prefersReducedMotion()) {
			settle(next);
			return;
		}

		beginQueue(from, next, !busy);
	});

	onDestroy(() => {
		disposed = true;
		clearStartTimer();
		releaseQueue();
	});
</script>

<div class="sf-unit" aria-hidden="true">
	{#if leaf}
		<FlipLeaf from={leaf.from} to={leaf.to} durationMs={stepMs} onComplete={handleStepComplete} />
	{:else}
		<div class="sf-half sf-half--top">
			<span class="sf-char">{displayed}</span>
		</div>
		<div class="sf-half sf-half--bottom">
			<span class="sf-char">{displayed}</span>
		</div>
	{/if}
</div>
