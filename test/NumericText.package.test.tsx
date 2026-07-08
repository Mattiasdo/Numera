import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Numera, { useCanAnimate } from '../src';
import * as packageExports from '../src';
import * as vanillaExports from '../src/vanilla';

describe('Numera package surface', () => {
  it('renders formatted accessible text during SSR', () => {
    const html = renderToString(
      <Numera
        value={1234}
        locales="en-US"
        format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
      />
    );

    expect(html).toContain('aria-label="$1,234"');
    expect(html).toContain('numeric-text');
  });

  it('exports the public hook and keeps AnimatedDigit internal', () => {
    expect(typeof useCanAnimate).toBe('function');
    expect(packageExports.default).toBe(packageExports.Numera);
    expect(packageExports.NumericText).toBe(packageExports.Numera);
    expect('AnimatedDigit' in packageExports).toBe(false);
  });

  it('exposes a framework-free vanilla controller entry', () => {
    expect(typeof vanillaExports.NumeraController).toBe('function');
    expect(typeof vanillaExports.NumericTextController).toBe('function');
    expect(vanillaExports.NumeraController).toBe(vanillaExports.NumericTextController);
    expect('NumericText' in vanillaExports).toBe(false);
    expect('useCanAnimate' in vanillaExports).toBe(false);
  });
});
