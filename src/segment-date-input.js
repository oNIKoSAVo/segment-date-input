const SEGMENT_ORDER = ["day", "month", "year"];

class SegmentDateInput extends HTMLElement {
	static get observedAttributes() {
		return ["value", "min", "max", "disabled", "placeholder", "title"];
	}

	constructor() {
		super();

		this.attachShadow({mode: "open"});

		this._draft = {day: "", month: "", year: ""};
		this._touched = {day: false, month: false, year: false};
		this._activeSegment = "day";
		this._replaceOnNextDigit = false;
		this._inFocus = false;
		this._pendingFocusSegment = null;

		this._ranges = {
			day: [0, 2],
			month: [3, 5],
			year: [6, 10],
		};

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: inline-block;
					width: 100%;
					box-sizing: border-box;
				}

				.wrap {
					width: 100%;
					box-sizing: border-box;
				}

				input {
					box-sizing: border-box;
					width: 100%;
					font: inherit;
					line-height: normal;
					color: inherit;
					background: transparent;
					border: none;
					border-radius: 0;
					padding: 0;
					margin: 0;
					outline: none;
					cursor: default;
					caret-color: transparent;
					-webkit-appearance: none;
					appearance: none;
					box-shadow: none;
				}

				input:focus {
					outline: none;
					border: none;
					box-shadow: none;
				}

