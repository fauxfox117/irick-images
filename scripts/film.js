import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// clip paths for 3x3 grid with overlap to prevent gaps
const clipPaths = [
  "polygon(0% 0%, 33.5% 0%, 33.5% 33.5%, 0% 33.5%)",
  "polygon(33% 0%, 66.5% 0%, 66.5% 33.5%, 33% 33.5%)",
  "polygon(66% 0%, 100% 0%, 100% 33.5%, 66% 33.5%)",
  "polygon(0% 33%, 33.5% 33%, 33.5% 66.5%, 0% 66.5%)",
  "polygon(33% 33%, 66.5% 33%, 66.5% 66.5%, 33% 66.5%)",
  "polygon(66% 33%, 100% 33%, 100% 66.5%, 66% 66.5%)",
  "polygon(0% 66%, 33.5% 66%, 33.5% 100%, 0% 100%)",
  "polygon(33% 66%, 66.5% 66%, 66.5% 100%, 33% 100%)",
  "polygon(66% 66%, 100% 66%, 100% 100%, 66% 100%)",
];

// create 9 mask divs for each image
function createMasks() {
  const images = document.querySelectorAll(".snap-img");

  images.forEach((img) => {
    if (!img.className.includes("img-")) return;

    for (let i = 0; i < 9; i++) {
      const mask = document.createElement("div");
      mask.classList.add("mask");
      img.appendChild(mask);
    }
  });
}

// animate each row when it comes into view
function initImageRevealAnimations() {
  const rows = document.querySelectorAll(".snap-row");

  rows.forEach((row) => {
    const images = row.querySelectorAll(".snap-img");

    images.forEach((img) => {
      if (!img.className.includes("img-")) return;

      const masks = img.querySelectorAll(".mask");

      // set initial state
      masks.forEach((mask, index) => {
        gsap.set(mask, {
          clipPath: clipPaths[index],
          opacity: 0,
        });
      });

      // shuffle masks for random reveal order
      const shuffledMasks = gsap.utils.shuffle([...masks]);

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: row,
          start: "top 75%",
        },
      });

      // flicker animation using stagger with repeat
      timeline.to(shuffledMasks, {
        opacity: 1,
        duration: 0.05,
        ease: "power2.inOut",
        stagger: {
          amount: 0.5,
          from: "random",
          repeat: 2,
          yoyo: true,
        },
      });
    });
  });
}

// main execution
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  createMasks();
  initImageRevealAnimations();
});
