import { slides } from "../data/slides.js";
import { vertexShader, fragmentShader } from "../shaders.js";
import { scrambleIn, scrambleOut, scrambleVisible } from "./scramble.js";

import * as THREE from "three";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

const page = document.querySelector(".page.work");

gsap.registerPlugin(SplitText);
gsap.config({ nullTargetWarn: false });

let currentSlideIndex = 0;
let isTransitioning = false;
let slideTextures = [];
let shaderMaterial, renderer;
let animationFrameId = null;

// creates character elements for scramble animation
function createCharacterElements(element) {
  if (element.querySelectorAll(".char").length > 0) return;

  const words = element.textContent.split(" ");
  element.innerHTML = "";

  words.forEach((word, index) => {
    const wordDiv = document.createElement("div");
    wordDiv.className = "word";

    [...word].forEach((char) => {
      const charDiv = document.createElement("div");
      charDiv.className = "char";
      charDiv.innerHTML = `<span>${char}</span>`;
      wordDiv.appendChild(charDiv);
    });

    element.appendChild(wordDiv);

    if (index < words.length - 1) {
      const spaceChar = document.createElement("div");
      spaceChar.className = "char space-char";
      spaceChar.innerHTML = "<span> </span>";
      element.appendChild(spaceChar);
    }
  });
}

// creates line elements using splittext
function createLineElements(element) {
  new SplitText(element, { type: "lines", linesClass: "line" });
  element.querySelectorAll(".line").forEach((line) => {
    line.innerHTML = `<span>${line.textContent}</span>`;
  });
}

// adds hover effect to slide link
function addSlideLinkHover(link) {
  let isAnimating = false;
  let currentSplit = null;

  if (!link.dataset.originalColor) {
    link.dataset.originalColor = getComputedStyle(link).color;
  }

  link.addEventListener("mouseenter", () => {
    if (isAnimating) return;
    isAnimating = true;

    if (currentSplit) {
      currentSplit.wordSplit?.revert();
    }

    currentSplit = scrambleVisible(link, 0, {
      duration: 0.1,
      charDelay: 25,
      stagger: 10,
      maxIterations: 5,
    });

    setTimeout(() => {
      isAnimating = false;
    }, 250);
  });

  link.addEventListener("mouseleave", () => {
    link.style.color = link.dataset.originalColor || "";
  });
}

// processes text elements by creating character and line elements
function processTextElements(container) {
  const title = container.querySelector(".slide-title h1");
  if (title) createCharacterElements(title);

  container
    .querySelectorAll(".slide-description p")
    .forEach(createLineElements);

  const link = container.querySelector(".slide-link a");
  if (link) {
    createLineElements(link);
    addSlideLinkHover(link);
  }
}

// creates slide element with title and description
const createSlideElement = (slideData) => {
  const content = document.createElement("div");
  content.className = "slider-content";
  content.style.opacity = "0";

  content.innerHTML = `
    <div class="slide-title"><a href="${slideData.route}" class="scramble-hover"><h1>${slideData.title}</h1></a></div>
    <div class="slide-description">
      <div class="slide-info">
      </div>
      <div class="slide-link">
        <a href="${slideData.route}" class="scramble-hover">[ View Full Project ]</a>
      </div>
    </div>
  `;

  return content;
};

