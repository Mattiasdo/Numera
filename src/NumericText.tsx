import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import './NumericText.css';
import { AnimatedDigit } from './AnimatedDigit';
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
  NumericTextMotionPreset,
  NumericTextPreset,
  NumericTextSpring,
  NumericTextTiming,
  NumericTextVisualTiming,
} from './motion';
import { createSpringTiming } from './springTiming';
import { useCanAnimate } from './useCanAnimate';

type NumericTextElementProps = Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  'children' | 'prefix'
>;

export interface NumericTextProps extends NumericTextElementProps {
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
  layoutTiming?: NumericTextTiming;
  opacityTiming?: NumericTextVisualTiming;
  duration?: number;
  stagger?: number;
  easing?: string;
  blur?: number | string;
  moveDistance?: number | string;
  spring?: Partial<NumericTextSpring>;
  layoutCorrection?: boolean;
  animationKey?: React.Key;
  animate?: boolean;
  isolate?: boolean;
  willChange?: boolean;
  respectReducedMotion?: boolean;
  onAnimationsStart?: () => void;
  onAnimationsFinish?: () => void;
}

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

interface NumericTextRect {
  left: number;
  top: number;
  viewportLeft: number;
  viewportTop: number;
  width: number;
  height: number;
}

interface NumericTextExitSlot {
  id: string;
  char: string;
  kind: NumericTextChar['kind'];
  isDigit: boolean;
  rect: NumericTextRect;
  delay: number;
}

const DEFAULT_EASING = 'cubic-bezier(0.2, 0, 0, 1)';
const DEFAULT_BLUR = 4.25;
const DEFAULT_SCALE = 0.8;
const DEFAULT_MOVE_DISTANCE = '0.42em';
const EMPTY_FACE = '\u00A0';
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

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
  if (typeof cssValue !== 'string') return 0;

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

function measureChildren(
  root: HTMLElement,
  nodes: Map<string, HTMLElement | null>
): Map<string, NumericTextRect> {
  const rootRect = root.getBoundingClientRect();
  const measures = new Map<string, NumericTextRect>();

  nodes.forEach((node, id) => {
    if (!node) return;
    const rect = node.getBoundingClientRect();
    measures.set(id, {
      left: rect.left - rootRect.left,
      top: rect.top - rootRect.top,
      viewportLeft: rect.left,
      viewportTop: rect.top,
      width: rect.width,
      height: rect.height,
    });
  });

  return measures;
}