				input:disabled {
					cursor: not-allowed;
					opacity: 1;
					background: transparent;
				}
			</style>
			<div class="wrap">
				<input type="text" part="input-date" inputmode="numeric" autocomplete="off" spellcheck="false" />
			</div>
		`;

		this._input = this.shadowRoot.querySelector("input");

		this._onFocus = this._onFocus.bind(this);
		this._onBlur = this._onBlur.bind(this);
		this._onKeyDown = this._onKeyDown.bind(this);
		this._onMouseDown = this._onMouseDown.bind(this);
		this._onClick = this._onClick.bind(this);
		this._onPaste = this._onPaste.bind(this);
		this._onInput = this._onInput.bind(this);
	}

	connectedCallback() {
		this._upgradeProperty("value");
		this._upgradeProperty("min");
		this._upgradeProperty("max");
		this._upgradeProperty("disabled");
		this._upgradeProperty("placeholder");
		this._upgradeProperty("title");

		this._input.addEventListener("focus", this._onFocus);
		this._input.addEventListener("blur", this._onBlur);
		this._input.addEventListener("keydown", this._onKeyDown);
		this._input.addEventListener("mousedown", this._onMouseDown);
		this._input.addEventListener("click", this._onClick);
		this._input.addEventListener("paste", this._onPaste);
		this._input.addEventListener("input", this._onInput);

		this._syncFromValue();
		this._render();
	}

	disconnectedCallback() {
		this._input.removeEventListener("focus", this._onFocus);
		this._input.removeEventListener("blur", this._onBlur);
		this._input.removeEventListener("keydown", this._onKeyDown);
		this._input.removeEventListener("mousedown", this._onMouseDown);
		this._input.removeEventListener("click", this._onClick);
		this._input.removeEventListener("paste", this._onPaste);
		this._input.removeEventListener("input", this._onInput);
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;

		if (name === "value" && !this._inFocus) {
			this._syncFromValue();
			this._render();
		}

		if (name === "disabled") {
			this._input.disabled = this.disabled;
		}

		if (name === "placeholder") {
			this._input.placeholder = this.placeholder || "";
		}

		if (name === "title") {
			this._input.title = this.title || "";
		}

		if (name === "min" || name === "max") {
			if (!this._inFocus) {
				this._syncFromValue();
				this._render();
			}
		}
	}

	_upgradeProperty(prop) {
		if (Object.prototype.hasOwnProperty.call(this, prop)) {
			const value = this[prop];
			delete this[prop];
			this[prop] = value;
		}
	}

	get value() {
		return this.getAttribute("value") || "";
	}

	set value(v) {
		if (!v) {
			this.removeAttribute("value");
			return;
		}
		this.setAttribute("value", v);
	}

	get min() {
		return this.getAttribute("min") || "2000-01-01";
	}

	set min(v) {
		if (!v) {
			this.removeAttribute("min");
			return;
		}
		this.setAttribute("min", v);
	}

	get max() {
		return this.getAttribute("max") || new Date().toISOString().slice(0, 10);
	}

	set max(v) {
		if (!v) {
			this.removeAttribute("max");
			return;
		}
		this.setAttribute("max", v);
	}

	get disabled() {
		return this.hasAttribute("disabled");
	}

	set disabled(v) {
		if (v) {
			this.setAttribute("disabled", "");
		} else {
			this.removeAttribute("disabled");
		}
	}

	get placeholder() {
		return this.getAttribute("placeholder") || "";
	}

	set placeholder(v) {
		if (!v) {
			this.removeAttribute("placeholder");
			return;
		}
		this.setAttribute("placeholder", v);
	}

	get title() {
		return this.getAttribute("title") || "";
	}

	set title(v) {
		if (!v) {
			this.removeAttribute("title");
			return;
		}
		this.setAttribute("title", v);
	}

	focus() {
		this._input.focus();
	}

	selectSegment(segment = "day") {
		this._keepFocusAndSelect(segment);
	}

	clear() {
		return this._clearAll();
	}

	_emptyDraft() {
		return {day: "", month: "", year: ""};
	}

	_emptyTouched() {
		return {day: false, month: false, year: false};
	}

	_parseIsoToDraft(value) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			return this._emptyDraft();
		}

		const [year, month, day] = value.split("-");
		return {day, month, year};
	}

	_draftToIso(draft) {
		if (draft.day.length !== 2 || draft.month.length !== 2 || draft.year.length !== 4) {
			return "";
		}

		return `${draft.year}-${draft.month}-${draft.day}`;
	}

	_isValidIsoDate(value) {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

		const [year, month, day] = value.split("-").map(Number);
		if (!year || !month || !day) return false;

		const date = new Date(year, month - 1, day);

		return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
	}

	_clampIsoDate(value, minValue, maxValue) {
		if (value < minValue) return minValue;
		if (value > maxValue) return maxValue;
		return value;
	}

	_coerceInvalidIsoDate(value, minValue, maxValue) {
		if (value && value < minValue) return minValue;
		if (value && value > maxValue) return maxValue;
		return maxValue;
	}

	_getSegmentLength(segment) {
		return segment === "year" ? 4 : 2;
	}

	_getSegmentPlaceholder(segment) {
		if (segment === "day") return "dd";
		if (segment === "month") return "mm";
		return "yyyy";
	}

	_buildSegmentDisplay(segment, value, touched, inFocus) {
		const length = this._getSegmentLength(segment);

		if (!inFocus && value.length === 0) {
			return "";
		}

		if (value.length > 0) {
			return touched ? value.padStart(length, "0") : value;
		}

		if (!inFocus) {
			return "";
		}

		return touched ? "0".repeat(length) : this._getSegmentPlaceholder(segment);
	}

	_draftToDisplay(draft, touched, inFocus, hasCommittedValue) {
		if (!inFocus && !hasCommittedValue) {
			return "";
		}

		const day = this._buildSegmentDisplay("day", draft.day, touched.day, inFocus);
		const month = this._buildSegmentDisplay("month", draft.month, touched.month, inFocus);
		const year = this._buildSegmentDisplay("year", draft.year, touched.year, inFocus);

		return `${day || "dd"}/${month || "mm"}/${year || "yyyy"}`;
	}

	_clampSegmentValue(segment, value) {
		if (!value) return "";

		if (segment === "day") {
			const n = Number(value);
			if (Number.isNaN(n)) return "";
			return String(Math.min(Math.max(n, 1), 31)).padStart(2, "0");
		}

		if (segment === "month") {
			const n = Number(value);
			if (Number.isNaN(n)) return "";
			return String(Math.min(Math.max(n, 1), 12)).padStart(2, "0");
		}

		return value.slice(-4);
	}

	_markTouched(segment) {
		this._touched = {
			...this._touched,
			[segment]: true,
		};
	}

	_selectSegment(segment) {
		const [start, end] = this._ranges[segment];
		queueMicrotask(() => {
			this._input.setSelectionRange(start, end);
		});
	}

	_keepFocusAndSelect(segment) {
		if (document.activeElement !== this._input) {
			this._input.focus({preventScroll: true});
		}
		this._selectSegment(segment);
	}

	_segmentFromMousePosition(clientX, value) {
		const rect = this._input.getBoundingClientRect();
		const styles = window.getComputedStyle(this._input);

		const font = [styles.fontStyle, styles.fontVariant, styles.fontWeight, styles.fontSize, styles.fontFamily].join(" ");

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		if (!ctx) return "day";

		ctx.font = font;

		const paddingLeft = parseFloat(styles.paddingLeft || "0");
		const x = clientX - rect.left - paddingLeft;

		const boundaries = [
			ctx.measureText(value.slice(0, 2)).width,
			ctx.measureText(value.slice(0, 5)).width,
			ctx.measureText(value.slice(0, 10)).width,
		];

		if (x <= boundaries[0]) return "day";
		if (x <= boundaries[1]) return "month";
		return "year";
	}

	_nextSegment(segment) {
		const index = SEGMENT_ORDER.indexOf(segment);
		return SEGMENT_ORDER[Math.min(index + 1, SEGMENT_ORDER.length - 1)];
	}

	_prevSegment(segment) {
		const index = SEGMENT_ORDER.indexOf(segment);
		return SEGMENT_ORDER[Math.max(index - 1, 0)];
	}

	_normalizePaste(value) {
		const trimmed = value.trim();

		if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
			return trimmed;
		}

		const digits = trimmed.replace(/[^\d]/g, "");

		if (digits.length !== 8) return "";

		const ddmmyyyy = `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
		if (this._isValidIsoDate(ddmmyyyy)) return ddmmyyyy;