// animates transition between slides with scramble effects
const animateSlideTransition = (nextIndex) => {
  const currentContent = document.querySelector(".slider-content");
  const slider = document.querySelector(".slider");

  // ADD THIS: Get current description for backdrop animation
  const currentDescription = currentContent.querySelector(".slide-description");

  const timeline = gsap.timeline();

  const currentTitle = currentContent.querySelector(".slide-title h1");
  if (currentTitle) {
    scrambleOut(currentTitle, 0);
  }

  timeline.call(
    () => {
      const newContent = createSlideElement(slides[nextIndex]);

      timeline.kill();
      currentContent.remove();
      slider.appendChild(newContent);

      gsap.set(newContent.querySelectorAll("span"), { y: "100%" });

      setTimeout(() => {
        processTextElements(newContent);

        const newTitle = newContent.querySelector(".slide-title h1");
        const newLines = newContent.querySelectorAll(".line span");

        gsap.set(newLines, { y: "100%" });
        gsap.set(newContent, { opacity: 0 });

        // Set backdrop initial state
        const description = newContent.querySelector(".slide-description");
        if (description) {
          gsap.set(description, {
            backgroundColor: "transparent",
          });
        }

        gsap
          .timeline({
            onComplete: () => {
              isTransitioning = false;
              currentSlideIndex = nextIndex;
              currentContent.remove();
            },
          })
          .to(
            newContent,
            { opacity: 1, duration: 0.6, ease: "power2.inOut" },
            0,
          )
          .call(
            () => {
              if (newTitle) {
                scrambleIn(newTitle, 0);
                // Re-apply the drop shadow to title words
                const titleWords = newTitle.querySelectorAll(".word");
                titleWords.forEach((word) => {
                  gsap.set(word, {
                    // filter: "drop-shadow(8px 0.5px 0.5px black)",
                  });
                });
              }
            },
            [],
            0.2,
          )
          .to(
            newLines,
            { y: "0%", duration: 0.5, stagger: 0.1, ease: "power2.inOut" },
            0.3,
          );

        // ADD THE BACKDROP ANIMATION AFTER THE TIMELINE, NOT INSIDE IT
        if (description) {
          gsap.to(description, {
            backgroundColor: "transparent",
            duration: 0.01,
            ease: "power2.inOut",
            delay: 0.1,
          });
        }
      }, 100);
    },
    null,
    0,
  );
};

// sets up initial slide with proper text processing
const setupInitialSlide = () => {
  const content = document.querySelector(".slider-content");
  processTextElements(content);
  const lines = content.querySelectorAll(".line span");
  gsap.set(lines, { y: "0%" });

  // Set initial backdrop
  const description = content.querySelector(".slide-description");
  gsap.set(description, {
    backgroundColor: "transparent",
  });
};

// initializes three renderer and shader material
const initializeRenderer = async () => {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("canvas"),
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTexture1: { value: null },
      uTexture2: { value: null },
      uProgress: { value: 0.0 },
      uResolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
      },
      uTexture1Size: { value: new THREE.Vector2(1, 1) },
      uTexture2Size: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader,
    fragmentShader,
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial));

  const loader = new THREE.TextureLoader();
  loader.premultiplyAlpha = false; // Add this

  for (const slide of slides) {
    const imageUrl =
      isMobile && slide.mobileImage ? slide.mobileImage : slide.image;
    const texture = await new Promise((resolve, reject) =>
      loader.load(imageUrl, resolve, undefined, reject),
    ).catch(() => null);
    if (!texture) continue; // Skip failed textures
    texture.premultiplyAlpha = false; // Add this
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.userData = {
      size: new THREE.Vector2(texture.image.width, texture.image.height),
    };
    slideTextures.push(texture);
  }

  if (slideTextures.length < 2) return;

  const safeIndex = Math.min(
    Math.max(currentSlideIndex, 0),
    slideTextures.length - 1,
  );
  const nextIndex = (safeIndex + 1) % slideTextures.length;
  currentSlideIndex = safeIndex;

  shaderMaterial.uniforms.uTexture1.value = slideTextures[safeIndex];
  shaderMaterial.uniforms.uTexture2.value = slideTextures[nextIndex];
  shaderMaterial.uniforms.uTexture1Size.value =
    slideTextures[safeIndex].userData.size;
  shaderMaterial.uniforms.uTexture2Size.value =
    slideTextures[nextIndex].userData.size;
  shaderMaterial.uniforms.uProgress.value = 0;

  const render = () => {
    if (!renderer || !renderer.getContext()) return;
    animationFrameId = requestAnimationFrame(render);
    renderer.render(scene, camera);
  };
  render();
};

