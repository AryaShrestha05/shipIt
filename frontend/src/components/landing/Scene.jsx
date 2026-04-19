import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

// ─── Galaxy generator ────────────────────────────────────────────────────────
const PARAMS = {
  count: 22000,
  radius: 5.2,
  branches: 5,
  spin: 1.15,
  randomness: 0.28,
  randomnessPower: 3,
  insideColor: '#e8fff5',
  outsideColor: '#7cffd4',
};

function buildGalaxy() {
  const { count, radius, branches, spin, randomness, randomnessPower, insideColor, outsideColor } = PARAMS;
  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);
  const aScale    = new Float32Array(count);
  const aRandom   = new Float32Array(count * 3);

  const cIn  = new THREE.Color(insideColor);
  const cOut = new THREE.Color(outsideColor);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r  = Math.random() * radius;
    const branchAngle = ((i % branches) / branches) * Math.PI * 2;
    const spinAngle   = r * spin;

    const jx = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;
    const jy = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r * 0.35;
    const jz = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * randomness * r;

    positions[i3]     = Math.cos(branchAngle + spinAngle) * r + jx;
    positions[i3 + 1] = jy;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + jz;

    const mixed = cIn.clone().lerp(cOut, r / radius);
    colors[i3]     = mixed.r;
    colors[i3 + 1] = mixed.g;
    colors[i3 + 2] = mixed.b;

    aScale[i] = Math.random();
    aRandom[i3]     = (Math.random() - 0.5) * 2;
    aRandom[i3 + 1] = (Math.random() - 0.5) * 2;
    aRandom[i3 + 2] = (Math.random() - 0.5) * 2;
  }

  return { positions, colors, aScale, aRandom };
}

// ─── Shaders ────────────────────────────────────────────────────────────────
// Per-vertex effects (cheap, runs on 22k particles in parallel on GPU):
//   1. differential rotation — inner arms orbit faster
//   2. mouse repulsion with tangential swirl — particles curve around cursor
//   3. velocity streak — fast cursor drags particles with it briefly
//   4. click ripple — expanding wave from last click, decays over time
//   5. brightening halo near cursor for a "focus lamp" feel
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform vec2  uMouse;
  uniform vec2  uMouseVel;
  uniform float uMouseForce;
  uniform float uRippleTime;
  uniform vec2  uRippleCenter;

  attribute float aScale;
  attribute vec3  aRandom;

  varying vec3  vColor;
  varying float vBoost;

  void main() {
    vec3 pos = position;
    float r = length(pos.xz);

    // 1. differential rotation
    float angle = uTime * (0.22 / max(r, 0.35));
    float c = cos(angle), s = sin(angle);
    pos.xz = mat2(c, -s, s, c) * pos.xz;

    // 2. mouse repulsion + tangential swirl (smoothstep for clean falloff)
    vec2 toMouse = pos.xz - uMouse;
    float d = length(toMouse) + 0.0001;
    float mouseFalloff = smoothstep(1.8, 0.0, d);
    // squared falloff — gentler reach, no sudden edge
    mouseFalloff *= mouseFalloff;
    vec2 radial  = toMouse / d;
    vec2 tangent = vec2(-radial.y, radial.x);
    pos.xz += (radial * 0.28 + tangent * 0.18) * mouseFalloff * uMouseForce;

    // 3. velocity streak — drags particles along with cursor motion
    pos.xz += uMouseVel * mouseFalloff * 0.12;

    // 4. click ripple: a moving ring that peaks at expanding radius
    vec2 toRip = pos.xz - uRippleCenter;
    float rd = length(toRip);
    float rippleR = uRippleTime * 3.2;
    float rippleBand = smoothstep(0.55, 0.0, abs(rd - rippleR));
    float rippleAmp  = exp(-uRippleTime * 1.3);
    pos.xz += (toRip / (rd + 0.0001)) * rippleBand * rippleAmp * 0.9;

    // breathing
    pos += aRandom * 0.02 * sin(uTime * 0.6 + aScale * 6.28);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.4 + aScale * 0.8) * (1.0 / -mv.z);

    vColor = color;
    vBoost = 1.0 + mouseFalloff * 0.35 + rippleBand * rippleAmp * 0.7;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vBoost;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = pow(1.0 - d * 2.0, 2.2);
    gl_FragColor = vec4(vColor * vBoost, alpha);
  }
