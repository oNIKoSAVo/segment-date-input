declare module "solid-js" {
	namespace JSX {
		interface IntrinsicElements {
			"segment-date-input": {
				value?: string;
				min?: string;
				max?: string;
				disabled?: boolean;
				placeholder?: string;
				title?: string;
				ref?: HTMLElement | ((el: HTMLElement) => void);
				onInput?: (e: CustomEvent<{ value: string }>) => void;
				onChange?: (e: CustomEvent<{ value: string }>) => void;
				onFocus?: (e: FocusEvent) => void;
				onBlur?: (e: FocusEvent) => void;
				onKeyDown?: (e: KeyboardEvent) => void;
				onClick?: (e: MouseEvent) => void;
				onMouseDown?: (e: MouseEvent) => void;
				onPaste?: (e: ClipboardEvent) => void;
				class?: string;
				classList?: Record<string, boolean>;
				style?: string | Record<string, string>;
			};
		}
	}
}

export {};