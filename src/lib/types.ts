export type Align = 'left' | 'right' | 'center';

export interface SplitFlapDisplayProps {
	text: string;
	length: number;
	align?: Align;
	charSet?: readonly string[];
	stepMs?: number;
	stagger?: number;
	/**
	 * Animate from blank on mount. Set to `false` for data-heavy boards where
	 * rendering the final text immediately is cheaper (updates still animate).
	 */
	intro?: boolean;
	/**
	 * Cap the number of intermediate characters cycled through per transition.
	 * Lower values are cheaper; `Infinity` (default) cycles every character.
	 */
	maxSteps?: number;
}

export interface FlipUnitProps {
	target: string;
	charSet: readonly string[];
	stepMs: number;
	delay: number;
	intro?: boolean;
	maxSteps?: number;
}
