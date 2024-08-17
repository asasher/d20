"use client";

import { Canvas } from "@react-three/fiber";
import {
  Physics,
  type ConvexPolyhedronProps,
  useConvexPolyhedron,
  type Triplet,
  type BoxProps,
  useBox,
  Debug,
} from "@react-three/cannon";
import { Text, OrbitControls, Bounds, Box } from "@react-three/drei";
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
import useDeviceMotion from "~/lib/use-device-motion";
import { Button } from "~/components/ui/button";
import { toFixed } from "~/lib/utils";

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
  radius,
  ...rest
}: Partial<ConvexPolyhedronProps> & { radius: number }) {
  const mass = 0.001;
  const geometry = useMemo(() => new IcosahedronGeometry(radius, 0), [radius]);
  const args = useMemo(() => toConvexProps(geometry), [geometry]);
  const [ref, api] = useConvexPolyhedron(
    () => ({ args, mass, position, rotation, ...rest }),
    useRef<Mesh>(null),
  );

  const rv = 30;
  const jv = 10;
  const jvMin = 10;
  const rollDice = useCallback(() => {
    api.velocity.set(
      (Math.random() - 0.5) * jv,
      (Math.random() - 0.5) * jv,
      Math.random() * jv + jvMin,
    );
    api.angularVelocity.set(
      (Math.random() - 0.5) * rv,
      (Math.random() - 0.5) * rv,
      (Math.random() - 0.5) * rv,
    );
  }, [api]);

  useEffect(() => {
    api.angularVelocity.set(
      (Math.random() - 0.5) * rv,
      (Math.random() - 0.5) * rv,
      (Math.random() - 0.5) * rv,
    );
  }, [api]);

  return (
    <mesh
      onClick={rollDice}
      receiveShadow
      castShadow
      // args={[radius, 0]}
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
            fontSize={radius * 0.25}
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
    </mesh>
  );
}

function Side({ position, rotation, args, ...rest }: Partial<BoxProps>) {
  const [ref] = useBox<Mesh>(() => ({
    position,
    rotation,
    args,
    ...rest,
  }));
  return (
    <Box receiveShadow {...{ position, ref, rotation, args }}>
      <shadowMaterial color={"#171717"} opacity={0.4} />
      {/* <meshStandardMaterial color="red" /> */}
    </Box>
  );
}

function Lights() {
  return (
    <>
      <ambientLight />
      <directionalLight position={[0, 0, 5]} castShadow />
    </>
  );
}

function Tray({ w, h, d }: { w: number; h: number; d: number }) {
  const wallThickness = 0.1;
  const measurements: {
    key: string;
    position: Triplet;
    rotation: Triplet;
    args: Triplet;
  }[] = [
    {
      key: "floor",
      position: [0, 0, -(d / 2)],
      rotation: [0, 0, 0],
      args: [w, h, wallThickness],
    }, // Bottom
    // {
    //   position: [0, 0, d / 2],
    //   rotation: [0, 0, 0],
    //   args: [w, h, wallThickness],
    // }, // Top
    {
      key: "left",
      position: [-(w / 2), 0, 0],
      rotation: [0, Math.PI / 2, 0],
      args: [d, h, wallThickness],
    }, // Left
    {
      key: "right",
      position: [w / 2, 0, 0],
      rotation: [0, Math.PI / 2, 0],
      args: [d, h, wallThickness],
    }, // Right
    {
      key: "up",
      position: [0, -(h / 2), 0],
      rotation: [Math.PI / 2, 0, 0],
      args: [w, d, wallThickness],
    }, // Up
    {
      key: "down",
      position: [0, h / 2, 0],
      rotation: [Math.PI / 2, 0, 0],
      args: [w, d, wallThickness],
    }, // Down
  ];
  return (
    <>
      {measurements.map(({ key, position, rotation, args }) => (
        <Side key={key} position={position} rotation={rotation} args={args} />
      ))}
    </>
  );
}

export default function Page() {
  const { requestPermission, motionData } = useDeviceMotion();

  const accX = toFixed(motionData.accelerationIncludingGravity.x ?? 0, 3);
  const accY = toFixed(motionData.accelerationIncludingGravity.y ?? 0, 3);
  let accZ = toFixed(motionData.accelerationIncludingGravity.z ?? 0, 3);
  if (accZ <= 0) {
    accZ = 9.81;
  }

  const mult = 10;
  const gravity: [number, number, number] = [
    mult * accX,
    mult * accY,
    -mult * accZ,
  ];

  console.log(gravity);

  return (
    <>
      <Canvas shadows camera={{ position: [0, 0, 2], fov: 20 }}>
        <color attach="background" args={["lightblue"]} />
        <OrbitControls />
        <Lights />
        <Physics gravity={gravity}>
          {/* <Debug scale={1.1}> */}
          <Bounds fit clip observe margin={1}>
            <Tray w={9} h={16} d={10} />
            <D20 radius={1} position={[0, 0, 0]} />
          </Bounds>
          {/* </Debug> */}
        </Physics>
      </Canvas>
      <div className="absolute left-2 top-2">
        <Button onClick={requestPermission}>Request Permission</Button>
        {/* <pre>{JSON.stringify(motionData, null, 2)}</pre> */}
      </div>
    </>
  );
}
