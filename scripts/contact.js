import { scrambleIn } from "./scramble.js";

// main execution
document.addEventListener("DOMContentLoaded", () => {
  const contactTextElements = document.querySelectorAll(
    ".contact-copy h4, .contact-copy-footer p"
  );

  // apply staggered scramble effect
  contactTextElements.forEach((element, index) => {
    if (element.textContent.trim()) {
      const delay = 0.75 + index * 0.1;

      scrambleIn(element, delay, {
        duration: 0.1,
        charDelay: 50,
        stagger: 25,
        skipChars: 0,
        maxIterations: 5,
      });
    }
  });
});
