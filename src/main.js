import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

class MemoryScene {
  constructor(container, buildScene) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111323);
    this.camera = this.createCamera();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.mixers = [];
    this.objects = {};
    this.rafId = null;

    const light = new THREE.DirectionalLight(0xffffff, 1.4);
    light.position.set(5, 8, 10);
    this.scene.add(light);

    const fillLight = new THREE.DirectionalLight(0x83d5ff, 0.6);
    fillLight.position.set(-6, 5, -4);
    this.scene.add(fillLight);

    const ambient = new THREE.AmbientLight(0x6ec4ff, 0.45);
    this.scene.add(ambient);

    buildScene(this.scene, this.camera, this.objects);
    this.animate = this.animate.bind(this);
    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
    this.onResize();
    this.animate();
  }

  createCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight || 1;
    const frustumSize = 12;
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      100
    );
    camera.position.set(10, 12, 10);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;
    const frustumSize = 12;
    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.rafId = requestAnimationFrame(this.animate);
    const elapsed = this.clock.getElapsedTime();

    if (this.objects.onUpdate) {
      this.objects.onUpdate(elapsed);
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
    this.scene.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}

function createRoomMemory(scene, camera, objects) {
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.2, 10),
    new THREE.MeshStandardMaterial({ color: 0x1f223d })
  );
  floor.position.y = -0.1;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1c33, roughness: 0.6 });
  const wallThickness = 0.4;
  const wallHeight = 4;

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(10, wallHeight, wallThickness), wallMaterial);
  backWall.position.set(0, wallHeight / 2, -5);
  scene.add(backWall);

  const sideWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 10), wallMaterial);
  sideWall.position.set(-5, wallHeight / 2, 0);
  scene.add(sideWall);

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 0.2, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x4c5372, metalness: 0.2, roughness: 0.4 })
  );
  table.position.set(0, 1.1, 0);
  scene.add(table);

  const tableLegMaterial = new THREE.MeshStandardMaterial({ color: 0x30354f });
  const legPositions = [
    [-2.1, 0.5, -1],
    [2.1, 0.5, -1],
    [-2.1, 0.5, 1],
    [2.1, 0.5, 1],
  ];
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 12), tableLegMaterial);
    leg.position.set(x, y, z);
    scene.add(leg);
  });

  function createChair(x, z, rotation) {
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x616a89 })
    );
    seat.position.set(x, 0.8, z);
    seat.rotation.y = rotation;
    scene.add(seat);

    const back = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x505776 })
    );
    back.position.set(x, 1.4, z - Math.cos(rotation) * 0.6);
    back.rotation.y = rotation;
    scene.add(back);
  }

  createChair(-1.7, 0.8, Math.PI * 0.1);
  createChair(1.7, -0.8, Math.PI * 1.1);

  function createPerson({ x, z, facing, colorPrimary, colorAccent }) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = facing;

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 1.8, 16),
      new THREE.MeshStandardMaterial({ color: colorPrimary })
    );
    torso.position.y = 1.8;
    group.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 24, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd4b8 })
    );
    head.position.y = 2.9;
    group.add(head);

    const legs = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 1.6, 12),
      new THREE.MeshStandardMaterial({ color: colorAccent })
    );
    legs.position.y = 0.8;
    group.add(legs);

    scene.add(group);
    return group;
  }

  const interviewer = createPerson({
    x: -1.2,
    z: 0.8,
    facing: Math.PI * 0.1,
    colorPrimary: 0x7ab6ff,
    colorAccent: 0x2e3a6b,
  });

  const candidate = createPerson({
    x: 1.2,
    z: -0.8,
    facing: Math.PI * 1.1,
    colorPrimary: 0xffa7c4,
    colorAccent: 0x3a275c,
  });

  const holo = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.2),
    new THREE.MeshBasicMaterial({ color: 0x9ef6f6, transparent: true, opacity: 0.18 })
  );
  holo.rotation.x = -Math.PI / 2;
  holo.position.set(0, 1.15, 0);
  scene.add(holo);

  const plantPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 0.8, 12),
    new THREE.MeshStandardMaterial({ color: 0x2f354e })
  );
  plantPot.position.set(-3.5, 0.4, -2.8);
  scene.add(plantPot);

  const plantLeaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 2.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x65e6c1, emissive: 0x0b3324, emissiveIntensity: 0.3 })
  );
  plantLeaves.position.set(-3.5, 1.7, -2.8);
  scene.add(plantLeaves);

  objects.onUpdate = (elapsed) => {
    interviewer.rotation.y = Math.PI * 0.1 + Math.sin(elapsed * 0.6) * 0.05;
    candidate.rotation.y = Math.PI * 1.1 + Math.sin(elapsed * 0.6 + Math.PI) * 0.05;
    holo.material.opacity = 0.15 + Math.sin(elapsed * 1.5) * 0.05;
  };
}

