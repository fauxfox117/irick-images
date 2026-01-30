import gsap from "gsap";

// animation functions
function revealTransition() {
  return new Promise((resolve) => {
    gsap.set(".transition-overlay", { scaleY: 1, transformOrigin: "top" });
    gsap.to(".transition-overlay", {
      scaleY: 0,
      duration: 0.6,
      delay: 0.5,
      ease: "power2.inOut",
      onComplete: resolve,
    });
  });
}

function animateTransition() {
  return new Promise((resolve) => {
    gsap.set(".transition-overlay", { scaleY: 0, transformOrigin: "bottom" });
    gsap.to(".transition-overlay", {
      scaleY: 1,
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: resolve,
    });
  });
}

// utility functions
function closeMenuIfOpen() {
  const menuToggleBtn = document.querySelector(".menu-toggle-btn");
  if (menuToggleBtn && menuToggleBtn.classList.contains("menu-open")) {
    menuToggleBtn.click();
  }
}

function isSamePage(href) {
  if (!href || href === "#" || href === "") return true;
  const currentPath = window.location.pathname;
  if (href === currentPath) return true;

  if (
    (currentPath === "/" || currentPath === "/index.html") &&
    (href === "/" ||
      href === "/index.html" ||
      href === "index.html" ||
      href === "./index.html")
  ) {
    return true;
  }

  const currentFileName = currentPath.split("/").pop() || "index.html";
  const hrefFileName = href.split("/").pop();
  if (currentFileName === hrefFileName) return true;

  return false;
}

// main execution
document.addEventListener("DOMContentLoaded", () => {
  const isPageNavigation = sessionStorage.getItem("pageTransition") === "true";

  if (isPageNavigation) {
    sessionStorage.removeItem("pageTransition");
    revealTransition();
  } else {
    gsap.set(".transition-overlay", { scaleY: 0 });
  }

  // handle link clicks
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");

    if (
      href &&
      (href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:"))
    ) {
      return;
    }

    // prevent same page navigation
    if (isSamePage(href)) {
      event.preventDefault();
      closeMenuIfOpen();
      return;
    }

    // animate transition to new page
    event.preventDefault();
    sessionStorage.setItem("pageTransition", "true");
    animateTransition().then(() => {
      window.location.href = href;
    });
  });
});
