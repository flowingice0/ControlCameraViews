import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraState } from '../types';

interface CameraVisualizerProps {
  state: CameraState;
  onChange: (newState: CameraState) => void;
  inputImage: string | null;
}

// Helper: Convert App State to 3D Cartesian Coordinates
const toCartesian = (azimuth: number, elevation: number, distance: number) => {
  const phi = THREE.MathUtils.degToRad(90 - elevation); // Phi is from Top Pole (Y)
  const theta = THREE.MathUtils.degToRad(azimuth);      // Theta is around Y, starting +Z
  
  const x = distance * Math.sin(phi) * Math.sin(theta);
  const y = distance * Math.cos(phi);
  const z = distance * Math.sin(phi) * Math.cos(theta);
  
  return new THREE.Vector3(x, y, z);
};

// --- Scene Components ---

const Subject = ({ image }: { image: string | null }) => {
  const texture = useMemo(() => {
    if (!image) return null;
    const t = new THREE.TextureLoader().load(image);
    t.colorSpace = THREE.SRGBColorSpace; 
    return t;
  }, [image]);

  return (
    <group position={[0, 0.6, 0]}>
       {/* Blue Focus Frame - Cascadeur Blue */}
       <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(1.5, 1.5)]} />
          <lineBasicMaterial color="#2563EB" linewidth={2} />
       </lineSegments>

       {/* Central Object Body - Dark Gray instead of black for visibility on light bg */}
       <mesh position={[0, 0, 0]}> 
         <boxGeometry args={[1.2, 1.2, 0.1]} />
         <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.2} />
       </mesh>
       
       {/* Image Display Overlay (if image exists) */}
       {texture && (
          <mesh position={[0, 0, 0.06]}>
             <planeGeometry args={[1.2, 1.2]} />
             <meshBasicMaterial map={texture} />
          </mesh>
       )}
    </group>
  );
};

