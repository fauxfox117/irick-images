import { scrambleVisible } from "./scramble.js";
import gsap from "gsap";
import { services } from "../data/services.js";

let currentActiveItem = null;
let isMobile = window.innerWidth < 1000;
const activeItems = new Set();

// create services html dynamically
function createServicesHTML() {
  const servicesList = document.querySelector(".services-list");
  if (!servicesList) return;

  services.forEach((service) => {
    const serviceItem = document.createElement("div");
    serviceItem.className = "service-item with-image";

    serviceItem.innerHTML = `
      <div class="service-img-wrapper">
        <img src="${service.img}" alt="${service.name}" class="service-image" />
      </div>
      <div class="service-name">
        <h2>${service.name}</h2>
      </div>
    `;

    servicesList.appendChild(serviceItem);
  });
}

// animate indicator to service item
function animateIndicatorToItem(item, index) {
  const servicesIndicator = document.querySelector(".services-indicator");
  if (!servicesIndicator) return;

  const servicesContainer = document.querySelector(".services-container");
  const servicesList = document.querySelector(".services-list");
  const indicatorSpan = servicesIndicator.querySelector("span");

  if (indicatorSpan && services[index]) {
    indicatorSpan.textContent = services[index].indicatorText;
  }

  const itemRect = item.getBoundingClientRect();
  const servicesListRect = servicesList.getBoundingClientRect();
  const itemCenterY = itemRect.top - servicesListRect.top + itemRect.height / 2;
  const indicatorRect = servicesIndicator.getBoundingClientRect();
  const indicatorHeight = indicatorRect.height;
  const targetY = itemCenterY - indicatorHeight / 2;
  const servicesListHeight = servicesListRect.height;
  const padding = 20;
  const minY = padding;
  const maxY = servicesListHeight - indicatorHeight - padding;
  const clampedY = Math.max(minY, Math.min(targetY, maxY));

  gsap.to(servicesIndicator, {
    y: clampedY,
    duration: 0.4,
    ease: "power2.out",
  });
}

// interaction functions
function onMouseEnter(item, index) {
  if (currentActiveItem && currentActiveItem !== item) {
    onMouseLeave(currentActiveItem);
  }

  if (activeItems.has(item)) return;
  activeItems.add(item);
  currentActiveItem = item;

  const nameElement = item.querySelector(".service-name h2");

  // only apply scramble animation on desktop
  if (!isMobile) {
    if (nameElement && !nameElement.dataset.originalText) {
      nameElement.dataset.originalText = nameElement.textContent;
      nameElement.dataset.originalColor = getComputedStyle(nameElement).color;
    }

    // animate name scramble effect
    if (nameElement) {
      nameElement.style.color = "var(--tone-500)";
      scrambleVisible(nameElement, 0, {
        duration: 0.1,
        charDelay: 25,
        stagger: 25,
        skipChars: 0,
        maxIterations: 5,
      });
    }

    animateIndicatorToItem(item, index);
  }
}

function onMouseLeave(item) {
  activeItems.delete(item);
  if (currentActiveItem === item) {
    currentActiveItem = null;
  }

  // only reset scramble animation on desktop
  if (!isMobile) {
    const nameElement = item.querySelector(".service-name h2");

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
  }
}

// initialize indicator
function initializeIndicator() {
  const servicesIndicator = document.querySelector(".services-indicator");
  if (servicesIndicator) {
    gsap.set(servicesIndicator, { y: 0 });
    const indicatorSpan = servicesIndicator.querySelector("span");
    if (indicatorSpan) {
      indicatorSpan.textContent = services[0].indicatorText;
    }
  }
}

// setup event listeners
function setupEventListeners() {
  const serviceItems = document.querySelectorAll(".service-item.with-image");
  const servicesList = document.querySelector(".services-list");
  const servicesIndicator = document.querySelector(".services-indicator");

  serviceItems.forEach((item, index) => {
    const image = item.querySelector(".service-image");

    item.addEventListener("mouseenter", () => onMouseEnter(item, index));
    item.addEventListener("mouseleave", () => onMouseLeave(item));

    // add click event for additional interaction
    if (image && !isMobile) {
      image.addEventListener("click", function () {
        // click interaction handled here
      });
    }
  });

  // handle services list mouse leave
  if (servicesList) {
    servicesList.addEventListener("mouseleave", function () {
      if (!currentActiveItem && !isMobile) {
        const indicatorSpan = servicesIndicator.querySelector("span");
        if (indicatorSpan) {
          indicatorSpan.textContent = services[0].indicatorText;
        }
        gsap.to(servicesIndicator, {
          y: 0,
          duration: 0.4,
          ease: "power2.out",
        });
      }
    });
  }
}

// handle resize events
function handleResize() {
  const newIsMobile = window.innerWidth < 1000;

  if (newIsMobile !== isMobile) {
    isMobile = newIsMobile;
    const servicesIndicator = document.querySelector(".services-indicator");
    const serviceItems = document.querySelectorAll(".service-item.with-image");

    if (isMobile) {
      if (currentActiveItem) {
        onMouseLeave(currentActiveItem);
      }

      // reset indicator position
      if (servicesIndicator) {
        const indicatorSpan = servicesIndicator.querySelector("span");
        if (indicatorSpan) {
          indicatorSpan.textContent = services[0].indicatorText;
        }
        gsap.set(servicesIndicator, { y: 0 });
      }

      // reset all text colors to original
      serviceItems.forEach((item) => {
        const nameElement = item.querySelector(".service-name h2");
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
      });
    } else {
      // going to desktop - reset indicator initial state
      if (servicesIndicator) {
        const indicatorSpan = servicesIndicator.querySelector("span");
        if (indicatorSpan) {
          indicatorSpan.textContent = services[0].indicatorText;
        }
        gsap.set(servicesIndicator, { y: 0 });
      }
    }
  }
}

// main execution
document.addEventListener("DOMContentLoaded", function () {
  createServicesHTML();
  initializeIndicator();
  setupEventListeners();

  window.addEventListener("resize", handleResize);
});
