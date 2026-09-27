import './styles.css';

export { default as SplitFlapDisplay } from './SplitFlapDisplay.svelte';
export { default } from './SplitFlapDisplay.svelte';
export { DEFAULT_CHARSET } from './charset.js';
export { getQuality, setQuality, quality, QUALITY_PROFILES } from './quality.js';
export type { QualityProfile } from './quality.js';
export type { Align, SplitFlapDisplayProps, Quality, QualityLayers } from './types.js';

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
 * Quality (visual layers) defaults to `auto`; change it globally with
 * `setQuality('low' | 'medium' | 'high')` or per board via the `quality` prop.
 * Style overrides go through the `--sf-*` custom properties (see styles.css).
 */
