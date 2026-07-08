export type NumericTextPreset = 'default' | 'soft' | 'snappy' | 'springy';

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

export interface NumericTextMotionPreset {
  duration: number;
  stagger: number;
  easing: string;
  blur: number | string;
  moveDistance: number | string;
  spring: NumericTextSpring;
}

export const NUMERIC_TEXT_PRESETS: Record<NumericTextPreset, NumericTextMotionPreset> = {
  default: {
    duration: 420,
    stagger: 28,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    blur: 3.5,
    moveDistance: '0.34em',
    spring: {
      stiffness: 420,
      damping: 38,
      mass: 0.9,
    },
  },
  soft: {
    duration: 520,
    stagger: 32,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    blur: 2.75,
    moveDistance: '0.24em',
    spring: {
      stiffness: 320,
      damping: 34,
      mass: 1,
    },
  },
  snappy: {
    duration: 260,
    stagger: 18,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    blur: 3,
    moveDistance: '0.3em',
    spring: {
      stiffness: 700,
      damping: 46,
      mass: 0.72,
    },
  },
  springy: {
    duration: 400,
    stagger: 26,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    blur: 3.1,
    moveDistance: '0.38em',
    spring: {
      stiffness: 620,
      damping: 33,
      mass: 0.9,
    },
  },
};

export function resolveMotionPreset(preset: NumericTextPreset | undefined) {
  return NUMERIC_TEXT_PRESETS[preset ?? 'default'] ?? NUMERIC_TEXT_PRESETS.default;
}

