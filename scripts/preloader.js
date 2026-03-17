import gsap from "gsap";
import { lenis } from "./lenis-scroll.js";

let loopTimeline = null;
let overlayTimeline = null;
let loopVisibilityTimeline = null;
let cleanupDelay = null;
let loopReady = false;
const LOOP_DURATION = 5;

function preloadImages(sources) {
  return Promise.all(
    sources.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          if (img.complete) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve;
          }
        }),
    ),
  );
}

const PROJECT_ROW = {
  name: "Justin Irick",
  director: "Irick Images",
  location: "Greenville, South Carolina",
};

const projectsData = Array.from({ length: 16 }, () => PROJECT_ROW);

const allImageSources = [
  "/spotlight/1 2.jpg",
  "/spotlight/4.jpg",
  "/spotlight/DJI_20251201172047_0094_D_DTE.jpg",
  "/spotlight/EDIT1.jpg",
  "/spotlight/EDIT11.jpg",
  "/spotlight/EDIT19-2.jpg",
  "/spotlight/OUTLINES.jpg",
  "/spotlight/TAWNY4.jpg",
  "/spotlight/_EPG1798.jpg",
  "/spotlight/_EPG4506.jpg",
  "/spotlight/_EPG4536.jpg",
  "/spotlight/_EPG4716.jpg",
  "/spotlight/_EPG5747.jpg",
  "/spotlight/_EPG6997.jpg",
  "/spotlight/_EPG9466.jpg",
  // "/spotlight/_EPG9466_DTE.jpg",
];

function initializeDynamicContent() {
  const projectsContainer = document.querySelector(".projects");
  const locationsContainer = document.querySelector(".locations");

  if (!projectsContainer || !locationsContainer) {
    return;
  }

  if (
    projectsContainer.querySelectorAll(".project-item").length > 0 ||
    locationsContainer.querySelectorAll(".location-item").length > 0
  ) {
    return;
  }

  projectsData.forEach((project) => {
    const projectItem = document.createElement("div");
    projectItem.className = "project-item";

    const projectName = document.createElement("p");
    projectName.textContent = project.name;

    const directorName = document.createElement("p");
    directorName.textContent = project.director;

    projectItem.appendChild(projectName);
    projectItem.appendChild(directorName);
    projectsContainer.appendChild(projectItem);
  });

  projectsData.forEach((project) => {
    const locationItem = document.createElement("div");
    locationItem.className = "location-item";

    const locationName = document.createElement("p");
    locationName.textContent = project.location;

    locationItem.appendChild(locationName);
    locationsContainer.appendChild(locationItem);
  });
}

function buildLoopItems() {
  const loopTrack = document.querySelector(".loop-track");

  if (!loopTrack) {
    return;
  }

  loopTrack.innerHTML = "";

  const duplicatedSources = [...allImageSources, ...allImageSources];
  const fragment = document.createDocumentFragment();

  duplicatedSources.forEach((source) => {
    const item = document.createElement("div");
    item.className = "loop-item";

    const image = document.createElement("img");
    image.src = source;
    image.alt = "";

    item.appendChild(image);
    fragment.appendChild(item);
  });

  loopTrack.appendChild(fragment);
}

async function prepareLoop() {
  await preloadImages(allImageSources);
  buildLoopItems();

  await new Promise((resolve) => requestAnimationFrame(resolve));

  loopReady = true;
}

function startLoopAnimation() {
  if (!loopReady) {
    return;
  }

  const loopTrack = document.querySelector(".loop-track");

  if (!loopTrack) {
    return;
  }

  const loopItems = gsap.utils.toArray(".loop-item");
  const firstItem = loopItems[0];
  const firstDuplicateItem = loopItems[allImageSources.length];

  if (!firstItem || !firstDuplicateItem) {
    return;
  }

  const loopDistance = firstDuplicateItem.offsetLeft - firstItem.offsetLeft;

  if (!loopDistance) {
    return;
  }

  loopTrack.style.setProperty("--loop-distance", `-${loopDistance}px`);
  loopTrack.style.setProperty("--loop-duration", `${LOOP_DURATION}s`);
  loopTrack.classList.add("is-running");
}

