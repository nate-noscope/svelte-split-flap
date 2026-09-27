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

	type FlipParams = { steps: number; duration: number; onfinish: () => void };

	const blank = untrack(() => (charSet.includes(' ') ? ' ' : charSet[0]));
	let displayed = $state(untrack(() => (intro ? blank : target)));
	let drum = $state<Drum | null>(null);

	let startTimer: ReturnType<typeof setTimeout> | undefined;
	let slotRelease: (() => void) | null = null;
	let acquiring = false;
	let disposed = false;
	let drumId = 0;

	/**
	 * Builds the whole transition as Web Animations:
	 *  - the drum jumps one character at a time (`steps(1)` easing)
	 *  - a shadow pulses at each jump, faking the flap passing the hinge
	 */
	function flip(node: HTMLElement, params: FlipParams) {
		const drumEl = node.querySelector<HTMLElement>('.sf-drum');
		const shadeEl = node.querySelector<HTMLElement>('.sf-flip-shade');

		if (!drumEl || typeof drumEl.animate !== 'function') {
			return { destroy() {} };
		}

		const height = node.getBoundingClientRect().height;
		const { steps, duration } = params;

		const scroll: Keyframe[] = [];
		for (let i = 0; i <= steps; i++) {
			scroll.push({
				offset: i / steps,
				transform: `translateY(${-i * height}px)`,
				easing: i < steps ? 'steps(1, end)' : 'linear'
			});
		}

		const shade: Keyframe[] = [];
		for (let i = 0; i < steps; i++) {
			shade.push({ offset: i / steps, opacity: 0 });
			shade.push({ offset: (i + 0.5) / steps, opacity: 0.5 });
		}
		shade.push({ offset: 1, opacity: 0 });

		const animations: Animation[] = [drumEl.animate(scroll, { duration, fill: 'forwards' })];
		if (shadeEl) {
			animations.push(shadeEl.animate(shade, { duration, fill: 'forwards' }));
		}

		const primary = animations[0];
		primary.onfinish = () => params.onfinish();

		return {
			destroy() {
				for (const animation of animations) {
					animation.onfinish = null;
					animation.cancel();
				}
			}
		};
	}

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

	function handleDrumEnd() {
		if (!drum) return;

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
				class="sf-unit-anim"
				use:flip={{ steps: drum.steps, duration: drum.duration, onfinish: handleDrumEnd }}
			>
				<div class="sf-drum">
					{#each drum.strip as char, index (index)}
						<span class="sf-drum-char">{char}</span>
					{/each}
				</div>
				<span class="sf-flip-shade"></span>
			</div>
		{/key}
	{:else}
		<span class="sf-char">{displayed}</span>
	{/if}
</div>
