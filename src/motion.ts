export interface NumericTextSpring {
  stiffness: number;
  damping: number;
  mass: number;
}

export interface NumericTextTiming {
  duration?: number;
  easing?: string;
  spring?: Partial<NumericTextSpring>;
}

export interface NumericTextVisualTiming {
  duration?: number;
  easing?: string;
}

export interface NumericTextMotion {
  duration: number;
  stagger: number;
  easing: string;
  blur: number | string;
  moveDistance: number | string;
  spring: NumericTextSpring;
}

export const DEFAULT_NUMERIC_TEXT_MOTION: NumericTextMotion = {
  duration: 900,
  stagger: 35,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  blur: 4,
  moveDistance: '0.28em',
  spring: {
    stiffness: 650,
    damping: 80,
    mass: 10,
  },
};
