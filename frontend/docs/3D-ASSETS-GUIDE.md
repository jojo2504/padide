# 🎮 CYCLR 3D Assets Implementation Guide

## Overview

This guide explains how to add custom 3D assets to CYCLR using React Three Fiber (R3F) with the "Eco-Playful Solarpunk" aesthetic.

---

## 🎨 Design Philosophy

### The "Clay" Material
All 3D objects should look like soft plastic or modeling clay:
- Low roughness (0.3-0.5)
- Subtle distortion for organic feel
- Soft shadows
- Friendly, approachable shapes

### Color Palette
- **Day Mode**: Bright pastels, leaf green (#22C55E), sky blue (#38BDF8)
- **Night Mode**: Bioluminescent glows, deeper saturation

---

## 📦 Required Packages

```bash
npm install @react-three/fiber @react-three/drei three
npm install @types/three --save-dev
```

---

## 🌳 Example 1: Wiggling Tree

```tsx
// components/3d/WigglingTree.tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface WigglingTreeProps {
  position?: [number, number, number];
  scale?: number;
  color?: string;
}

export default function WigglingTree({ 
  position = [0, 0, 0], 
  scale = 1,
  color = '#22C55E' 
}: WigglingTreeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Wiggle animation
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle rotation wiggle
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });
  
  return (
    <group position={position} scale={scale}>
      {/* Tree trunk */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
        <MeshDistortMaterial 
          color="#8B4513"
          roughness={0.4}
          distort={0.1}
          speed={2}
        />
      </mesh>
      
      {/* Tree foliage (clay sphere) */}
      <mesh ref={meshRef} position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <MeshDistortMaterial 
          color={color}
          roughness={0.3}
          distort={0.2}
          speed={3}
        />
      </mesh>
    </group>
  );
}
```

---

## 🤖 Example 2: Head-Tracking Robot

```tsx
// components/3d/RecyclingBot.tsx
'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MeshDistortMaterial, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export default function RecyclingBot({ position = [0, 0, 0] }) {
  const headRef = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();
  
  // Head tracking - follows mouse
  useFrame(() => {
    if (headRef.current) {
      // Smoothly look towards cursor
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        pointer.x * 0.5,
        0.1
      );
      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x,
        -pointer.y * 0.3,
        0.1
      );
    }
  });
  
  return (
    <group position={position}>
      {/* Body */}
      <RoundedBox args={[1, 1.2, 0.8]} radius={0.2}>
        <MeshDistortMaterial 
          color="#22C55E"
          roughness={0.3}
          distort={0.05}
        />
      </RoundedBox>
      
      {/* Head */}
      <group ref={headRef} position={[0, 1, 0]}>
        <RoundedBox args={[0.8, 0.6, 0.6]} radius={0.15}>
          <MeshDistortMaterial 
            color="#22C55E"
            roughness={0.3}
            distort={0.05}
          />
        </RoundedBox>
        
        {/* Eyes */}
        <mesh position={[-0.2, 0.1, 0.31]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0.2, 0.1, 0.31]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="white" />
        </mesh>
        
        {/* Pupils (follow mouse more) */}
        <mesh position={[-0.2 + pointer.x * 0.05, 0.1 + pointer.y * 0.03, 0.35]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[0.2 + pointer.x * 0.05, 0.1 + pointer.y * 0.03, 0.35]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </group>
    </group>
  );
}
```

---

## 🔐 Example 3: Breathing Vault

```tsx
// components/3d/BreathingVault.tsx
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';

export default function BreathingVault({ position = [0, 0, 0] }) {
  const vaultRef = useRef<THREE.Group>(null);
  const doorRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (vaultRef.current) {
      // Breathing scale animation
      const breathe = Math.sin(state.clock.elapsedTime * 0.5) * 0.02 + 1;
      vaultRef.current.scale.setScalar(breathe);
    }
    
    if (doorRef.current) {
      // Door slight rotation
      doorRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.02;
    }
  });
  
  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={vaultRef} position={position}>
        {/* Vault body */}
        <RoundedBox args={[2, 2.5, 1.5]} radius={0.2}>
          <MeshDistortMaterial 
            color="#64748B"
            roughness={0.2}
            metalness={0.3}
            distort={0.02}
          />
        </RoundedBox>
        
        {/* Vault door */}
        <group ref={doorRef} position={[0, 0, 0.76]}>
          <RoundedBox args={[1.6, 2.1, 0.1]} radius={0.1}>
            <MeshDistortMaterial 
              color="#94A3B8"
              roughness={0.2}
              metalness={0.4}
            />
          </RoundedBox>
          
          {/* XRPL Logo (glowing) */}
          <mesh position={[0, 0.3, 0.06]}>
            <torusGeometry args={[0.3, 0.05, 16, 32]} />
            <meshStandardMaterial 
              color="#38BDF8"
              emissive="#38BDF8"
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {/* Handle */}
          <mesh position={[0.5, 0, 0.1]}>
            <cylinderGeometry args={[0.08, 0.08, 0.3, 16]} />
            <meshStandardMaterial color="#FCD34D" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}
```

---

## 🎬 Setting Up a 3D Scene

```tsx
// components/3d/Scene.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { 
  Environment, 
  PerspectiveCamera, 
  OrbitControls,
  ContactShadows 
} from '@react-three/drei';
import WigglingTree from './WigglingTree';
import RecyclingBot from './RecyclingBot';

interface SceneProps {
  isDayMode?: boolean;
}

export default function Scene({ isDayMode = true }: SceneProps) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]} // Responsive DPI
    >
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={50} />
      
      {/* Lighting */}
      <ambientLight intensity={isDayMode ? 0.8 : 0.3} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={isDayMode ? 1 : 0.5}
        castShadow
      />
      
      {/* Point lights for night mode glow */}
      {!isDayMode && (
        <>
          <pointLight position={[-2, 1, 0]} color="#38BDF8" intensity={2} />
          <pointLight position={[2, 1, 0]} color="#22C55E" intensity={2} />
        </>
      )}
      
      {/* Environment for reflections */}
      <Environment preset={isDayMode ? 'park' : 'night'} />
      
      {/* 3D Objects */}
      <WigglingTree position={[-2, 0, 0]} />
      <WigglingTree position={[2, 0, 0]} color="#4ADE80" />
      <RecyclingBot position={[0, 0, 0]} />
      
      {/* Ground shadows */}
      <ContactShadows 
        position={[0, -0.5, 0]}
        opacity={isDayMode ? 0.4 : 0.2}
        blur={2}
      />
      
      {/* Optional: Orbit controls for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <OrbitControls enableZoom={false} />
      )}
    </Canvas>
  );
}
```

---

## 🎯 Performance Tips

### 1. Use Instanced Meshes for Many Objects

```tsx
import { Instances, Instance } from '@react-three/drei';

function ManyTrees({ count = 100 }) {
  return (
    <Instances limit={count}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#22C55E" />
      
      {Array.from({ length: count }).map((_, i) => (
        <Instance 
          key={i}
          position={[
            Math.random() * 20 - 10,
            0,
            Math.random() * 20 - 10
          ]}
          scale={0.5 + Math.random() * 0.5}
        />
      ))}
    </Instances>
  );
}
```

### 2. Use Leva for Dev Tweaking

```bash
npm install leva
```

```tsx
import { useControls } from 'leva';

function TweakableTree() {
  const { distort, speed, color } = useControls({
    distort: { value: 0.2, min: 0, max: 1 },
    speed: { value: 3, min: 0, max: 10 },
    color: '#22C55E',
  });
  
  return (
    <mesh>
      <sphereGeometry />
      <MeshDistortMaterial 
        color={color}
        distort={distort}
        speed={speed}
      />
    </mesh>
  );
}
```

### 3. Lazy Load 3D Components

```tsx
import dynamic from 'next/dynamic';

const Scene3D = dynamic(() => import('./Scene'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-clay h-96 rounded-3xl" />
});
```

---

## 🗂 File Structure Recommendation

```
src/
├── components/
│   └── 3d/
│       ├── Scene.tsx           # Main canvas wrapper
│       ├── WigglingTree.tsx    # Animated tree
│       ├── RecyclingBot.tsx    # Head-tracking robot
│       ├── BreathingVault.tsx  # Staking vault
│       ├── ClayPhone.tsx       # Hero phone model
│       └── materials/
│           └── ClayMaterial.tsx # Reusable clay material
```

---

## 🎨 Loading Custom 3D Models

### Using GLTF Models

```tsx
import { useGLTF } from '@react-three/drei';

function CustomModel() {
  const { scene } = useGLTF('/models/custom-model.glb');
  
  return <primitive object={scene} scale={0.5} />;
}

// Preload for better performance
useGLTF.preload('/models/custom-model.glb');
```

### Converting Models to Clay Style

After loading, replace materials:

```tsx
import { useGLTF } from '@react-three/drei';
import { MeshDistortMaterial } from '@react-three/drei';

function ClayModel() {
  const { scene } = useGLTF('/models/product.glb');
  
  // Clone and replace materials
  const clonedScene = scene.clone();
  clonedScene.traverse((child) => {
    if (child.isMesh) {
      child.material = new MeshDistortMaterial({
        color: '#22C55E',
        roughness: 0.3,
        distort: 0.1,
      });
    }
  });
  
  return <primitive object={clonedScene} />;
}
```

---

## 🔊 Adding Sound Effects (Optional)

```bash
npm install @react-three/drei howler
```

```tsx
import { useEffect } from 'react';
import { Howl } from 'howler';

const thudSound = new Howl({
  src: ['/sounds/thud.mp3'],
  volume: 0.5,
});

function ThemeToggle3D() {
  const handleClick = () => {
    thudSound.play();
    // Toggle theme logic
  };
  
  return (
    <mesh onClick={handleClick}>
      {/* Switch mesh */}
    </mesh>
  );
}
```

---

## ✅ Checklist for New 3D Assets

- [ ] Uses MeshDistortMaterial for clay effect
- [ ] Has subtle animation (wiggle, breathe, float)
- [ ] Responds to user input (hover, click, mouse follow)
- [ ] Works in both Day and Night mode
- [ ] Optimized for 60 FPS
- [ ] Has fallback for mobile/low-end devices
- [ ] Matches the "Nintendo meets Patagonia" aesthetic

---

Happy building! 🌱✨
