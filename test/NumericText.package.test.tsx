import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Numorph, { useCanAnimate } from '../src';
import packageJson from '../package.json';
import * as packageExports from '../src';
import * as vanillaExports from '../src/vanilla';

describe('Numorph package surface', () => {
  it('renders formatted accessible text during SSR', () => {
    const html = renderToString(
      <Numorph
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
    expect(packageExports.default).toBe(packageExports.Numorph);
    expect('Numera' in packageExports).toBe(false);
    expect('NumericText' in packageExports).toBe(false);
    expect('AnimatedDigit' in packageExports).toBe(false);
  });

  it('exposes a framework-free vanilla controller entry', () => {
    expect(typeof vanillaExports.NumorphController).toBe('function');
    expect('NumeraController' in vanillaExports).toBe(false);
    expect('NumericTextController' in vanillaExports).toBe(false);
    expect('NumericText' in vanillaExports).toBe(false);
    expect('useCanAnimate' in vanillaExports).toBe(false);
  });

  it('keeps package exports ESM-only and uses one shared stylesheet', () => {
    expect(packageJson.exports['.']).not.toHaveProperty('require');
    expect(packageJson.exports['./vanilla']).not.toHaveProperty('require');
    expect(packageJson.exports['./style.css']).toBe('./dist/index.css');
    expect(packageJson.exports['./vanilla.css']).toBe('./dist/index.css');
  });
});
