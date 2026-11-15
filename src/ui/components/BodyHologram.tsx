import React, { useEffect, useMemo, useRef, useState } from 'react';
import type * as THREE_NS from 'three';
import type { DomainAnalysis, DomainId } from '@/contracts/types';
import { DOMAIN_LABELS, DOMAIN_ORDER } from '@/contracts/indicators';
import { cn } from '@/ui/lib/format';
import { DOMAIN_VISUALS } from './MetricTile';

export type BodyRiskTone = 'ok' | 'watch' | 'review' | 'urgent';

export interface BodyHologramProps {
  domains: Record<DomainId, DomainAnalysis>;
  summaries: Record<DomainId, string>;
  riskTone: BodyRiskTone;
  selected?: DomainId;
  onSelect: (domain: DomainId) => void;
  className?: string;
}

type MarchingCubesConstructor = typeof import('three/examples/jsm/objects/MarchingCubes.js')['MarchingCubes'];
type GLTFLoaderConstructor = typeof import('three/examples/jsm/loaders/GLTFLoader.js')['GLTFLoader'];

const STATUS_COLORS: Record<DomainAnalysis['status'], { hex: number; css: string }> = {
  ok: { hex: 0x34c759, css: '#34c759' },
  watch: { hex: 0xff9f0a, css: '#ff9f0a' },
  flagged: { hex: 0xff3b30, css: '#ff3b30' },
};

interface RiskTheme {
  label: string;
  css: string;
  baseCss: string;
  fill: number;
  rimCss: string;
  base: number;
  emissive: number;
  rim: number;
  star: number;
  ring: number;
  ambient: number;
  key: number;
  warm: number;
  under: number;
  glow: string;
}

/**
 * Overall crew risk drives the body tint. The body moves from a cool
 * nominal scan to amber watch and then a clearly red review/urgent state.
 */
const RISK_THEMES: Record<BodyRiskTone, RiskTheme> = {
  ok: {
    label: 'Nominal',
    css: '#0a84ff',
    baseCss: '#0a84ff',
    fill: 0.04,
    rimCss: '#bfe0ff',
    base: 0x0a84ff,
    emissive: 0x0a2540,
    rim: 0xbfe0ff,
    star: 0xd6e9ff,
    ring: 0x0a84ff,
    ambient: 0x9cc7ff,
    key: 0xf2f7ff,
    warm: 0x9ed2ff,
    under: 0x0a84ff,
    glow: 'rgba(10,132,255,0.18)',
  },
  watch: {
    label: 'Watch',
    css: '#ff9f0a',
    baseCss: '#b25000',
    fill: 0.35,
    rimCss: '#ffd9a8',
    base: 0xb25000,
    emissive: 0x3d1d00,
    rim: 0xffd9a8,
    star: 0xfff0d6,
    ring: 0xff9f0a,
    ambient: 0xffc98a,
    key: 0xfff6e8,
    warm: 0xffc266,
    under: 0xd97706,
    glow: 'rgba(255,159,10,0.18)',
  },
  review: {
    label: 'Review',
    css: '#ff453a',
    baseCss: '#c93400',
    fill: 0.68,
    rimCss: '#ffc9c4',
    base: 0xc93400,
    emissive: 0x3d0a00,
    rim: 0xffc9c4,
    star: 0xffdcd8,
    ring: 0xff453a,
    ambient: 0xffb3ad,
    key: 0xffeae8,
    warm: 0xff8a80,
    under: 0xc93400,
    glow: 'rgba(255,69,58,0.2)',
  },
  urgent: {
    label: 'Urgent',
    css: '#ff3b30',
    baseCss: '#d70015',
    fill: 0.96,
    rimCss: '#ffb8b3',
    base: 0xd70015,
    emissive: 0x3a0006,
    rim: 0xffb8b3,
    star: 0xffcbc7,
    ring: 0xff3b30,
    ambient: 0xffb0ab,
    key: 0xfff0ee,
    warm: 0xff6b62,
    under: 0xd70015,
    glow: 'rgba(255,59,48,0.24)',
  },
};

/** Positions of the body hotspots in the 3D scene (body-local coordinates). */
const HOTSPOTS: Record<DomainId, { position: [number, number, number]; scale: number }> = {
  behavioral: { position: [0, 1.34, 0.16], scale: 0.76 },
  cardiovascular: { position: [0, 0.78, 0.18], scale: 1.02 },
  metabolic_general: { position: [0, 0.25, 0.16], scale: 0.9 },
  physical_performance: { position: [0.16, -0.5, 0.11], scale: 0.8 },
  sleep_recovery: { position: [-0.28, 0.88, 0.08], scale: 0.64 },
  radiation: { position: [0.28, 0.88, 0.08], scale: 0.64 },
};

