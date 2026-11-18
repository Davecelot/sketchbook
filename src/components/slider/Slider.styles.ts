// GENERATED from Slider.scss by scripts/build-styles.mjs. Do not edit.
import { css } from 'lit';

export const sliderStyles = css`
:host {
  display: block;
}

:host([hidden]) {
  display: none;
}

[part=field] {
  display: flex;
  flex-direction: column;
  gap: var(--sb-slider-gap);
  font-family: var(--sb-slider-font-family);
}

[part=label] {
  color: var(--sb-slider-label-fg);
  font-size: var(--sb-slider-label-font-size);
  font-weight: var(--sb-slider-label-font-weight);
  line-height: var(--sb-slider-label-line-height);
}

:host([hide-label]) [part=label] {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

[part=control] {
  --_thumb: var(--sb-slider-thumb-size);
  --_target: var(--sb-slider-target-size);
  --_start: 0px;
  --_size: calc(var(--_to) * (100% - var(--_thumb)) + var(--_thumb) / 2);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: var(--_target);
  touch-action: none;
}

[part=control][data-multi] {
  --_start: calc(var(--_from) * (100% - var(--_thumb)) + var(--_thumb) / 2);
  --_size: calc((var(--_to) - var(--_from)) * (100% - var(--_thumb)));
}

:host([orientation=vertical]) [part=control] {
  width: var(--_target);
  height: calc(3 * var(--sb-slider-vertical-length));
}

:host(:disabled) [part=control] {
  opacity: var(--sb-slider-disabled-opacity);
}

[part=track] {
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  height: var(--sb-slider-track-size);
  overflow: hidden;
  border-radius: var(--sb-slider-track-radius);
  background: var(--sb-slider-track-bg);
  transform: translateY(-50%);
}
@media (forced-colors: active) {
  [part=track] {
    background: GrayText;
  }
}

:host([orientation=vertical]) [part=track] {
  top: 0;
  right: auto;
  bottom: 0;
  left: 50%;
  width: var(--sb-slider-track-size);
  height: auto;
  transform: translateX(-50%);
}

[part=range] {
  position: absolute;
  top: 0;
  bottom: 0;
  inset-inline-start: var(--_start);
  width: var(--_size);
  background: var(--sb-slider-range-bg);
}
@media (forced-colors: active) {
  [part=range] {
    background: Highlight;
  }
}

:host([orientation=vertical]) [part=range] {
  top: auto;
  right: 0;
  bottom: var(--_start);
  left: 0;
  width: auto;
  height: var(--_size);
}

[part=thumb] {
  appearance: none;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background: transparent;
  outline: none;
  pointer-events: none;
}
[part=thumb]::-webkit-slider-runnable-track {
  appearance: none;
  width: 100%;
  height: 100%;
  background: transparent;
  border: 0;
}
[part=thumb]::-moz-range-track {
  width: 100%;
  height: 100%;
  background: transparent;
  border: 0;
}
[part=thumb]::-webkit-slider-thumb {
  appearance: none;
  box-sizing: border-box;
  width: var(--_thumb);
  height: var(--_thumb);
  border: var(--sb-slider-thumb-border-width) solid var(--sb-slider-thumb-border);
  border-radius: var(--sb-slider-track-radius);
  background: var(--sb-slider-thumb-bg);
  box-shadow: var(--sb-slider-thumb-shadow);
  margin-block-start: calc((var(--_target) - var(--_thumb)) / 2);
  cursor: grab;
  pointer-events: auto;
  transition: box-shadow var(--sb-slider-transition-duration) var(--sb-slider-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=thumb]::-webkit-slider-thumb {
    transition: none;
    animation: none;
  }
}
[part=thumb]::-moz-range-thumb {
  box-sizing: border-box;
  width: var(--_thumb);
  height: var(--_thumb);
  border: var(--sb-slider-thumb-border-width) solid var(--sb-slider-thumb-border);
  border-radius: var(--sb-slider-track-radius);
  background: var(--sb-slider-thumb-bg);
  box-shadow: var(--sb-slider-thumb-shadow);
  cursor: grab;
  pointer-events: auto;
  transition: box-shadow var(--sb-slider-transition-duration) var(--sb-slider-transition-easing);
}
@media (prefers-reduced-motion: reduce) {
  [part=thumb]::-moz-range-thumb {
    transition: none;
    animation: none;
  }
}
[part=thumb]:focus-visible::-webkit-slider-thumb {
  outline: none;
  box-shadow: 0 0 0 var(--sb-slider-focus-ring-width) var(--sb-slider-focus-ring-color);
}
@media (forced-colors: active) {
  [part=thumb]:focus-visible::-webkit-slider-thumb {
    outline: var(--sb-slider-focus-ring-width) solid CanvasText;
  }
}
[part=thumb]:focus-visible::-moz-range-thumb {
  outline: none;
  box-shadow: 0 0 0 var(--sb-slider-focus-ring-width) var(--sb-slider-focus-ring-color);
}
@media (forced-colors: active) {
  [part=thumb]:focus-visible::-moz-range-thumb {
    outline: var(--sb-slider-focus-ring-width) solid CanvasText;
  }
}
[part=thumb][aria-invalid=true]::-webkit-slider-thumb {
  border-color: var(--sb-slider-border-invalid);
}
[part=thumb][aria-invalid=true]::-moz-range-thumb {
  border-color: var(--sb-slider-border-invalid);
}
[part=thumb]:disabled::-webkit-slider-thumb {
  cursor: not-allowed;
}
[part=thumb]:disabled::-moz-range-thumb {
  cursor: not-allowed;
}

[part=control]:not([data-multi]) [part=thumb] {
  pointer-events: auto;
  cursor: pointer;
}

:host([orientation=vertical]) [part=thumb] {
  direction: rtl;
  writing-mode: vertical-lr;
}

[part=description],
[part=error] {
  margin: 0;
  font-size: var(--sb-slider-description-font-size);
  line-height: var(--sb-slider-description-line-height);
}

[part=description] {
  color: var(--sb-slider-description-fg);
}

[part=error] {
  color: var(--sb-slider-error-fg);
}

[part=error]:empty {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
`;
