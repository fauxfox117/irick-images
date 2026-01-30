import { scrambleVisible } from "./scramble.js";

const clientsContainer = document.querySelector(".clients .container");
const highlight = document.querySelector(".clients .highlight");
const gridItems = document.querySelectorAll(".clients .grid-item");
const firstItem = gridItems[0];

let isMobile = false;
let currentActiveElement = null;

// utility functions
const getHighlightColor = () => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--tone-500")
    .trim();
};

const getTextColor = () => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--tone-100")
    .trim();
};

function checkScreenSize() {
  const newIsMobile = window.innerWidth < 1000;

  if (newIsMobile !== isMobile) {
    isMobile = newIsMobile;

    if (isMobile) {
      // mobile - hide highlighter and remove events
      highlight.style.opacity = "0";
      clientsContainer.removeEventListener("mousemove", moveHighlight);

      // reset all text colors
      gridItems.forEach((item) => {
        const p = item.querySelector("p");
        if (p) p.style.color = "";
      });

      currentActiveElement = null;
    } else {
      // desktop - show highlighter and add events
      highlight.style.opacity = "1";
      clientsContainer.addEventListener("mousemove", moveHighlight);
      moveToElement(firstItem);
    }
  }
}

// highlight functions
function moveToElement(element) {
  if (!element || isMobile) return;

  if (currentActiveElement === element) return;

  // reset previous element text color
  if (currentActiveElement) {
    const prevP = currentActiveElement.querySelector("p");
    if (prevP) prevP.style.color = "";
  }

  // update highlighter position and size
  const rect = element.getBoundingClientRect();
  const containerRect = clientsContainer.getBoundingClientRect();

  highlight.style.transform = `translate(${rect.left - containerRect.left}px, ${
    rect.top - containerRect.top
  }px)`;
  highlight.style.width = `${rect.width}px`;
  highlight.style.height = `${rect.height}px`;
  highlight.style.backgroundColor = getHighlightColor();

  currentActiveElement = element;

  // style text and apply scramble effect
  const p = element.querySelector("p");
  if (p) {
    p.style.color = getTextColor();
    scrambleVisible(p, 0, {
      duration: 0.3,
      charDelay: 30,
      stagger: 20,
      maxIterations: 3,
    });
  }
}

function moveHighlight(e) {
  if (isMobile) return;

  const hoveredElement = document.elementFromPoint(e.clientX, e.clientY);
  let targetElement = null;

  if (hoveredElement && hoveredElement.classList.contains("grid-item")) {
    targetElement = hoveredElement;
  } else if (
    hoveredElement &&
    hoveredElement.parentElement &&
    hoveredElement.parentElement.classList.contains("grid-item")
  ) {
    targetElement = hoveredElement.parentElement;
  }

  if (targetElement) {
    moveToElement(targetElement);
  }
}

function handleResize() {
  checkScreenSize();

  // update highlighter dimensions if active
  if (!isMobile && currentActiveElement) {
    const rect = currentActiveElement.getBoundingClientRect();
    const containerRect = clientsContainer.getBoundingClientRect();

    highlight.style.transform = `translate(${
      rect.left - containerRect.left
    }px, ${rect.top - containerRect.top}px)`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
  }
}

checkScreenSize();

if (!isMobile && firstItem) {
  moveToElement(firstItem);
}

window.addEventListener("resize", handleResize);

if (!isMobile) {
  clientsContainer.addEventListener("mousemove", moveHighlight);
}