function statusWord(status: DomainAnalysis['status']): string {
  if (status === 'flagged') return 'Review';
  if (status === 'watch') return 'Watch';
  return 'Normal';
}

function HologramFallback({
  domains,
  riskTone,
  selected,
  onSelect,
}: Pick<BodyHologramProps, 'domains' | 'riskTone' | 'selected' | 'onSelect'>) {
  const risk = RISK_THEMES[riskTone];
  const region = (domain: DomainId, children: React.ReactNode, labelPos: { x: number; y: number }) => {
    const status = domains[domain]?.status ?? 'ok';
    const colors = STATUS_COLORS[status];
    return (
      <g
        key={domain}
        role="button"
        tabIndex={0}
        aria-label={`${DOMAIN_LABELS[domain]}, ${statusWord(status)}. Open details.`}
        onClick={() => onSelect(domain)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(domain);
          }
        }}
        className="cursor-pointer"
      >
        {children}
        <circle cx={labelPos.x} cy={labelPos.y} r="5" fill={colors.css} opacity="0.9" />
        <circle cx={labelPos.x} cy={labelPos.y} r="10" fill="none" stroke={colors.css} strokeWidth="1" opacity="0.5" />
        {selected === domain && <circle cx={labelPos.x} cy={labelPos.y} r="14" fill="none" stroke={colors.css} strokeWidth="1.5" />}
      </g>
    );
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg viewBox="0 0 220 380" className="h-full max-h-[360px] w-auto" aria-hidden="false">
        <defs>
          <linearGradient id="body-fallback-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe0ff" stopOpacity="0.5" />
            <stop offset={`${Math.max(0, (1 - risk.fill) * 100 - 1)}%`} stopColor="#0a84ff" stopOpacity="0.34" />
            <stop offset={`${(1 - risk.fill) * 100}%`} stopColor="#ff3b30" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#d70015" stopOpacity="0.62" />
          </linearGradient>
          <filter id="body-fallback-glow">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse cx="110" cy="350" rx="64" ry="12" fill={risk.baseCss} opacity="0.16" />
        <g filter="url(#body-fallback-glow)" fill="url(#body-fallback-fill)" stroke="#bfe0ff" strokeWidth="1.1">
          {region('behavioral', <ellipse cx="110" cy="54" rx="24" ry="28" />, { x: 110, y: 54 })}
          {region('cardiovascular', <path d="M88 88c0-8 8-14 22-14s22 6 22 14l-4 38c-1 7-9 11-18 11s-17-4-18-11z" />, { x: 110, y: 102 })}
          {region('metabolic_general', <path d="M91 130h38l-3 48c-1 8-7 12-16 12s-15-4-16-12z" />, { x: 110, y: 152 })}
          {region('sleep_recovery', <path d="M72 92c-7 2-11 8-12 16l-6 66c-1 8 2 13 7 14 6 1 10-3 11-11l7-66c1-9-1-17-7-19z" />, { x: 66, y: 104 })}
          {region('physical_performance', <path d="M84 190c-7 4-9 11-9 20l2 64c0 8 4 12 9 12s8-4 8-12l1-62 2-12 4 12 3 62c1 8 4 12 9 12s8-4 8-12l-1-64c0-9-3-16-10-20z" />, { x: 90, y: 244 })}
          {region('radiation', <path d="M148 92c7 2 11 8 12 16l6 66c1 8-2 13-7 14-6 1-10-3-11-11l-7-66c-1-9 1-17 7-19z" />, { x: 154, y: 104 })}
        </g>
        <path d="M110 28v-15M101 18h18" stroke={risk.rimCss} strokeWidth="1" opacity="0.5" />
        <circle cx="110" cy="14" r="3" fill={risk.rimCss} opacity="0.8" />
      </svg>
    </div>
  );
}

