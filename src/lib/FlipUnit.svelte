<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import FlipLeaf from './FlipLeaf.svelte';
	import { getPath } from './path.js';
	import { prefersReducedMotion } from './motion.js';
	import type { FlipUnitProps } from './types.js';

	let { target, charSet, stepMs, delay }: FlipUnitProps = $props();

	const blank = untrack(() => (charSet.includes(' ') ? ' ' : charSet[0]));
	let displayed = $state(blank);
	let leaf = $state<{ from: string; to: string } | null>(null);

	let queue: string[] = [];
	let startTimer: ReturnType<typeof setTimeout> | undefined;

	function clearStartTimer() {
		if (startTimer !== undefined) {
			clearTimeout(startTimer);
			startTimer = undefined;
		}
	}

	function startNextStep() {
		if (leaf || queue.length === 0) return;

		const next = queue.shift();
		if (next === undefined) return;

		leaf = { from: displayed, to: next };
	}

	function beginQueue(from: string, to: string, respectDelay: boolean) {
		queue = getPath(from, to, charSet);
		if (queue.length === 0) return;

		if (respectDelay && delay > 0) {
			clearStartTimer();
			startTimer = setTimeout(startNextStep, delay);
		} else {
			startNextStep();
		}
	}

	function handleStepComplete() {
		if (!leaf) return;

		if (prefersReducedMotion()) {
			displayed = target;
			queue = [];
			leaf = null;
			return;
		}

		displayed = leaf.to;
		leaf = null;
		startNextStep();
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
			clearStartTimer();
			queue = [];
			leaf = null;
			displayed = next;
			return;
		}

		beginQueue(from, next, !busy);
	});

	onDestroy(clearStartTimer);
</script>

<div class="sf-unit" aria-hidden="true">
	{#if leaf}
		{#key leaf}
			<FlipLeaf from={leaf.from} to={leaf.to} durationMs={stepMs} onComplete={handleStepComplete} />
		{/key}
	{:else}
		<div class="sf-half sf-half--top">
			<span class="sf-char">{displayed}</span>
		</div>
		<div class="sf-half sf-half--bottom">
			<span class="sf-char">{displayed}</span>
		</div>
	{/if}
</div>