`;

// ─── Galaxy component ────────────────────────────────────────────────────────
function Galaxy() {
  const pointsRef   = useRef();
  const materialRef = useRef();
  const { pointer, camera, raycaster } = useThree();
  const { positions, colors, aScale, aRandom } = useMemo(() => buildGalaxy(), []);

  // raycast helpers
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const world = useMemo(() => new THREE.Vector3(), []);
  const local = useMemo(() => new THREE.Vector3(), []);

  // damped cursor state (in galaxy-local XZ)
  const smooth   = useRef(new THREE.Vector2());
  const prev     = useRef(new THREE.Vector2());
  const velocity = useRef(new THREE.Vector2());

  const ripple     = useRef({ center: new THREE.Vector2(), time: 10 });

  useEffect(() => {
    const onDown = () => {
      if (!pointsRef.current) return;
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(plane, world)) {
        pointsRef.current.worldToLocal(local.copy(world));
        ripple.current.center.set(local.x, local.z);
        ripple.current.time = 0;
      }
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [pointer, camera, raycaster, plane, world, local]);

  useFrame((_, dt) => {
    const mat = materialRef.current;
    const pts = pointsRef.current;
    if (!mat || !pts) return;

    mat.uniforms.uTime.value += dt;

    // project screen cursor → galaxy-local XZ
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(plane, world)) {
      pts.worldToLocal(local.copy(world));
      // slower lerp → cursor chase is luxurious, not jittery
      const damp = Math.min(1, dt * 2.5);
      prev.current.copy(smooth.current);
      smooth.current.x += (local.x - smooth.current.x) * damp;
      smooth.current.y += (local.z - smooth.current.y) * damp;
      velocity.current
        .subVectors(smooth.current, prev.current)
        .multiplyScalar(1 / Math.max(dt, 0.016))
        .clampLength(0, 2);
    }

    mat.uniforms.uMouse.value.copy(smooth.current);
    mat.uniforms.uMouseVel.value.copy(velocity.current).multiplyScalar(0.05);

    ripple.current.time += dt;
    mat.uniforms.uRippleTime.value = ripple.current.time;
    mat.uniforms.uRippleCenter.value.copy(ripple.current.center);

    // gentle tilt — muted range, soft lerp
    const targetX = -pointer.y * 0.08 + Math.PI * 0.15;
    const targetZ =  pointer.x * 0.08;
    pts.rotation.x += (targetX - pts.rotation.x) * 0.02;
    pts.rotation.z += (targetZ - pts.rotation.z) * 0.02;
  });

  return (
    <points ref={pointsRef} rotation={[Math.PI * 0.15, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color"    count={colors.length / 3}    array={colors}    itemSize={3} />
        <bufferAttribute attach="attributes-aScale"   count={aScale.length}        array={aScale}    itemSize={1} />
        <bufferAttribute attach="attributes-aRandom"  count={aRandom.length / 3}   array={aRandom}   itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime:         { value: 0 },
          uSize:         { value: 32 },
          uMouse:        { value: new THREE.Vector2(0, 0) },
          uMouseVel:     { value: new THREE.Vector2(0, 0) },
          uMouseForce:   { value: 0.35 },
          uRippleTime:   { value: 10 },
          uRippleCenter: { value: new THREE.Vector2(0, 0) },
        }}
        vertexColors
        depthWrite={false}
        transparent
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Background star field ───────────────────────────────────────────────────
function Stars({ count = 3000 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 40 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.005;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.06} sizeAttenuation
        transparent opacity={0.55} depthWrite={false}
        blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function Scene() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [0, 2.2, 6.5], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Stars count={2500} />
        <Galaxy />
      </Canvas>
    </div>
  );
}
