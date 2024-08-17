import { useState, useEffect, useCallback } from "react";

export type MotionData = {
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
    isSecureContext: false,
  });
  const [permissionState, setPermissionState] = useState<string>();

  const requestPermission = useCallback(() => {
    if (
      "requestPermission" in DeviceMotionEvent &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      console.log("Requesting permission.");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      DeviceMotionEvent.requestPermission()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .then((permissionState: string) => {
          if (permissionState === "granted") {
            setPermissionState(permissionState);
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .catch((error: unknown) => {
          console.error(error);
        });
    } else {
      console.log("No need to request permission.");
      setPermissionState("granted");
    }
  }, []);

  useEffect(() => {
    const handleMotion = (event: DeviceMotionEvent) => {
      console.log("Received device motion event.");
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

    if (permissionState === "granted") {
      console.log("Permission state is granted. Setting up event listener.");
      window.addEventListener("devicemotion", handleMotion);

      return () => {
        window.removeEventListener("devicemotion", handleMotion);
      };
    }
  }, [permissionState]);

  return { requestPermission, motionData };
}

export default useDeviceMotion;
