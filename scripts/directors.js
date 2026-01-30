import { scrambleVisible } from "./scramble.js";
import gsap from "gsap";
import { directors } from "../data/directors.js";

let isMobile = false;
let eventListenersAttached = false;

// utility functions
function checkScreenSize() {
  isMobile = window.innerWidth < 1000;
}

function createDirectorsHTML() {
  const directorsListContainer = document.querySelector(".directors-list");
  if (!directorsListContainer) return;

  directorsListContainer.innerHTML = "";

  directors.forEach((director) => {
    const directorElement = document.createElement("div");
    directorElement.className = "director-item";

    directorElement.innerHTML = `
      <a href="${director.route}" class="director-link">
        <div class="director-name">
          <h2>${director.name}</h2>
        </div>
        <div class="director-preview">
          <img src="${director.previewImg}" alt="${director.name}" />
        </div>
      </a>
    `;

    directorsListContainer.appendChild(directorElement);
  });
}

// layout functions
function setMobileLayout() {
  const previewElements = document.querySelectorAll(".director-preview");
  const imageElements = document.querySelectorAll(".director-preview img");

  previewElements.forEach((preview) => {
    gsap.set(preview, {
      position: "relative",
      top: "auto",
      height: "300px",
      pointerEvents: "auto",
      clearProps: "clip-path",
      padding: "1rem",
    });
  });

  imageElements.forEach((img) => {
    gsap.set(img, {
      scale: 1,
      clearProps: "scale",
    });
  });
}

function setDesktopLayout() {
  const previewElements = document.querySelectorAll(".director-preview");
  const imageElements = document.querySelectorAll(".director-preview img");

  previewElements.forEach((preview) => {
    gsap.set(preview, {
      position: "absolute",
      top: "100%",
      height: "300%",
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      pointerEvents: "none",
      clearProps: "position,top,height",
    });
  });

  imageElements.forEach((img) => {
    gsap.set(img, {
      scale: 1.5,
    });
  });
}

function applyResponsiveLayout() {
  checkScreenSize();

  if (isMobile) {
    setMobileLayout();
  } else {
    setDesktopLayout();
  }
}

function removeEventListeners() {
  const directorItems = document.querySelectorAll(".director-item");
  directorItems.forEach((item) => {
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
  });
  eventListenersAttached = false;
}

// interaction functions
function onMouseEnter(item, activeItems) {
  if (activeItems.has(item)) return;
  activeItems.add(item);

  const nameElement = item.querySelector(".director-name h2");
  const previewElement = item.querySelector(".director-preview");
  const imageElement = previewElement?.querySelector("img");

  if (nameElement && !nameElement.dataset.originalText) {
    nameElement.dataset.originalText = nameElement.textContent;
    nameElement.dataset.originalColor = getComputedStyle(nameElement).color;
  }

  // animate name scramble
  if (nameElement) {
    nameElement.style.color = "var(--tone-500)";
    scrambleVisible(nameElement, 0, {
      duration: 0.1,
      charDelay: 25,
      stagger: 25,
      skipChars: 1,
      maxIterations: 5,
    });
  }

  // animate preview reveal
  if (previewElement) {
    gsap.to(previewElement, {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      duration: 0.3,
      ease: "power4.out",
    });
  }

  // animate image scale
  if (imageElement) {
    gsap.killTweensOf(imageElement);
    gsap.fromTo(
      imageElement,
      { scale: 1.5 },
      {
        scale: 1,
        duration: 0.75,
        ease: "power4.out",
      }
    );
  }
}

function onMouseLeave(item, activeItems) {
  activeItems.delete(item);

  const nameElement = item.querySelector(".director-name h2");
  const previewElement = item.querySelector(".director-preview");
  const imageElement = previewElement?.querySelector("img");

  // reset name to original
  if (nameElement) {
    nameElement.style.color = nameElement.dataset.originalColor || "";

    const chars = nameElement.querySelectorAll(".char span");
    if (chars.length > 0) {
      chars.forEach((char) => {
        char.textContent = char.dataset.originalText || char.textContent;
        char.style.opacity = "1";
      });
    }
  }

  // animate preview hide
  if (previewElement) {
    gsap.set(previewElement, {
      clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
    });

    gsap.to(previewElement, {
      clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
      duration: 0.5,
      ease: "power4.out",
      onComplete: () => {
        gsap.set(previewElement, {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
        });
      },
    });
  }

  // animate image scale back
  if (imageElement) {
    gsap.killTweensOf(imageElement);
    gsap.fromTo(
      imageElement,
      { scale: 1 },
      {
        scale: 1.5,
        duration: 0.5,
        ease: "power4.out",
      }
    );
  }
}

function initDirectorScramble() {
  if (isMobile) {
    if (eventListenersAttached) {
      removeEventListeners();
    }
    return;
  }

  const directorItems = document.querySelectorAll(".director-item");
  const activeItems = new Set();

  // add event listeners only if not already attached
  if (!eventListenersAttached) {
    directorItems.forEach((item) => {
      item.addEventListener("mouseenter", () =>
        onMouseEnter(item, activeItems)
      );
      item.addEventListener("mouseleave", () =>
        onMouseLeave(item, activeItems)
      );
    });
    eventListenersAttached = true;
  }
}

// event handlers
function handleResize() {
  const wasDesktop = !isMobile;
  checkScreenSize();
  const isNowMobile = isMobile;

  if ((wasDesktop && isNowMobile) || (!wasDesktop && !isNowMobile)) {
    applyResponsiveLayout();
    initDirectorScramble();
  }
}

function init() {
  createDirectorsHTML();
  applyResponsiveLayout();
  initDirectorScramble();
}

// main execution
document.addEventListener("DOMContentLoaded", () => {
  init();

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleResize, 150);
  });
});
