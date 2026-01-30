import { scrambleVisible } from "./scramble.js";

// add hover effect to individual link
function addHoverEffect(link) {
  if (link.dataset.hasHoverEffect) return;
  link.dataset.hasHoverEffect = "true";

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

// re-apply to new content
export function reinitHoverEffects() {
  if (window.innerWidth < 1000) return;

  const links = document.querySelectorAll("a.scramble-hover");
  links.forEach(addHoverEffect);
}

// initial setup
document.addEventListener("DOMContentLoaded", () => {
  if (window.innerWidth < 1000) return;

  const links = document.querySelectorAll("a.scramble-hover");
  links.forEach(addHoverEffect);
});
