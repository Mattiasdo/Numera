import React, { useRef, useState } from 'react';

export function AnimatedExit({
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  const [isPresent, setIsPresent] = useState(true);
  const completedAnimationNamesRef = useRef(new Set<string>());

  if (!isPresent) return null;

  return (
    <span
      {...props}
      onAnimationEnd={(event) => {
        props.onAnimationEnd?.(event);
        if (event.target !== event.currentTarget) return;
        if (
          event.animationName !== 'numeric-text-face-exit-transform' &&
          event.animationName !== 'numeric-text-face-exit-visual'
        ) return;

        completedAnimationNamesRef.current.add(event.animationName);
        if (completedAnimationNamesRef.current.size === 2) {
          setIsPresent(false);
        }
      }}
    >
      {children}
    </span>
  );
}
