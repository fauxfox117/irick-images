function hidePreloader() {
  const preloader = document.querySelector(".preloader");
  if (preloader) {
    preloader.style.display = "none";
  }
}

function initPreloader() {
  const preloader = document.querySelector(".preloader");
  const textContainer = document.querySelector(".text-container");

  if (!preloader || !textContainer) {
    return;
  }

  // Skip preloader if already seen this session
  if (sessionStorage.getItem("preloaderSeen") === "true") {
    hidePreloader();
    return;
  }

  let progress = 0;
  const duration = 2000; // 2 seconds
  const interval = 20; // Update every 20ms
  const increment = 100 / (duration / interval);

  const timer = setInterval(() => {
    progress += increment;

    if (progress >= 100) {
      progress = 100;
      clearInterval(timer);

      sessionStorage.setItem("preloaderSeen", "true");

      // Fade out preloader after fill completes
      setTimeout(() => {
        preloader.style.opacity = "0";
        setTimeout(() => {
          preloader.style.display = "none";
        }, 500);
      }, 200);
    }

    textContainer.style.setProperty("--fill-progress", `${progress}%`);
  }, interval);
}

// Handle bfcache restores (back/forward button)
window.addEventListener("pageshow", (e) => {
  if (e.persisted) {
    hidePreloader();
  }
});

// Run when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPreloader);
} else {
  initPreloader();
}
