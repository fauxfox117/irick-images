import * as THREE from "three";
import html2canvas from "html2canvas";

class PixelatedTextEffect {
  constructor() {
    this.textContainer = document.querySelector(".pixelated-text");
    this.textElement = document.querySelector(".pixelated-text h1");

    if (!this.textContainer || !this.textElement) return;

    this.isMobile = window.innerWidth < 1000;
    this.isDestroyed = false;
    this.time = 0;

    this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };
    this.settings = { grid: 25, mouse: 0.25, strength: 0.1, relaxation: 0.925 };

    this.init();
  }

  // create data texture
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

  // capture text element as texture using html2canvas
  async createTextTexture() {
    try {
      this.textElement.style.opacity = "1";
      await new Promise((resolve) => setTimeout(resolve, 50));

      const h1Canvas = await html2canvas(this.textElement, {
        backgroundColor: null,
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        allowTaint: true,
        width: this.textElement.offsetWidth,
        height: this.textElement.offsetHeight,
        logging: false,
        imageTimeout: 0,
      });

      this.textElement.style.opacity = "0";

      // create full container sized canvas
      const fullCanvas = document.createElement("canvas");
      const ctx = fullCanvas.getContext("2d");
      const dpr = window.devicePixelRatio || 2;

      this.width = this.textContainer.offsetWidth;
      this.height = this.textContainer.offsetHeight;

      fullCanvas.width = this.width * dpr;
      fullCanvas.height = this.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, this.width, this.height);

      // position text within container
      const h1Rect = this.textElement.getBoundingClientRect();
      const containerRect = this.textContainer.getBoundingClientRect();
      const h1X = h1Rect.left - containerRect.left;
      const h1Y = h1Rect.top - containerRect.top;

      ctx.drawImage(
        h1Canvas,
        h1X,
        h1Y,
        h1Canvas.width / dpr,
        h1Canvas.height / dpr
      );

      return this.createThreeTexture(fullCanvas);
    } catch (error) {
      return this.createFallbackTexture();
    }
  }

  // fallback text rendering using canvas 2d
  createFallbackTexture() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 2;

    this.width = this.textContainer.offsetWidth;
    this.height = this.textContainer.offsetHeight;

    canvas.width = this.width * dpr;
    canvas.height = this.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, this.width, this.height);

    // get text styling and position
    const computedStyle = window.getComputedStyle(this.textElement);
    const fontSize = parseFloat(computedStyle.fontSize);
    const fontFamily = computedStyle.fontFamily;
    const fontWeight = computedStyle.fontWeight;
    const color = computedStyle.color;

    const h1Rect = this.textElement.getBoundingClientRect();
    const containerRect = this.textContainer.getBoundingClientRect();
    const h1X = h1Rect.left - containerRect.left + h1Rect.width / 2;
    const h1Y = h1Rect.top - containerRect.top + h1Rect.height / 2;

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.textElement.textContent, h1X, h1Y);

    return this.createThreeTexture(canvas);
  }

  // convert canvas to three texture
  createThreeTexture(canvas) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.flipY = true;
    return texture;
  }

  // initialize three scene and materials
  initializeScene(texture) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this.camera.position.z = 1;

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
        vec4 color = texture2D(uTexture, vUv - 0.02 * offset.rg);
        gl_FragColor = color;
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
      transparent: true,
    });

    this.planeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.material
    );
    this.scene.add(this.planeMesh);

    // setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // position canvas
    const canvas = this.renderer.domElement;
    canvas.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;z-index:2";
    this.textContainer.appendChild(canvas);
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

  // handle mouse movement
  handlePointerMove(clientX, clientY) {
    if (this.isMobile) return;

    const rect = this.textContainer.getBoundingClientRect();
    const newX = (clientX - rect.left) / rect.width;
    const newY = (clientY - rect.top) / rect.height;

    this.mouse.vX = newX - this.mouse.prevX;
    this.mouse.vY = newY - this.mouse.prevY;
    this.mouse.prevX = this.mouse.x;
    this.mouse.prevY = this.mouse.y;
    this.mouse.x = newX;
    this.mouse.y = newY;
  }

  // setup event listeners
  setupEvents() {
    if (!this.isMobile) {
      this.textContainer.addEventListener("mousemove", (e) => {
        this.handlePointerMove(e.clientX, e.clientY);
      });
    }

    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(async () => {
        this.isMobile = window.innerWidth < 1000;
        this.width = this.textContainer.offsetWidth;
        this.height = this.textContainer.offsetHeight;

        this.renderer.setSize(this.width, this.height);
        this.createCleanGrid();

        try {
          const newTexture = await this.createTextTexture();
          this.material.uniforms.uTexture.value = newTexture;
          this.material.uniforms.uTexture.value.needsUpdate = true;
        } catch (error) {
          console.error("failed to recreate texture on resize:", error);
        }
      }, 100);
    });
  }

  // main render loop
  render() {
    if (this.isDestroyed) return;

    this.time += 0.05;
    this.updateDataTexture();
    this.material.uniforms.time.value = this.time;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }

  // initialize the effect
  async init() {
    try {
      await new Promise((resolve) => {
        if (document.readyState === "complete") {
          resolve();
        } else {
          window.addEventListener("load", resolve);
        }
      });

      if (this.isMobile) {
        this.textElement.style.opacity = "1";
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const texture = await this.createTextTexture();
      this.initializeScene(texture);
      this.setupEvents();
      this.render();
    } catch (error) {
      console.error("failed to initialize pixelated text effect:", error);
    }
  }

  // cleanup
  destroy() {
    this.isDestroyed = true;
    if (this.renderer) this.renderer.dispose();
    if (this.material) this.material.dispose();
    if (this.planeMesh?.geometry) this.planeMesh.geometry.dispose();
    if (this.dataTexture) this.dataTexture.dispose();
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => new PixelatedTextEffect()
  );
} else {
  new PixelatedTextEffect();
}
