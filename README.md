# @onikosavo/segment-date-input

A lightweight Web Component that provides a segmented date input with keyboard-driven editing.

The component stores the value in ISO format (`yyyy-mm-dd`) while displaying it in segmented form (`dd/mm/yyyy`). It is designed for cases where native `<input type="date">` behavior is inconsistent across browsers or where a custom segmented typing experience is preferred.

## Features

* ISO value format: `yyyy-mm-dd`
* Display format: `dd/mm/yyyy`
* Segmented editing for day, month, and year
* Keyboard navigation between segments
* Mouse-based segment selection
* Paste support for common date formats
* `min` / `max` bounds support
* `disabled`, `placeholder`, and `title` attributes
* Custom events for input and committed change
* Public methods for focus, segment selection, and clearing
* Shadow DOM encapsulation
* Stylable exposed input part via `::part(input-date)`

## Installation

### npm

```bash
npm install @onikosavo/segment-date-input
```

### Git dependency

```bash
npm install git+https://github.com/oNIKoSAVo/segment-date-input.git
```

## Usage

### Import once

```js
import "@onikosavo/segment-date-input";
```

### HTML

```html
<segment-date-input
  value="2025-10-12"
  min="1930-01-01"
  max="2025-12-31"
  placeholder="Date of birth"
  title="Date of birth"
></segment-date-input>
```

### Listening to events

```js
const el = document.querySelector("segment-date-input");

el.addEventListener("input", (e) => {
  console.log("input:", e.detail.value);
});

el.addEventListener("change", (e) => {
  console.log("change:", e.detail.value);
});
```

## Value model

The component works with an ISO date string:

```text
yyyy-mm-dd
```

Examples:

* `2025-10-12`
* `1930-01-01`

The displayed format is:

```text
dd/mm/yyyy
```

## Attributes

### `value`

Current value in ISO format.

```html
<segment-date-input value="2025-10-12"></segment-date-input>
```

### `min`

Minimum allowed ISO date.

```html
<segment-date-input min="1930-01-01"></segment-date-input>
```

### `max`

Maximum allowed ISO date.

```html
<segment-date-input max="2025-12-31"></segment-date-input>
```

### `disabled`

Disables interaction.

```html
<segment-date-input disabled></segment-date-input>
```

### `placeholder`

Placeholder text forwarded to the internal input.

```html
<segment-date-input placeholder="Date"></segment-date-input>
```

### `title`

Tooltip text forwarded to the internal input.

```html
<segment-date-input title="Date of birth"></segment-date-input>
```

## Events

### `input`

Emits `CustomEvent<{ value: string }>` during editing.

Examples:

* partial or invalid intermediate value may emit through `detail.value`
* valid committed ISO values also emit through `detail.value`

```js
el.addEventListener("input", (e) => {
  console.log(e.detail.value);
});
```

### `change`

Emits `CustomEvent<{ value: string }>` when a value is committed or cleared.

```js
el.addEventListener("change", (e) => {
  console.log(e.detail.value);
});
```

## Public methods

### `focus()`

Focuses the internal input.

```js
el.focus();
```

### `selectSegment(segment)`

Selects one of the date segments.

Allowed values:

* `"day"`
* `"month"`
* `"year"`

```js
el.selectSegment("month");
```

### `clear()`

Clears the component value.

```js
el.clear();
```

## Keyboard behavior

### Typing digits

Digits are entered into the currently active segment.

* Day and month are normalized to valid numeric ranges
* Year keeps the last four typed digits

### Navigation

* `ArrowLeft` — move to previous segment
* `ArrowRight` — move to next segment
* `/`, `.`, `-` — move to next segment
* `Home` — move to day
* `End` — move to year
* `Tab` — move forward through segments, then leave the component
* `Shift+Tab` — move backward through segments, then leave the component

### Editing

* `Backspace` / `Delete` — clear the whole value

### Paste

The component accepts pasted values in supported formats and normalizes them to ISO.

## Styling

The component uses Shadow DOM. The internal input is exposed through the `input-date` part.

### Styling the internal input

```css
segment-date-input::part(input-date) {
  width: 100%;
  font: inherit;
  color: inherit;
  background: transparent;
  border: none;
  outline: none;
}
```

### Styling the placeholder

```css
segment-date-input::part(input-date)::placeholder {
  color: #666;
  opacity: 0.5;
}
```

### Styling the disabled state from outside

```css
segment-date-input[disabled]::part(input-date) {
  cursor: not-allowed;
}
```

## Using with frameworks

The component is framework-agnostic and can be used in plain HTML, React, Solid, Vue, Svelte, or other environments that support custom elements.

### Solid example

```tsx
<segment-date-input
  value={birthDate()}
  min="1930-01-01"
  max={new Date().toISOString().slice(0, 10)}
  onInput={(e: CustomEvent<{ value: string }>) => {
    setBirthDate(e.detail.value);
  }}
/>
```

When using TypeScript with Solid or JSX-based frameworks, add custom element typings in your project.

## Browser notes

This component is intended for modern browsers with support for:

* Custom Elements
* Shadow DOM
* ES modules

## Package structure

```text
segment-date-input/
  index.js
  package.json
  README.md
  src/
    segment-date-input.js
```

## Development

### Local test with a static server

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Roadmap

Potential future improvements:

* optional accessibility enhancements
* additional exported typings
* optional locale display separators
* optional non-shadow build
* optional calendar integration layer

## License

MIT
