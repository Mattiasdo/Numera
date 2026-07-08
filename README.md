# Numera

Dependency-free animated numbers for React counters, prices, stats, OTP slots, and compact metrics.

## Installation

```sh
npm install numera
```

`react` is the only peer dependency.

## Usage

```tsx
import Numera from 'numera';
import 'numera/style.css';

<Numera value={123456} />;
```

Use `Intl.NumberFormat` options for currency, compact notation, percentages, signs, decimals, and locale-aware separators:

```tsx
<Numera
  value={79187}
  locales="en-US"
  format={{ style: 'currency', currency: 'USD' }}
/>;

<Numera
  value={3300000}
  format={{ notation: 'compact', maximumFractionDigits: 1 }}
  suffix=" views"
/>;
```

## Animated Parts

Numera animates formatted number parts as first-class pieces. Digits roll, separators move, and symbols like `$`, `,`, `.`, `%`, `+`, `-`, compact labels, prefixes, and suffixes can enter, exit, or crossfade with the number.

```tsx
<Numera
  value={temperature}
  format={{ signDisplay: 'exceptZero', maximumFractionDigits: 1 }}
  suffix=" deg"
/>;
```

## Spring Animations

Use presets for quick tuning:

```tsx
<Numera value={score} preset="soft" />;
<Numera value={score} preset="snappy" />;
<Numera value={score} preset="springy" />;
```

Or pass timing options directly. Springs are generated as CSS timing functions, so there is no runtime animation dependency.

```tsx
<Numera
  value={score}
  timing={{
    duration: 420,
    spring: { mass: 1.2, stiffness: 150, damping: 19 },
  }}
/>;
```

## Fixed Slots

Use `Numera` directly for OTP and code-input slots. Give each slot a stable width, disable layout correction, and pass `animationKey` when the visible state changes even if the displayed number is still `0`.

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
/>;
```

## Vanilla Usage

```ts
import { NumeraController } from 'numera/vanilla';
import 'numera/vanilla.css';

const numera = new NumeraController({
  element: document.querySelector('[data-numera]')!,
  value: 1284,
});

numera.update(1300);
```

## Documentation

See the [full docs draft](docs/numera-docs.md) for API details, timing options, examples, and notes for specific use cases.

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
