import React, { useEffect, useRef } from 'react';
import { createSpringTiming } from './springTiming';

export type AnimatedDigitDirection = 'up' | 'down' | 'neutral';

export interface AnimatedDigitSpring {
  stiffness: number;
  damping: number;
  mass: number;
}

export interface AnimatedDigitProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  value: string;
  previousValue?: string;
  animationKey?: React.Key;
  previousAnimationKey?: React.Key;
  shouldAnimate?: boolean;
  direction?: AnimatedDigitDirection;
  duration?: number;
  easing?: string;
  exitEasing?: string;
  visualDuration?: number;
  visualEasing?: string;
  blur?: number | string;
  scale?: number;
  moveDistance?: number | string;
  exitMoveDistance?: number | string;
  delay?: number;
  spring?: Partial<AnimatedDigitSpring>;
  faceClassName?: string;
  currentClassName?: string;
  previousClassName?: string;
  faceStyle?: React.CSSProperties;
  currentStyle?: React.CSSProperties;
  previousStyle?: React.CSSProperties;
  willChange?: boolean;
}

const DEFAULT_DURATION = 340;
const DEFAULT_EXIT_EASING = 'cubic-bezier(0.2, 0, 0, 1)';
const DEFAULT_BLUR = 4.25;
const DEFAULT_SCALE = 0.75;
const DEFAULT_MOVE_DISTANCE = '0.42em';
const DEFAULT_SPRING: AnimatedDigitSpring = {
  stiffness: 540,
  damping: 42,
  mass: 0.82,
};
function toCssLength(value: number | string, unit = 'px') {
  return typeof value === 'number' ? `${value}${unit}` : value;
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

function toZeroCssLength(value: number | string, unit = '%') {
  const cssValue = toCssLength(value, unit);
  const unitMatch = cssValue.match(/[a-z%]+$/i);
  return unitMatch ? `0${unitMatch[0]}` : 0;
}

const joinClassNames = (...classNames: Array<string | undefined>) => (
  classNames.filter(Boolean).join(' ') || undefined
);

interface ActiveDigitAnimation {
  id: string;
  value: string;
  previousValue: string;
  animationKey?: React.Key;
  direction: AnimatedDigitDirection;
}

export const AnimatedDigit = React.forwardRef<HTMLSpanElement, AnimatedDigitProps>(
  (
    {
      value,
      previousValue,
      animationKey,
      previousAnimationKey,
      shouldAnimate = true,
      direction = 'up',
      duration = DEFAULT_DURATION,
      easing,
      exitEasing,
      visualDuration,
      visualEasing,
      blur = DEFAULT_BLUR,
      scale = DEFAULT_SCALE,
      moveDistance = DEFAULT_MOVE_DISTANCE,
      exitMoveDistance,
      delay = 0,
      spring,
      className,
      style,
      faceClassName,
      currentClassName,
      previousClassName,
      faceStyle,
      currentStyle,
      previousStyle,
      willChange = false,
      ...props
    },
    ref
  ) => {
    const previousValueRef = useRef(value);
    const previousAnimationKeyRef = useRef<React.Key | undefined>(animationKey);
    const hasMountedRef = useRef(false);
    const hasExplicitPreviousValue = previousValue !== undefined;
    const hasExplicitPreviousAnimationKey = previousAnimationKey !== undefined;
    const resolvedPreviousValue = previousValue ?? previousValueRef.current;
    const resolvedPreviousAnimationKey = previousAnimationKey ?? previousAnimationKeyRef.current;
    const keyChanged =
      animationKey !== undefined &&
      resolvedPreviousAnimationKey !== animationKey;
    const valueChanged = resolvedPreviousValue !== value;
    const canCompare = hasMountedRef.current || hasExplicitPreviousValue || hasExplicitPreviousAnimationKey;
    const canStartAnimation =
      shouldAnimate &&
      direction !== 'neutral' &&
      canCompare &&
      (valueChanged || keyChanged);
    const resolvedSpring = {
      ...DEFAULT_SPRING,
      ...spring,
    };
    const springTiming = createSpringTiming(resolvedSpring);
    const motionDuration = duration ?? springTiming.duration;

    const pendingAnimation: ActiveDigitAnimation | null = canStartAnimation
      ? {
        id: `${String(resolvedPreviousAnimationKey ?? '')}:${resolvedPreviousValue}->${String(animationKey ?? '')}:${value}:${direction}`,
        value,
        previousValue: resolvedPreviousValue,
        animationKey,
        direction,
      }
      : null;
    const renderedAnimation = pendingAnimation;
    const isAnimating = Boolean(renderedAnimation);
    const renderDirection = renderedAnimation?.direction ?? direction;
    const distanceCss = toCssLength(moveDistance, '%');
    const exitDistanceCss = toCssLength(exitMoveDistance ?? scaleCssLength(moveDistance, 1.28), '%');
    const negativeDistanceCss = toNegativeCssLength(distanceCss);
    const negativeExitDistanceCss = toNegativeCssLength(exitDistanceCss);
    const zeroDistanceCss = toZeroCssLength(moveDistance);
    const blurCss = toCssLength(blur);
    const resolvedEnterMotionEasing = easing ?? springTiming.easing;
    const resolvedExitMotionEasing = exitEasing ?? DEFAULT_EXIT_EASING;
    const resolvedVisualDuration = visualDuration ?? Math.max(140, motionDuration * 0.72);
    const resolvedVisualEasing = visualEasing ?? 'cubic-bezier(0.2, 0, 0, 1)';
    const enterFromY = renderDirection === 'up' ? distanceCss : negativeDistanceCss;
    const exitToY = renderDirection === 'up' ? negativeExitDistanceCss : exitDistanceCss;
    const rootStyle: React.CSSProperties = {
      position: 'relative',
      display: 'inline-block',
      width: '1ch',
      height: '1em',
      lineHeight: '1em',
      overflow: 'visible',
      ...style,
    };
    const sharedFaceStyle: React.CSSProperties = {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'inherit',
      fontSize: 'inherit',
      fontWeight: 'inherit',
      fontFeatureSettings: 'inherit',
      fontVariantNumeric: 'inherit',
      lineHeight: '1em',
      backfaceVisibility: 'hidden',
      willChange: willChange ? 'transform, opacity, filter' : undefined,
      ...faceStyle,
    };
    const animationVars = {
      '--numeric-digit-duration': `${motionDuration}ms`,
      '--numeric-digit-visual-duration': `${resolvedVisualDuration}ms`,
      '--numeric-digit-delay': `${delay}ms`,
      '--numeric-digit-motion-ease': resolvedEnterMotionEasing,
      '--numeric-digit-enter-motion-ease': resolvedEnterMotionEasing,
      '--numeric-digit-exit-motion-ease': resolvedExitMotionEasing,
      '--numeric-digit-visual-ease': resolvedVisualEasing,
      '--numeric-digit-enter-y': enterFromY,
      '--numeric-digit-exit-y': exitToY,
      '--numeric-digit-rest-y': zeroDistanceCss,
      '--numeric-digit-blur': blurCss,
      '--numeric-digit-scale': scale,
    } as React.CSSProperties;

    useEffect(() => {
      previousValueRef.current = value;
      previousAnimationKeyRef.current = animationKey;
      hasMountedRef.current = true;
    }, [value, animationKey]);

    return (
      <span {...props} ref={ref} className={className} style={rootStyle}>
        {isAnimating && renderedAnimation && (
          <span
            key={`previous:${renderedAnimation.id}`}
            className={joinClassNames(faceClassName, previousClassName, 'numeric-text__face--exit')}
            style={{
              ...sharedFaceStyle,
              ...animationVars,
              zIndex: 1,
              ...previousStyle,
            }}
          >
            {renderedAnimation.previousValue}
          </span>
        )}
        {isAnimating && renderedAnimation ? (
          <span
            key={`current:${renderedAnimation.id}`}
            className={joinClassNames(faceClassName, currentClassName, 'numeric-text__face--enter')}
            style={{
              ...sharedFaceStyle,
              ...animationVars,
              zIndex: 2,
              ...currentStyle,
            }}
          >
            {renderedAnimation.value}
          </span>
        ) : (
          <span
            key={`current:${String(animationKey ?? '')}:${value}`}
            className={joinClassNames(faceClassName, currentClassName)}
            style={{
              ...sharedFaceStyle,
              zIndex: 2,
              ...currentStyle,
            }}
          >
            {value}
          </span>
        )}
      </span>
    );
  }
);

AnimatedDigit.displayName = 'AnimatedDigit';

export default AnimatedDigit;
