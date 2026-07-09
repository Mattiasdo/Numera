export type NumericTextValue = number | bigint;

export type NumericTextTrend = 'auto' | 'up' | 'down' | 'neutral';

export type NumericTextPartKind =
  | 'digit'
  | 'group'
  | 'decimal'
  | 'sign'
  | 'currency'
  | 'percent'
  | 'unit'
  | 'compact'
  | 'literal'
  | 'prefix'
  | 'suffix';

export interface NumericTextChar {
  char: string;
  id: string;
  kind: NumericTextPartKind;
  isDigit: boolean;
  index: number;
}

const DIGIT_PART_TYPES = new Set<Intl.NumberFormatPartTypes>(['integer', 'fraction']);

const EMPTY_DIGIT = '\u00A0';
const MAX_FORMATTER_CACHE_SIZE = 80;
const formatterCache = new Map<string, Intl.NumberFormat>();

const isDigitPart = (part: Intl.NumberFormatPart) => DIGIT_PART_TYPES.has(part.type);

const partKindFromType = (type: Intl.NumberFormatPartTypes): NumericTextPartKind => {
  switch (type) {
    case 'integer':
    case 'fraction':
      return 'digit';
    case 'group':
      return 'group';
    case 'decimal':
      return 'decimal';
    case 'minusSign':
    case 'plusSign':
      return 'sign';
    case 'currency':
      return 'currency';
    case 'percentSign':
      return 'percent';
    case 'unit':
      return 'unit';
    case 'compact':
      return 'compact';
    default:
      return 'literal';
  }
};

const toDisplayChar = (char: string) => (char === ' ' ? EMPTY_DIGIT : char);

function createFormatterCacheKey(
  locales?: Intl.LocalesArgument,
  format?: Intl.NumberFormatOptions
) {
  const localeKey = Array.isArray(locales) ? locales.join('\u0001') : String(locales ?? '');
  if (!format) return localeKey;

  const formatKey = Object.keys(format)
    .sort()
    .map((key) => {
      const value = format[key as keyof Intl.NumberFormatOptions];
      return `${key}:${String(value)}`;
    })
    .join('\u0001');

  return `${localeKey}\u0002${formatKey}`;
}

function getNumberFormatter(
  locales?: Intl.LocalesArgument,
  format?: Intl.NumberFormatOptions
) {
  const cacheKey = createFormatterCacheKey(locales, format);
  const cached = formatterCache.get(cacheKey);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat(locales, format);
  if (formatterCache.size >= MAX_FORMATTER_CACHE_SIZE) {
    const oldestKey = formatterCache.keys().next().value;
    if (oldestKey !== undefined) formatterCache.delete(oldestKey);
  }
  formatterCache.set(cacheKey, formatter);
  return formatter;
}

export function compareNumericTextValues(
  previous: NumericTextValue,
  next: NumericTextValue
): -1 | 0 | 1 {
  if (typeof previous === 'bigint' && typeof next === 'bigint') {
    if (next > previous) return 1;
    if (next < previous) return -1;
    return 0;
  }

  const prevNumber = Number(previous);
  const nextNumber = Number(next);

  if (!Number.isFinite(prevNumber) || !Number.isFinite(nextNumber)) return 0;
  if (nextNumber > prevNumber) return 1;
  if (nextNumber < prevNumber) return -1;
  return 0;
}

function createAffixChars(
  text: string | undefined,
  kind: 'prefix' | 'suffix',
  startIndex: number
): NumericTextChar[] {
  if (!text) return [];

  return Array.from(text).map((char, index) => ({
    char: toDisplayChar(char),
    id: `${kind}:${index}`,
    kind,
    isDigit: false,
    index: startIndex + index,
  }));
}

export function formatNumericTextParts(
  value: NumericTextValue,
  locales?: Intl.LocalesArgument,
  format?: Intl.NumberFormatOptions,
  prefix?: string,
  suffix?: string
): NumericTextChar[] {
  const formatter = getNumberFormatter(locales, format);
  const parts = formatter.formatToParts(value);
  const integerDigitCount = parts.reduce((count, part) => {
    if (part.type !== 'integer') return count;
    return count + Array.from(part.value).length;
  }, 0);
  const groupSeparatorCount = parts.reduce((count, part) => {
    if (part.type !== 'group') return count;
    return count + Array.from(part.value).length;
  }, 0);

  let visualIndex = 0;
  let integerDigitIndex = 0;
  let fractionDigitIndex = 0;
  let groupSeparatorIndex = 0;
  const typeCounts = new Map<string, number>();
  const formattedChars: NumericTextChar[] = [];

  const prefixChars = createAffixChars(prefix, 'prefix', visualIndex);
  formattedChars.push(...prefixChars);
  visualIndex += prefixChars.length;

  parts.forEach((part) => {
    Array.from(part.value).forEach((rawChar) => {
      const char = toDisplayChar(rawChar);
      const isDigit = isDigitPart(part);
      let id: string;

      if (part.type === 'integer') {
        const positionFromRight = integerDigitCount - integerDigitIndex - 1;
        id = `integer:${positionFromRight}`;
        integerDigitIndex += 1;
      } else if (part.type === 'fraction') {
        id = `fraction:${fractionDigitIndex}`;
        fractionDigitIndex += 1;
      } else if (part.type === 'group') {
        const positionFromRight = groupSeparatorCount - groupSeparatorIndex - 1;
        id = `group:${positionFromRight}`;
        groupSeparatorIndex += 1;
      } else {
        const stableType = part.type === 'minusSign' || part.type === 'plusSign' ? 'sign' : part.type;
        const occurrence = typeCounts.get(stableType) ?? 0;
        id = `${stableType}:${occurrence}`;
        typeCounts.set(stableType, occurrence + 1);
      }

      formattedChars.push({
        char,
        id,
        kind: partKindFromType(part.type),
        isDigit,
        index: visualIndex,
      });
      visualIndex += 1;
    });
  });

  const suffixChars = createAffixChars(suffix, 'suffix', visualIndex);
  formattedChars.push(...suffixChars);

  return formattedChars;
}

export function getPlainNumericText(parts: NumericTextChar[]) {
  return parts.map((part) => part.char).join('').split(EMPTY_DIGIT).join(' ');
}
