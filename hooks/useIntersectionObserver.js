import React from 'react';
import { useCallback, useEffect } from 'react';

const listeners = new WeakMap();

let io;

function getIO() {
  if (typeof io === `undefined` && typeof window !== `undefined` && window.IntersectionObserver) {
    io = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (listeners.has(entry.target)) {
            const cb = listeners.get(entry.target);
            if (entry.isIntersecting || entry.intersectionRatio > 0) {
              io.unobserve(entry.target);
              listeners.delete(entry.target);
              cb();
            }
          }
        });
      },
      { rootMargin: `50px` },
    );
  }

  return io;
}

export default function useIntersectionObserver({
  ref,
  onViewportEnter,
}) {
  const _onViewportEnter = useCallback(onViewportEnter, [onViewportEnter]);

  useEffect(() => {
    const observer = getIO();
    const target = ref.current;

    if (observer) {
      observer.observe(target);
      listeners.set(target, _onViewportEnter);
    } else {
      _onViewportEnter();
    }

    return () => {
      if (observer) {
        observer.unobserve(target);
        listeners.delete(target);
      }
    };
  }, [ref, _onViewportEnter]);

  return null;
}
