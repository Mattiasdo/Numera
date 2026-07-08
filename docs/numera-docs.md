# Numera Docs

Animated React number text for counters, scores, prices, percentages, levels, OTP slots, stats, and formatted metrics.

Numera is designed around a simple idea: pass a number in, and the rendered text transitions when that value changes. Digits roll vertically. Formatting parts like commas, decimal points, currency symbols, percent signs, plus/minus signs, compact labels, prefixes, and suffixes are treated as real animated parts instead of static text that users have to wrap manually.

## Install

```sh
npm install numera
```

```tsx
import Numera from 'numera';
import 'numera/style.css';
```

`react` is the only peer dependency. The package does not require Framer Motion, Motion, GSAP, or a runtime animation dependency.

## Basic Usage

```tsx
import { useState } from 'react';
import Numera from 'numera';
import 'numera/style.css';

export function ScoreExample() {
  const [score, setScore] = useState(1284);

  return (
    <button type="button" onClick={() => setScore((value) => value + 1)}>
      <Numera value={score} locales="en-US" />
    </button>
  );
}
```

`Numera` automatically transitions when the `value` prop changes.

## Formatting

Numera uses `Intl.NumberFormat` under the hood. Pass `locales` and `format` the same way you would pass them to `new Intl.NumberFormat(locales, options)`.

```tsx
<Numera
  value={4217}
  locales="en-US"
  format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
/>
```

```tsx
<Numera
  value={0.684}
  locales="en-US"
  format={{ style: 'percent', maximumFractionDigits: 1 }}
/>
```

```tsx
<Numera
  value={177100}
  locales="en-US"
  format={{ notation: 'compact', maximumFractionDigits: 1 }}
  suffix=" views"
/>
```

Formatted non-digit parts are animated by default. For example:

- `$` enters and exits with currency values.
- `,` and `.` move with the number instead of jumping.
- `%`, `+`, `-`, and unit text stay aligned with the digits.
- Compact labels like `K` and `M` crossfade when they swap.
- Prefixes and suffixes are included in the same layout model as the number.

## Common Examples

### Score

```tsx
<Numera value={score} locales="en-US" />
```

Use this for scores, counters, totals, and other plain numeric values.

### Currency

```tsx
<Numera
  value={price}
  locales="en-US"
  format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
/>
```

Currency symbols are animated parts. If the symbol appears or disappears because the format changes, it enters or exits with the rest of the number.

### Compact Metrics

```tsx
<Numera
  value={viewCount}
  locales="en-US"
  format={{ notation: 'compact', maximumFractionDigits: 1 }}
  suffix=" views"
/>
```

Use this for views, likes, downloads, followers, gems, and usage metrics. Compact labels from `Intl.NumberFormat`, such as `K` and `M`, are treated as formatted parts. Custom suffix text like ` views` is also part of the rendered sequence.

### Percent

```tsx
<Numera
  value={progress}
  locales="en-US"
  format={{ style: 'percent', maximumFractionDigits: 1 }}
/>
```

The percent symbol is aligned with the number and uses part timing rather than digit timing.

### Signed Decimal

```tsx
<Numera
  value={temperature}
  locales="en-US"
  format={{
    signDisplay: 'exceptZero',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }}
  suffix=" deg"
/>
```

Signs are first-class parts. `+` and `-` can enter, exit, or crossfade without users having to manually split them out.

### Level Prefix

```tsx
<Numera value={level} prefix="Level " />
```

Use `prefix` for stable text that should move with the number. The prefix is rendered as individual parts so spacing stays connected to the digits.

### BigInt

```tsx
<Numera value={9007199254740993n} locales="en-US" />
```

`value` accepts `number | bigint`.

## OTP and Fixed Slots

Numera can be used directly inside fixed slots, such as OTP codes, invite codes, or verification inputs.

```tsx
const digit = code[index] ?? '';
const isFilled = digit.length > 0;
const displayValue = isFilled ? Number(digit) : 0;

<div className="otp-slot">
  <Numera
    value={displayValue}
    preset="soft"
    trend={isFilled ? 'up' : 'down'}
    animationKey={`${isFilled ? 'filled' : 'empty'}:${displayValue}`}
    layoutCorrection={false}
  />
</div>
```

