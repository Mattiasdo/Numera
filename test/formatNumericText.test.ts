import { describe, expect, it } from 'vitest';
import {
  compareNumericTextValues,
  formatNumericTextParts,
  getPlainNumericText,
} from '../src/formatNumericText';

describe('formatNumericTextParts', () => {
  it('formats localized numeric text with stable digit ids', () => {
    const parts = formatNumericTextParts(12345.67, 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }, '$', ' USD');

    expect(getPlainNumericText(parts)).toBe('$12,345.67 USD');
    expect(parts.filter((part) => part.isDigit).map((part) => part.id)).toEqual([
      'integer:4',
      'integer:3',
      'integer:2',
      'integer:1',
      'integer:0',
      'fraction:0',
      'fraction:1',
    ]);
  });

  it('keeps compact notation labels as compact parts', () => {
    const thousands = formatNumericTextParts(177100, 'en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    const millions = formatNumericTextParts(2100000, 'en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    });

    expect(getPlainNumericText(thousands)).toBe('177.1K');
    expect(thousands[thousands.length - 1]).toMatchObject({
      char: 'K',
      id: 'compact:0',
      kind: 'compact',
      isDigit: false,
    });
    expect(millions[millions.length - 1]).toMatchObject({
      char: 'M',
      id: 'compact:0',
      kind: 'compact',
      isDigit: false,
    });
  });

  it('uses stable ids for sign and affix character swaps', () => {
    const positive = formatNumericTextParts(10, 'en-US', { signDisplay: 'always' }, 'A', ' pts');
    const negative = formatNumericTextParts(-10, 'en-US', { signDisplay: 'always' }, 'B', ' pct');

    expect(positive.find((part) => part.kind === 'sign')).toMatchObject({ char: '+', id: 'sign:0' });
    expect(negative.find((part) => part.kind === 'sign')).toMatchObject({ char: '-', id: 'sign:0' });
    expect(positive[0]).toMatchObject({ char: 'A', id: 'prefix:0' });
    expect(negative[0]).toMatchObject({ char: 'B', id: 'prefix:0' });
    expect(positive.find((part) => part.char === 't')).toMatchObject({ id: 'suffix:2' });
    expect(negative.find((part) => part.char === 'c')).toMatchObject({ id: 'suffix:2' });
  });

  it('keys group separators from the right', () => {
    const millions = formatNumericTextParts(1234567, 'en-US');
    const thousands = formatNumericTextParts(123456, 'en-US');

    expect(millions.filter((part) => part.kind === 'group').map((part) => part.id)).toEqual([
      'group:1',
      'group:0',
    ]);
    expect(thousands.filter((part) => part.kind === 'group').map((part) => part.id)).toEqual([
      'group:0',
    ]);
  });
});

describe('compareNumericTextValues', () => {
  it('compares numbers and bigint values', () => {
    expect(compareNumericTextValues(1, 2)).toBe(1);
    expect(compareNumericTextValues(2, 1)).toBe(-1);
    expect(compareNumericTextValues(2n, 2n)).toBe(0);
  });
});
