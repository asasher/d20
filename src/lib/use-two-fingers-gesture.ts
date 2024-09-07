import { useRef, useCallback, useEffect, useState } from "react";

// Types
type Point = { x: number; y: number };
type Gesture = {
  origin: Point;
  translation: Point;
  scale: number;
  rotation: number;
};

type GestureHandlers = {
  onGestureStart?: (gesture: Gesture) => void;
  onGestureChange?: (gesture: Gesture) => void;
  onGestureEnd?: (gesture: Gesture) => void;
};

// Constants
const WHEEL_SCALE_SPEEDUP = 2;
const WHEEL_TRANSLATION_SPEEDUP = 2;

// Helper functions
const midpoint = (t1: Touch, t2: Touch): Point => ({
  x: (t1.clientX + t2.clientX) / 2,
  y: (t1.clientY + t2.clientY) / 2,
});

const distance = (t1: Touch, t2: Touch): number =>
  Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

const angle = (t1: Touch, t2: Touch): number =>
  (Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * 180) /
  Math.PI;

const normalizeWheel = (e: WheelEvent): [number, number] => {
  let dx = e.deltaX;
  let dy = e.deltaY;

  if (dx === 0 && e.shiftKey) {
    [dx, dy] = [dy, dx];
  }

  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    dx *= 8;
    dy *= 8;
  } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    dx *= 24;
    dy *= 24;
  }

  dy = Math.sign(dy) * Math.min(24, Math.abs(dy));

  return [dx, dy];
};

export function useTwoFingerGesture<T extends HTMLElement>({
  onGestureStart,
  onGestureChange,
  onGestureEnd,
}: GestureHandlers = {}) {
  const elementRef = useRef<T | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const initialTouchesRef = useRef<Touch[]>([]);
  const timerRef = useRef<number | null>(null);

  const [isGesturing, setIsGesturing] = useState(false);

  const handleGestureStart = useCallback(
    (newGesture: Gesture) => {
      gestureRef.current = newGesture;
      setIsGesturing(true);
      onGestureStart?.(newGesture);
    },
    [onGestureStart],
  );

  const handleGestureChange = useCallback(
    (newGesture: Gesture) => {
      gestureRef.current = newGesture;
      onGestureChange?.(newGesture);
    },
    [onGestureChange],
  );

  const handleGestureEnd = useCallback(() => {
    if (gestureRef.current) {
      onGestureEnd?.(gestureRef.current);
    }
    gestureRef.current = null;
    setIsGesturing(false);
  }, [onGestureEnd]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.cancelable) e.preventDefault();

      const [dx, dy] = normalizeWheel(e);

      if (!gestureRef.current) {
        console.log("Reseting Gesture Ref");
        handleGestureStart({
          origin: { x: e.clientX, y: e.clientY },
          scale: 1,
          rotation: 0,
          translation: { x: 0, y: 0 },
        });
      }

      if (e.ctrlKey) {
        // Pinch-zoom
        const factor =
          dy <= 0
            ? 1 - (WHEEL_SCALE_SPEEDUP * dy) / 100
            : 1 / (1 + (WHEEL_SCALE_SPEEDUP * dy) / 100);

        handleGestureChange({
          ...gestureRef.current!,
          scale: gestureRef.current!.scale * factor,
        });
      } else {
        // Panning
        handleGestureChange({
          ...gestureRef.current!,
          translation: {
            x:
              gestureRef.current!.translation.x -
              WHEEL_TRANSLATION_SPEEDUP * dx,
            y:
              gestureRef.current!.translation.y -
              WHEEL_TRANSLATION_SPEEDUP * dy,
          },
        });
      }

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(handleGestureEnd, 200);
    },
    [handleGestureStart, handleGestureChange, handleGestureEnd],
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();

        initialTouchesRef.current = Array.from(e.touches);
        const mp = midpoint(e.touches[0]!, e.touches[1]!);

        handleGestureStart({
          origin: mp,
          scale: 1,
          rotation: 0,
          translation: { x: 0, y: 0 },
        });
      }
    },
    [handleGestureStart],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();

        const [t1, t2] = [e.touches.item(0)!, e.touches.item(1)!];
        const [i1, i2] = initialTouchesRef.current as [Touch, Touch];
        const mp_init = midpoint(i1, i2);
        const mp_curr = midpoint(t1, t2);

        handleGestureChange({
          origin: mp_init,
          scale: distance(t1, t2) / distance(i1, i2),
          rotation: angle(t1, t2) - angle(i1, i2),
          translation: {
            x: mp_curr.x - mp_init.x,
            y: mp_curr.y - mp_init.y,
          },
        });
      }
    },
    [handleGestureChange],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length < 2 && gestureRef.current) {
        handleGestureEnd();
      }
    },
    [handleGestureEnd],
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("wheel", handleWheel as EventListener, {
      passive: false,
    });
    element.addEventListener("touchstart", handleTouchStart as EventListener, {
      passive: false,
    });
    element.addEventListener("touchmove", handleTouchMove as EventListener, {
      passive: false,
    });
    element.addEventListener("touchend", handleTouchEnd as EventListener);
    element.addEventListener("touchcancel", handleTouchEnd as EventListener);

    return () => {
      element.removeEventListener("wheel", handleWheel as EventListener);
      element.removeEventListener(
        "touchstart",
        handleTouchStart as EventListener,
      );
      element.removeEventListener(
        "touchmove",
        handleTouchMove as EventListener,
      );
      element.removeEventListener("touchend", handleTouchEnd as EventListener);
      element.removeEventListener(
        "touchcancel",
        handleTouchEnd as EventListener,
      );
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    ref: elementRef,
    gesture: gestureRef.current,
    isGesturing,
  };
}
