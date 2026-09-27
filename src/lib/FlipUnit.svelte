<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
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

	type Drum = {
		id: number;
		to: string;
		steps: number;
		duration: number;
		strip: string[];
	};

	const blank = untrack(() => (charSet.includes(' ') ? ' ' : charSet[0]));
	let displayed = $state(untrack(() => (intro ? blank : target)));
	let drum = $state<Drum | null>(null);

	let startTimer: ReturnType<typeof setTimeout> | undefined;
	let slotRelease: (() => void) | null = null;
	let acquiring = false;
	let disposed = false;
	let drumId = 0;

	function clearStartTimer() {
		if (startTimer !== undefined) {
			clearTimeout(startTimer);
			startTimer = undefined;
		}
	}

	function releaseSlot() {
		const release = slotRelease;
		slotRelease = null;
		if (release) release();
	}

	function settle(value: string) {
		clearStartTimer();
		releaseSlot();
		drum = null;
		displayed = value;
	}

	async function startNext() {
		if (disposed || acquiring || drum) return;

		const from = displayed;
		const to = target;
		if (from === to) return;

		const path = samplePath(getPath(from, to, charSet), maxSteps);
		if (path.length === 0) {
			displayed = to;
			return;
		}

		acquiring = true;
		const release = await requestSlot();
		acquiring = false;

		if (disposed || prefersReducedMotion()) {
			release();
			if (!disposed) displayed = target;
			return;
		}

		// Something changed while we waited for a slot — recompute from fresh state.
		if (displayed !== from || target !== to) {
			release();
			void startNext();
			return;
		}

		slotRelease = release;
		drumId += 1;
		drum = {
			id: drumId,
			to,
			steps: path.length,
			duration: Math.max(1, path.length * stepMs),
			strip: [from, ...path]
		};
	}

	function scheduleStart(withDelay: boolean) {
		if (withDelay && delay > 0) {
			clearStartTimer();
			startTimer = setTimeout(() => void startNext(), delay);
		} else {
			void startNext();
		}
	}

	function handleDrumEnd(event: AnimationEvent) {
		if (event.animationName !== 'sf-drum-scroll' || !drum) return;

		displayed = drum.to;
		drum = null;
		releaseSlot();

		if (!disposed && displayed !== target) {
			void startNext();
		}
	}

	$effect(() => {
		const next = target;

		untrack(() => {
			const current = drum ? drum.to : displayed;
			if (next === current) return;

			if (prefersReducedMotion()) {
				settle(next);
				return;
			}

			scheduleStart(!drum);
		});
	});

	onDestroy(() => {
		disposed = true;
		clearStartTimer();
		releaseSlot();
	});
</script>

<div class="sf-unit" aria-hidden="true">
	{#if drum}
		{#key drum.id}
			<div
				class="sf-drum"
				onanimationend={handleDrumEnd}
				style="--sf-drum-steps: {drum.steps}; --sf-drum-duration: {drum.duration}ms;"
			>
				{#each drum.strip as char, index (index)}
					<span class="sf-drum-char">{char}</span>
				{/each}
			</div>
		{/key}
	{:else}
		<span class="sf-char">{displayed}</span>
	{/if}
</div>
