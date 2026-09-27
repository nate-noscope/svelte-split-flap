<script lang="ts">
	import FlipUnit from './FlipUnit.svelte';
	import { DEFAULT_CHARSET, validateText } from './charset.js';
	import { staggerDelay } from './motion.js';
	import type { Align, SplitFlapDisplayProps } from './types.js';

	let {
		text,
		length,
		align = 'left',
		charSet = DEFAULT_CHARSET,
		stepMs = 80,
		stagger = 40,
		intro = true,
		maxSteps = Infinity
	}: SplitFlapDisplayProps = $props();

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

<div class="sf-display">
	<div class="sf-row" aria-hidden="true">
		{#each chars as char, index (index)}
			<FlipUnit
				{charSet}
				{stepMs}
				{intro}
				{maxSteps}
				target={char}
				delay={staggerDelay(index, stagger)}
			/>
		{/each}
	</div>
	<span class="sf-sr-only">{text}</span>
</div>
