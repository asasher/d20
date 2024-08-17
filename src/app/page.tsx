"use client";

import { Canvas } from "@react-three/fiber";
import {
  Physics,
  type ConvexPolyhedronProps,
  useConvexPolyhedron,
  type Triplet,
  type BoxProps,
  useBox,
} from "@react-three/cannon";
import {
  Text,
  Icosahedron,
  OrbitControls,
  Bounds,
  Box,
  useBounds,
} from "@react-three/drei";
import {
  type BufferGeometry,
  Euler,
  IcosahedronGeometry,
  type Mesh,
  Quaternion,
  Vector3,
} from "three";
import { Geometry } from "three-stdlib";
import { useCallback, useEffect, useMemo, useRef } from "react";
import useDeviceMotion, { MotionData } from "~/lib/use-device-motion";
import { Button } from "~/components/ui/button";

function toConvexProps(
  bufferGeometry: BufferGeometry,
): [vertices: Triplet[], faces: Triplet[]] {
  const geo = new Geometry().fromBufferGeometry(bufferGeometry);
  geo.mergeVertices();
  const vertices: Triplet[] = geo.vertices.map((v) => [v.x, v.y, v.z]);
  const faces: Triplet[] = geo.faces.map((f) => [f.a, f.b, f.c]);
  return [vertices, faces];
}

function D20({
  position,
  rotation,
  motionData,
  ...rest
}: Partial<ConvexPolyhedronProps> & { motionData: MotionData }) {
  const mass = 1;
  const geometry = useMemo(() => new IcosahedronGeometry(1, 0), []);
  const args = useMemo(() => toConvexProps(geometry), [geometry]);
  const [ref, api] = useConvexPolyhedron(
    () => ({ args, mass, position, rotation, ...rest }),
    useRef<Mesh>(null),
  );

  const rollDice = useCallback(() => {
    api.velocity.set(
      (Math.random() - 0.5) * 10,
      Math.random() * 5 + 3,
      (Math.random() - 0.5) * 10,
    );
    api.angularVelocity.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
    );
  }, [api]);

  useEffect(() => {
    api.angularVelocity.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
    );
  }, [api]);

  useEffect(() => {
    if (!position) return;
    const accX = motionData.accelerationIncludingGravity.x ?? 0;
    const accY = motionData.accelerationIncludingGravity.y ?? 0;
    const accZ = motionData.accelerationIncludingGravity.z ?? 0;
    const forceX = mass * accX;
    const forceY = mass * accY;
    const forceZ = mass * accZ;
    api.applyLocalForce([forceX, forceY, forceZ], position);
  }, [api, mass, position, motionData]);

  return (
    <Icosahedron
      onClick={rollDice}
      receiveShadow
      castShadow
      {...{ geometry, position, ref, rotation }}
    >
      <meshStandardMaterial color="orange" />
      {args[1].map((face, index) => {
        const [a, b, c] = face.map((i) => new Vector3(...args[0][i]!));
        const center = new Vector3().addVectors(a!, b!).add(c!).divideScalar(3);
        const normal = new Vector3()
          .subVectors(b!, a!)
          .cross(new Vector3().subVectors(c!, a!))
          .normalize();

        // Offset the text slightly along the normal
        const offset = normal.clone().multiplyScalar(0.05); // Adjust the scalar value as needed
        const position = center.clone().add(offset);

        const quaternion = new Quaternion().setFromUnitVectors(
          new Vector3(0, 0, 1),
          normal,
        );
        const rotation = new Euler().setFromQuaternion(quaternion);

        return (
          <Text
            key={index}
            position={position}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
            rotation={rotation}
            quaternion={quaternion}
          >
            {index + 1 === 6 ? "6." : index + 1 === 9 ? "9." : index + 1}
          </Text>
        );
      })}
    </Icosahedron>
  );
}

function Plane({ position, rotation, args, ...rest }: Partial<BoxProps>) {
  const [ref] = useBox<Mesh>(() => ({
    position,
    rotation,
    args,
    ...rest,
  }));
  return (
    <Box receiveShadow {...{ position, ref, rotation, args }}>
      <shadowMaterial color={"#171717"} opacity={0.4} />
    </Box>
  );
}

function Lights() {
  return (
    <>
      <ambientLight />
      <directionalLight position={[0, 5, 0]} castShadow />
    </>
  );
}

export default function Page() {
  const { requestPermission, motionData } = useDeviceMotion();
  return (
    <>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ alpha: false }}
        camera={{ position: [0, 10, 0], fov: 10 }}
      >
        <color attach="background" args={["lightblue"]} />
        <OrbitControls />
        <Lights />
        <Physics>
          <Bounds fit clip observe margin={1}>
            <Plane
              position={[0, -4.5, 0]}
              args={[9, 16, 1]}
              rotation={[-Math.PI / 2, 0, 0]}
            />
            <Plane
              position={[-4.5, 0, 0]}
              args={[16, 10, 1]}
              rotation={[0, Math.PI / 2, 0]}
            />
            <Plane
              position={[4.5, 0, 0]}
              args={[16, 10, 1]}
              rotation={[0, -Math.PI / 2, 0]}
            />
            <Plane
              position={[0, 0, -8]}
              args={[9, 10, 1]}
              rotation={[0, 0, 0]}
            />
            <Plane
              position={[0, 0, 8]}
              args={[9, 10, 1]}
              rotation={[0, Math.PI, 0]}
            />
            <D20 position={[0, 10, 0]} motionData={motionData} />
          </Bounds>
        </Physics>
      </Canvas>
      <div className="absolute left-2 top-2">
        <Button onClick={requestPermission}>Request Permission</Button>
        <pre>{JSON.stringify(motionData, null, 2)}</pre>
      </div>
    </>
  );
}
