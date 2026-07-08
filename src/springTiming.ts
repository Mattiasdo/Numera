export interface SpringTimingOptions {
  stiffness: number;
  damping: number;
  mass: number;
  precision?: number;
}

export interface SpringTiming {
  easing: string;
  duration: number;
}

const timingCache = new Map<string, SpringTiming>();

function springProgress(time: number, angularFrequency: number, dampingRatio: number) {
  if (dampingRatio < 1) {
    const dampedFrequency = angularFrequency * Math.sqrt(1 - dampingRatio * dampingRatio);
    const envelope = Math.exp(-dampingRatio * angularFrequency * time);
    const motion =
      Math.cos(dampedFrequency * time) +
      (dampingRatio * angularFrequency / dampedFrequency) * Math.sin(dampedFrequency * time);

    return 1 - envelope * motion;
  }

  const root = Math.sqrt(dampingRatio * dampingRatio - 1);
  const slow = -angularFrequency * (dampingRatio - root);
  const fast = -angularFrequency * (dampingRatio + root);
  const coefficient = -fast / (slow - fast);

  return 1 - (1 - coefficient) * Math.exp(fast * time) - coefficient * Math.exp(slow * time);
}

function resolveSettledDuration(
  angularFrequency: number,
  dampingRatio: number,
  precision: number
) {
  let settledFor = 0;

  for (let time = 0; time < 10; time += 0.001) {
    if (Math.abs(springProgress(time, angularFrequency, dampingRatio) - 1) > precision) {
      settledFor = 0;
    } else {
      settledFor += 0.001;
      if (settledFor > 0.1) return Math.ceil((time - settledFor + 0.001) * 1000);
    }
  }

  return 10000;
}

export function createSpringTiming({
  stiffness,
  damping,
  mass,
  precision = 0.001,
}: SpringTimingOptions): SpringTiming {
  const cacheKey = `${stiffness}:${damping}:${mass}:${precision}`;
  const cached = timingCache.get(cacheKey);
  if (cached) return cached;

  const angularFrequency = Math.sqrt(stiffness / mass);
  const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
  const duration = resolveSettledDuration(angularFrequency, dampingRatio, precision);
  const sampleCount = Math.min(100, Math.max(32, Math.round(duration / 15)));
  const samples: string[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const time = (index / (sampleCount - 1)) * (duration / 1000);
    const value = index === sampleCount - 1 ? 1 : springProgress(time, angularFrequency, dampingRatio);
    samples.push(`${Math.round(value * 10000) / 10000}`);
  }

  while (samples.length > 2 && samples[samples.length - 2] === '1') {
    samples.splice(samples.length - 2, 1);
  }

  const timing = {
    easing: `linear(${samples.join(', ')})`,
    duration,
  };

  timingCache.set(cacheKey, timing);
  return timing;
}