export function BodyHologram({
  domains,
  summaries,
  riskTone,
  selected,
  onSelect,
  className,
}: BodyHologramProps) {
  const risk = RISK_THEMES[riskTone];
  const mountRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selected);
  const hoveredRef = useRef<DomainId | null>(null);
  const [ready, setReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  onSelectRef.current = onSelect;
  selectedRef.current = selected;

  const statusKey = useMemo(
    () => DOMAIN_ORDER.map((domain) => domains[domain]?.status ?? 'ok').join('|'),
    [domains],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      let THREE: typeof THREE_NS;
      let MarchingCubesCtor: MarchingCubesConstructor;
      let GLTFLoader: GLTFLoaderConstructor;
      let realisticScene: THREE_NS.Group | null = null;
      try {
        const [threeModule, marchingModule, loaderModule] = await Promise.all([
          import('three'),
          import('three/examples/jsm/objects/MarchingCubes.js'),
          import('three/examples/jsm/loaders/GLTFLoader.js'),
        ]);
        THREE = threeModule;
        MarchingCubesCtor = marchingModule.MarchingCubes;
        GLTFLoader = loaderModule.GLTFLoader;
      } catch {
        if (!disposed) setWebglFailed(true);
        return;
      }
      if (disposed) return;
      try {
        realisticScene = (await new GLTFLoader().loadAsync('/models/male-base-mesh.glb')).scene;
      } catch {
        // Keep the procedural hologram available when the optional mesh cannot load.
      }

      try {
        const width = mount.clientWidth || 360;
        const height = mount.clientHeight || 390;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        renderer.domElement.setAttribute('aria-hidden', 'true');
        mount.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
        camera.position.set(0, 0.14, 5.8);
        camera.lookAt(0, 0.1, 0);

        /* Lights -------------------------------------------------- */
        scene.add(new THREE.AmbientLight(0xffffff, 0.72));
        const key = new THREE.DirectionalLight(0xffffff, 2.0);
        key.position.set(2.4, 3.4, 4);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xf2f2f7, 1.7);
        rim.position.set(-3.4, 1.4, -2.4);
        scene.add(rim);
        const warm = new THREE.PointLight(0xffffff, 1.3, 7);
        warm.position.set(0.5, 0.8, 2.2);
        scene.add(warm);
        const under = new THREE.PointLight(0xffffff, 0.5, 6);
        under.position.set(0, -1.4, 1.2);
        scene.add(under);

        /* Materials ----------------------------------------------- */
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x48484a,
          emissive: 0x08080a,
          emissiveIntensity: 0.28,
          roughness: 0.44,
          metalness: 0.12,
          clearcoat: 0.45,
          clearcoatRoughness: 0.35,
          transparent: true,
          opacity: 0.95,
          side: THREE.FrontSide,
          depthWrite: true,
        });
        const fillUniforms = {
          uRiskFill: { value: risk.fill },
          uRiskTime: { value: 0 },
          uBodyHeightMin: { value: 0 },
          uBodyHeightInvRange: { value: 1 },
          uRiskColor: { value: new THREE.Color(risk.base).lerp(new THREE.Color(0x8e8e93), 0.35) },
        };
        bodyMaterial.onBeforeCompile = (shader) => {
          Object.assign(shader.uniforms, fillUniforms);
          shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            '#include <common>\nuniform float uBodyHeightMin;\nuniform float uBodyHeightInvRange;\nvarying float vBodyHeight;',
          ).replace(
            '#include <project_vertex>',
            'vBodyHeight = (position.y - uBodyHeightMin) * uBodyHeightInvRange;\n#include <project_vertex>',
          );
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            '#include <common>\nuniform float uRiskFill;\nuniform float uRiskTime;\nuniform vec3 uRiskColor;\nvarying float vBodyHeight;',
          ).replace(
            '#include <color_fragment>',
            `#include <color_fragment>
             float waterline = clamp(uRiskFill + sin(vBodyHeight * 34.0 + uRiskTime * 2.1) * 0.006, 0.02, 0.98);
             float submerged = 1.0 - smoothstep(waterline - 0.012, waterline + 0.012, vBodyHeight);
             float waterEdge = 1.0 - smoothstep(0.0, 0.025, abs(vBodyHeight - waterline));
             diffuseColor.rgb = mix(diffuseColor.rgb, uRiskColor, submerged * 0.07);
             diffuseColor.rgb += uRiskColor * waterEdge * 0.10;`,
          );
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            '#include <emissivemap_fragment>\ntotalEmissiveRadiance = mix(totalEmissiveRadiance, uRiskColor * 0.06, submerged);',
          );
        };

        // Fresnel halo: a second pass over the same geometry gives the body
        // a luminous glass edge without flattening the lit surface.
        const glowMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color(risk.rim) },
            uStrength: { value: 0.45 },
          },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vView;
            void main() {
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vNormal = normalize(normalMatrix * normal);
              vView = normalize(-mvPosition.xyz);
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            uniform vec3 uColor;
            uniform float uStrength;
            varying vec3 vNormal;
            varying vec3 vView;
            void main() {
              float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.4);
              gl_FragColor = vec4(uColor, rim * uStrength);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.FrontSide,
        });

        const bodyGroup = new THREE.Group();
        scene.add(bodyGroup);

        if (realisticScene) {
          const bodyRoot = realisticScene.getObjectByName('base_male_body');
          let visibleBodyParts = 0;
          let bodyMinY = Infinity;
          let bodyMaxY = -Infinity;
          realisticScene.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;
            // GLTFLoader wraps the base mesh's six material primitives in a
            // named group, leaving the actual child meshes unnamed.
            const belongsToBase = bodyRoot?.getObjectById(object.id) === object;
            object.visible = bodyRoot ? belongsToBase : false;
            if (object.visible) {
              object.material = bodyMaterial;
              object.geometry.computeBoundingBox();
              const partBounds = object.geometry.boundingBox;
              if (partBounds) {
                bodyMinY = Math.min(bodyMinY, partBounds.min.y);
                bodyMaxY = Math.max(bodyMaxY, partBounds.max.y);
              }
              visibleBodyParts += 1;
            }
          });
          if (visibleBodyParts > 0) {
            realisticScene.updateMatrixWorld(true);
            const bounds = new THREE.Box3().setFromObject(realisticScene);
            const size = bounds.getSize(new THREE.Vector3());
            const center = bounds.getCenter(new THREE.Vector3());
            const scale = 3.0 / Math.max(size.y, 0.001);
            fillUniforms.uBodyHeightMin.value = bodyMinY;
            fillUniforms.uBodyHeightInvRange.value = 1 / Math.max(bodyMaxY - bodyMinY, 0.001);
            realisticScene.scale.setScalar(scale);
            realisticScene.position.set(-center.x * scale, 0.08 - center.y * scale, -center.z * scale);
            realisticScene.updateMatrixWorld(true);
            bodyGroup.add(realisticScene);
          } else {
            realisticScene = null;
          }
        }

        const geometries: THREE_NS.BufferGeometry[] = [];
        const materials: THREE_NS.Material[] = [bodyMaterial, glowMaterial];

        /* Body scan -------------------------------------------------
           A single smooth metaball surface (MarchingCubes) instead of
           assembled primitives: no visible joints, and the fresnel shader
           reads as a holographic medical scan rather than a plastic model. */
        const SCAN_HEIGHT = 1.75;
        const SCAN_SUBTRACT = 300;
        const scanResolution = window.innerWidth < 640 ? 96 : 128;
        const body = new MarchingCubesCtor(scanResolution, bodyMaterial, false, false, 120000);
        body.isolation = 80;
        body.frustumCulled = false;

        const addBall = (x: number, y: number, z: number, radius: number) => {
          const nx = 0.5 + x / (2 * SCAN_HEIGHT);
          const ny = 0.5 + y / (2 * SCAN_HEIGHT);
          const nz = 0.5 + z / (2 * SCAN_HEIGHT);
          const rn = radius / (2 * SCAN_HEIGHT);
          body.addBall(
            nx,
            ny,
            nz,
            (SCAN_SUBTRACT + body.isolation) * rn * rn,
            SCAN_SUBTRACT,
          );
        };

        /* Interpolate along limb paths so the metaball surface stays
           continuous instead of reading as a chain of beads. */
        const addPath = (path: Array<[number, number, number]>) => {
          for (let i = 0; i < path.length - 1; i += 1) {
            const [x1, y1, r1] = path[i]!;
            const [x2, y2, r2] = path[i + 1]!;
            const distance = Math.hypot(x2 - x1, y2 - y1);
            const steps = Math.max(2, Math.ceil(distance / 0.024));
            for (let step = 0; step < steps; step += 1) {
              const t = step / steps;
              addBall(
                x1 + (x2 - x1) * t,
                y1 + (y2 - y1) * t,
                0,
                r1 + (r2 - r1) * t,
              );
            }
          }
          const last = path[path.length - 1]!;
          addBall(last[0], last[1], 0, last[2]);
        };

        /* Torso, pelvis, and neck — dense overlapping bands keep the
           surface continuous instead of reading as stacked spheres. */
        const torsoBands: Array<[number, number, number]> = [
          [-0.08, 0.175, 0.145],
          [0.04, 0.18, 0.15],
          [0.16, 0.175, 0.147],
          [0.28, 0.17, 0.143],
          [0.4, 0.178, 0.147],
          [0.52, 0.19, 0.153],
          [0.64, 0.2, 0.16],
          [0.76, 0.2, 0.158],
          [0.86, 0.17, 0.135],
        ];
        for (const [y, center, side] of torsoBands) {
          addBall(0, y, 0, center);
          addBall(-0.1, y, 0, side);
          addBall(0.1, y, 0, side);
        }
        addBall(-0.16, 0.82, 0.02, 0.11);
        addBall(0.16, 0.82, 0.02, 0.11);
        addBall(0, 0.96, 0, 0.075);
        addBall(0, 1.05, 0, 0.078);
        addBall(0, 1.08, 0, 0.07);

        /* Chest, shoulder, and abdominal relief. These extra metaballs
           give the smooth surface readable pectorals, lats, and obliques. */
        addBall(-0.085, 0.79, 0.115, 0.066);
        addBall(0.085, 0.79, 0.115, 0.066);
        addBall(-0.155, 0.7, 0.055, 0.06);
        addBall(0.155, 0.7, 0.055, 0.06);
        addBall(-0.255, 0.83, 0.02, 0.095);
        addBall(0.255, 0.83, 0.02, 0.095);
        for (const y of [0.5, 0.4, 0.3]) {
          addBall(-0.048, y, 0.12, 0.042);
          addBall(0.048, y, 0.12, 0.042);
        }
        addBall(-0.135, 0.34, 0.075, 0.045);
        addBall(0.135, 0.34, 0.075, 0.045);
        addBall(-0.11, 0.18, 0.095, 0.05);
        addBall(0.11, 0.18, 0.095, 0.05);

        /* Head and jaw */
        addBall(0, 1.16, 0.01, 0.11);
        addBall(0, 1.26, 0.01, 0.165);
        addBall(-0.04, 1.33, 0, 0.105);
        addBall(0.04, 1.33, 0, 0.105);
        addBall(0, 1.22, 0.075, 0.1);
        addBall(0, 1.3, -0.04, 0.1);
        addBall(0, 1.36, -0.01, 0.085);
        addBall(-0.065, 1.32, 0, 0.055);
        addBall(0.065, 1.32, 0, 0.055);
        addBall(0, 1.28, 0.115, 0.028);
        addBall(-0.11, 1.3, 0.005, 0.025);
        addBall(0.11, 1.3, 0.005, 0.025);
        addBall(0, 1.19, 0.085, 0.05);

        /* Shoulders and arms in a relaxed A-pose */
        addBall(-0.24, 0.88, 0, 0.125);
        addBall(0.24, 0.88, 0, 0.125);
        const armPath: Array<[number, number, number]> = [
          [0.3, 0.85, 0.09],
          [0.335, 0.77, 0.083],
          [0.37, 0.68, 0.076],
          [0.4, 0.59, 0.07],
          [0.42, 0.5, 0.065],
          [0.435, 0.42, 0.061],
          [0.447, 0.34, 0.057],
          [0.458, 0.26, 0.053],
          [0.467, 0.18, 0.049],
          [0.475, 0.1, 0.046],
          [0.482, 0.03, 0.045],
          [0.487, -0.04, 0.051],
          [0.487, -0.1, 0.041],
          [0.492, -0.2, 0.039],
          [0.496, -0.3, 0.038],
          [0.499, -0.4, 0.037],
          [0.5, -0.47, 0.044],
        ];
        for (const side of [-1, 1]) {
          addPath(armPath.map(([x, y, radius]) => [side * x, y, radius]));
          addBall(side * 0.5, -0.5, 0.01, 0.05);
          addBall(side * 0.5, -0.55, 0.025, 0.04);
          addBall(side * 0.48, -0.58, 0.035, 0.025);
        }

        /* Hips and legs */
        addBall(-0.1, -0.11, 0, 0.145);
        addBall(0.1, -0.11, 0, 0.145);
        const legPath: Array<[number, number, number]> = [
          [0.13, -0.2, 0.125],
          [0.14, -0.3, 0.115],
          [0.146, -0.4, 0.107],
          [0.15, -0.5, 0.1],
          [0.155, -0.6, 0.093],
          [0.158, -0.7, 0.086],
          [0.161, -0.8, 0.08],
          [0.164, -0.9, 0.074],
          [0.167, -1.0, 0.068],
          [0.169, -1.1, 0.061],
          [0.17, -1.18, 0.055],
          [0.17, -1.24, 0.05],
        ];
        for (const side of [-1, 1]) {
          addPath(legPath.map(([x, y, radius]) => [side * x, y, radius]));
          addBall(side * 0.09, -0.17, -0.09, 0.09);
          addBall(side * 0.14, -0.36, 0.07, 0.075);
          addBall(side * 0.16, -0.78, 0.0, 0.065);
          addBall(side * 0.17, -1.27, 0.02, 0.05);
          addBall(side * 0.17, -1.27, 0.08, 0.045);
          addBall(side * 0.17, -1.27, 0.14, 0.03);
        }

        body.update();
        body.geometry.computeBoundingBox();
        if (!realisticScene && body.geometry.boundingBox) {
          const bodyBounds = body.geometry.boundingBox;
          fillUniforms.uBodyHeightMin.value = bodyBounds.min.y;
          fillUniforms.uBodyHeightInvRange.value = 1 / Math.max(bodyBounds.max.y - bodyBounds.min.y, 0.001);
        }
        body.scale.set(SCAN_HEIGHT, SCAN_HEIGHT, SCAN_HEIGHT * 0.78);
        body.position.y = 0.1;
        body.renderOrder = 1;
        body.visible = !realisticScene;
        geometries.push(body.geometry);
        bodyGroup.add(body);

        const bodyGlow = new THREE.Mesh(body.geometry, glowMaterial);
        bodyGlow.scale.copy(body.scale).multiplyScalar(1.014);
        bodyGlow.position.copy(body.position);
        bodyGlow.renderOrder = 2;
        bodyGlow.visible = !realisticScene;
        bodyGroup.add(bodyGlow);

        /* Internal constellation ---------------------------------
           Sample the generated body surface for tiny additive points.
           Read through the translucent body like a medical hologram. */
        const surface = body.geometry.getAttribute('position');
        const starCount = Math.min(900, Math.max(280, Math.floor(surface.count / 120)));
        const starPositions = new Float32Array(starCount * 3);
        const random = (seed: number) => {
          const value = Math.sin(seed * 12.9898) * 43758.5453;
          return value - Math.floor(value);
        };
        for (let i = 0; i < starCount; i += 1) {
          const sourceIndex = (i * 7919) % surface.count;
          starPositions[i * 3] = surface.getX(sourceIndex) + (random(i + 1) - 0.5) * 0.016;
          starPositions[i * 3 + 1] = surface.getY(sourceIndex) + (random(i + 7) - 0.5) * 0.016;
          starPositions[i * 3 + 2] = surface.getZ(sourceIndex) + (random(i + 13) - 0.5) * 0.016;
        }
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        geometries.push(starGeometry);
        const starMaterial = new THREE.PointsMaterial({
          color: 0x9cc7ff,
          size: 0.018,
          transparent: true,
          opacity: 1,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          sizeAttenuation: true,
        });
        materials.push(starMaterial);
        const starPoints = new THREE.Points(starGeometry, starMaterial);
        starPoints.visible = !realisticScene;
        starPoints.scale.copy(body.scale);
        starPoints.position.copy(body.position);
        starPoints.renderOrder = 3;
        bodyGroup.add(starPoints);

        /* Holographic floor rings -------------------------------- */
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: risk.ring,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        materials.push(ringMaterial);
        const rings = [0.62, 0.9, 1.22];
        rings.forEach((radius, index) => {
          const geom = new THREE.RingGeometry(radius, radius + 0.006, 96);
          geometries.push(geom);
          const ring = new THREE.Mesh(geom, ringMaterial);
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = -1.44 - index * 0.004;
          ring.renderOrder = 0;
          bodyGroup.add(ring);
        });

        /* Particle atmosphere ------------------------------------ */
        const particleCount = 180;
        const particlePositions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i += 1) {
          const angle = (i / particleCount) * Math.PI * 2;
          const radius = 0.75 + (i % 17) * 0.045;
          particlePositions[i * 3] = Math.cos(angle) * radius;
          particlePositions[i * 3 + 1] = -1.4 + ((i * 37) % 100) / 100 * 3.05;
          particlePositions[i * 3 + 2] = Math.sin(angle) * radius * 0.55;
        }
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        geometries.push(particleGeometry);
        const particleMaterial = new THREE.PointsMaterial({
          color: 0xd2d2d7,
          size: 0.018,
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        });
        materials.push(particleMaterial);
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        bodyGroup.add(particles);

        /* Scanning band ------------------------------------------ */
        const scanMaterial = new THREE.MeshBasicMaterial({
          color: risk.rim,
          transparent: true,
          opacity: 0.08,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
          side: THREE.DoubleSide,
        });
        materials.push(scanMaterial);
        const scanRingGeometry = new THREE.TorusGeometry(0.54, 0.0045, 8, 120);
        geometries.push(scanRingGeometry);
        const scanRing = new THREE.Mesh(scanRingGeometry, scanMaterial);
        scanRing.rotation.x = Math.PI / 2;
        scanRing.position.y = 0.4;
        scanRing.renderOrder = 4;
        bodyGroup.add(scanRing);

        /* Domain hotspots ---------------------------------------- */
        const hotspotMeshes: Array<{
          domain: DomainId;
          hit: THREE_NS.Mesh;
          core: THREE_NS.Mesh;
          halo: THREE_NS.Sprite;
          baseScale: number;
        }> = [];

        const makeGlowTexture = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 128;
          const context = canvas.getContext('2d');
          if (context) {
            const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 62);
            gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
            gradient.addColorStop(0.25, 'rgba(255,255,255,0.68)');
            gradient.addColorStop(0.65, 'rgba(255,255,255,0.18)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 128, 128);
          }
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          return texture;
        };

        const glowTexture = makeGlowTexture();
        const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
        materials.push(hitMaterial);

        for (const domain of DOMAIN_ORDER) {
          const spec = HOTSPOTS[domain];
          const status = domains[domain]?.status ?? 'ok';
          const color = STATUS_COLORS[status];
          const hitGeometry = new THREE.SphereGeometry(0.19, 16, 12);
          geometries.push(hitGeometry);
          const hit = new THREE.Mesh(hitGeometry, hitMaterial);
          hit.position.set(...spec.position);
          hit.userData.domain = domain;
          bodyGroup.add(hit);

          const coreMaterial = new THREE.MeshBasicMaterial({
            color: color.hex,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
          });
          materials.push(coreMaterial);
          const coreGeometry = new THREE.SphereGeometry(0.027, 16, 12);
          geometries.push(coreGeometry);
          const core = new THREE.Mesh(coreGeometry, coreMaterial);
          core.position.set(...spec.position);
          core.renderOrder = 4;
          bodyGroup.add(core);

          const haloMaterial = new THREE.SpriteMaterial({
            map: glowTexture,
            color: color.hex,
            transparent: true,
            opacity: 0.46,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
          });
          materials.push(haloMaterial);
          const halo = new THREE.Sprite(haloMaterial);
          halo.position.set(...spec.position);
          halo.scale.setScalar(0.32 * spec.scale);
          halo.renderOrder = 4;
          bodyGroup.add(halo);

          hotspotMeshes.push({ domain, hit, core, halo, baseScale: spec.scale });
        }

        /* Interaction -------------------------------------------- */
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let dragging = false;
        let dragMoved = false;
        let lastX = 0;
        let lastY = 0;
        let rotationVelocity = 0;
        let hovering: DomainId | null = null;

        const setPointer = (event: PointerEvent) => {
          const rect = renderer.domElement.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        };

        const hitTest = (): DomainId | null => {
          raycaster.setFromCamera(pointer, camera);
          const objects = hotspotMeshes.map((hotspot) => hotspot.hit);
          const intersections = raycaster.intersectObjects(objects, false);
          const first = intersections[0]?.object;
          return (first?.userData.domain as DomainId | undefined) ?? null;
        };

        const onPointerMove = (event: PointerEvent) => {
          setPointer(event);
          if (dragging) {
            const dx = event.clientX - lastX;
            const dy = event.clientY - lastY;
            lastX = event.clientX;
            lastY = event.clientY;
            if (Math.abs(dx) + Math.abs(dy) > 1) dragMoved = true;
            bodyGroup.rotation.y += dx * 0.0055;
            bodyGroup.rotation.x = Math.max(-0.18, Math.min(0.18, bodyGroup.rotation.x + dy * 0.0015));
            rotationVelocity = dx * 0.0018;
            renderer.domElement.style.cursor = 'grabbing';
            return;
          }
          const domain = hitTest();
          hovering = domain;
          hoveredRef.current = domain;
          renderer.domElement.style.cursor = domain ? 'pointer' : 'grab';
          if (domain) bodyGroup.rotation.y += 0;
        };

        const onPointerDown = (event: PointerEvent) => {
          dragging = true;
          dragMoved = false;
          lastX = event.clientX;
          lastY = event.clientY;
          renderer.domElement.setPointerCapture?.(event.pointerId);
        };

        const onPointerUp = (event: PointerEvent) => {
          if (dragging && !dragMoved) {
            setPointer(event);
            const domain = hitTest();
            if (domain) onSelectRef.current(domain);
          }
          dragging = false;
          renderer.domElement.style.cursor = hovering ? 'pointer' : 'grab';
        };

        const onPointerLeave = () => {
          hovering = null;
          hoveredRef.current = null;
          if (!dragging) renderer.domElement.style.cursor = 'grab';
        };

        renderer.domElement.addEventListener('pointermove', onPointerMove);
        renderer.domElement.addEventListener('pointerdown', onPointerDown);
        renderer.domElement.addEventListener('pointerup', onPointerUp);
        renderer.domElement.addEventListener('pointerleave', onPointerLeave);
        renderer.domElement.style.cursor = 'grab';
        renderer.domElement.style.touchAction = 'pan-y';

        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        let frameId = 0;
        let lastTime = performance.now();
        let visible = true;

        const animate = (time: number) => {
          const delta = Math.min(0.05, (time - lastTime) / 1000);
          lastTime = time;
          fillUniforms.uRiskTime.value = time * 0.001;
          if (!dragging) {
            rotationVelocity *= 0.94;
            const auto = reducedMotion ? 0 : 0.12;
            bodyGroup.rotation.y += rotationVelocity + auto * delta;
            bodyGroup.rotation.x += (0 - bodyGroup.rotation.x) * 0.015;
          }
          particles.rotation.y -= delta * 0.018;
          const scanPhase = reducedMotion ? 0.55 : (time * 0.00009) % 1;
          scanRing.position.y = -1.2 + scanPhase * 2.6;
          scanMaterial.opacity = reducedMotion ? 0.09 : 0.2 * Math.sin(scanPhase * Math.PI);
          hotspotMeshes.forEach((hotspot, index) => {
            const isActive = selectedRef.current === hotspot.domain || hoveredRef.current === hotspot.domain;
            const pulse = 0.82 + Math.sin(time * 0.0021 + index * 1.3) * 0.16;
            const scale = hotspot.baseScale * (isActive ? 1.5 : 1) * pulse;
            hotspot.halo.scale.setScalar(0.32 * scale);
            hotspot.halo.material.opacity = isActive ? 0.8 : 0.42;
            hotspot.core.scale.setScalar(isActive ? 1.5 : 1);
          });
          if (visible) renderer.render(scene, camera);
          frameId = window.requestAnimationFrame(animate);
        };
        frameId = window.requestAnimationFrame(animate);

        const resize = () => {
          const nextWidth = mount.clientWidth || width;
          const nextHeight = mount.clientHeight || height;
          if (nextWidth === 0 || nextHeight === 0) return;
          camera.aspect = nextWidth / nextHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(nextWidth, nextHeight);
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);

        const intersectionObserver = new IntersectionObserver((entries) => {
          visible = entries[0]?.isIntersecting ?? true;
        });
        intersectionObserver.observe(mount);

        setReady(true);

        cleanup = () => {
          window.cancelAnimationFrame(frameId);
          resizeObserver.disconnect();
          intersectionObserver.disconnect();
          renderer.domElement.removeEventListener('pointermove', onPointerMove);
          renderer.domElement.removeEventListener('pointerdown', onPointerDown);
          renderer.domElement.removeEventListener('pointerup', onPointerUp);
          renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
          geometries.forEach((geometry) => geometry.dispose());
          materials.forEach((material) => material.dispose());
          glowTexture.dispose();
          renderer.dispose();
          if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
        };
      } catch {
        if (!disposed) setWebglFailed(true);
      }
    };

    void boot();
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [statusKey, domains, riskTone]);

  const selectedDomain = selected;
  const hovered = hoveredRef.current;

  return (
    <div
      className={cn(
        'relative flex min-h-[430px] w-full flex-col overflow-hidden rounded-[14px] border border-white/10 bg-[linear-gradient(180deg,#2c2c2e_0%,#1c1c1e_100%)]',
        className,
      )}
      role="group"
      aria-label="Body map"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(70% 70% at 50% 38%, rgba(255,255,255,0.06) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2 py-1 text-[0.58rem] font-medium text-white/75 backdrop-blur">
        <span className="relative flex h-1.5 w-1.5">
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: risk.css }} />
        </span>
        Live body map
      </div>
      <div className="absolute right-3 top-3 z-10 rounded-full bg-white/[0.08] px-2 py-1 text-[0.55rem] font-medium text-white/45 backdrop-blur">
        3D scan
      </div>

      <div
        ref={mountRef}
        className="relative z-0 h-[360px] w-full sm:h-[400px]"
        style={{ filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.35))' }}
        aria-hidden="true"
      />

      {!ready && !webglFailed && (
        <div
          className="absolute inset-x-8 top-16 bottom-14 animate-pulse rounded-[40%]"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 68%)' }}
          aria-hidden="true"
        />
      )}

      {webglFailed && (
        <div className="absolute inset-0 z-10 pt-8">
          <HologramFallback domains={domains} riskTone={riskTone} selected={selected} onSelect={onSelect} />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 border-t border-white/10 bg-[#1c1c1e]/85 px-3 py-2 backdrop-blur">
        <div className="min-w-0">
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.08em] text-white/40">
            {hovered ? 'Domain selected' : selectedDomain ? 'Focused domain' : `Crew risk · ${risk.label} · ${Math.round(risk.fill * 100)}%`}
          </p>
          <p className="truncate text-[0.66rem] font-medium text-white/85">
            {hovered ? DOMAIN_LABELS[hovered] : selectedDomain ? DOMAIN_LABELS[selectedDomain] : 'Drag to rotate · click a signal'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {DOMAIN_ORDER.map((domain) => {
            const status = domains[domain]?.status ?? 'ok';
            return (
              <span
                key={domain}
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status].css }}
                title={`${DOMAIN_LABELS[domain]}: ${statusWord(status)}`}
                aria-hidden="true"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
