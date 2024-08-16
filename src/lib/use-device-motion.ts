import { useState, useEffect } from "react";

type MotionData = {
  acceleration: {
    x: number | null;
    y: number | null;
    z: number | null;
  };
  accelerationIncludingGravity: {
    x: number | null;
    y: number | null;
    z: number | null;
  };
  rotationRate: {
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  };
  interval: number;
};

function useDeviceMotion() {
  const [motionData, setMotionData] = useState<MotionData>({
    acceleration: { x: null, y: null, z: null },
    accelerationIncludingGravity: { x: null, y: null, z: null },
    rotationRate: { alpha: null, beta: null, gamma: null },
    interval: 0,
  });

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      setMotionData((prev) => ({
        acceleration: event.acceleration ?? prev.acceleration,
        accelerationIncludingGravity:
          event.accelerationIncludingGravity ??
          prev.accelerationIncludingGravity,
        rotationRate: event.rotationRate ?? prev.rotationRate,
        interval: event.interval ?? prev.interval,
      }));
    };

    window.addEventListener("devicemotion", handleMotion);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, []);

  return motionData;
}

export default useDeviceMotion;
