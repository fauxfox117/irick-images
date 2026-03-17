import * as THREE from "three";

class PixelatedVideoEffect {
  constructor() {
    this.heroContainer = document.querySelector(".hero");
    this.videoElement = document.querySelector(".hero-video");

    if (!this.heroContainer || !this.videoElement) return;

    this.isMobile = window.innerWidth < 1000;
    this.isDestroyed = false;
    this.time = 0;

    this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };
    this.settings = { grid: 25, mouse: 0.25, strength: 0.1, relaxation: 0.925 };

    this.init();
  }

  // create video texture from DOM element
  createVideoTexture() {
    this.videoTexture = new THREE.VideoTexture(this.videoElement);
    this.videoTexture.minFilter = THREE.LinearFilter;
    this.videoTexture.magFilter = THREE.LinearFilter;
    this.videoTexture.generateMipmaps = false;
    this.videoTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.videoTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.videoTexture.flipY = true;
    return this.videoTexture;
  }

  // calculate camera and geometry for proper aspect ratio
  updateCameraAndGeometry() {
    this.width = this.heroContainer.offsetWidth;
    this.height = this.heroContainer.offsetHeight;

    const videoWidth = this.videoElement.videoWidth || 1920;
    const videoHeight = this.videoElement.videoHeight || 1080;
    const containerAspect = this.width / this.height;
    const videoAspect = videoWidth / videoHeight;

    let scaleX = 1,
      scaleY = 1;
    if (containerAspect > videoAspect) {
      scaleY = containerAspect / videoAspect;
    } else {
      scaleX = videoAspect / containerAspect;
    }

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this.camera.position.z = 1;
    this.planeGeometry = new THREE.PlaneGeometry(2 * scaleX, 2 * scaleY);
  }

  // create clean data texture without random values
  createCleanGrid() {
    const size = this.settings.grid;
    const totalSize = size * size * 4;
    const data = new Float32Array(totalSize);

    for (let i = 3; i < totalSize; i += 4) {
      data[i] = 255;
    }

    this.dataTexture = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this.dataTexture.magFilter = this.dataTexture.minFilter =
      THREE.NearestFilter;

    if (this.material) {
      this.material.uniforms.uDataTexture.value = this.dataTexture;
      this.material.uniforms.uDataTexture.value.needsUpdate = true;
    }
  }

  // initialize three scene and materials
  initializeScene(texture) {
    this.scene = new THREE.Scene();
    this.updateCameraAndGeometry();
    this.createCleanGrid();

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`;

    const fragmentShader = `
      uniform sampler2D uDataTexture;
      uniform sampler2D uTexture;
      varying vec2 vUv;
      void main() {
        vec4 offset = texture2D(uDataTexture, vUv);
        gl_FragColor = texture2D(uTexture, vUv - 0.02 * offset.rg);
      }`;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        uTexture: { value: texture },
        uDataTexture: { value: this.dataTexture },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });

    this.planeMesh = new THREE.Mesh(this.planeGeometry, this.material);
    this.scene.add(this.planeMesh);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // position canvas and hide original video
    const canvas = this.renderer.domElement;
    canvas.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;z-index:0";
    this.videoElement.style.opacity = "0";
    this.heroContainer.appendChild(canvas);
  }

  // update data texture based on mouse movement
  updateDataTexture() {
    if (!this.dataTexture || this.isMobile) return;

    const data = this.dataTexture.image.data;
    const size = this.settings.grid;
    const relaxation = this.settings.relaxation;

    for (let i = 0; i < data.length; i += 4) {
      data[i] *= relaxation;
      data[i + 1] *= relaxation;
    }

    if (Math.abs(this.mouse.vX) < 0.001 && Math.abs(this.mouse.vY) < 0.001) {
      this.mouse.vX *= 0.9;
      this.mouse.vY *= 0.9;
      this.dataTexture.needsUpdate = true;
      return;
    }

    // calculate mouse influence on grid
    const gridMouseX = size * this.mouse.x;
    const gridMouseY = size * (1 - this.mouse.y);
    const maxDist = size * this.settings.mouse;
    const maxDistSq = maxDist * maxDist;
    const aspect = this.height / this.width;
    const strengthFactor = this.settings.strength * 100;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const distance = (gridMouseX - i) ** 2 / aspect + (gridMouseY - j) ** 2;
        if (distance < maxDistSq) {
          const index = 4 * (i + size * j);
          const power = Math.min(10, maxDist / Math.sqrt(distance));
          data[index] += strengthFactor * this.mouse.vX * power;
          data[index + 1] -= strengthFactor * this.mouse.vY * power;
        }
      }
    }

    this.mouse.vX *= 0.9;
    this.mouse.vY *= 0.9;
    this.dataTexture.needsUpdate = true;
  }

  // handle mouse/touch pointer movement
  handlePointerMove(clientX, clientY) {
    if (this.isMobile) return;

    const rect = this.heroContainer.getBoundingClientRect();
    const newX = (clientX - rect.left) / rect.width;
    const newY = (clientY - rect.top) / rect.height;

    this.mouse.vX = newX - this.mouse.prevX;
    this.mouse.vY = newY - this.mouse.prevY;
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = newX;
    this.mouse.y = newY;
  }

  // event listeners
  setupEvents() {
    if (!this.isMobile) {
      this.heroContainer.addEventListener("mousemove", (e) => {
        this.handlePointerMove(e.clientX, e.clientY);
      });
    }

    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.isMobile = window.innerWidth < 1000;
        this.updateCameraAndGeometry();

        if (this.planeMesh) {
          this.planeMesh.geometry.dispose();
          this.planeMesh.geometry = this.planeGeometry;
        }

        this.renderer.setSize(this.width, this.height);
        this.createCleanGrid();
      }, 100);
    });
  }

  // main render loop
  render() {
    if (this.isDestroyed) return;

    this.time += 0.05;
    this.updateDataTexture();
    this.material.uniforms.time.value = this.time;

    if (this.videoTexture) {
      this.videoTexture.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }

  async init() {
    try {
      // wait for DOM ready
      await new Promise((resolve) => {
        if (document.readyState === "complete") {
          resolve();
        } else {
          window.addEventListener("load", resolve);
        }
      });

      // wait for video data
      await new Promise((resolve) => {
        if (this.videoElement.readyState >= 2) {
          resolve();
        } else {
          this.videoElement.addEventListener("loadeddata", resolve);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const texture = this.createVideoTexture();
      this.initializeScene(texture);
      this.setupEvents();
      this.render();
    } catch (error) {
      console.error("Failed to initialize pixelated video effect:", error);
    }
  }

  // cleanup
  destroy() {
    this.isDestroyed = true;
    if (this.renderer) this.renderer.dispose();
    if (this.material) this.material.dispose();
    if (this.planeGeometry) this.planeGeometry.dispose();
    if (this.videoTexture) this.videoTexture.dispose();
    if (this.dataTexture) this.dataTexture.dispose();
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => new PixelatedVideoEffect()
  );
} else {
  new PixelatedVideoEffect();
}
