import '@fontsource-variable/overpass-mono';
import './styles.css';

export { default as SplitFlapDisplay } from './SplitFlapDisplay.svelte';
export { default } from './SplitFlapDisplay.svelte';
export { DEFAULT_CHARSET } from './charset';
export type { Align, SplitFlapDisplayProps } from './types';

/**
 * Usage:
 *
 * ```svelte
 * <script lang="ts">
 * 	import { SplitFlapDisplay } from 'svelte-split-flap';
 *
 * 	let text = $state('HELLO');
 * </script>
 *
 * <SplitFlapDisplay {text} length={8} align="center" stepMs={70} stagger={35} />
 * ```
 *
 * `length` fixes the number of cells; `text` is padded or truncated to fit.
 * Style overrides go through the `--sf-*` custom properties (see styles.css).
 */
