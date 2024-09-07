"use client";

import { useCallback, useRef, useState } from "react";
import { useTwoFingerGesture } from "~/lib/use-two-fingers-gesture";
import colors from "tailwindcss/colors";
import { useAnimationFrame } from "~/lib/use-animation-frame";

type Transform = {
  translation: {
    x: number;
    y: number;
  };
  scale: number;
  origin: {
    x: number;
    y: number;
  };
};

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewportDimensions, setViewportDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 1000, height: 1000 });
  const [transform, setTransform] = useState<Transform>({
    translation: {
      x: 0,
      y: 0,
    },
    scale: 1,
    origin: {
      x: 0,
      y: 0,
    },
  });
  const initialTransform = useRef<Transform | null>(null);
  const { ref: gestureArea } = useTwoFingerGesture<HTMLDivElement>({
    onGestureStart(gesture) {
      initialTransform.current = transform;
      console.log("Initial Gesture", gesture);
    },
    onGestureChange(gesture) {
      if (!initialTransform.current) {
        return;
      }
      setTransform(() => ({
        translation: {
          x: initialTransform.current!.translation.x + gesture.translation.x,
          y: initialTransform.current!.translation.y + gesture.translation.y,
        },
        scale: initialTransform.current!.scale * gesture.scale,
        origin: gesture.origin,
      }));
    },
    onGestureEnd() {
      initialTransform.current = null;
    },
  });

  const draw = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (transform) {
        ctx.translate(transform.origin.x, transform.origin.y);
        ctx.scale(transform.scale, transform.scale);
        ctx.translate(transform.translation.x, transform.translation.y);
        ctx.translate(-transform.origin.x, -transform.origin.y);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = 100;

      // Starting Box
      ctx.fillStyle = colors.green[700];
      ctx.moveTo(0, 0);
      ctx.lineTo(0, w);
      ctx.lineTo(w, w);
      ctx.lineTo(w, 0);
      ctx.closePath();
      ctx.fill();
    },
    [transform],
  );

  useAnimationFrame(() => {
    if (!canvasRef.current) return;
    const { width: containerWidth, height: containerHeight } =
      canvasRef.current.getBoundingClientRect();
    canvasRef.current.width = containerWidth;
    canvasRef.current.height = containerHeight;
    setViewportDimensions({
      height: containerHeight,
      width: containerWidth,
    });
    draw(canvasRef.current);
  });

  return (
    <div ref={gestureArea}>
      <canvas
        className="h-full w-full"
        ref={canvasRef}
        width={viewportDimensions.width}
        height={viewportDimensions.height}
      />
    </div>
  );
}
