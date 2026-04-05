import { slides } from "../data/slides.js";
import { vertexShader, fragmentShader } from "../shaders.js";
import { scrambleIn, scrambleOut, scrambleVisible } from "./scramble.js";

import * as THREE from "three";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);
gsap.config({ nullTargetWarn: false });

const section = document.querySelector(".work-preview");
if (!section) throw new Error(".work-preview section not found");
const slider = section.querySelector(".slider");

let currentSlideIndex = 0;
let isTransitioning = false;
let slideTextures = [];
let shaderMaterial, renderer;

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

function createLineElements(element) {
  new SplitText(element, { type: "lines", linesClass: "line" });
  element.querySelectorAll(".line").forEach((line) => {
    line.innerHTML = `<span>${line.textContent}</span>`;
  });
}

function addSlideLinkHover(link) {
  let isAnimating = false;
  let currentSplit = null;
  if (!link.dataset.originalColor)
    link.dataset.originalColor = getComputedStyle(link).color;
  link.addEventListener("mouseenter", () => {
    if (isAnimating) return;
    isAnimating = true;
    if (currentSplit) currentSplit.wordSplit?.revert();
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
        <a href="${slideData.route}">[ View Full Project ]</a>
      </div>
    </div>
  `;
  return content;
};

const animateSlideTransition = (nextIndex) => {
  const currentContent = slider.querySelector(".slider-content");
  const currentDescription = currentContent.querySelector(".slide-description");
  const timeline = gsap.timeline();
  const currentTitle = currentContent.querySelector(".slide-title h1");
  if (currentTitle) scrambleOut(currentTitle, 0);

  timeline
    .to(
      currentDescription,
      {
        backgroundColor: "rgba(0,0,0,0)",
        backdropFilter: "blur(0px)",
        duration: 0.1,
        ease: "power2.inOut",
      },
      0.1,
    )
    .call(
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
          gsap.set(newContent, { opacity: 1 });
          const description = newContent.querySelector(".slide-description");
          if (description)
            gsap.set(description, {
              backgroundColor: "transparent",
            });
          gsap
            .timeline({
              onComplete: () => {
                isTransitioning = false;
                currentSlideIndex = nextIndex;
              },
            })
            .call(() => {
              if (newTitle) {
                scrambleIn(newTitle, 0);
                const titleWords = newTitle.querySelectorAll(".word");
                titleWords.forEach((word) => {
                  gsap.set(word, {
                    filter: "drop-shadow(8px 0.5px 0.5px black)",
                  });
                });
              }
            })
            .to(
              newLines,
              { y: "0%", duration: 0.5, stagger: 0.1, ease: "power2.inOut" },
              0.3,
            );
          if (description)
            gsap.to(description, {
              backgroundColor: "transparent",
              duration: 0.1,
              ease: "power2.inOut",
              delay: 0.1,
            });
        }, 100);
      },
      null,
      0,
    );
};

const setupInitialSlide = () => {
  const content = slider.querySelector(".slider-content");
  processTextElements(content);
  gsap.set(content.querySelectorAll(".line span"), { y: "0%" });
  const description = content.querySelector(".slide-description");
  if (description)
    gsap.set(description, {
      backgroundColor: "transparent",
    });
};

const initializeRenderer = async () => {
  const canvas = section.querySelector("canvas");
  const w = section.clientWidth;
  const h = section.clientHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(w, h);
  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTexture1: { value: null },
      uTexture2: { value: null },
      uProgress: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(w, h) },
      uTexture1Size: { value: new THREE.Vector2(1, 1) },
      uTexture2Size: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader,
    fragmentShader,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial));
  const loader = new THREE.TextureLoader();
  for (const slide of slides) {
    const texture = await new Promise((resolve) =>
      loader.load(slide.image, resolve),
    );
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.userData = {
      size: new THREE.Vector2(texture.image.width, texture.image.height),
    };
    slideTextures.push(texture);
  }
  shaderMaterial.uniforms.uTexture1.value = slideTextures[0];
  shaderMaterial.uniforms.uTexture2.value = slideTextures[1];
  shaderMaterial.uniforms.uTexture1Size.value = slideTextures[0].userData.size;
  shaderMaterial.uniforms.uTexture2Size.value = slideTextures[1].userData.size;
  const render = () => {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  };
  render();
};

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
        shaderMaterial.uniforms.uProgress.value = 0;
        shaderMaterial.uniforms.uTexture1.value = slideTextures[nextIndex];
        shaderMaterial.uniforms.uTexture1Size.value =
          slideTextures[nextIndex].userData.size;
      },
    },
  );
};

const handleResize = () => {
  const w = section.clientWidth;
  const h = section.clientHeight;
  renderer.setSize(w, h);
  shaderMaterial.uniforms.uResolution.value.set(w, h);
  const currentContent = slider.querySelector(".slider-content");
  if (!currentContent) return;
  currentContent.remove();
  const newContent = createSlideElement(slides[currentSlideIndex]);
  slider.appendChild(newContent);
  document.fonts.ready.then(() => {
    processTextElements(newContent);
    const nextIndex = (currentSlideIndex + 1) % slides.length;
    shaderMaterial.uniforms.uTexture1.value = slideTextures[currentSlideIndex];
    shaderMaterial.uniforms.uTexture2.value = slideTextures[nextIndex];
    shaderMaterial.uniforms.uTexture1Size.value =
      slideTextures[currentSlideIndex].userData.size;
    shaderMaterial.uniforms.uTexture2Size.value =
      slideTextures[nextIndex].userData.size;
    shaderMaterial.uniforms.uProgress.value = 0;
    gsap.set(newContent.querySelectorAll(".line span"), { y: "0%" });
    gsap.set(newContent, { opacity: 0 });
  });
};

window.addEventListener("load", () => {
  document.fonts.ready.then(() => {
    setupInitialSlide();
    initializeRenderer();
  });
});

section.addEventListener("click", (e) => {
  if (
    e.target.closest(".slide-link a") ||
    e.target.closest("nav") ||
    e.target.closest(".nav-overlay") ||
    e.target.closest(".menu-toggle-btn")
  )
    return;
  handleSlideChange();
});

window.addEventListener("resize", handleResize);
