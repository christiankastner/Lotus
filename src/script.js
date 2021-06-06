import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { gsap } from "gsap";

//Shaders
import loaderVertexShader from "./shaders/loader/vertex.glsl";
import loaderFragmentShader from "./shaders/loader/fragment.glsl";
import flowerVertexShader from "./shaders/flower/vertex.glsl";
import flowerFragmentShader from "./shaders/flower/fragment.glsl";

/**
 * Loaders
 */
const loadingBarElement = document.querySelector(".loading-bar");
const loadingManager = new THREE.LoadingManager(
  // Loaded
  () => {

    window.setTimeout(() => {

      gsap.to(overlayMaterial.uniforms.uAlpha, {
        duration: 3,
        value: 0,
        delay: 1,
      });

      // Update loadingBarElement
      loadingBarElement.classList.add("ended");
      loadingBarElement.style.transform = "";
      gsap.to(material.uniforms.uEnter, {value: 0, duration: 5});
    }, 500);
  },

  // Progress
  (itemUrl, itemsLoaded, itemsTotal) => {
    // Calculate the progress and update the loadingBarElement
    const progressRatio = itemsLoaded / itemsTotal;
    loadingBarElement.style.transform = `scaleX(${progressRatio})`;
  }
);
const gltfLoader = new GLTFLoader(loadingManager);
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);

/**
 * Base
 */
// Debug
const debugObject = {};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
  // wireframe: true,
  transparent: true,
  uniforms: {
    uAlpha: { value: 1 },
  },
  vertexShader: loaderVertexShader,
  fragmentShader: loaderFragmentShader,
});
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

scene.background = new THREE.Color("rgb(50,50,75)");

/**
 * Models
 */
let flowerGroup = new THREE.Group();
const material = new THREE.ShaderMaterial({
  vertexShader: flowerVertexShader,
  blending: THREE.AdditiveBlending,
  vertexColors: true,
  fragmentShader: flowerFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uEnter: { value: 20 },
  },
});

const particlePalette = [
  [0.35, 0.8, 0.56],
  [0.35 * 0.83, 0.8 * 0.83, 0.56 * 0.83],
  [0.35 * 0.65, 0.8 * 0.65, 0.56 * 0.65],
];

// Number of particles at each geometry vertex
const particleCount = 5;

gltfLoader.load("https://res.cloudinary.com/dlc0jxvah/image/upload/v1622847714/lotus_cpcfgv.glb", (gltf) => {
  const sceneMeshes = [...gltf.scene.children[1].children];

  for (const mesh of sceneMeshes) {
    if (mesh.geometry) {
      const totalParticles = mesh.geometry.attributes.position.array.length / 3;

      // Mesh Attributes
      const particleArray = new Float32Array(totalParticles * 3);
      const particleColors = new Float32Array(totalParticles * 3);
      const particleSize = new Float32Array(totalParticles);
      const particleGeometry = new THREE.BufferGeometry();

      for (let i = 0; i < totalParticles; i++) {
        const i3 = i * 3;

        particleArray[i3] =
          mesh.geometry.attributes.position.array[i3] + Math.random() * 5;
        particleArray[i3 + 1] =
          mesh.geometry.attributes.position.array[i3 + 1] + Math.random() * 5;
        particleArray[i3 + 2] =
          mesh.geometry.attributes.position.array[i3 + 2] + Math.random() * 5;

        const num = Math.floor(Math.random() * 3);
        particleColors[i3] = particlePalette[num][0];
        particleColors[i3 + 1] = particlePalette[num][1];
        particleColors[i3 + 2] = particlePalette[num][2];
        particleSize[i] = Math.random();
      }

      // Set Attributes
      particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(particleArray, 3)
      );
      particleGeometry.setAttribute(
        "color",
        new THREE.BufferAttribute(particleColors, 3)
      );
      particleGeometry.setAttribute(
        "size",
        new THREE.BufferAttribute(particleSize, 1)
      );

      const petalMesh = new THREE.Points(particleGeometry, material);
      petalMesh.scale.copy(mesh.scale);
      petalMesh.position.copy(mesh.position);
      petalMesh.rotation.copy(mesh.rotation);
      flowerGroup.add(petalMesh);
    }
  }

  scene.add(flowerGroup);
});

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-4, 3, 3);
camera.lookAt(0, 0, 0);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
});
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 3;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

document.addEventListener("mousemove", (event) => {
  const normXPosition = event.clientX / window.innerWidth - 0.5;
  flowerGroup.rotation.y = (normXPosition * Math.PI) / 4;
});
const tick = () => {
  // Update controls
  controls.update();

  const elapsedTime = clock.getElapsedTime();

  material.uniforms.uTime.value = elapsedTime;
  material.uniforms.uScroll.value = window.scrollY;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
