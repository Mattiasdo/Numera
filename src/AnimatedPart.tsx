import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { NumericTextPartKind } from './formatNumericText';

type AnimatedPartMotion = 'enter' | 'swap';

interface ActivePartAnimation {
  id: string;
  currentChar: string;
  previousChar?: string;
  motion: AnimatedPartMotion;
}

export interface AnimatedPartProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  currentChar: string;
  previousChar?: string;
  kind: NumericTextPartKind;
  runId: string;
  shouldAnimate: boolean;
  isNew: boolean;
  enabled: boolean;
}

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export const AnimatedPart = React.forwardRef<HTMLSpanElement, AnimatedPartProps>(
  (
    {
      currentChar,
      previousChar,
      kind,
      runId,
      shouldAnimate,
      isNew,
      enabled,
      className,
      ...props
    },
    ref
  ) => {
    const acceptedAnimationIdRef = useRef<string | null>(null);
    const completedAnimationNamesRef = useRef(new Set<string>());
    const [activeAnimation, setActiveAnimation] = useState<ActivePartAnimation | null>(null);
    const motion: AnimatedPartMotion =
      !isNew && previousChar !== undefined && previousChar !== currentChar ? 'swap' : 'enter';
    const pendingAnimation: ActivePartAnimation | null = shouldAnimate
      ? {
        id: `${runId}:${previousChar ?? ''}->${currentChar}:${motion}`,
        currentChar,
        previousChar,
        motion,
      }
      : null;
    const hasPendingAnimation = Boolean(
      pendingAnimation && pendingAnimation.id !== acceptedAnimationIdRef.current
    );
    const activeAnimationMatches = Boolean(
      enabled && activeAnimation?.currentChar === currentChar
    );
    const renderedAnimation = hasPendingAnimation
      ? pendingAnimation
      : activeAnimationMatches
        ? activeAnimation
        : null;

    useIsomorphicLayoutEffect(() => {
      if (!hasPendingAnimation || !pendingAnimation) return;

      acceptedAnimationIdRef.current = pendingAnimation.id;
      completedAnimationNamesRef.current.clear();
      setActiveAnimation(pendingAnimation);
    }, [hasPendingAnimation, pendingAnimation?.id]);

    useEffect(() => {
      if (!enabled) setActiveAnimation(null);
    }, [enabled]);

    const handleAnimationEnd = (event: React.AnimationEvent<HTMLSpanElement>) => {
      if (!renderedAnimation) return;

      const isEnterAnimation =
        renderedAnimation.motion === 'enter' &&
        event.target === event.currentTarget &&
        (
          event.animationName === 'numeric-text-part-enter-transform' ||
          event.animationName === 'numeric-text-part-enter-visual'
        );
      const isCompletedSwap =
        renderedAnimation.motion === 'swap' &&
        event.animationName === 'numeric-text-part-swap-in';
      if (!isEnterAnimation && !isCompletedSwap) return;

      if (isEnterAnimation) {
        completedAnimationNamesRef.current.add(event.animationName);
        if (completedAnimationNamesRef.current.size < 2) return;
      }

      const completedId = renderedAnimation.id;
      setActiveAnimation((current) => current?.id === completedId ? null : current);
    };

    return (
      <span
        {...props}
        ref={ref}
        className={className}
        data-kind={kind}
        data-animate={renderedAnimation ? 'true' : undefined}
        data-motion={renderedAnimation?.motion}
        onAnimationEnd={handleAnimationEnd}
      >
        {renderedAnimation?.motion === 'swap' && (
          <span className="numeric-text__part-value numeric-text__part-value--previous">
            {renderedAnimation.previousChar}
          </span>
        )}
        <span className="numeric-text__part-value numeric-text__part-value--current">
          {currentChar}
        </span>
      </span>
    );
  }
);

AnimatedPart.displayName = 'AnimatedPart';
