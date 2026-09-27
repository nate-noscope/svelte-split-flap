export type Align = 'left' | 'right' | 'center';

/** Rendering quality. `auto` resolves from device hints (see quality.ts). */
export type Quality = 'low' | 'medium' | 'high';

/** Which visual layers of the flip a cell renders. */
export interface QualityLayers {
	/** The top half rotates down (the falling flap). */
	topFlap: boolean;
	/** Reveal layer behind the top flap (the next character's top). */
	topReveal: boolean;
	/** The bottom half rotates in (the rising flap). */
	bottomFlap: boolean;
	/** Cover layer behind the bottom flap (the previous character's bottom). */
	bottomReveal: boolean;
	/** Depth shadow that pulses as the flaps turn. */
	shade: boolean;
	/** Specular highlight on the flaps (extra layer). */
	highlight: boolean;
	/** 3D perspective on the flaps. */
	perspective: boolean;
}

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
	 * Lower values are cheaper; defaults to the active quality profile's value.
	 */
	maxSteps?: number;
	/** Visual quality. `auto` (default) uses the globally detected level. */
	quality?: 'auto' | Quality;
}

export interface FlipUnitProps {
	target: string;
	charSet: readonly string[];
	stepMs: number;
	delay: number;
	intro?: boolean;
	maxSteps?: number;
	layers: QualityLayers;
}
