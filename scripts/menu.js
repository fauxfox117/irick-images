import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { scrambleIn, scrambleOut, scrambleVisible } from "./scramble.js";
import { lenis } from "./lenis-scroll.js";

gsap.registerPlugin(SplitText);

let isMenuOpen = false;
let isAnimating = false;
let scrambleInstances = [];

// scramble configs
const scrambleConfigs = {
  nav: {
    duration: 0.2,
    charDelay: 50,
    stagger: 25,
    maxIterations: 10,
  },
  footer: {
    duration: 0.1,
    charDelay: 25,
    stagger: 15,
    maxIterations: 5,
  },
};

// utility functions
function cleanupScrambleInstances() {
  scrambleInstances.forEach((instance) => {
    if (instance && instance.wordSplit) {
      instance.wordSplit.revert();
    }
  });
  scrambleInstances = [];
}

function resetAllTextToOriginal() {
  const allLinks = document.querySelectorAll(".nav-item a");
  const footerLinks = document.querySelectorAll(".nav-footer-item a");
  const allLinksArray = [...allLinks, ...footerLinks];

  allLinksArray.forEach((link) => {
    link.style.color = link.dataset.originalColor || "";
    const chars = link.querySelectorAll(".char span");
    if (chars.length > 0) {
      const originalText = link.textContent;
      link.innerHTML = originalText;
    }
  });
}

function addHoverScrambleEffect(link, type = "nav") {
  let isAnimating = false;
  let currentSplit = null;
  const config = scrambleConfigs[type];

  link.addEventListener("mouseenter", () => {
    if (isAnimating) return;
    isAnimating = true;

    if (!link.dataset.originalColor) {
      link.dataset.originalColor = getComputedStyle(link).color;
    }

    link.style.color = "var(--tone-500)";

    if (currentSplit) {
      currentSplit.wordSplit?.revert();
    }

    currentSplit = scrambleVisible(link, 0, config);

    setTimeout(() => {
      isAnimating = false;
    }, config.duration * 1000 + 50);
  });

  link.addEventListener("mouseleave", () => {
    link.style.color = link.dataset.originalColor || "";
  });
}

function addNavItemHoverEffects() {
  const isMobile = window.innerWidth < 1000;
  if (isMobile) return;

  const navItems = document.querySelectorAll(".nav-item");
  const footerItems = document.querySelectorAll(".nav-footer-item");

  navItems.forEach((item) => {
    const link = item.querySelector("a");
    if (link) {
      addHoverScrambleEffect(link, "nav");
    }
  });

  footerItems.forEach((footerItem) => {
    const links = footerItem.querySelectorAll("a");
    links.forEach((link) => {
      addHoverScrambleEffect(link, "footer");
    });
  });
}

// menu functions
function openMenu() {
  const navOverlay = document.querySelector(".nav-overlay");
  const menuToggleBtn = document.querySelector(".menu-toggle-btn");
  const navItems = document.querySelectorAll(".nav-item");

  isAnimating = true;
  navOverlay.style.pointerEvents = "all";
  menuToggleBtn.classList.add("menu-open");

  // disable scrolling
  if (lenis) {
    lenis.stop();
  }

  gsap.to(navOverlay, {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    duration: 0.3,
    onComplete: () => {
      isAnimating = false;
    },
  });

  cleanupScrambleInstances();
  resetAllTextToOriginal();

  // animate nav items
  navItems.forEach((item, index) => {
    const link = item.querySelector("a");
    if (link) {
      gsap.set(item, { opacity: 1, transform: "translateY(0%)" });
      const scrambleInstance = scrambleIn(link, index * 0.1, {
        duration: 0.15,
        charDelay: 50,
        stagger: 25,
        maxIterations: 5,
      });
      scrambleInstances.push(scrambleInstance);
    }
  });

  // animate footer items
  const footerItems = document.querySelectorAll(".nav-footer-item");
  let footerLinkIndex = 0;
  footerItems.forEach((footerItem) => {
    const links = footerItem.querySelectorAll("a");
    links.forEach((link) => {
      if (link) {
        const scrambleInstance = scrambleIn(
          link,
          navItems.length * 0.1 + footerLinkIndex * 0.1,
          {
            duration: 0.15,
            charDelay: 50,
            stagger: 25,
            maxIterations: 5,
          }
        );
        scrambleInstances.push(scrambleInstance);
        footerLinkIndex++;
      }
    });
  });

  addNavItemHoverEffects();
  isMenuOpen = true;
}

function closeMenu() {
  const navOverlay = document.querySelector(".nav-overlay");
  const menuToggleBtn = document.querySelector(".menu-toggle-btn");
  const navItems = document.querySelectorAll(".nav-item");

  isAnimating = true;
  navOverlay.style.pointerEvents = "none";
  menuToggleBtn.classList.remove("menu-open");

  // enable scrolling
  if (lenis) {
    lenis.start();
  }

  // animate nav items out
  navItems.forEach((item, index) => {
    const link = item.querySelector("a");
    if (link) {
      scrambleOut(link, index * 0.1);
    }
  });

  // animate footer items out
  const footerItems = document.querySelectorAll(".nav-footer-item");
  let footerLinkIndex = 0;
  footerItems.forEach((footerItem) => {
    const links = footerItem.querySelectorAll("a");
    links.forEach((link) => {
      if (link) {
        scrambleOut(link, navItems.length * 0.1 + footerLinkIndex * 0.1);
        footerLinkIndex++;
      }
    });
  });

  gsap.to(navOverlay, {
    clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)",
    duration: 0.3,
    onComplete: () => {
      gsap.set(navItems, { opacity: 0, transform: "translateY(100%)" });
      isAnimating = false;
    },
  });

  isMenuOpen = false;
}

// main execution - wait for fonts to load
document.fonts.ready.then(() => {
  const menuToggleBtn = document.querySelector(".menu-toggle-btn");
  const navOverlay = document.querySelector(".nav-overlay");
  const navItems = document.querySelectorAll(".nav-item");

  menuToggleBtn.addEventListener("click", () => {
    if (isAnimating) {
      gsap.killTweensOf([navOverlay, navItems]);
      cleanupScrambleInstances();
      resetAllTextToOriginal();
      isAnimating = false;
    }

    if (!isMenuOpen) {
      openMenu();
    } else {
      closeMenu();
    }
  });
});
