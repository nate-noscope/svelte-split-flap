export type Align = 'left' | 'right' | 'center';

export interface SplitFlapDisplayProps {
	text: string;
	length: number;
	align?: Align;
	charSet?: readonly string[];
	stepMs?: number;
	stagger?: number;
}

export interface FlipUnitProps {
	target: string;
	charSet: readonly string[];
	stepMs: number;
	delay: number;
}

export interface FlipLeafProps {
	from: string;
	to: string;
	durationMs: number;
	onComplete: () => void;
}
