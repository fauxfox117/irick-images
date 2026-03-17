import Ukiyo from "ukiyojs";

let ukiyo = null;

// initialize parallax effect
function initUkiyo() {
  if (window.innerWidth >= 1000) {
    ukiyo = new Ukiyo('[data-parallax="true"] img', {
      scale: 1.5,
      speed: 0.65,
      willChange: true,
      wrapperClass: "ukiyo-wrapper",
      externalRAF: false,
    });
  }
}

function handleResize() {
  if (ukiyo) {
    ukiyo.reset();
  }
}

// initialization
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUkiyo);
} else {
  initUkiyo();
}

window.addEventListener("resize", handleResize);
