import './NumericText.css';
import {
  compareNumericTextValues,
  formatNumericTextParts,
  getPlainNumericText,
  NumericTextChar,
  NumericTextTrend,
  NumericTextValue,
} from './formatNumericText';
import {
  NUMERIC_TEXT_PRESETS,
  NumericTextPreset,
  NumericTextSpring,
  NumericTextTiming,
  NumericTextVisualTiming,
  resolveMotionPreset,
} from './motion';
import { createSpringTiming } from './springTiming';

export interface NumericTextControllerOptions {
  element: HTMLElement;
  value: NumericTextValue;
  locales?: Intl.LocalesArgument;
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  preset?: NumericTextPreset;
  trend?: NumericTextTrend;
  timing?: NumericTextTiming;
  digitTiming?: NumericTextTiming;
  partTiming?: NumericTextTiming;
  opacityTiming?: NumericTextVisualTiming;
  duration?: number;
  stagger?: number;
  easing?: string;
  blur?: number | string;
  moveDistance?: number | string;
  spring?: Partial<NumericTextSpring>;
  animationKey?: string | number;
  animate?: boolean;
  respectReducedMotion?: boolean;
  willChange?: boolean;
  ariaLabel?: string;
  onAnimationsStart?: () => void;
  onAnimationsFinish?: () => void;
}

export type NumericTextControllerUpdate =
  | NumericTextValue
  | (Partial<Omit<NumericTextControllerOptions, 'element'>> & { value?: NumericTextValue });

interface NumericTextSlot {
  id: string;
  kind: NumericTextChar['kind'];
  isDigit: boolean;
  currentChar: string;
  previousChar?: string;
  shouldAnimate: boolean;
  isNew: boolean;
  runId: string;
}

interface ActiveSlotAnimation {
  previousChar?: string;
  currentChar: string;
  isNew: boolean;
  runId: string;
  expiresAt: number;
}

const DEFAULT_SCALE = 0.8;
const EMPTY_FACE = '\u00A0';

function toCssLength(value: number | string, unit = 'px') {
  return typeof value === 'number' ? `${value}${unit}` : value;
}

function toScaledCssLength(value: number | string, scale: number, unit = 'px') {
  return typeof value === 'number' ? `${value * scale}${unit}` : value;
}

function scaleCssLength(value: number | string, scale: number, unit = '%') {
  if (typeof value === 'number') return `${value * scale}${unit}`;
  if (value.endsWith('em')) return `${Number(value.slice(0, -2)) * scale}em`;
  if (value.endsWith('rem')) return `${Number(value.slice(0, -3)) * scale}rem`;
  if (value.endsWith('px')) return `${Number(value.slice(0, -2)) * scale}px`;
  if (value.endsWith('%')) return `${Number(value.slice(0, -1)) * scale}%`;
  return value;
}

function toNegativeCssLength(value: number | string, unit = '%') {
  if (typeof value === 'number') return `${-value}${unit}`;
  return value.startsWith('-') ? value : `-${value}`;
}

function toHalfCssLength(value: number | string, unit = '%') {
  if (typeof value === 'number') return `${value * 0.55}${unit}`;
  if (value.endsWith('em')) return `${Number(value.slice(0, -2)) * 0.55}em`;
  if (value.endsWith('rem')) return `${Number(value.slice(0, -3)) * 0.55}rem`;
  if (value.endsWith('px')) return `${Number(value.slice(0, -2)) * 0.55}px`;
  if (value.endsWith('%')) return `${Number(value.slice(0, -1)) * 0.55}%`;
  return value;
}

function toZeroCssLength(value: number | string, unit = '%') {
  const cssValue = toCssLength(value, unit);
  const unitMatch = cssValue.match(/[a-z%]+$/i);
  return unitMatch ? `0${unitMatch[0]}` : 0;
}

function resolveDirection(
  trend: NumericTextTrend,
  previousValue: NumericTextValue,
  value: NumericTextValue
) {
  if (trend === 'up') return 'up';
  if (trend === 'down') return 'down';
  if (trend === 'neutral') return 'neutral';

  const comparison = compareNumericTextValues(previousValue, value);
  if (comparison > 0) return 'up';
  if (comparison < 0) return 'down';
  return 'neutral';
}

