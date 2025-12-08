'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import * as THREE from 'three';

export default function BackgroundLayer() {
    const { currentParameters } = useSelector((state: RootState) => state.art);
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

    const fragmentShader = `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uNoiseScale;
    uniform float uEnergy;
    
    varying vec2 vUv;
    
    // Simplex noise function (simplified)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      vec2 uv = vUv;
      
      // Animated noise
      float noise = snoise(uv * uNoiseScale + uTime * uEnergy * 0.1);
      noise = noise * 0.5 + 0.5;
      
      // Create gradient with noise
      float gradient = mix(uv.y, noise, 0.3);
      
      // Mix three colors based on gradient
      vec3 color;
      if (gradient < 0.33) {
        color = mix(uColor1, uColor2, gradient * 3.0);
      } else if (gradient < 0.66) {
        color = mix(uColor2, uColor3, (gradient - 0.33) * 3.0);
      } else {
        color = mix(uColor3, uColor1, (gradient - 0.66) * 3.0);
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

    return (
        <mesh ref={meshRef} position={[0, 0, -3]}>
            <planeGeometry args={[20, 20]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={{
                    uTime: { value: 0 },
                    uColor1: { value: new THREE.Color(currentParameters.palette[0]) },
                    uColor2: { value: new THREE.Color(currentParameters.palette[2]) },
                    uColor3: { value: new THREE.Color(currentParameters.palette[4]) },
                    uNoiseScale: { value: currentParameters.noiseScale * 10 },
                    uEnergy: { value: currentParameters.energy },
                }}
            />
        </mesh>
    );
}
