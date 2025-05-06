// js/background.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';

let scene, camera, renderer, starGroup;
const angularSpeed = 0.0005;
const moveDuration = 1;
const moveDistance = 375;
let moving = false, moveStart = 0, origCamZ = 0;
let oscillationPhase = 0, maxAngle = THREE.MathUtils.degToRad(15);

export function initBackground(container) {
  scene    = new THREE.Scene();
  camera   = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  starGroup = new THREE.Group();
  for (let i = 0; i < 1500; i++) {
    const geo = new THREE.SphereGeometry(1, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const star = new THREE.Mesh(geo, mat);
    star.position.set(
      Math.random() * 600 - 300,
      Math.random() * 600 - 300,
      Math.random() * -1200 - 50
    );
    starGroup.add(star);
  }
  scene.add(starGroup);

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  animate();
}

export function startFlight() {
  if (!moving) {
    moving = true;
    moveStart = performance.now();
    origCamZ = camera.position.z;
  }
}

function animate() {
  requestAnimationFrame(animate);

  // 星云环形振荡
  oscillationPhase += angularSpeed;
  starGroup.rotation.y = (Math.sin(oscillationPhase) + 1)/2 * maxAngle;

  if (moving) {
    const elapsed = (performance.now() - moveStart) / 1000;
    if (elapsed <= moveDuration) {
      const t = elapsed / moveDuration;
      const delta = easeInOutQuad(t) * moveDistance;
      camera.position.z = origCamZ - delta;
    } else {
      camera.position.z = origCamZ - moveDistance;
      moving = false;
      window.dispatchEvent(new Event('flightComplete'));
    }
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
}

function onMouseMove(e) {
  const x = (e.clientX - innerWidth/2) / innerWidth;
  const y = (e.clientY - innerHeight/2) / innerHeight;
  const range = 20;
  const img = document.getElementById('titleImage');
  const txt = document.getElementById('continueText');
  if (img) img.style.transform =
    `translateX(calc(-50% + ${-x*range}px)) translateY(${-y*range}px) scale(1.25)`;
  if (txt) txt.style.transform =
    `translateX(calc(-50% + ${ x*range*1.5 }px)) translateY(${ y*range*1.5 }px)`;
}

function easeInOutQuad(t) {
  return t < 0.5
    ? 2*t*t
    : -1 + (4 - 2*t)*t;
}