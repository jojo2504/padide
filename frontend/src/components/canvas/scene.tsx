'use client';

import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Preload, 
  AdaptiveDpr, 
  AdaptiveEvents,
  MeshDistortMaterial,
  Float,
  Environment,
  ContactShadows,
  RoundedBox
} from '@react-three/drei';
import * as THREE from 'three';
import { useCanvasStore, useUIStore } from '@/lib/store';

// Wiggling Tree Component
function WigglingTree({ position = [0, 0, 0] as [number, number, number], scale = 1, color = '#22C55E' }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });
  
  return (
    <group position={position} scale={scale}>
      {/* Tree trunk */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 8]} />
        <MeshDistortMaterial 
          color="#8B4513"
          roughness={0.4}
          distort={0.05}
          speed={2}
        />
      </mesh>
      
      {/* Tree foliage (clay sphere) */}
      <mesh ref={meshRef} position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <MeshDistortMaterial 
          color={color}
          roughness={0.3}
          distort={0.15}
          speed={3}
        />
      </mesh>
    </group>
  );
}

// Head-tracking Robot
function RecyclingBot({ position = [0, 0, 0] as [number, number, number] }) {
  const headRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  
  useFrame(() => {
    if (headRef.current) {
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
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <group position={position}>
        {/* Body */}
        <RoundedBox args={[0.8, 1, 0.6]} radius={0.15}>
          <MeshDistortMaterial 
            color="#22C55E"
            roughness={0.3}
            distort={0.03}
          />
        </RoundedBox>
        
        {/* Head */}
        <group ref={headRef} position={[0, 0.8, 0]}>
          <RoundedBox args={[0.6, 0.5, 0.5]} radius={0.1}>
            <MeshDistortMaterial 
              color="#4ADE80"
              roughness={0.3}
              distort={0.03}
            />
          </RoundedBox>
          
          {/* Eyes */}
          <mesh position={[-0.15, 0.08, 0.26]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0.15, 0.08, 0.26]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
          
          {/* Pupils */}
          <mesh position={[-0.15 + pointer.x * 0.03, 0.08 + pointer.y * 0.02, 0.3]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="black" />
          </mesh>
          <mesh position={[0.15 + pointer.x * 0.03, 0.08 + pointer.y * 0.02, 0.3]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial color="black" />
          </mesh>
          
          {/* Antenna */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
            <meshStandardMaterial color="#38BDF8" />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial 
              color="#38BDF8"
              emissive="#38BDF8"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
        
        {/* Arms */}
        <mesh position={[-0.55, 0, 0]}>
          <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
          <MeshDistortMaterial color="#22C55E" roughness={0.3} distort={0.02} />
        </mesh>
        <mesh position={[0.55, 0, 0]}>
          <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
          <MeshDistortMaterial color="#22C55E" roughness={0.3} distort={0.02} />
        </mesh>
      </group>
    </Float>
  );
}

// Scene content component
function SceneContent() {
  const groupRef = useRef<THREE.Group>(null);
  const mousePosition = useCanvasStore((state) => state.mousePosition);
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      const targetX = mousePosition.y * 0.05;
      const targetY = mousePosition.x * 0.05;
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetX,
        delta * 2
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetY,
        delta * 2
      );
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Friendly Robot */}
      <RecyclingBot position={[0, 0, 0]} />
      
      {/* Forest of trees */}
      <WigglingTree position={[-2.5, -0.5, -1]} scale={0.8} />
      <WigglingTree position={[2.5, -0.5, -1]} scale={0.9} color="#4ADE80" />
      <WigglingTree position={[-1.5, -0.5, -2]} scale={0.6} color="#86EFAC" />
      <WigglingTree position={[1.5, -0.5, -2]} scale={0.7} />
    </group>
  );
}

// Camera rig for smooth following
function CameraRig() {
  useFrame((state) => {
    state.camera.position.z = 4.5 + Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
  });
  
  return null;
}

export default function Scene() {
  const setReady = useCanvasStore((state) => state.setReady);
  const isLoading = useUIStore((state) => state.isLoading);
  
  return (
    <div 
      className="canvas-container"
      style={{
        opacity: isLoading ? 0 : 1,
        transition: 'opacity 0.8s ease-out',
      }}
    >
      <Canvas
        camera={{
          position: [0, 0.5, 4.5],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        onCreated={() => {
          setReady(true);
        }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        {/* Bright, friendly lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1}
          castShadow
        />
        <pointLight 
          position={[-3, 2, 2]} 
          intensity={0.5} 
          color="#22C55E" 
        />
        <pointLight 
          position={[3, 2, 2]} 
          intensity={0.3} 
          color="#38BDF8" 
        />
        
        {/* Environment for nice reflections */}
        <Environment preset="park" />
        
        {/* Scene content */}
        <SceneContent />
        
        {/* Ground shadows */}
        <ContactShadows 
          position={[0, -1, 0]}
          opacity={0.3}
          blur={2}
          scale={10}
        />
        
        {/* Camera animation */}
        <CameraRig />
        
        <Preload all />
      </Canvas>
    </div>
  );
}
