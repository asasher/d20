import { useEffect, useState } from "react";

export default function useAspectRatio(defaultRatio: number) {
  const [aspectRatio, setAspectRatio] = useState<number>(defaultRatio);

  useEffect(() => {
    const onResize = () => {
      setAspectRatio(window.innerWidth / window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return aspectRatio;
}