function partsChanged(previousParts: NumericTextChar[], nextParts: NumericTextChar[]) {
  if (previousParts.length !== nextParts.length) return true;

  return nextParts.some((part, index) => {
    const previousPart = previousParts[index];
    return (
      previousPart.id !== part.id ||
      previousPart.char !== part.char ||
      previousPart.kind !== part.kind ||
      previousPart.isDigit !== part.isDigit
    );
  });
}

function createSlots(
  previousParts: NumericTextChar[],
  nextParts: NumericTextChar[],
  canAnimate: boolean,
  runId: string,
  forceStableAnimation: boolean
): NumericTextSlot[] {
  const previousById = new Map(previousParts.map((part) => [part.id, part]));

  return nextParts.map((part): NumericTextSlot => {
    const previous = previousById.get(part.id);
    const previousChar = previous?.char;
    const changed = previousChar !== undefined && previousChar !== part.char;
    const isNew = previousChar === undefined;

    return {
      id: part.id,
      kind: part.kind,
      isDigit: part.isDigit,
      currentChar: part.char,
      previousChar,
      shouldAnimate: canAnimate && (changed || isNew || forceStableAnimation),
      isNew,
      runId,
    };
  });
}

function createSlotDelays(slots: NumericTextSlot[], stagger: number) {
  const delayMap = new Map<string, number>();
  const animatedSlots = slots.filter((slot) => slot.shouldAnimate);
  const digitSlots = animatedSlots.filter((slot) => slot.isDigit).reverse();
  const nonDigitSlots = animatedSlots.filter((slot) => !slot.isDigit);

  [...digitSlots, ...nonDigitSlots].forEach((slot, index) => {
    delayMap.set(slot.id, slot.isDigit ? index * stagger : 0);
  });

  return delayMap;
}

function resolveMotionTiming(
  base: {
    duration: number;
    easing: string;
    spring: NumericTextSpring;
  },
  timing?: NumericTextTiming
) {
  return {
    duration: timing?.duration ?? base.duration,
    easing: timing?.easing ?? base.easing,
    spring: {
      ...base.spring,
      ...timing?.spring,
    },
  };
}

