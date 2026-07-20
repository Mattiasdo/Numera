import { useSyncExternalStore } from 'react';

export interface UseCanAnimateOptions {
  animate?: boolean;
  respectReducedMotion?: boolean;
}

interface MotionEnvironmentSnapshot {
  canUseDOM: boolean;
  isDocumentVisible: boolean;
  prefersReducedMotion: boolean;
}

const SERVER_SNAPSHOT: MotionEnvironmentSnapshot = {
  canUseDOM: false,
  isDocumentVisible: true,
  prefersReducedMotion: false,
};

const listeners = new Set<() => void>();
let mediaQuery: MediaQueryList | null =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
let snapshot = readMotionEnvironment();

function readMotionEnvironment(): MotionEnvironmentSnapshot {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return SERVER_SNAPSHOT;
  }

  return {
    canUseDOM: true,
    isDocumentVisible: document.visibilityState === 'visible',
    prefersReducedMotion: mediaQuery?.matches ?? false,
  };
}

function updateSnapshot() {
  const nextSnapshot = readMotionEnvironment();
  if (
    snapshot.canUseDOM === nextSnapshot.canUseDOM &&
    snapshot.isDocumentVisible === nextSnapshot.isDocumentVisible &&
    snapshot.prefersReducedMotion === nextSnapshot.prefersReducedMotion
  ) {
    return;
  }

  snapshot = nextSnapshot;
  listeners.forEach((listener) => listener());
}

function startListening() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  mediaQuery ??= typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  document.addEventListener('visibilitychange', updateSnapshot);
  mediaQuery?.addEventListener('change', updateSnapshot);
  updateSnapshot();
}

function stopListening() {
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', updateSnapshot);
  }
  mediaQuery?.removeEventListener('change', updateSnapshot);
  mediaQuery = null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) startListening();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopListening();
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export function useCanAnimate({
  animate = true,
  respectReducedMotion = true,
}: UseCanAnimateOptions = {}) {
  const environment = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    animate &&
    environment.canUseDOM &&
    environment.isDocumentVisible &&
    !(respectReducedMotion && environment.prefersReducedMotion)
  );
}