Use `layoutCorrection={false}` in fixed-width slots. The slot container already owns the layout, so Numera should only animate the digit inside the slot.

Use `animationKey` when the rendered number is not enough to describe the visual state. The important OTP case is an empty slot that displays `0` and a filled slot where the user typed `0`. Both render the same number, but they are different UI states. `animationKey` tells Numera to animate the transition anyway.

Recommended slot CSS:

```css
.otp-slot {
  display: grid;
  place-items: center;
  width: 48px;
  height: 56px;
  border-radius: 12px;
  font-variant-numeric: tabular-nums;
}
```

## Timing and Easing

Use presets for most cases:

```tsx
<Numera value={score} preset="soft" />
<Numera value={score} preset="snappy" />
<Numera value={score} preset="springy" />
```

Available presets:

| Preset | Best For |
| --- | --- |
| `default` | Balanced app UI motion. |
| `soft` | Calm product UI, slower dashboards, and gentle changes. |
| `snappy` | Small counters, compact stats, and frequent updates. |
| `springy` | A more visibly spring-based preset for testing and playful surfaces. |

For more control, use the grouped timing props:

```tsx
<Numera
  value={price}
  timing={{
    duration: 420,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
  }}
/>
```

```tsx
<Numera
  value={price}
  digitTiming={{
    duration: 420,
    spring: { stiffness: 620, damping: 33, mass: 0.9 },
  }}
  partTiming={{
    duration: 220,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
  }}
  opacityTiming={{
    duration: 180,
    easing: 'ease-out',
  }}
/>
```

Timing layers:

| Prop | Controls |
| --- | --- |
| `timing` | Shared base timing for digit, part, and layout motion. |
| `digitTiming` | Rolling digit motion. |
| `partTiming` | Non-digit formatted parts like `$`, `,`, `.`, `%`, signs, prefixes, suffixes, compact labels, and units. |
| `layoutTiming` | Layout movement when stable parts shift position. |
| `opacityTiming` | Fade and blur timing for entering/exiting faces and parts. |

Each motion timing object accepts:

```ts
type NumeraTiming = {
  duration?: number;
  easing?: string;
  spring?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
};
```

If `easing` is supplied, Numera uses it directly. If `spring` is supplied and no explicit easing overrides it, Numera generates a CSS easing from the spring parameters. The spring affects incoming digit motion; exit motion stays controlled by the regular easing so outgoing digits feel clean and do not bounce away.

## Direction

```tsx
<Numera value={value} trend="auto" />
<Numera value={value} trend="up" />
<Numera value={value} trend="down" />
<Numera value={value} trend="neutral" />
```

`trend` controls the direction of digit movement.

| Value | Behavior |
| --- | --- |
| `auto` | Digits move up when the numeric value increases and down when it decreases. |
| `up` | Digits always enter upward. Useful for adding code digits or celebratory counters. |
| `down` | Digits always enter downward. Useful for deletions or countdown-like moments. |
| `neutral` | Avoids directional digit animation unless a non-value animation key or formatted part change needs a transition. |

## Animated Parts

Numera splits the formatted output into stable character parts. Digits animate with digit timing. Non-digits animate with part timing.

This means users do not need to do this:

```tsx
<>
  <span>$</span>
  <Numera value={amount} />
  <span> views</span>
</>
```

Prefer this:

```tsx
<Numera
  value={amount}
  locales="en-US"
  format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
/>
```

Or:

```tsx
<Numera
  value={views}
  locales="en-US"
  format={{ notation: 'compact', maximumFractionDigits: 1 }}
  suffix=" views"
/>
```

Use `prefix` and `suffix` when the text should participate in Numera layout and animation. Use surrounding text outside of Numera when that text should not be part of the number.

## Layout Correction

`layoutCorrection` is enabled by default.

```tsx
<Numera value={score} layoutCorrection />
```

When formatting changes the width of a number, stable parts can shift position. Layout correction measures those stable parts and animates their movement, which prevents commas, decimal points, suffixes, and units from feeling disconnected from the number.

