import { scrambleIn } from "./scramble.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";

let isMobile = false;

// grid layout and transform origins
const gridLayout = [
  [0, null, 1, null],
  [null, 2, null, null],
  [3, null, null, 4],
  [null, 5, 6, null],
  [7, null, null, 8],
  [null, null, 9, null],
  [null, 10, null, 11],
  [12, null, 13, null],
  [null, 14, null, null],
  [15, null, null, 16],
];

const origins = [
  "right",
  "left",
  "left",
  "right",
  "left",
  "left",
  "right",
  "left",
  "left",
  "left",
  "left",
  "left",
  "right",
  "left",
  "left",
  "right",
  "left",
];

// utility functions
function checkScreenSize() {
  isMobile = window.innerWidth < 1000;
}

function createTeamGrid() {
  const teamSection = document.querySelector(".team");
  if (!teamSection) return;

  gridLayout.forEach((row) => {
    const teamRow = document.createElement("div");
    teamRow.className = "team-row";

    row.forEach((imageIndex) => {
      const teamCol = document.createElement("div");
      teamCol.className = "team-col";

      if (imageIndex !== null) {
        const teamImg = document.createElement("div");
        teamImg.className = "team-img";
        teamImg.setAttribute("data-origin", origins[imageIndex]);

        const img = document.createElement("img");
        img.src = `/culture/team/team-${imageIndex + 1}.jpg`;
        img.alt = "";

        teamImg.appendChild(img);
        teamCol.appendChild(teamImg);
      }

      teamRow.appendChild(teamCol);
    });

    teamSection.appendChild(teamRow);
  });
}

// animation functions
function initTeamAnimation() {
  checkScreenSize();

  if (isMobile) {
    // mobile - set all images to final state
    gsap.set(".team-img", { scale: 1, force3D: true });
    return;
  }

  // desktop - initialize scroll animations
  gsap.set(".team-img", { scale: 0, force3D: true });

  const rows = document.querySelectorAll(".team-row");

  rows.forEach((row, index) => {
    const rowImages = row.querySelectorAll(".team-img");

    if (rowImages.length > 0) {
      row.id = `team-row-${index}`;

      // scale in animation
      ScrollTrigger.create({
        id: `scaleIn-${index}`,
        trigger: row,
        start: "top bottom",
        end: "bottom bottom-=10%",
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          if (self.isActive) {
            const progress = self.progress;
            const easedProgress = Math.min(1, progress * 1.2);
            const scaleValue = gsap.utils.interpolate(0, 1, easedProgress);

            rowImages.forEach((img) => {
              gsap.set(img, { scale: scaleValue, force3D: true });
            });

            if (progress > 0.95) {
              gsap.set(rowImages, { scale: 1, force3D: true });
            }
          }
        },
        onLeave: function () {
          gsap.set(rowImages, { scale: 1, force3D: true });
        },
      });

      // scale out animation
      ScrollTrigger.create({
        id: `scaleOut-${index}`,
        trigger: row,
        start: "top top",
        end: "bottom top",
        pin: true,
        pinSpacing: false,
        scrub: 1,
        invalidateOnRefresh: true,
        onEnter: function () {
          gsap.set(rowImages, { scale: 1, force3D: true });
        },
        onUpdate: function (self) {
          if (self.isActive) {
            const scale = gsap.utils.interpolate(1, 0, self.progress);

            rowImages.forEach((img) => {
              gsap.set(img, {
                scale: scale,
                force3D: true,
                clearProps: self.progress === 1 ? "scale" : "",
              });
            });
          } else {
            const isAbove = self.scroll() < self.start;
            if (isAbove) {
              gsap.set(rowImages, { scale: 1, force3D: true });
            }
          }
        },
      });

      // marker triggers
      ScrollTrigger.create({
        id: `marker-${index}`,
        trigger: row,
        start: "bottom bottom",
        end: "top top",
        onEnter: function () {
          const scaleOut = ScrollTrigger.getById(`scaleOut-${index}`);
          if (scaleOut && scaleOut.progress === 0) {
            gsap.set(rowImages, { scale: 1, force3D: true });
          }
        },
        onLeave: function () {
          const scaleOut = ScrollTrigger.getById(`scaleOut-${index}`);
          if (scaleOut && scaleOut.progress === 0) {
            gsap.set(rowImages, { scale: 1, force3D: true });
          }
        },
        onEnterBack: function () {
          const scaleOut = ScrollTrigger.getById(`scaleOut-${index}`);
          if (scaleOut && scaleOut.progress === 0) {
            gsap.set(rowImages, { scale: 1, force3D: true });
          }
        },
      });
    }
  });
}

function initHeaderPin() {
  const teamSection = document.querySelector(".team");
  const header = document.querySelector(".team-header");

  if (!teamSection || !header) return;

  ScrollTrigger.create({
    trigger: teamSection,
    start: "top top",
    end: "bottom bottom",
    pin: header,
    pinSpacing: false,
  });
}

// main execution
document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  createTeamGrid();

  // scramble hero heading
  const heroHeading = document.querySelector(".culture-hero-header h1");
  if (heroHeading) {
    scrambleIn(heroHeading, 0.75, {
      duration: 0.4,
      charDelay: 40,
      stagger: 80,
      skipChars: 0,
      maxIterations: 5,
    });
  }

  // set data-origin for images without it
  document
    .querySelectorAll(".team-img:not([data-origin])")
    .forEach((img, index) => {
      img.setAttribute("data-origin", index % 2 === 0 ? "left" : "right");
    });

  initTeamAnimation();
  initHeaderPin();

  // handle resize
  window.addEventListener("resize", () => {
    ScrollTrigger.killAll();
    gsap.set(".team-img", { clearProps: "all" });
    initTeamAnimation();
    initHeaderPin();
    ScrollTrigger.refresh();
  });
});
