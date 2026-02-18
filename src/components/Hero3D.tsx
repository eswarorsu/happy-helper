import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  MeshDistortMaterial,
  Sphere,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";

// ============================================================================
// SUBTLE 3D FLOATING SHAPES - Professional & Minimal
// ============================================================================
const FloatingShapes = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { mouse } = useThree();

  // Very subtle mouse following
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        mouse.y * 0.02,
        0.03
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mouse.x * 0.02,
        0.03
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Small central sphere - positioned far back */}
      <Float
        speed={1}
        rotationIntensity={0.2}
        floatIntensity={0.3}
        position={[2, 1, -8]}
      >
        <Sphere args={[0.6, 32, 32]} scale={0.5}>
          <MeshDistortMaterial
            color="#F59E0B"
            attach="material"
            distort={0.2}
            speed={1.5}
            roughness={0.3}
            metalness={0.6}
            transparent
            opacity={0.6}
          />
        </Sphere>
      </Float>

      {/* Small amber accent - far left */}
      <Float
        speed={1.5}
        rotationIntensity={0.3}
        floatIntensity={0.4}
        position={[-4, 2, -10]}
      >
        <Sphere args={[0.4, 32, 32]} scale={0.4}>
          <meshStandardMaterial
            color="#FBBF24"
            roughness={0.2}
            metalness={0.7}
            transparent
            opacity={0.5}
          />
        </Sphere>
      </Float>

      {/* Small dark sphere - right side */}
      <Float
        speed={0.8}
        rotationIntensity={0.2}
        floatIntensity={0.3}
        position={[4, -1, -9]}
      >
        <Sphere args={[0.3, 32, 32]} scale={0.3}>
          <meshStandardMaterial
            color="#2B2B2B" /* brand-charcoal */
            roughness={0.4}
            metalness={0.5}
            transparent
            opacity={0.4}
          />
        </Sphere>
      </Float>

      {/* Tiny accent spheres - background only */}
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5} position={[-3, -2, -12]}>
        <Sphere args={[0.15, 16, 16]} scale={0.5}>
          <meshStandardMaterial
            color="#FCD34D"
            transparent
            opacity={0.3}
          />
        </Sphere>
      </Float>

      <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.4} position={[3, 3, -11]}>
        <Sphere args={[0.12, 16, 16]} scale={0.5}>
          <meshStandardMaterial
            color="#FBBF24"
            transparent
            opacity={0.25}
          />
        </Sphere>
      </Float>

      <Float speed={1.5} rotationIntensity={0.25} floatIntensity={0.35} position={[-2, 0, -13]}>
        <Sphere args={[0.18, 16, 16]} scale={0.5}>
          <meshStandardMaterial
            color="#FDE68A"
            transparent
            opacity={0.2}
          />
        </Sphere>
      </Float>
    </group>
  );
};

// ============================================================================
// SUBTLE PARTICLES - Background only
// ============================================================================
const ParticleConnections = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const particleCount = 30;

  const { positions } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 10; // Push back
    }

    return { positions };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.005;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#F59E0B"
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
};

// ============================================================================
// SUBTLE GLOWING ORBS - Background only
// ============================================================================
const GlowingOrbs = () => {
  const orb1Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (orb1Ref.current) {
      orb1Ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    }
  });

  return (
    <>
      {/* Large ambient glow - far back */}
      <mesh ref={orb1Ref} position={[-6, 3, -15]}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial
          color="#F59E0B"
          transparent
          opacity={0.05}
        />
      </mesh>
    </>
  );
};

// ============================================================================
// MAIN 3D SCENE
// ============================================================================
const Scene3D = () => {
  return (
    <>
      {/* Lighting - Subtle */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 5]} intensity={0.5} color="#F59E0B" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#FBBF24" />

      {/* 3D Elements - All in background */}
      <FloatingShapes />
      <ParticleConnections />
      <GlowingOrbs />

      {/* Background stars - minimal */}
      <Stars
        radius={80}
        depth={60}
        count={100}
        factor={3}
        saturation={0.3}
        fade
        speed={0.3}
      />
    </>
  );
};

// ============================================================================
// MOBILE FALLBACK - CSS-based animation
// ============================================================================
const MobileFallback = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, rgba(245, 158, 11, 0.3) 0%, transparent 40%),
            radial-gradient(circle at 70% 80%, rgba(251, 191, 36, 0.2) 0%, transparent 40%)
          `
        }}
      />

      {/* Subtle floating orbs */}
      <div
        className="absolute w-24 h-24 rounded-full blur-3xl opacity-20"
        style={{
          background: '#F59E0B',
          top: '15%',
          right: '10%',
        }}
      />
      <div
        className="absolute w-16 h-16 rounded-full blur-2xl opacity-15"
        style={{
          background: '#FBBF24',
          bottom: '20%',
          left: '15%',
        }}
      />
    </div>
  );
};

// ============================================================================
// MAIN HERO 3D COMPONENT
// ============================================================================
interface Hero3DProps {
  children?: React.ReactNode;
}

const Hero3D = ({ children }: Hero3DProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="relative w-full min-h-[100vh] overflow-hidden" style={{ background: '#000000' }}>
      {/* 3D Canvas - Fixed position, behind content */}
      {!isMobile && (
        <div className="absolute inset-0 pointer-events-none">
          <Canvas
            camera={{ position: [0, 0, 10], fov: 60 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance"
            }}
            dpr={[1, 1.5]}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Scene3D />
          </Canvas>
        </div>
      )}

      {/* Mobile Fallback */}
      {isMobile && <MobileFallback />}

      {/* Content Overlay - On top of 3D */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[100vh] px-6">
        {children}
      </div>

      {/* Bottom gradient fade */}

    </div>
  );
};

export default Hero3D;