Disable it when the parent owns a fixed layout:

```tsx
<Numera value={digit} layoutCorrection={false} />
```

Good places to disable layout correction:

- OTP/code slots
- Fixed-width scoreboard cells
- Grid cells where every slot already has a stable width

## Accessibility

Numera renders an `aria-label` for the full plain text number. The animated internal faces are hidden from assistive technology.

```tsx
<Numera value={price} aria-label={`Current price is ${price} dollars`} />
```

Pass your own `aria-label` when the raw formatted number is not descriptive enough.

## Reduced Motion

By default, Numera respects the user's reduced motion preference.

```tsx
<Numera value={score} respectReducedMotion />
```

To force animation regardless of the system setting:

```tsx
<Numera value={score} respectReducedMotion={false} />
```

You can also disable animations manually:

```tsx
<Numera value={score} animate={false} />
```

`animate={false}` is useful for static previews, tests, and places where the number is updating too frequently for motion to be helpful.

## Callbacks

```tsx
<Numera
  value={score}
  onAnimationsStart={() => {
    console.log('animation started');
  }}
  onAnimationsFinish={() => {
    console.log('animation finished');
  }}
/>
```

Use callbacks for sound effects, analytics, haptics, or chaining a secondary UI effect after the number finishes moving.

## Styling

Numera inherits font styles from its parent.

```css
.stat {
  font-family: Inter, system-ui, sans-serif;
  font-size: 48px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
```

```tsx
<div className="stat">
  <Numera value={score} locales="en-US" />
</div>
```

Use `font-variant-numeric: tabular-nums` when consistent digit widths matter. This reduces horizontal shifting during transitions and is especially useful in dashboards, tables, scoreboards, and OTP slots.

Numera exports CSS separately so apps can decide where to load it:

```tsx
import 'numera/style.css';
```

## Performance Notes

Use `willChange` only when a number changes frequently and you have confirmed it helps:

```tsx
<Numera value={score} willChange />
```

`will-change` can improve animation smoothness in the right place, but it can increase memory usage if applied broadly.

Numera preserves active slot animations across unrelated parent renders. This matters for UI like OTP inputs, where the digit changes and the active focus ring may re-render immediately afterward. Users do not need to manage previous digits manually.

## API Reference

```ts
type NumeraValue = number | bigint;
type NumeraTrend = 'auto' | 'up' | 'down' | 'neutral';
type NumeraPreset = 'default' | 'soft' | 'snappy' | 'springy';
```

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number | bigint` | Required | The numeric value to render and animate. |
| `locales` | `Intl.LocalesArgument` | `undefined` | Passed to `Intl.NumberFormat`. |
| `format` | `Intl.NumberFormatOptions` | `undefined` | Passed to `Intl.NumberFormat`. |
| `prefix` | `string` | `undefined` | Stable text before the formatted number. |
| `suffix` | `string` | `undefined` | Stable text after the formatted number. |
| `preset` | `NumeraPreset` | `default` | Motion preset. |
| `trend` | `NumeraTrend` | `auto` | Direction of digit movement. |
| `timing` | `NumeraTiming` | Preset timing | Shared timing override. |
| `digitTiming` | `NumeraTiming` | `timing` | Overrides digit motion. |
| `partTiming` | `NumeraTiming` | `timing` | Overrides non-digit part motion. |
| `layoutTiming` | `NumeraTiming` | `timing` | Overrides layout correction motion. |
| `opacityTiming` | `NumeraVisualTiming` | Derived from timing | Overrides opacity and blur timing. |
| `duration` | `number` | Preset duration | Convenience shorthand for base duration. |
| `stagger` | `number` | Preset stagger | Delay between digit animations. |
| `easing` | `string` | Preset easing | Convenience shorthand for base easing. |
| `blur` | `number | string` | Preset blur | Blur amount for entering/exiting content. |
| `moveDistance` | `number | string` | Preset distance | Vertical movement distance. |
| `spring` | `Partial<NumeraSpring>` | Preset spring | Convenience shorthand for base spring params. |
| `layoutCorrection` | `boolean` | `true` | Animates stable parts when their position changes. |
| `animationKey` | `React.Key` | `undefined` | Forces a visual transition when value alone is not enough. |
| `animate` | `boolean` | `true` | Enables or disables animation. |
| `isolate` | `boolean` | `false` | Applies CSS isolation to the root. |
| `willChange` | `boolean` | `false` | Applies will-change hints to animated faces. |
| `respectReducedMotion` | `boolean` | `true` | Disables motion when the user prefers reduced motion. |
| `onAnimationsStart` | `() => void` | `undefined` | Fires when Numera starts update animations. |
| `onAnimationsFinish` | `() => void` | `undefined` | Fires after update animations are expected to finish. |

Numera also accepts normal `span` attributes like `className`, `style`, `id`, and `aria-label`.

## Use Case Notes

### Values That Render the Same Text

Use `animationKey` when the displayed text does not change but the visual state should still animate.

```tsx
<Numera
  value={isFilled ? Number(digit) : 0}
  animationKey={isFilled ? `filled:${digit}` : 'empty'}
