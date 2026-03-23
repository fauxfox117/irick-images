import { scrambleIn } from "./scramble.js";

// main execution
document.addEventListener("DOMContentLoaded", () => {
  const contactTextElements = document.querySelectorAll(
    ".contact-info h2, .contact-info .about-text, .contact-col h4, .contact-footer p",
  );

  // apply staggered scramble effect
  contactTextElements.forEach((element, index) => {
    if (element.textContent.trim()) {
      const delay = 0.75 + index * 0.1;

      scrambleIn(element, delay, {
        duration: 0.1,
        charDelay: 25,
        stagger: 15,
        skipChars: 0,
        maxIterations: 5,
      });
    }
  });
});