const Controls = ({ state, onChange }: { state: CameraState, onChange: (s: CameraState) => void }) => {
  const { camera } = useThree();
  const [dragTarget, setDragTarget] = useState<'azimuth' | 'elevation' | 'camera' | null>(null);

  // Constants for visualization scale
  const VISUAL_SCALE = 3.5; 
  const displayDist = state.distance * VISUAL_SCALE;

  const pos = useMemo(() => 
    toCartesian(state.azimuth, state.elevation, displayDist), 
  [state.azimuth, state.elevation, displayDist]);

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>, target: 'azimuth' | 'elevation' | 'camera') => {
    e.stopPropagation();
    // @ts-ignore
    (e.nativeEvent.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragTarget(target);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // @ts-ignore
    (e.nativeEvent.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragTarget(null);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragTarget) return;
    e.stopPropagation();
    
    const ray = e.ray;
    const planeIntersect = new THREE.Vector3();
    
    if (dragTarget === 'camera') {
        const sphere = new THREE.Sphere(new THREE.Vector3(0,0,0), displayDist);
        const intersectPoint = new THREE.Vector3();
        
        if (ray.intersectSphere(sphere, intersectPoint)) {
            const r = Math.sqrt(intersectPoint.x**2 + intersectPoint.y**2 + intersectPoint.z**2);
            let phi = Math.acos(Math.max(-1, Math.min(1, intersectPoint.y / r)));
            let theta = Math.atan2(intersectPoint.x, intersectPoint.z);

            let newEl = 90 - THREE.MathUtils.radToDeg(phi);
            let newAz = THREE.MathUtils.radToDeg(theta);
            
            if (newAz < 0) newAz += 360;
            newEl = Math.max(-30, Math.min(60, newEl));
            
            onChange({
                ...state,
                azimuth: Number(newAz.toFixed(1)),
                elevation: Number(newEl.toFixed(1))
            });
        }
    } 
    else if (dragTarget === 'azimuth') {
        if (ray.intersectPlane(groundPlane, planeIntersect)) {
            const theta = Math.atan2(planeIntersect.x, planeIntersect.z);
            let newAz = THREE.MathUtils.radToDeg(theta);
            if (newAz < 0) newAz += 360;
            onChange({ ...state, azimuth: Number(newAz.toFixed(1)) });
        }
    }
    else if (dragTarget === 'elevation') {
        const azRad = THREE.MathUtils.degToRad(state.azimuth);
        const planeNormal = new THREE.Vector3(Math.cos(azRad), 0, -Math.sin(azRad));
        const elevationPlane = new THREE.Plane(planeNormal, 0);
        
        if (ray.intersectPlane(elevationPlane, planeIntersect)) {
            const distXZ = Math.sqrt(planeIntersect.x**2 + planeIntersect.z**2);
            const distY = planeIntersect.y;
            const angleRad = Math.atan2(distY, distXZ);
            let newEl = THREE.MathUtils.radToDeg(angleRad);
            newEl = Math.max(-30, Math.min(60, newEl));
            onChange({ ...state, elevation: Number(newEl.toFixed(1)) });
        }
    }
  };

  // --- Geometries ---
  const ringRadius = displayDist; 
  const arcPoints = useMemo(() => {
    const points = [];
    for (let i = -30; i <= 60; i += 2) {
       points.push(toCartesian(state.azimuth, i, displayDist));
    }
    return new THREE.CatmullRomCurve3(points).getPoints(50);
  }, [state.azimuth, displayDist]);


  return (
    <group 
        onPointerMove={handlePointerMove} 
        onPointerUp={handlePointerUp}
    >
       {/* Global event catcher */}
       {dragTarget && (
          <mesh scale={100} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
             <sphereGeometry />
             <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
          </mesh>
       )}

       {/* Camera Object - Cascadeur Blue */}
       <mesh 
         position={pos} 
         onPointerDown={(e) => handlePointerDown(e, 'camera')}
         onPointerOver={() => document.body.style.cursor = 'grab'}
         onPointerOut={() => document.body.style.cursor = 'auto'}
         scale={dragTarget === 'camera' ? 1.2 : 1}
       >
         <sphereGeometry args={[0.1, 32, 32]} />
         <meshStandardMaterial 
            color="#2563EB" 
            emissive="#2563EB" 
            emissiveIntensity={dragTarget === 'camera' ? 0.5 : 0.2} 
            roughness={0.2}
            metalness={0.1}
         />
       </mesh>
       
       {/* Connecting Line - Darker Blue/Grey */}
       <line>
         <bufferGeometry>
            <bufferAttribute 
                attach="attributes-position" 
                count={2} 
                array={new Float32Array([0,0,0, pos.x, pos.y, pos.z])} 
                itemSize={3} 
            />
         </bufferGeometry>
         <lineBasicMaterial color="#93C5FD" transparent opacity={0.8} />
       </line>

       {/* Azimuth Ring - Light Blue/Grey */}
       <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[ringRadius, 0.03, 32, 100]} />
          <meshBasicMaterial color="#CBD5E1" />
       </mesh>
       
       {/* Invisible Hit Area */}
       <mesh 
         rotation={[-Math.PI / 2, 0, 0]} 
         onPointerDown={(e) => handlePointerDown(e, 'azimuth')}
         onPointerOver={() => document.body.style.cursor = 'pointer'}
         onPointerOut={() => document.body.style.cursor = 'auto'}
       >
          <torusGeometry args={[ringRadius, 0.5, 8, 64]} />
          <meshBasicMaterial transparent opacity={0} />
       </mesh>
       
       {/* Active Azimuth Indicator - Dark Blue */}
        <mesh 
            position={[Math.sin(THREE.MathUtils.degToRad(state.azimuth))*ringRadius, 0, Math.cos(THREE.MathUtils.degToRad(state.azimuth))*ringRadius]}
            scale={dragTarget === 'azimuth' ? 1.3 : 1} 
        >
            <sphereGeometry args={[0.08, 32, 32]} />
            <meshStandardMaterial 
                color="#1E3A8A" 
                emissive="#1E3A8A" 
                emissiveIntensity={0.2} 
            />
        </mesh>

       {/* Elevation Arc - Darker Grey */}
       <mesh>
          <tubeGeometry args={[new THREE.CatmullRomCurve3(arcPoints), 64, 0.03, 8, false]} />
          <meshBasicMaterial color="#94A3B8" />
       </mesh>
       
       {/* Invisible Hit Area */}
       <mesh 
         onPointerDown={(e) => handlePointerDown(e, 'elevation')}
         onPointerOver={() => document.body.style.cursor = 'pointer'}
         onPointerOut={() => document.body.style.cursor = 'auto'}
       >
          <tubeGeometry args={[new THREE.CatmullRomCurve3(arcPoints), 64, 0.5, 8, false]} />
          <meshBasicMaterial transparent opacity={0} />
       </mesh>

    </group>
  );
};


const CameraVisualizer: React.FC<CameraVisualizerProps> = ({ state, onChange, inputImage }) => {
  return (
    // Enlarged container to match the yellow box size - using h-[500px] instead of aspect-square
    <div className="w-full h-[500px] bg-[#F5F5F7] rounded-2xl overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="text-[10px] font-bold text-gray-500 bg-white/60 px-2 py-1 rounded-full backdrop-blur-sm border border-gray-100 shadow-sm flex gap-2">
             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span>Cam</span> 
             <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span>Azimuth</span> 
          </div>
      </div>

      <Canvas camera={{ position: [8, 5, 8], fov: 45 }}>
         <ambientLight intensity={0.8} />
         <directionalLight position={[10, 10, 5]} intensity={1.2} />
         <directionalLight position={[-10, 5, -5]} intensity={0.5} color="#EBF2FF" />
         
         {/* Light Grid Helper */}
         <gridHelper args={[20, 20, 0xE2E8F0, 0xE2E8F0]} position={[0, -0.01, 0]} />

         <Subject image={inputImage} />
         <Controls state={state} onChange={onChange} />
      </Canvas>
      
      <div className="absolute bottom-4 right-4 pointer-events-none">
         <div className="text-gray-500 text-[10px] font-semibold bg-white/80 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm backdrop-blur-md">
             {state.azimuth.toFixed(0)}° H / {state.elevation.toFixed(0)}° V
         </div>
      </div>
    </div>
  );
};

export default CameraVisualizer;