// handles slide change with shader transition
const handleSlideChange = () => {
  if (isTransitioning) return;

  isTransitioning = true;
  const nextIndex = (currentSlideIndex + 1) % slides.length;

  shaderMaterial.uniforms.uTexture1.value = slideTextures[currentSlideIndex];
  shaderMaterial.uniforms.uTexture2.value = slideTextures[nextIndex];
  shaderMaterial.uniforms.uTexture1Size.value =
    slideTextures[currentSlideIndex].userData.size;
  shaderMaterial.uniforms.uTexture2Size.value =
    slideTextures[nextIndex].userData.size;

  animateSlideTransition(nextIndex);

  gsap.fromTo(
    shaderMaterial.uniforms.uProgress,
    { value: 0 },
    {
      value: 1,
      duration: 2.5,
      ease: "power2.inOut",
      onComplete: () => {
        if (!shaderMaterial || !slideTextures[nextIndex]) return;
        shaderMaterial.uniforms.uProgress.value = 0;
        shaderMaterial.uniforms.uTexture1.value = slideTextures[nextIndex];
        shaderMaterial.uniforms.uTexture1Size.value =
          slideTextures[nextIndex].userData.size;
      },
    },
  );
};

// handles window resize events - resets splittext and elements
const handleResize = () => {
  if (!renderer || !shaderMaterial) return; // ← add this line
  renderer.setSize(window.innerWidth, window.innerHeight);
  shaderMaterial.uniforms.uResolution.value.set(
    window.innerWidth,
    window.innerHeight,
  );

  const currentContent = document.querySelector(".slider-content");
  if (!currentContent) return;

  const currentSlideData = slides[currentSlideIndex];

  const slider = document.querySelector(".slider");
  currentContent.remove();

  const newContent = createSlideElement(currentSlideData);
  slider.appendChild(newContent);

  document.fonts.ready.then(() => {
    processTextElements(newContent);

    // reset shader to current slide
    const nextIndex = (currentSlideIndex + 1) % slides.length;
    shaderMaterial.uniforms.uTexture1.value = slideTextures[currentSlideIndex];
    shaderMaterial.uniforms.uTexture2.value = slideTextures[nextIndex];
    shaderMaterial.uniforms.uTexture1Size.value =
      slideTextures[currentSlideIndex].userData.size;
    shaderMaterial.uniforms.uTexture2Size.value =
      slideTextures[nextIndex].userData.size;
    shaderMaterial.uniforms.uProgress.value = 0;

    // set initial state
    const lines = newContent.querySelectorAll(".line span");
    gsap.set(lines, { y: "0%" });
    gsap.set(newContent, { opacity: "1" });
  });
};

window.addEventListener("load", () => {
  document.fonts.ready.then(() => {
    setupInitialSlide();
    initializeRenderer();
  });
});

document.addEventListener("click", (e) => {
  // don't change slide if clicking on project link, nav, nav-overlay, or menu elements
  if (
    e.target.closest(".slide-link a") ||
    e.target.closest("nav") ||
    e.target.closest(".nav-overlay") ||
    e.target.closest(".menu-toggle-btn")
  ) {
    return;
  }
  handleSlideChange();
});

// Scroll-driven slide change (debounced)
let scrollTimeout = null;
window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    if (scrollTimeout) return;

    // Only trigger on meaningful scroll
    if (Math.abs(e.deltaY) < 10) return;

    handleSlideChange();

    // Debounce — ignore further scroll events during transition
    scrollTimeout = setTimeout(() => {
      scrollTimeout = null;
    }, 1500);
  },
  { passive: false },
);

// Touch swipe support for mobile
let touchStartY = 0;
window.addEventListener(
  "touchstart",
  (e) => {
    touchStartY = e.touches[0].clientY;
  },
  { passive: true },
);

window.addEventListener("touchend", (e) => {
  const deltaY = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(deltaY) > 50) {
    handleSlideChange();
  }
});

window.addEventListener("resize", handleResize);

window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (shaderMaterial) gsap.killTweensOf(shaderMaterial.uniforms.uProgress);
    gsap.killTweensOf("*");
    isTransitioning = false;
    slideTextures.forEach((t) => t.dispose());
    slideTextures = [];
    if (renderer) {
      renderer.dispose();
      renderer = null;
    }
    shaderMaterial = null;
    initializeRenderer();
  }
});

if (animationFrameId !== null) {
  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
}

const isMobile = window.innerWidth < 768;