/>
```

Common cases:

- Empty OTP slot showing `0` vs a user-entered `0`.
- Reset states where `0` appears before and after a reset.
- Replaying a score reveal with the same final value.

### Fast Updates and Spamming

Numera keeps active animations alive through unrelated re-renders. It does not currently queue every intermediate value. If a value changes extremely quickly, the latest value wins, and any still-active slot animation is preserved only when it still matches the latest rendered character.

For very high-frequency values, consider:

- Using `preset="snappy"`.
- Lowering `duration` and `stagger`.
- Disabling animation while dragging or scrubbing.
- Animating only committed values instead of every transient value.

### Tabular Digits

If the number appears in a row, grid, table, card, or slot, use tabular digits:

```css
.metric {
  font-variant-numeric: tabular-nums;
}
```

This is usually the easiest way to prevent width jitter.

### Formatting Changes

When changing `format`, `prefix`, or `suffix` at the same time as `value`, consider adding an `animationKey` that represents the display mode.

```tsx
<Numera
  value={amount}
  format={mode === 'currency' ? currencyFormat : decimalFormat}
  animationKey={`${mode}:${amount}`}
/>
```

This helps Numera treat semantic mode changes as animation-worthy changes.

### Fixed Containers

For fixed containers, let the parent provide dimensions:

```css
.score-cell {
  width: 8ch;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
```

```tsx
<div className="score-cell">
  <Numera value={score} layoutCorrection={false} />
</div>
```

## Inspiration Notes

These notes are for our future docs/site direction.

- NumberFlow's docs do a good job of making each prop concrete with a small example. It documents `format`, `locales`, `prefix`, `suffix`, timing layers, `trend`, animation toggles, reduced motion, callbacks, styling, grouping, hooks, and limitations.
- NumberFlow splits timing into transform/spin/opacity concerns. Numera's equivalent is `layoutTiming`, `digitTiming`, `partTiming`, and `opacityTiming`.
- NumberFlow calls out tabular numbers and reduced motion. Numera docs should do the same because those are real production details.
- Torph's docs are clean about dependency-free positioning, framework entry points, and spring params. Numera should keep its React-first quick start just as direct, and the spring section should stay easy to scan.
- Torph allows spring parameters through `ease`; Numera exposes spring parameters through `timing`, `digitTiming`, `partTiming`, `layoutTiming`, or the shorthand `spring`.

Reference docs reviewed:

- [NumberFlow docs](https://number-flow.barvian.me/)
- [Torph repository README](https://github.com/lochie/torph)
- [Torph package README](https://github.com/lochie/torph/blob/main/packages/torph/README.md)

## Current Limitations

- Numera is currently React-only.
- Scientific and engineering notation have not been tested as first-class use cases.
- Non-Latin digits and RTL locales need explicit testing before being documented as supported.
- The package currently ships CSS that must be imported by the app.
- There is not yet a headless hook for fully custom rendering.
- There is not yet a grouping component for syncing multiple Numera instances that affect each other's layout.