function completePreloader() {
  sessionStorage.setItem("preloaderSeen", "true");

  cleanupDelay = window.setTimeout(() => {
    cleanupPreloader();
  }, 300);
}

function cleanupPreloader() {
  const overlay = document.querySelector(".overlay");
  const imageLoop = document.querySelector(".image-loop");
  const loopTrack = document.querySelector(".loop-track");

  if (cleanupDelay) {
    window.clearTimeout(cleanupDelay);
    cleanupDelay = null;
  }

  if (loopTrack) {
    loopTrack.classList.remove("is-running");
  }

  if (overlayTimeline) {
    overlayTimeline.kill();
    overlayTimeline = null;
  }

  if (loopVisibilityTimeline) {
    loopVisibilityTimeline.kill();
    loopVisibilityTimeline = null;
  }

  if (overlay) overlay.remove();
  if (imageLoop) imageLoop.remove();

  gsap.killTweensOf([
    ".overlay",
    ".image-loop",
    ".loop-track",
    ".loop-item",
    ".projects",
    ".locations",
    ".loader",
    ".project-item",
    ".location-item",
    ".projects-header",
    ".locations-header",
    ".logo-line-1",
  ]);

  if (lenis) {
    lenis.start();
  }
}

function createAnimationTimelines() {
  overlayTimeline = gsap.timeline();
  loopVisibilityTimeline = gsap.timeline();

  overlayTimeline.to(".logo-line-1", {
    backgroundPosition: "0% 0%",
    color: "#e3e4d8",
    duration: 1,
    ease: "none",
    delay: 0.5,
  });

  overlayTimeline.to([".projects-header", ".project-item"], {
    opacity: 1,
    duration: 0.05,
    stagger: 0.075,
    delay: 1,
  });

  overlayTimeline.to(
    [".locations-header", ".location-item"],
    {
      opacity: 1,
      duration: 0.05,
      stagger: 0.075,
    },
    "<",
  );

  overlayTimeline.to(".project-item", {
    color: "#e3e4d8",
    duration: 0.15,
    stagger: 0.075,
  });

  overlayTimeline.to(
    ".location-item",
    {
      color: "#e3e4d8",
      duration: 0.15,
      stagger: 0.075,
    },
    "<",
  );

  overlayTimeline.to([".projects-header", ".project-item"], {
    opacity: 0,
    duration: 0.05,
    stagger: 0.075,
  });

  overlayTimeline.to(
    [".locations-header", ".location-item"],
    {
      opacity: 0,
      duration: 0.05,
      stagger: 0.075,
    },
    "<",
  );

  overlayTimeline.to(".overlay", {
    opacity: 0,
    duration: 0.5,
    delay: 1.5,
  });

  loopVisibilityTimeline.to(".image-loop", {
    opacity: 1,
    duration: 0.6,
    delay: 2.5,
    onStart: () => {
      startLoopAnimation();
      gsap.to(".loader", {
        opacity: 0,
        duration: 0.3,
      });
    },
  });

  loopVisibilityTimeline.to(".image-loop", {
    opacity: 0,
    duration: 0.6,
    delay: 3.75,
    onComplete: completePreloader,
  });
}

function init() {
  initializeDynamicContent();
  prepareLoop();
  createAnimationTimelines();
}

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.querySelector(".overlay");
  const imageLoop = document.querySelector(".image-loop");

  if (!overlay || !imageLoop) {
    return;
  }

  const hasSeenPreloader = sessionStorage.getItem("preloaderSeen") === "true";

  if (hasSeenPreloader) {
    if (overlay) overlay.style.display = "none";
    if (imageLoop) imageLoop.style.display = "none";

    if (lenis) {
      lenis.start();
    }

    return;
  }

  if (lenis) {
    lenis.stop();
  }

  init();
});
