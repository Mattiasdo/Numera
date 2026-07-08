# Numorph

Dependency-free animated number text for React counters, prices, stats, OTP slots, and compact metrics.

## Installation

```sh
npm install numorph
```

`react` is the only peer dependency.

## Usage

```tsx
import Numorph from 'numorph';
import 'numorph/style.css';

<Numorph value={123456} />;
```

Use `Intl.NumberFormat` options for currency, compact notation, percentages, signs, decimals, and locale-aware separators:

```tsx
<Numorph
  value={79187}
  locales="en-US"
  format={{ style: 'currency', currency: 'USD' }}
/>;

<Numorph
  value={3300000}
  format={{ notation: 'compact', maximumFractionDigits: 1 }}
  suffix=" views"
/>;
```

## Animated Parts

Numorph animates formatted number parts as first-class pieces. Digits roll, separators move, and symbols like `$`, `,`, `.`, `%`, `+`, `-`, compact labels, prefixes, and suffixes can enter, exit, or crossfade with the number.

```tsx
<Numorph
  value={temperature}
  format={{ signDisplay: 'exceptZero', maximumFractionDigits: 1 }}
  suffix=" deg"
/>;
```

## Spring Animations

Use presets for quick tuning:

```tsx
<Numorph value={score} preset="soft" />;
<Numorph value={score} preset="snappy" />;
<Numorph value={score} preset="springy" />;
```

Or pass timing options directly. Springs are generated as CSS timing functions, so there is no runtime animation dependency.

```tsx
<Numorph
  value={score}
  timing={{
    duration: 420,
    spring: { mass: 1.2, stiffness: 150, damping: 19 },
  }}
/>;
```

## Fixed Slots

Use `Numorph` directly for OTP and code-input slots. Give each slot a stable width, disable layout correction, and pass `animationKey` when the visible state changes even if the displayed number is still `0`.

```tsx
const digit = code[index] ?? '';
const isFilled = digit.length > 0;
const displayDigit = isFilled ? Number(digit) : 0;

<Numorph
  value={displayDigit}
  preset="soft"
  trend={isFilled ? 'up' : 'down'}
  animationKey={`${isFilled ? 'filled' : 'empty'}:${displayDigit}`}
  layoutCorrection={false}
/>;
```

## Vanilla Usage

```ts
import { NumorphController } from 'numorph/vanilla';
import 'numorph/vanilla.css';

const numorph = new NumorphController({
  element: document.querySelector('[data-numorph]')!,
  value: 1284,
});

numorph.update(1300);
```

## Documentation

See the [full docs draft](docs/numorph-docs.md) for API details, timing options, examples, and notes for specific use cases.

## Security

Please report security issues privately using the guidance in [.github/SECURITY.md](.github/SECURITY.md).

## Contributing

Install dependencies:

```sh
npm install
```

Run the playground:

```sh
npm run dev
```

Run checks:

```sh
npm run check
```

Build the package:

```sh
npm run build
```

## Other Projects

You might also like:

- [number-flow](https://number-flow.barvian.me/) - Animated number component by Maxwell Barvian.
- [torph](https://github.com/lochie/torph) - Dependency-free animated text morphing.

## License

MIT.
