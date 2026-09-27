<script lang="ts">
	import type { FlipLeafProps } from './types.js';

	let { from, to, durationMs, onComplete }: FlipLeafProps = $props();

	let root: HTMLDivElement | undefined;

	const frontDuration = $derived(durationMs / 2);
	const backDuration = $derived(durationMs / 2);
	const backDelay = $derived(durationMs / 2);

	function restart() {
		if (!root || typeof root.getAnimations !== 'function') return;
		for (const animation of root.getAnimations({ subtree: true })) {
			animation.currentTime = 0;
			animation.play();
		}
	}

	// This component is reused across a cell's steps, so restart the CSS
	// animations whenever the characters change instead of remounting.
	$effect(() => {
		void from;
		void to;
		restart();
	});

	function handleAnimationEnd(event: AnimationEvent) {
		if (event.animationName === 'sf-back-fall') {
			onComplete();
		}
	}
</script>

<div
	bind:this={root}
	class="sf-leaf"
	aria-hidden="true"
	style="--sf-front-duration: {frontDuration}ms; --sf-back-duration: {backDuration}ms; --sf-back-delay: {backDelay}ms;"
>
	<div class="sf-half sf-half--top">
		<span class="sf-char">{to}</span>
	</div>
	<div class="sf-half sf-half--bottom">
		<span class="sf-char">{from}</span>
	</div>

	<div class="sf-leaf-front">
		<span class="sf-char">{from}</span>
		<span class="sf-shade sf-shade--front"></span>
	</div>

	<div class="sf-leaf-back" onanimationend={handleAnimationEnd}>
		<span class="sf-char">{to}</span>
		<span class="sf-shade sf-shade--back"></span>
	</div>
</div>