function animateLayoutCorrection(
  node: HTMLElement,
  dx: number,
  dy: number,
  duration: number,
  easing: string
) {
  if (typeof node.animate !== 'function') {
    node.style.transition = 'none';
    node.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    node.getBoundingClientRect();

    window.requestAnimationFrame(() => {
      node.style.transition = `transform ${duration}ms ${easing}`;
      node.style.transform = 'translate3d(0, 0, 0)';
    });
    return;
  }

  const animation = node.animate(
    [
      { transform: `translate3d(${dx}px, ${dy}px, 0)` },
      { transform: 'translate3d(0, 0, 0)' },
    ],
    {
      duration,
      easing,
      composite: 'accumulate',
      fill: 'none',
    }
  );

  animation.finished.catch(() => undefined);
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

export const NumericText = React.forwardRef<HTMLSpanElement, NumericTextProps>(
  (
    {
      value,
      locales,
      format,
      prefix,
      suffix,
      preset = 'default',
      trend = 'auto',
      timing,
      digitTiming,
      partTiming,
      layoutTiming,
      opacityTiming,
      duration,
      stagger,
      easing,
      blur,
      moveDistance,
      spring,
      layoutCorrection = true,
      animationKey,
      animate = true,
      isolate = false,
      willChange = false,
      respectReducedMotion = true,
      onAnimationsStart,
      onAnimationsFinish,
      className,
      style,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const allowsMotion = useCanAnimate({ animate, respectReducedMotion });
    const rootRef = useRef<HTMLSpanElement | null>(null);
    const nodeRefs = useRef(new Map<string, HTMLElement | null>());
    const previousValueRef = useRef(value);
    const previousAnimationKeyRef = useRef<React.Key | undefined>(animationKey);
    const previousPartsRef = useRef<NumericTextChar[] | null>(null);
    const previousRectsRef = useRef(new Map<string, NumericTextRect>());
    const activeSlotAnimationsRef = useRef(new Map<string, ActiveSlotAnimation>());
    const hasMountedRef = useRef(false);
    const motionPreset = NUMERIC_TEXT_PRESETS[preset] ?? NUMERIC_TEXT_PRESETS.default;
    const baseTiming = {
      duration: timing?.duration ?? duration ?? motionPreset.duration,
      easing: timing?.easing ?? easing ?? motionPreset.easing,
      spring: {
        ...motionPreset.spring,
        ...spring,
        ...timing?.spring,
      },
    };
    const resolvedDigitTiming = resolveMotionTiming(baseTiming, digitTiming);
    const resolvedPartTiming = resolveMotionTiming(baseTiming, partTiming);
    const resolvedLayoutTiming = resolveMotionTiming(baseTiming, layoutTiming);
    const resolvedOpacityTiming = resolveVisualTiming(
      Math.max(140, resolvedDigitTiming.duration * 0.72),
      'cubic-bezier(0.2, 0, 0, 1)',
      opacityTiming
    );
    const resolvedStagger = stagger ?? motionPreset.stagger;
    const resolvedEasing = baseTiming.easing;
    const resolvedBlur = blur ?? motionPreset.blur;
    const resolvedScale = DEFAULT_SCALE;
    const resolvedMoveDistance = moveDistance ?? motionPreset.moveDistance;

    const parts = useMemo(
      () => formatNumericTextParts(value, locales, format, prefix, suffix),
      [value, locales, format, prefix, suffix]
    );
    const plainText = useMemo(() => getPlainNumericText(parts), [parts]);

    const previousParts = previousPartsRef.current ?? parts;
    const previousValue = previousValueRef.current;
    const previousAnimationKey = previousAnimationKeyRef.current;
    const animationKeyChanged = hasMountedRef.current && animationKey !== undefined && previousAnimationKey !== animationKey;
    const formattedPartsChanged = hasMountedRef.current && partsChanged(previousParts, parts);
    const direction = resolveDirection(trend, previousValue, value);
    const nonValueAnimation = animationKeyChanged || formattedPartsChanged;
    const motionDirection = direction === 'neutral' && nonValueAnimation ? 'up' : direction;
    const canAnimate =
      allowsMotion &&
      hasMountedRef.current &&
      (direction !== 'neutral' || nonValueAnimation);
    const animationRunId = `${plainText}:${motionDirection}:${String(value)}:${String(animationKey ?? '')}`;
    const distance = resolvedMoveDistance;
    const shouldAnimateStableSlots = animationKeyChanged && !formattedPartsChanged;
    const now = Date.now();
    const activeAnimationLifetime =
      Math.max(resolvedDigitTiming.duration, resolvedPartTiming.duration) +
      Math.max(0, parts.length - 1) * resolvedStagger +
      500;
    const slots = createSlots(previousParts, parts, canAnimate, animationRunId, shouldAnimateStableSlots).map((slot) => {
      if (slot.shouldAnimate) {
        activeSlotAnimationsRef.current.set(slot.id, {
          previousChar: slot.previousChar,
          currentChar: slot.currentChar,
          isNew: slot.isNew,
          runId: slot.runId,
          expiresAt: now + activeAnimationLifetime,
        });

        return slot;
      }

      const activeAnimation = activeSlotAnimationsRef.current.get(slot.id);
      if (activeAnimation && activeAnimation.expiresAt <= now) {
        activeSlotAnimationsRef.current.delete(slot.id);
        return slot;
      }

      if (!allowsMotion || !activeAnimation || activeAnimation.currentChar !== slot.currentChar) {
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
    const animatedCount = slots.filter((slot) => slot.shouldAnimate).length;
    const nextIds = new Set(parts.map((part) => part.id));
    const exitDistanceCss = scaleCssLength(distance, 1.28);
    const negativeExitDistanceCss = toNegativeCssLength(exitDistanceCss);
    const zeroDistanceCss = toZeroCssLength(distance);
    const blurCss = toCssLength(resolvedBlur);
    const digitSpringTiming = createSpringTiming(resolvedDigitTiming.spring);
    const partSpringTiming = createSpringTiming(resolvedPartTiming.spring);
    const layoutSpringTiming = createSpringTiming(resolvedLayoutTiming.spring);
    const hasBaseEasingOverride = timing?.easing !== undefined || easing !== undefined;
    const shouldUseDigitSpring =
      digitTiming?.easing === undefined &&
      !(hasBaseEasingOverride && digitTiming?.spring === undefined);
    const digitMotionEasing = shouldUseDigitSpring
      ? digitSpringTiming.easing
      : resolvedDigitTiming.easing;
    const digitExitMotionEasing = resolvedDigitTiming.easing;
    const shouldUsePartSpring =
      partTiming?.easing === undefined &&
      !(hasBaseEasingOverride && partTiming?.spring === undefined);
    const partMotionEasing = shouldUsePartSpring
      ? partSpringTiming.easing
      : resolvedPartTiming.easing;
    const partExitMotionEasing = resolvedPartTiming.easing;
    const shouldUseLayoutSpring =
      layoutTiming?.spring !== undefined &&
      layoutTiming.easing === undefined;
    const layoutMotionEasing = shouldUseLayoutSpring
      ? layoutSpringTiming.easing
      : resolvedLayoutTiming.easing;
    const exitingSlots: NumericTextExitSlot[] = canAnimate
      ? previousParts
        .filter((part) => !nextIds.has(part.id))
        .reverse()
        .map((part, index) => {
          const rect = previousRectsRef.current.get(part.id);
          if (!rect) return null;

          return {
            id: `exit:${part.id}:${animationRunId}`,
            char: part.char,
            kind: part.kind,
            isDigit: part.isDigit,
            rect,
            delay: part.isDigit ? index * resolvedStagger : 0,
          };
        })
        .filter((slot): slot is NumericTextExitSlot => Boolean(slot))
      : [];

    useIsomorphicLayoutEffect(() => {
      const root = rootRef.current;
      if (!root) return;

      if (!layoutCorrection) {
        previousRectsRef.current = new Map();
        previousPartsRef.current = parts;
        previousValueRef.current = value;
        previousAnimationKeyRef.current = animationKey;
        hasMountedRef.current = true;
        return;
      }

      const currentRects = measureChildren(root, nodeRefs.current);
      const currentPartsById = new Map(parts.map((part) => [part.id, part]));

      if (canAnimate) {
        currentRects.forEach((currentRect, id) => {
          const currentPart = currentPartsById.get(id);
          if (!currentPart) return;

          const previousRect = previousRectsRef.current.get(id);
          const node = nodeRefs.current.get(id);
          if (!previousRect || !node) return;

          const dx = previousRect.left - currentRect.left;
          const dy = previousRect.top - currentRect.top;
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

          animateLayoutCorrection(node, dx, dy, resolvedLayoutTiming.duration, layoutMotionEasing);
        });
      }

      previousRectsRef.current = currentRects;
      previousPartsRef.current = parts;
      previousValueRef.current = value;
      previousAnimationKeyRef.current = animationKey;
      hasMountedRef.current = true;
    }, [
      animationKey,
      animationRunId,
      canAnimate,
      layoutCorrection,
      layoutMotionEasing,
      parts,
      resolvedLayoutTiming.duration,
      value,
    ]);

    useEffect(() => {
      const shouldNotify = canAnimate && (animatedCount > 0 || exitingSlots.length > 0);
      let finishTimer: number | undefined;
      const clearTimers: number[] = [];

      slots.forEach((slot) => {
        if (!slot.shouldAnimate) return;

        const clearDelay =
          (slotDelays.get(slot.id) ?? 0) +
          (slot.isDigit ? resolvedDigitTiming.duration : resolvedPartTiming.duration) +
          140;

        clearTimers.push(window.setTimeout(() => {
          const activeAnimation = activeSlotAnimationsRef.current.get(slot.id);
          if (activeAnimation?.runId === slot.runId) {
            activeSlotAnimationsRef.current.delete(slot.id);
          }
        }, clearDelay));
      });

      if (shouldNotify) {
        onAnimationsStart?.();
        const totalAnimated = Math.max(animatedCount, exitingSlots.length);
        const totalDuration =
          Math.max(resolvedDigitTiming.duration, resolvedPartTiming.duration) +
          Math.max(0, totalAnimated - 1) * resolvedStagger;
        finishTimer = window.setTimeout(() => {
          onAnimationsFinish?.();
        }, totalDuration);
      }

      return () => {
        if (finishTimer) window.clearTimeout(finishTimer);
        clearTimers.forEach((timer) => window.clearTimeout(timer));
      };
    }, [
      animatedCount,
      animationRunId,
      canAnimate,
      resolvedDigitTiming.duration,
      resolvedPartTiming.duration,
      onAnimationsFinish,
      onAnimationsStart,
      exitingSlots.length,
      slotDelays,
      slots,
      resolvedStagger,
    ]);

    const setRootRef = (node: HTMLSpanElement | null) => {
      rootRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <span
        {...props}
        ref={setRootRef}
        aria-label={ariaLabel ?? plainText}
        className={['numeric-text', className].filter(Boolean).join(' ')}
        data-isolate={isolate ? 'true' : undefined}
        style={
          {
            ...style,
            '--numeric-text-duration': `${baseTiming.duration}ms`,
            '--numeric-text-stagger': `${resolvedStagger}ms`,
            '--numeric-text-ease': resolvedEasing,
            '--numeric-part-duration': `${resolvedPartTiming.duration}ms`,
            '--numeric-part-motion-ease': partMotionEasing,
            '--numeric-part-visual-duration': `${resolvedOpacityTiming.duration}ms`,
            '--numeric-part-visual-ease': resolvedOpacityTiming.easing,
            '--numeric-text-blur': toCssLength(resolvedBlur),
            '--numeric-text-mid-blur': toScaledCssLength(resolvedBlur, 0.45),
            '--numeric-text-soft-blur': toScaledCssLength(resolvedBlur, 0.18),
            '--numeric-text-scale': resolvedScale,
            '--numeric-text-move-distance': toCssLength(distance, '%'),
            '--numeric-text-move-distance-negative': toNegativeCssLength(distance),
            '--numeric-text-move-distance-mid': toHalfCssLength(distance),
            '--numeric-text-move-distance-mid-negative': toNegativeCssLength(toHalfCssLength(distance)),
            '--numeric-layout-duration': `${resolvedLayoutTiming.duration}ms`,
            '--numeric-layout-motion-ease': layoutMotionEasing,
            '--numeric-digit-duration': `${resolvedDigitTiming.duration}ms`,
            '--numeric-digit-visual-duration': `${resolvedOpacityTiming.duration}ms`,
            '--numeric-digit-motion-ease': digitMotionEasing,
            '--numeric-digit-enter-motion-ease': digitMotionEasing,
            '--numeric-digit-exit-motion-ease': digitExitMotionEasing,
            '--numeric-digit-visual-ease': resolvedOpacityTiming.easing,
            '--numeric-digit-rest-y': zeroDistanceCss,
            '--numeric-digit-exit-y': motionDirection === 'up' ? negativeExitDistanceCss : exitDistanceCss,
            '--numeric-digit-blur': blurCss,
            '--numeric-digit-scale': resolvedScale,
          } as React.CSSProperties
        }
      >
        {slots.map((slot) => {
          const { currentChar, id, isDigit, isNew, kind, previousChar, runId, shouldAnimate } = slot;
          const delay = slotDelays.get(id) ?? 0;
          const slotStyle = {
            '--numeric-text-delay': `${delay}ms`,
            '--numeric-part-delay': `${delay}ms`,
            '--numeric-part-enter-y': motionDirection === 'up'
              ? toHalfCssLength(distance)
              : toNegativeCssLength(toHalfCssLength(distance)),
            '--numeric-part-exit-y': motionDirection === 'up'
              ? toNegativeCssLength(toHalfCssLength(distance))
              : toHalfCssLength(distance),
          } as React.CSSProperties;

          if (!isDigit) {
            const shouldSwapPart = shouldAnimate && !isNew && previousChar !== undefined && previousChar !== currentChar;

            return (
              <span
                key={id}
                ref={(node) => {
                  nodeRefs.current.set(id, node);
                }}
                className="numeric-text__part"
                data-kind={kind}
                data-animate={shouldAnimate ? 'true' : undefined}
                data-motion={shouldAnimate ? (shouldSwapPart ? 'swap' : 'enter') : undefined}
                style={slotStyle}
              >
                {shouldSwapPart && (
                  <span className="numeric-text__part-value numeric-text__part-value--previous">
                    {previousChar}
                  </span>
                )}
                <span className="numeric-text__part-value numeric-text__part-value--current">
                  {currentChar}
                </span>
              </span>
            );
          }

          const oldChar = previousChar ?? EMPTY_FACE;
          return (
            <AnimatedDigit
              key={id}
              ref={(node) => {
                nodeRefs.current.set(id, node);
              }}
              value={currentChar}
              previousValue={oldChar}
              shouldAnimate={shouldAnimate}
              direction={motionDirection}
              duration={resolvedDigitTiming.duration}
              easing={digitMotionEasing}
              exitEasing={digitExitMotionEasing}
              visualDuration={resolvedOpacityTiming.duration}
              visualEasing={resolvedOpacityTiming.easing}
              blur={resolvedBlur}
              scale={resolvedScale}
              moveDistance={distance}
              exitMoveDistance={exitDistanceCss}
              delay={delay}
              spring={resolvedDigitTiming.spring}
              className="numeric-text__digit"
              faceClassName="numeric-text__face"
              previousClassName="numeric-text__face--previous"
              currentClassName="numeric-text__face--current"
              data-animate={shouldAnimate ? 'true' : undefined}
              data-direction={motionDirection}
              data-new={isNew ? 'true' : undefined}
              data-will-change={willChange ? 'true' : undefined}
              style={slotStyle}
              aria-hidden="true"
              animationKey={shouldAnimate ? runId : id}
              willChange={willChange}
            />
          );
        })}

        {exitingSlots.map((slot) => (
          <span
            key={slot.id}
            aria-hidden="true"
            className="numeric-text__exit numeric-text__exit--animate"
            data-direction={motionDirection}
            data-kind={slot.kind}
            data-digit={slot.isDigit ? 'true' : undefined}
            style={
              {
                left: `${slot.rect.viewportLeft}px`,
                top: `${slot.rect.viewportTop}px`,
                width: `${slot.rect.width}px`,
                height: `${slot.rect.height}px`,
                '--numeric-text-delay': `${slot.delay}ms`,
                '--numeric-digit-delay': `${slot.delay}ms`,
                '--numeric-digit-duration': `${slot.isDigit ? resolvedDigitTiming.duration : resolvedPartTiming.duration}ms`,
                '--numeric-digit-visual-duration': `${resolvedOpacityTiming.duration}ms`,
                '--numeric-digit-motion-ease': slot.isDigit ? digitMotionEasing : partMotionEasing,
                '--numeric-digit-enter-motion-ease': slot.isDigit ? digitMotionEasing : partMotionEasing,
                '--numeric-digit-exit-motion-ease': slot.isDigit ? digitExitMotionEasing : partExitMotionEasing,
                '--numeric-digit-visual-ease': resolvedOpacityTiming.easing,
                '--numeric-digit-rest-y': zeroDistanceCss,
                '--numeric-digit-exit-y': motionDirection === 'up'
                  ? slot.isDigit
                    ? negativeExitDistanceCss
                    : toHalfCssLength(distance)
                  : slot.isDigit
                    ? exitDistanceCss
                    : toHalfCssLength(distance),
                '--numeric-digit-blur': blurCss,
                '--numeric-digit-scale': slot.isDigit ? resolvedScale : 0.98,
              } as React.CSSProperties
            }
          >
            {slot.char}
          </span>
        ))}
      </span>
    );
  }
);

NumericText.displayName = 'Numorph';

export default NumericText;
