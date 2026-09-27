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
	 * Builds the whole transition as Web Animations, per cell. Four strips carry
	 * the character sequence (advanced one character per step) while two flaps
	 * rotate about the hinge, exactly like the classic split-flap:
	 *  - top flap falls 0deg -> 90deg, revealing the next character's top;
	 *  - bottom flap rises -90deg -> 0deg, covering the previous bottom.
	 * No per-step JS.
	 */
	function flip(node: HTMLElement, params: FlipParams) {
		const topFront = node.querySelector<HTMLElement>('.sf-half--top > .sf-flap .sf-drum');
		const topBehind = node.querySelector<HTMLElement>('.sf-half--top > .sf-drum');
		const topFlap = node.querySelector<HTMLElement>('.sf-half--top > .sf-flap');
		const bottomFront = node.querySelector<HTMLElement>('.sf-half--bottom > .sf-flap .sf-drum');
		const bottomBehind = node.querySelector<HTMLElement>('.sf-half--bottom > .sf-drum');
		const bottomFlap = node.querySelector<HTMLElement>('.sf-half--bottom > .sf-flap');

		if (!topFlap || typeof topFlap.animate !== 'function') {
			return { destroy() {} };
		}

		const height = node.getBoundingClientRect().height;
		const { steps, duration } = params;
		const epsilon = 1e-4;
		const shadowMax =
			parseFloat(getComputedStyle(node).getPropertyValue('--sf-shadow-max')) || 0.62;

		const animations: Animation[] = [];
		const run = (el: HTMLElement | null, keyframes: Keyframe[]) => {
			if (el) animations.push(el.animate(keyframes, { duration, fill: 'forwards' }));
		};

		// Strip translation: during step i show character (i + lead).
		const strip = (lead: number): Keyframe[] => {
			const keyframes: Keyframe[] = [];
			for (let i = 0; i < steps; i++) {
				keyframes.push({
					offset: i / steps,
					transform: `translateY(${-(i + lead) * height}px)`,
					easing: 'steps(1, end)'
				});
			}
			keyframes.push({ offset: 1, transform: `translateY(${-steps * height}px)` });
			return keyframes;
		};

		// Top flap: fall 0deg -> 90deg over the first half of each step, hold, snap.
		const fall: Keyframe[] = [{ offset: 0, transform: 'rotateX(0deg)', easing: 'linear' }];
		// Bottom flap: hidden (-90deg) for the first half, rise to 0deg over the
		// second half, then snap back for the next step.
		const rise: Keyframe[] = [{ offset: 0, transform: 'rotateX(-90deg)', easing: 'steps(1, end)' }];

		for (let i = 0; i < steps; i++) {
			fall.push({
				offset: (i + 0.5) / steps,
				transform: 'rotateX(90deg)',
				easing: 'steps(1, end)'
			});
			fall.push({ offset: (i + 1) / steps, transform: 'rotateX(0deg)' });

			rise.push({ offset: (i + 0.5) / steps, transform: 'rotateX(-90deg)' });
			if (i < steps - 1) {
				rise.push({ offset: (i + 1) / steps - epsilon, transform: 'rotateX(0deg)' });
				rise.push({
					offset: (i + 1) / steps,
					transform: 'rotateX(-90deg)',
					easing: 'steps(1, end)'
				});
			} else {
				rise.push({ offset: 1, transform: 'rotateX(0deg)' });
			}
		}

		const shade: Keyframe[] = [];
		for (let i = 0; i < steps; i++) {
			shade.push({ offset: i / steps, opacity: 0 });
			shade.push({ offset: (i + 0.5) / steps, opacity: shadowMax });
			shade.push({ offset: (i + 1) / steps, opacity: 0 });
		}

		run(topFront, strip(0));
		run(topBehind, strip(1));
		run(bottomBehind, strip(0));
		run(bottomFront, strip(1));
		run(topFlap, fall);
		run(bottomFlap, rise);

		for (const shadeEl of node.querySelectorAll<HTMLElement>('.sf-flip-shade')) {
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
				<div class="sf-half sf-half--top">
					<div class="sf-drum">
						{#each drum.strip as char, index (index)}
							<span class="sf-drum-char">{char}</span>
						{/each}
					</div>
					<div class="sf-flap sf-flap--top">
						<div class="sf-drum">
							{#each drum.strip as char, index (index)}
								<span class="sf-drum-char">{char}</span>
							{/each}
						</div>
						<span class="sf-flip-shade"></span>
					</div>
				</div>
				<div class="sf-half sf-half--bottom">
					<div class="sf-drum">
						{#each drum.strip as char, index (index)}
							<span class="sf-drum-char">{char}</span>
						{/each}
					</div>
					<div class="sf-flap sf-flap--bottom">
						<div class="sf-drum">
							{#each drum.strip as char, index (index)}
								<span class="sf-drum-char">{char}</span>
							{/each}
						</div>
						<span class="sf-flip-shade"></span>
					</div>
				</div>
			</div>
		{/key}
	{:else}
		<span class="sf-char">{displayed}</span>
	{/if}
</div>
