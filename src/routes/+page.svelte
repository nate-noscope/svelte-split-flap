<script lang="ts">
	import { DEFAULT_CHARSET, SplitFlapDisplay, type Align } from '$lib';

	const length = 12;

	let input = $state('hello world');
	let text = $state('HELLO WORLD');
	let align = $state<Align>('left');

	function normalize(value: string): string {
		return [...value.toUpperCase()].filter((char) => DEFAULT_CHARSET.includes(char)).join('');
	}

	function apply() {
		text = normalize(input);
	}
</script>

<main>
	<h1>svelte-split-flap</h1>
	<p>A split-flap (airport departure board) display for Svelte 5.</p>

	<div class="controls">
		<input
			aria-label="Text to display"
			bind:value={input}
			onkeydown={(event) => event.key === 'Enter' && apply()}
		/>
		<button type="button" onclick={apply}>Flip</button>
		<select aria-label="Alignment" bind:value={align}>
			<option value="left">left</option>
			<option value="center">center</option>
			<option value="right">right</option>
		</select>
	</div>

	<SplitFlapDisplay {text} {length} {align} />
</main>

<style>
	main {
		max-width: 48rem;
		margin: 0 auto;
		padding: 2rem 1rem;
	}
	.controls {
		display: flex;
		gap: 0.5rem;
		margin-block: 1rem;
	}
</style>
