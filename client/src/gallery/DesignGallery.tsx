import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { diagramPreviewMarkup } from './diagramSvg';
import DiagramDetailModal from './DiagramDetailModal';
import type { GalleryDiagram } from './types';

const RADIUS = 760;
const ROTATE_SPEED = 0.0045;
const AUTO_ROTATE_SPEED = 0.0009;
const DRAG_THRESHOLD = 6;

function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const offset = 2 / count;
  const increment = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = i * offset - 1 + offset / 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * increment;
    points.push(new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r).multiplyScalar(radius));
  }
  return points;
}

export default function DesignGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [diagrams, setDiagrams] = useState<GalleryDiagram[] | null>(null);
  const [selected, setSelected] = useState<GalleryDiagram | null>(null);

  useEffect(() => {
    fetch('/api/gallery/diagrams')
      .then((r) => r.json())
      .then(setDiagrams)
      .catch(() => setDiagrams([]));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !diagrams || diagrams.length === 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 5000);
    camera.position.z = 1900;

    const renderer = new CSS3DRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const points = fibonacciSphere(diagrams.length, RADIUS);
    const drag = { active: false, moved: false, prevX: 0, prevY: 0, velX: 0, velY: 0 };
    let rotX = -0.15;
    let rotY = 0;
    group.rotation.x = rotX;

    diagrams.forEach((diagram, i) => {
      const el = document.createElement('div');
      el.className = 'gallery-card';
      el.innerHTML = `
        <div class="gallery-card-inner">
          <div class="gallery-card-svg">${diagramPreviewMarkup(diagram, { width: 280, height: 160 })}</div>
          <div class="gallery-card-meta">
            <p class="gallery-card-category">${diagram.category}</p>
            <p class="gallery-card-title">${diagram.title}</p>
          </div>
        </div>
      `;
      el.addEventListener('click', () => {
        if (drag.moved) return;
        setSelected(diagram);
      });
      const obj = new CSS3DObject(el);
      obj.position.copy(points[i]);
      obj.lookAt(0, 0, 0);
      group.add(obj);
    });

    const onPointerDown = (e: PointerEvent) => {
      drag.active = true;
      drag.moved = false;
      drag.prevX = e.clientX;
      drag.prevY = e.clientY;
      drag.velX = 0;
      drag.velY = 0;
      gsap.killTweensOf(drag);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.prevX;
      const dy = e.clientY - drag.prevY;
      if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) drag.moved = true;
      rotY += dx * ROTATE_SPEED;
      rotX += dy * ROTATE_SPEED;
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      drag.velX = dx;
      drag.velY = dy;
      drag.prevX = e.clientX;
      drag.prevY = e.clientY;
    };
    const onPointerUp = () => {
      if (!drag.active) return;
      drag.active = false;
      gsap.to(drag, { velX: 0, velY: 0, duration: 1.2, ease: 'power2.out' });
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!drag.active) {
        rotY += drag.velX * ROTATE_SPEED;
        rotX += drag.velY * ROTATE_SPEED;
        rotX = Math.max(-1.2, Math.min(1.2, rotX));
        const idle = Math.abs(drag.velX) < 0.01 && Math.abs(drag.velY) < 0.01;
        if (idle) rotY += AUTO_ROTATE_SPEED;
      }
      group.rotation.y = rotY;
      group.rotation.x = rotX;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      gsap.killTweensOf(drag);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      container.removeChild(renderer.domElement);
    };
  }, [diagrams]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-semibold">Architecture design starting points</h2>
      <p className="mt-2 text-sm text-slate-600">
        Drag to rotate the gallery and explore reusable architecture pattern sketches. Click a tile to view it full size, get
        details, and ask the AI to refine it or suggest a title.
      </p>
      <div ref={containerRef} className="gallery-viewport mt-4">
        {!diagrams && <p className="p-6 text-sm text-slate-500">Loading gallery…</p>}
        {diagrams && diagrams.length === 0 && <p className="p-6 text-sm text-slate-500">No diagrams available.</p>}
      </div>
      {selected && <DiagramDetailModal diagram={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
