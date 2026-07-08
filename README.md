# Numera

Animated number text for counters, scores, streaks, levels, stats, prices, OTP slots, and compact metrics.

Numera is dependency-free at runtime aside from React. It uses CSS animations and generated CSS spring easings, so apps do not need Framer Motion, Motion, GSAP, or a runtime animation engine.

```tsx
import Numera from 'numera';
import 'numera/style.css';

<Numera value={score} />
<Numera value={gems} locales="en-US" />
<Numera value={level} prefix="Level " preset="soft" />
```

## Install

```sh
npm install numera
```

`react` is the only peer dependency.

## Features

- Rolling digit transitions for numbers and counters.
- `Intl.NumberFormat` support through `locales` and `format`.
- Animated formatted parts like `$`, `,`, `.`, `%`, `+`, `-`, compact notation, prefixes, suffixes, and unit text.
- Motion presets plus custom duration, easing, spring, stagger, blur, and movement distance.
- Fixed-slot support for OTP/code inputs with `animationKey` and `layoutCorrection={false}`.
- Reduced-motion support by default.
- React entry plus a framework-free vanilla controller entry.

## API Shape

For the longer website-ready docs draft with examples and use-case notes, see [docs/numera-docs.md](docs/numera-docs.md).

Use the simple props first:

- `value`: `number | bigint`
- `locales`: forwarded to `Intl.NumberFormat`
- `format`: forwarded to `Intl.NumberFormat`
- `prefix` / `suffix`: stable text around the formatted number
- `trend`: `"auto" | "up" | "down" | "neutral"`
- `preset`: `"default" | "soft" | "snappy" | "springy"`
- `layoutCorrection`: keeps shared digit slots and stable secondary text parts visually stable when the formatted number changes width; disable this inside fixed slots like OTP/code boxes
- `animationKey`: optional visual-change key for fixed slots where the rendered number alone is not enough, like an empty slot changing into a typed `0`

Raw animation props still exist for local tuning:

- `duration`
- `stagger`
- `easing`
- `blur`
- `moveDistance`
- `spring`

For package-style control, use the grouped timing props:

- `timing`: shared defaults for digit, part, and layout motion
- `digitTiming`: overrides for rolling digits
- `partTiming`: overrides for formatted text parts like `$`, `,`, `.`, `%`, `+`, `-`, prefixes, suffixes, and units
- `layoutTiming`: overrides for layout movement when shared slots shift position
- `opacityTiming`: overrides for opacity/blur timing

Each motion timing object accepts `duration`, `easing`, and `spring`. If you provide `easing`, that easing is used directly. If you provide `spring`, Numera generates dependency-free CSS spring timing.

```tsx
<Numera
  value={price}
  locales="en-US"
  format={{ style: 'currency', currency: 'USD' }}
  timing={{
    duration: 360,
    spring: { stiffness: 560, damping: 44, mass: 0.8 },
  }}
/>

<Numera
  value={temperature}
  format={{ signDisplay: 'exceptZero', maximumFractionDigits: 1 }}
  suffix=" deg"
  digitTiming={{ duration: 340 }}
  partTiming={{ duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}
  layoutTiming={{ duration: 300 }}
  opacityTiming={{ duration: 160, easing: 'ease-out' }}
/>
```

Formatted non-digit pieces animate as first-class parts. Users do not need to manually wrap punctuation, currency symbols, signs, percent marks, compact labels, or unit text just to make them enter, exit, or move with the number. When a stable part changes value, such as `K` becoming `M` or `+` becoming `-`, Numera keeps the part in place and crossfades the old and new characters.

## Presets

`default` is the balanced baseline. Use `soft` for an even gentler, calmer motion, `snappy` for smaller counters that need to feel quick, and `springy` for a deliberately bouncy spring demo.

## Fixed Slots

Use `Numera` directly for fixed-width character slots, like OTP/code inputs. Give every slot a stable width, turn off layout correction, and use `animationKey` when the visual state changes even though the displayed number may still be `0`.

```tsx
const digit = code[index] ?? '';
const isFilled = digit.length > 0;
const displayDigit = isFilled ? Number(digit) : 0;

<Numera
  value={displayDigit}
  preset="soft"
  trend={isFilled ? 'up' : 'down'}
  animationKey={`${isFilled ? 'filled' : 'empty'}:${displayDigit}`}
  layoutCorrection={false}
/>
```

## Development

```sh
npm install
npm run check
```

Run the playground:

```sh
npm run dev
```

Individual checks:

```sh
npm run typecheck
npm test
npm run build
```

## Vanilla Usage

```ts
import { NumeraController } from 'numera/vanilla';
import 'numera/vanilla.css';

const controller = new NumeraController({
  element: document.querySelector('[data-numera]')!,
  value: 1284,
});

controller.update(1300);
```

## License

MIT.

## Package TODO

- Add exit-slot cleanup after animations finish.
- Consider replacing layout correction's Web Animations call with the same motion system as digit animation.
- Add a headless hook for custom renderers.
- Add examples for gems, streaks, gravity score, levels, negatives, compact notation, and decimals.