		const yyyymmdd = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
		if (this._isValidIsoDate(yyyymmdd)) return yyyymmdd;

		return "";
	}

	async _emitInput(value) {
		this.dispatchEvent(
			new CustomEvent("input", {
				detail: {value},
				bubbles: true,
				composed: true,
			})
		);
	}

	async _emitChange(value) {
		this.dispatchEvent(
			new CustomEvent("change", {
				detail: {value},
				bubbles: true,
				composed: true,
			})
		);
	}

	_syncFromValue() {
		this._draft = this._parseIsoToDraft(this.value);
		this._touched = this._emptyTouched();
	}

	_render() {
		this._input.value = this._draftToDisplay(this._draft, this._touched, this._inFocus, !!this.value);
		this._input.disabled = this.disabled;
		this._input.placeholder = this.placeholder || "";
		this._input.title = this.title || "";
	}

	async _commitDraft(nextDraft) {
		const iso = this._draftToIso(nextDraft);

		if (!iso) {
			await this._emitInput("");
			return;
		}

		if (!this._isValidIsoDate(iso)) {
			await this._emitInput(iso);
			return;
		}

		this.value = iso;
		await this._emitInput(iso);
	}

	async _normalizeSegmentAndMaybeCommit(segment) {
		const currentValue = this._draft[segment];

		if (!currentValue) return;

		const normalized = this._clampSegmentValue(segment, currentValue);

		if (normalized === currentValue) return;

		this._draft = {
			...this._draft,
			[segment]: normalized,
		};

		this._markTouched(segment);
		this._render();
		await this._commitDraft(this._draft);
	}

	async _focusSegment(segment) {
		await this._normalizeSegmentAndMaybeCommit(this._activeSegment);

		this._activeSegment = segment;
		this._replaceOnNextDigit = true;
		this._keepFocusAndSelect(segment);
	}

	async _clearAll() {
		this.value = "";
		this._draft = this._emptyDraft();
		this._touched = this._emptyTouched();
		this._replaceOnNextDigit = false;
		this._activeSegment = "day";

		this._render();
		this._keepFocusAndSelect("day");
		await this._emitInput("");
		await this._emitChange("");
	}

	async _updateActiveSegment(digit) {
		const segment = this._activeSegment;
		const maxLength = this._getSegmentLength(segment);
		const currentValue = this._draft[segment];
		const shouldReplace = this._replaceOnNextDigit;

		let nextValue = "";

		if (shouldReplace) {
			nextValue = digit;
		} else {
			nextValue = `${currentValue}${digit}`.slice(-maxLength);
		}

		this._draft = {
			...this._draft,
			[segment]: nextValue,
		};

		this._markTouched(segment);
		this._replaceOnNextDigit = false;
		this._render();

		if (nextValue.length >= maxLength) {
			const normalizedValue = this._clampSegmentValue(segment, nextValue);

			this._draft = {
				...this._draft,
				[segment]: normalizedValue,
			};

			this._render();
			await this._commitDraft(this._draft);

			if (segment === "year") {
				this._keepFocusAndSelect("year");
				return;
			}

			const next = this._nextSegment(segment);
			this._activeSegment = next;
			this._replaceOnNextDigit = true;
			this._keepFocusAndSelect(next);
			return;
		}

		this._keepFocusAndSelect(segment);
		await this._commitDraft(this._draft);
	}

	async _onFocus() {
		this._inFocus = true;
		this._draft = this._parseIsoToDraft(this.value);
		this._touched = this._emptyTouched();
		this._replaceOnNextDigit = true;

		const initialSegment = this._pendingFocusSegment || "day";
		this._pendingFocusSegment = null;

		this._activeSegment = initialSegment;
		this._render();
		this._keepFocusAndSelect(initialSegment);
	}

	async _onBlur() {
		await this._normalizeSegmentAndMaybeCommit(this._activeSegment);

		const iso = this._draftToIso(this._draft);

		if (!iso) {
			this._draft = this._parseIsoToDraft(this.value);
			this._touched = this._emptyTouched();
			this._replaceOnNextDigit = false;
			this._inFocus = false;
			this._render();
			await this._emitInput("");
			return;
		}

		if (!this._isValidIsoDate(iso)) {
			const fallback = this._coerceInvalidIsoDate(iso, this.min, this.max);
			this.value = fallback;
			this._draft = this._parseIsoToDraft(fallback);
			this._touched = this._emptyTouched();
			this._replaceOnNextDigit = false;
			this._inFocus = false;
			this._render();
			await this._emitInput(fallback);
			await this._emitChange(fallback);
			return;
		}

		const clamped = this._clampIsoDate(iso, this.min, this.max);

		this.value = clamped;
		this._draft = this._parseIsoToDraft(clamped);
		this._touched = this._emptyTouched();
		this._replaceOnNextDigit = false;
		this._inFocus = false;
		this._render();

		await this._emitInput(clamped);
		await this._emitChange(clamped);
	}

	async _onKeyDown(ev) {
		if (this.disabled) return;

		if (/^\d$/.test(ev.key)) {
			ev.preventDefault();
			ev.stopPropagation();
			await this._updateActiveSegment(ev.key);
			return;
		}

		if (ev.key === "ArrowLeft") {
			ev.preventDefault();
			ev.stopPropagation();
			await this._focusSegment(this._prevSegment(this._activeSegment));
			return;
		}

		if (ev.key === "ArrowRight" || ev.key === "/" || ev.key === "." || ev.key === "-") {
			ev.preventDefault();
			ev.stopPropagation();
			await this._focusSegment(this._nextSegment(this._activeSegment));
			return;
		}

		if (ev.key === "Home") {
			ev.preventDefault();
			ev.stopPropagation();
			await this._focusSegment("day");
			return;
		}

		if (ev.key === "End") {
			ev.preventDefault();
			ev.stopPropagation();
			await this._focusSegment("year");
			return;
		}

		if (ev.key === "Tab") {
			const current = this._activeSegment;

			if (ev.shiftKey) {
				if (current === "day") {
					return;
				}

				ev.preventDefault();
				await this._focusSegment(this._prevSegment(current));
				return;
			}

			if (current === "year") {
				return;
			}

			ev.preventDefault();
			await this._focusSegment(this._nextSegment(current));
			return;
		}

		if (ev.key === "Backspace" || ev.key === "Delete") {
			ev.preventDefault();
			ev.stopPropagation();
			await this._clearAll();
			return;
		}

		ev.preventDefault();
		ev.stopPropagation();
	}

	async _onMouseDown(ev) {
		if (this.disabled) return;

		ev.preventDefault();

		const segment = this.value ? this._segmentFromMousePosition(ev.clientX, this._input.value) : "day";

		this._pendingFocusSegment = segment;

		if (document.activeElement !== this._input) {
			this._input.focus({preventScroll: true});
			return;
		}

		await this._normalizeSegmentAndMaybeCommit(this._activeSegment);
		this._activeSegment = segment;
		this._replaceOnNextDigit = true;
		this._keepFocusAndSelect(segment);
	}

	_onClick(ev) {
		ev.preventDefault();

		const segment = this.value ? this._segmentFromMousePosition(ev.clientX, this._input.value) : "day";

		this._pendingFocusSegment = null;
		this._activeSegment = segment;
		this._replaceOnNextDigit = true;
		this._keepFocusAndSelect(segment);
	}

	async _onPaste(ev) {
		ev.preventDefault();

		const pasted = ev.clipboardData?.getData("text") || "";
		const iso = this._normalizePaste(pasted);

		if (!iso) return;

		const clamped = this._clampIsoDate(iso, this.min, this.max);

		this.value = clamped;
		this._draft = this._parseIsoToDraft(clamped);
		this._touched = this._emptyTouched();
		this._replaceOnNextDigit = true;
		this._activeSegment = "day";
		this._render();
		this._keepFocusAndSelect("day");

		await this._emitInput(clamped);
		await this._emitChange(clamped);
	}

	_onInput(ev) {
		ev.preventDefault();
	}
}

customElements.define("segment-date-input", SegmentDateInput);