function createRoadMemory(scene, camera, objects) {
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x15182b })
  );
  base.position.y = -0.2;
  scene.add(base);

  const road = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.02, 4),
    new THREE.MeshStandardMaterial({ color: 0x2a2f45 })
  );
  road.position.y = 0.01;
  scene.add(road);

  const dashedMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3 });
  for (let i = -5; i <= 5; i += 2) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 0.2), dashedMaterial);
    dash.position.set(i, 0.02, 0);
    scene.add(dash);
  }

  const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x1f3d3d, roughness: 0.9 });
  const leftTerrain = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 2), terrainMaterial);
  leftTerrain.position.set(0, -0.05, -3);
  scene.add(leftTerrain);

  const rightTerrain = leftTerrain.clone();
  rightTerrain.position.z = 3;
  scene.add(rightTerrain);

  const guardrailMaterial = new THREE.MeshStandardMaterial({ color: 0x5bd4d4, emissive: 0x1b5c68, emissiveIntensity: 0.5 });
  function createGuardrail(z) {
    const railGroup = new THREE.Group();
    railGroup.position.z = z;
    for (let i = -5; i <= 5; i += 2.5) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), guardrailMaterial);
      post.position.set(i, 0.6, 0);
      railGroup.add(post);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.15, 0.12), guardrailMaterial);
    rail.position.set(0, 1.15, 0);
    railGroup.add(rail);
    scene.add(railGroup);
  }

  createGuardrail(-2.3);
  createGuardrail(2.3);

  const carGroup = new THREE.Group();
  carGroup.position.set(-2, 0.6, 0);
  scene.add(carGroup);

  const carBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.8, 1.4),
    new THREE.MeshStandardMaterial({ color: 0xff7a9e, metalness: 0.4, roughness: 0.4 })
  );
  carBody.position.y = 0.6;
  carGroup.add(carBody);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.7, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xf5e1ff, transparent: true, opacity: 0.65 })
  );
  cabin.position.set(0.2, 1.1, 0);
  carGroup.add(cabin);

  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x0e0f15, metalness: 0.3 });
  const wheelPositions = [
    [-0.9, 0.2, 0.7],
    [0.9, 0.2, 0.7],
    [-0.9, 0.2, -0.7],
    [0.9, 0.2, -0.7],
  ];
  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.4, 24), wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    carGroup.add(wheel);
  });

  function createPassenger(offsetX, colorPrimary, colorAccent) {
    const passenger = new THREE.Group();
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: colorPrimary })
    );
    torso.position.y = 0.6;
    passenger.add(torso);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd4b8 })
    );
    head.position.y = 1.2;
    passenger.add(head);

    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.1, 8, 20),
      new THREE.MeshStandardMaterial({ color: colorAccent })
    );
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 0.95;
    passenger.add(scarf);

    passenger.position.set(offsetX, 0.2, 0);
    carGroup.add(passenger);
    return passenger;
  }

  const driver = createPassenger(-0.35, 0x7ab6ff, 0x2e3a6b);
  const companion = createPassenger(0.35, 0xffa7c4, 0x3a275c);

  const mountainsMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2d4f, roughness: 1, flatShading: true });
  for (let i = 0; i < 4; i++) {
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(2.5 + i, 4 + i, 4 + i), mountainsMaterial);
    mountain.position.set(-4 + i * 3, 1.2, -3.5);
    scene.add(mountain);
    const mountain2 = mountain.clone();
    mountain2.position.z = 3.5;
    mountain2.position.x += 1.5;
    mountain2.rotation.y = Math.random() * Math.PI;
    scene.add(mountain2);
  }

  objects.onUpdate = (elapsed) => {
    carGroup.position.x = -2 + Math.sin(elapsed * 0.6) * 2.5;
    carGroup.rotation.y = Math.sin(elapsed * 0.3) * 0.1;
    driver.rotation.y = Math.sin(elapsed * 0.8) * 0.1;
    companion.rotation.y = Math.sin(elapsed * 0.8 + Math.PI) * 0.1;
  };
}

const scenes = [
  new MemoryScene(document.getElementById("memory-1"), createRoomMemory),
  new MemoryScene(document.getElementById("memory-2"), createRoadMemory),
];

const slides = Array.from(document.querySelectorAll(".slide"));
const dotsContainer = document.querySelector(".dots");
const prevButton = document.querySelector(".prev");
const nextButton = document.querySelector(".next");
let currentSlide = 0;

function updateSlider(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
  });
  Array.from(dotsContainer.children).forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
    dot.setAttribute("aria-selected", i === index ? "true" : "false");
    dot.setAttribute("tabindex", i === index ? "0" : "-1");
  });
  currentSlide = index;
}

function createDots() {
  slides.forEach((slide, i) => {
    const button = document.createElement("button");
    button.className = i === 0 ? "active" : "";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", slide.querySelector(".canvas-wrapper").id);
    button.setAttribute("aria-label", `Ir para memória ${i + 1}`);
    button.setAttribute("tabindex", i === 0 ? "0" : "-1");
    button.setAttribute("aria-selected", i === 0 ? "true" : "false");
    button.addEventListener("click", () => updateSlider(i));
    dotsContainer.appendChild(button);
  });
}

createDots();

prevButton.addEventListener("click", () => {
  const index = (currentSlide - 1 + slides.length) % slides.length;
  updateSlider(index);
});

nextButton.addEventListener("click", () => {
  const index = (currentSlide + 1) % slides.length;
  updateSlider(index);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    prevButton.click();
  }
  if (event.key === "ArrowRight") {
    nextButton.click();
  }
});

updateSlider(0);
