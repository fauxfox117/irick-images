import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let splitScrollTrigger = null;
let resizeTimeout;

// initialize split animation
function initSplitAnimation() {
  const splitTopImg = document.querySelector(".split-top img");
  const splitBottomImg = document.querySelector(".split-bottom img");

  if (!splitTopImg || !splitBottomImg) {
    return;
  }

  if (splitScrollTrigger) {
    splitScrollTrigger.kill();
  }

  // create new scrolltrigger
  splitScrollTrigger = ScrollTrigger.create({
    trigger: ".split-element",
    start: "top bottom",
    end: "bottom top",
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const progress = Math.min(self.progress / 0.65, 1);
      const topScale = 1.5 + (1 - 1.5) * progress;
      const bottomScale = 2 + (1 - 2) * progress;

      gsap.set(splitTopImg, { scale: topScale, force3D: true });
      gsap.set(splitBottomImg, { scale: bottomScale, force3D: true });
    },
  });
}

function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    initSplitAnimation();
    ScrollTrigger.refresh();
  }, 100);
}

initSplitAnimation();

window.addEventListener("resize", handleResize);