function resolveVisualTiming(
  fallbackDuration: number,
  fallbackEasing: string,
  timing?: NumericTextVisualTiming
) {
  return {
    duration: timing?.duration ?? fallbackDuration,
    easing: timing?.easing ?? fallbackEasing,
  };
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function appendFace(
  parent: HTMLElement,
  char: string,
  className: string,
  variables: Record<string, string | number>
) {
  const face = document.createElement('span');
  face.className = className;
  Object.entries(variables).forEach(([name, value]) => {
    face.style.setProperty(name, String(value));
  });
  face.textContent = char;
  parent.appendChild(face);
}

export class NumericTextController {
  private options: NumericTextControllerOptions;
  private previousParts: NumericTextChar[] | null = null;
  private previousValue: NumericTextValue;
  private previousAnimationKey?: string | number;
  private activeAnimations = new Map<string, ActiveSlotAnimation>();
  private timers = new Set<number>();
  private hasMounted = false;

  constructor(options: NumericTextControllerOptions) {
    this.options = {
      preset: 'default',
      trend: 'auto',
      animate: true,
      respectReducedMotion: true,
      willChange: false,
      ...options,
    };
    this.previousValue = this.options.value;
    this.previousAnimationKey = this.options.animationKey;
    this.prepareElement();
    this.render();
  }

  update(update: NumericTextControllerUpdate) {
    if (typeof update === 'number' || typeof update === 'bigint') {
      this.options = {
        ...this.options,
        value: update,
      };
    } else {
      this.options = {
        ...this.options,
        ...update,
      };
    }

    this.render();
  }

  destroy() {
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers.clear();
    this.activeAnimations.clear();
    this.options.element.replaceChildren();
    this.options.element.classList.remove('numeric-text');
    this.options.element.removeAttribute('aria-label');
  }

  private prepareElement() {
    this.options.element.classList.add('numeric-text');
  }

  private canAnimate() {
    return Boolean(
      this.options.animate &&
      !(this.options.respectReducedMotion && prefersReducedMotion())
    );
  }

  private render() {
    const {
      element,
      value,
      locales,
      format,
      prefix,
      suffix,
      animationKey,
      trend = 'auto',
    } = this.options;
    const motionPreset = resolveMotionPreset(this.options.preset);
    const baseTiming = {
      duration: this.options.timing?.duration ?? this.options.duration ?? motionPreset.duration,
      easing: this.options.timing?.easing ?? this.options.easing ?? motionPreset.easing,
      spring: {
        ...motionPreset.spring,
        ...this.options.spring,
        ...this.options.timing?.spring,
      },
    };
    const digitTiming = resolveMotionTiming(baseTiming, this.options.digitTiming);
    const partTiming = resolveMotionTiming(baseTiming, this.options.partTiming);
    const opacityTiming = resolveVisualTiming(
      Math.max(140, digitTiming.duration * 0.72),
      'cubic-bezier(0.2, 0, 0, 1)',
      this.options.opacityTiming
    );
    const parts = formatNumericTextParts(value, locales, format, prefix, suffix);
    const plainText = getPlainNumericText(parts);
    const previousParts = this.previousParts ?? parts;
    const animationKeyChanged =
      this.hasMounted &&
      animationKey !== undefined &&
      this.previousAnimationKey !== animationKey;
    const formattedPartsChanged = this.hasMounted && partsChanged(previousParts, parts);
    const direction = resolveDirection(trend, this.previousValue, value);
    const nonValueAnimation = animationKeyChanged || formattedPartsChanged;
    const motionDirection = direction === 'neutral' && nonValueAnimation ? 'up' : direction;
    const canAnimate = this.canAnimate() && this.hasMounted && (direction !== 'neutral' || nonValueAnimation);
    const runId = `${plainText}:${motionDirection}:${String(value)}:${String(animationKey ?? '')}`;
    const distance = this.options.moveDistance ?? motionPreset.moveDistance;
    const blur = this.options.blur ?? motionPreset.blur;
    const resolvedStagger = this.options.stagger ?? motionPreset.stagger;
    const shouldAnimateStableSlots = animationKeyChanged && !formattedPartsChanged;
    const now = Date.now();
    const activeAnimationLifetime =
      Math.max(digitTiming.duration, partTiming.duration) +
      Math.max(0, parts.length - 1) * resolvedStagger +
      500;

    const slots = createSlots(previousParts, parts, canAnimate, runId, shouldAnimateStableSlots).map((slot) => {
      if (slot.shouldAnimate) {
        this.activeAnimations.set(slot.id, {
          previousChar: slot.previousChar,
          currentChar: slot.currentChar,
          isNew: slot.isNew,
          runId: slot.runId,
          expiresAt: now + activeAnimationLifetime,
        });

        return slot;
      }

      const activeAnimation = this.activeAnimations.get(slot.id);
      if (activeAnimation && activeAnimation.expiresAt <= now) {
        this.activeAnimations.delete(slot.id);
        return slot;
      }

      if (!this.canAnimate() || !activeAnimation || activeAnimation.currentChar !== slot.currentChar) {
        return slot;
      }

      return {
        ...slot,
        previousChar: activeAnimation.previousChar,
        shouldAnimate: true,
        isNew: activeAnimation.isNew,
        runId: activeAnimation.runId,
      };
    });
    const slotDelays = createSlotDelays(slots, resolvedStagger);
    const digitSpringTiming = createSpringTiming(digitTiming.spring);
    const hasBaseEasingOverride = this.options.timing?.easing !== undefined || this.options.easing !== undefined;
    const shouldUseDigitSpring =
      this.options.digitTiming?.easing === undefined &&
      !(hasBaseEasingOverride && this.options.digitTiming?.spring === undefined);
    const digitMotionEasing = shouldUseDigitSpring ? digitSpringTiming.easing : digitTiming.easing;
    const digitExitMotionEasing = digitTiming.easing;
    const partSpringTiming = createSpringTiming(partTiming.spring);
    const shouldUsePartSpring =
      this.options.partTiming?.easing === undefined &&
      !(hasBaseEasingOverride && this.options.partTiming?.spring === undefined);
    const partMotionEasing = shouldUsePartSpring ? partSpringTiming.easing : partTiming.easing;
    const exitDistanceCss = scaleCssLength(distance, 1.28);
    const negativeExitDistanceCss = toNegativeCssLength(exitDistanceCss);
    const zeroDistanceCss = toZeroCssLength(distance);
    const blurCss = toCssLength(blur);

    element.setAttribute('aria-label', this.options.ariaLabel ?? plainText);
    element.style.setProperty('--numeric-text-duration', `${baseTiming.duration}ms`);
    element.style.setProperty('--numeric-text-stagger', `${resolvedStagger}ms`);
    element.style.setProperty('--numeric-text-ease', baseTiming.easing);
    element.style.setProperty('--numeric-part-duration', `${partTiming.duration}ms`);
    element.style.setProperty('--numeric-part-motion-ease', partMotionEasing);
    element.style.setProperty('--numeric-part-visual-duration', `${opacityTiming.duration}ms`);
    element.style.setProperty('--numeric-part-visual-ease', opacityTiming.easing);
    element.style.setProperty('--numeric-text-blur', toCssLength(blur));
    element.style.setProperty('--numeric-text-mid-blur', toScaledCssLength(blur, 0.45));
    element.style.setProperty('--numeric-text-soft-blur', toScaledCssLength(blur, 0.18));
    element.style.setProperty('--numeric-text-scale', String(DEFAULT_SCALE));
    element.style.setProperty('--numeric-text-move-distance', toCssLength(distance, '%'));
    element.style.setProperty('--numeric-text-move-distance-negative', toNegativeCssLength(distance));
    element.style.setProperty('--numeric-text-move-distance-mid', toHalfCssLength(distance));
    element.style.setProperty('--numeric-text-move-distance-mid-negative', toNegativeCssLength(toHalfCssLength(distance)));

    element.replaceChildren();

    slots.forEach((slot) => {
      const delay = slotDelays.get(slot.id) ?? 0;
      const slotStyle: Record<string, string | number> = {
        '--numeric-text-delay': `${delay}ms`,
        '--numeric-digit-delay': `${delay}ms`,
        '--numeric-part-delay': `${delay}ms`,
        '--numeric-part-enter-y': motionDirection === 'up'
          ? toHalfCssLength(distance)
          : toNegativeCssLength(toHalfCssLength(distance)),
        '--numeric-part-exit-y': motionDirection === 'up'
          ? toNegativeCssLength(toHalfCssLength(distance))
          : toHalfCssLength(distance),
      };

      if (!slot.isDigit) {
        const shouldSwapPart =
          slot.shouldAnimate &&
          !slot.isNew &&
          slot.previousChar !== undefined &&
          slot.previousChar !== slot.currentChar;
        const part = document.createElement('span');
        part.className = 'numeric-text__part';
        part.dataset.kind = slot.kind;
        if (slot.shouldAnimate) {
          part.dataset.animate = 'true';
          part.dataset.motion = shouldSwapPart ? 'swap' : 'enter';
        }
        Object.entries(slotStyle).forEach(([name, slotValue]) => {
          part.style.setProperty(name, String(slotValue));
        });

        if (shouldSwapPart) {
          const previous = document.createElement('span');
          previous.className = 'numeric-text__part-value numeric-text__part-value--previous';
          previous.textContent = slot.previousChar ?? '';
          part.appendChild(previous);
        }

        const current = document.createElement('span');
        current.className = 'numeric-text__part-value numeric-text__part-value--current';
        current.textContent = slot.currentChar;
        part.appendChild(current);
        element.appendChild(part);
        return;
      }

      const digit = document.createElement('span');
      digit.className = 'numeric-text__digit';
      digit.dataset.direction = motionDirection;
      if (slot.shouldAnimate) digit.dataset.animate = 'true';
      if (slot.isNew) digit.dataset.new = 'true';
      if (this.options.willChange) digit.dataset.willChange = 'true';

      Object.entries({
        ...slotStyle,
        '--numeric-digit-duration': `${digitTiming.duration}ms`,
        '--numeric-digit-visual-duration': `${opacityTiming.duration}ms`,
        '--numeric-digit-motion-ease': digitMotionEasing,
        '--numeric-digit-enter-motion-ease': digitMotionEasing,
        '--numeric-digit-exit-motion-ease': digitExitMotionEasing,
        '--numeric-digit-visual-ease': opacityTiming.easing,
        '--numeric-digit-enter-y': motionDirection === 'up'
          ? toCssLength(distance, '%')
          : toNegativeCssLength(distance),
        '--numeric-digit-exit-y': motionDirection === 'up' ? negativeExitDistanceCss : exitDistanceCss,
        '--numeric-digit-rest-y': zeroDistanceCss,
        '--numeric-digit-blur': blurCss,
        '--numeric-digit-scale': DEFAULT_SCALE,
      }).forEach(([name, slotValue]) => {
        digit.style.setProperty(name, String(slotValue));
      });

      if (slot.shouldAnimate) {
        appendFace(
          digit,
          slot.previousChar ?? EMPTY_FACE,
          'numeric-text__face numeric-text__face--previous numeric-text__face--exit',
          {}
        );
        appendFace(
          digit,
          slot.currentChar,
          'numeric-text__face numeric-text__face--current numeric-text__face--enter',
          {}
        );
      } else {
        appendFace(
          digit,
          slot.currentChar,
          'numeric-text__face numeric-text__face--current',
          {}
        );
      }

      element.appendChild(digit);
    });

    this.scheduleAnimationCallbacks(slots, slotDelays, digitTiming.duration, partTiming.duration, resolvedStagger);
    this.previousParts = parts;
    this.previousValue = value;
    this.previousAnimationKey = animationKey;
    this.hasMounted = true;
  }

  private scheduleAnimationCallbacks(
    slots: NumericTextSlot[],
    slotDelays: Map<string, number>,
    digitDuration: number,
    partDuration: number,
    stagger: number
  ) {
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers.clear();

    const animatedSlots = slots.filter((slot) => slot.shouldAnimate);
    if (animatedSlots.length === 0) return;

    this.options.onAnimationsStart?.();

    animatedSlots.forEach((slot) => {
      const clearDelay =
        (slotDelays.get(slot.id) ?? 0) +
        (slot.isDigit ? digitDuration : partDuration) +
        140;
      const timer = window.setTimeout(() => {
        const activeAnimation = this.activeAnimations.get(slot.id);
        if (activeAnimation?.runId === slot.runId) {
          this.activeAnimations.delete(slot.id);
        }
        this.timers.delete(timer);
      }, clearDelay);
      this.timers.add(timer);
    });

    const totalDuration =
      Math.max(digitDuration, partDuration) +
      Math.max(0, animatedSlots.length - 1) * stagger;
    const finishTimer = window.setTimeout(() => {
      this.options.onAnimationsFinish?.();
      this.timers.delete(finishTimer);
    }, totalDuration);
    this.timers.add(finishTimer);
  }
}

const NumeraController = NumericTextController;
const NUMERA_PRESETS = NUMERIC_TEXT_PRESETS;

export type NumeraControllerOptions = NumericTextControllerOptions;
export type NumeraControllerUpdate = NumericTextControllerUpdate;

export {
  NumeraController,
  NUMERA_PRESETS,
  NUMERIC_TEXT_PRESETS,
  type NumericTextPreset as NumeraPreset,
  type NumericTextPreset,
  type NumericTextSpring as NumeraSpring,
  type NumericTextSpring,
  type NumericTextTiming as NumeraTiming,
  type NumericTextTiming,
  type NumericTextTrend as NumeraTrend,
  type NumericTextTrend,
  type NumericTextValue as NumeraValue,
  type NumericTextValue,
  type NumericTextVisualTiming as NumeraVisualTiming,
  type NumericTextVisualTiming,
};
