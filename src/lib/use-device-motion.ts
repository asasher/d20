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
  isSecureContext: boolean;
};

function useDeviceMotion() {
  const [motionData, setMotionData] = useState<MotionData>({
    acceleration: { x: null, y: null, z: null },
    accelerationIncludingGravity: { x: null, y: null, z: null },
    rotationRate: { alpha: null, beta: null, gamma: null },
    interval: 0,
    isSecureContext: window && (window.isSecureContext ?? false),
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
        isSecureContext:
          window && (window.isSecureContext ?? prev.isSecureContext),
      }));
    };

    if (
      "requestPermission" in DeviceMotionEvent &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      DeviceMotionEvent.requestPermission()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .then((permissionState: string) => {
          if (permissionState === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .catch((error: unknown) => {
          console.error(error);
        });
    }

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, []);

  return motionData;
}

export default useDeviceMotion;
