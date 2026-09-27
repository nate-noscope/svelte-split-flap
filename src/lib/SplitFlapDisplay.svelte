<script lang="ts">
	import { onMount } from 'svelte';
	import FlipUnit from './FlipUnit.svelte';
	import { DEFAULT_CHARSET, validateText } from './charset.js';
	import { staggerDelay } from './motion.js';
	import { QUALITY_PROFILES, probeQuality, quality as qualityStore } from './quality.js';
	import type { Align, SplitFlapDisplayProps } from './types.js';

	let {
		text,
		length,
		align = 'left',
		charSet = DEFAULT_CHARSET,
		stepMs = 80,
		stagger = 40,
		intro = true,
		maxSteps,
		quality = 'auto'
	}: SplitFlapDisplayProps = $props();

	const level = $derived(quality === 'auto' ? $qualityStore : quality);
	const profile = $derived(QUALITY_PROFILES[level]);
	const steps = $derived(maxSteps ?? profile.maxSteps);

	onMount(() => probeQuality());

	function pad(value: string, size: number, alignment: Align): string {
		const target = Math.max(0, Math.floor(size));
		const chars = [...value];

		if (chars.length >= target) {
			return chars.slice(0, target).join('');
		}

		const padding = target - chars.length;
		const left =
			alignment === 'right' ? padding : alignment === 'center' ? Math.floor(padding / 2) : 0;
		const right = padding - left;

		return ' '.repeat(left) + chars.join('') + ' '.repeat(right);
	}

	const padded = $derived.by(() => {
		const result = pad(text, length, align);
		validateText(result, charSet);
		return result;
	});

	const chars = $derived([...padded]);
</script>

<div class="sf-display" class:sf-flat={!profile.layers.perspective}>
	<div class="sf-row" aria-hidden="true">
		{#each chars as char, index (index)}
			<FlipUnit
				{charSet}
				{stepMs}
				{intro}
				maxSteps={steps}
				layers={profile.layers}
				target={char}
				delay={staggerDelay(index, stagger)}
			/>
		{/each}
	</div>
	<span class="sf-sr-only">{text}</span>
</div>
