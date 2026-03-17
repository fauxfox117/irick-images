import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

// animation settings
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
const DURATION = 0.25;
const STAGGER = 50;

// scrambles a single character with random chars
function scrambleChar(
  char,
  showAfter = true,
  duration = DURATION,
  charDelay = 50,
  maxIterations = null
) {
  // store original text on the element
  if (!char.dataset.originalText) {
    char.dataset.originalText = char.textContent;
  }
  const originalText = char.dataset.originalText;
  let iterations = 0;
  const iterationsCount = maxIterations || Math.floor(Math.random() * 6) + 3;

  if (showAfter) gsap.set(char, { opacity: 1 });

  // clear any existing intervals/timeouts
  if (char.scrambleInterval) {
    clearInterval(char.scrambleInterval);
  }
  if (char.scrambleTimeout) {
    clearTimeout(char.scrambleTimeout);
  }

  const interval = setInterval(() => {
    // preserve spaces during scrambling
    if (originalText === " ") {
      char.textContent = " ";
    } else {
      char.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    iterations++;

    if (iterations >= iterationsCount) {
      clearInterval(interval);
      char.scrambleInterval = null;
      char.textContent = originalText;
      if (!showAfter) gsap.set(char, { opacity: 0 });
    }
  }, charDelay);

  char.scrambleInterval = interval;

  const timeout = setTimeout(() => {
    clearInterval(interval);
    char.scrambleInterval = null;
    char.scrambleTimeout = null;
    char.textContent = originalText;
    if (!showAfter) gsap.set(char, { opacity: 0 });
  }, duration * 1000);

  char.scrambleTimeout = timeout;
}

// scrambles multiple characters with stagger delay
function scrambleText(
  elements,
  showAfter = true,
  duration = DURATION,
  charDelay = 50,
  stagger = STAGGER,
  skipChars = 0,
  maxIterations = null
) {
  elements.forEach((char, index) => {
    if (index < skipChars) {
      if (showAfter) gsap.set(char, { opacity: 1 });
      return;
    }

    // clear any existing stagger timeout
    if (char.staggerTimeout) {
      clearTimeout(char.staggerTimeout);
    }

    const staggerTimeout = setTimeout(() => {
      scrambleChar(char, showAfter, duration, charDelay, maxIterations);
      char.staggerTimeout = null;
    }, (index - skipChars) * stagger);

    char.staggerTimeout = staggerTimeout;
  });
}

// shows text with scramble effect using word-first splitting
export function scrambleIn(element, delay = 0, options = {}) {
  if (!element.textContent.trim()) return;

  const {
    duration = DURATION,
    charDelay = 50,
    stagger = STAGGER,
    skipChars = 0,
    maxIterations = null,
  } = options;

  // split into words first
  const wordSplit = new SplitText(element, { type: "words" });

  // then split each word into characters
  const charSplits = wordSplit.words.map((word) => {
    return new SplitText(word, { type: "chars" });
  });

  // collect all characters in order
  const allChars = [];
  charSplits.forEach((split) => {
    allChars.push(...split.chars);
  });

  gsap.set(allChars, { opacity: 0 });

  setTimeout(() => {
    scrambleText(
      allChars,
      true,
      duration,
      charDelay,
      stagger,
      skipChars,
      maxIterations
    );
  }, delay * 1000);

  return { wordSplit, charSplits, allChars };
}

// hides text with scramble effect
export function scrambleOut(element, delay = 0) {
  const chars = element.querySelectorAll(".char span");
  if (chars.length === 0) return;

  gsap.set(chars, { opacity: 1 });

  setTimeout(() => {
    scrambleText([...chars].reverse(), false);
  }, delay * 1000);
}

// scrambles text while keeping letters visible
export function scrambleVisible(element, delay = 0, options = {}) {
  if (!element.textContent.trim()) return;

  const {
    duration = DURATION,
    charDelay = 50,
    stagger = STAGGER,
    skipChars = 0,
    maxIterations = null,
  } = options;

  // split into words first
  const wordSplit = new SplitText(element, { type: "words" });

  // then split each word into characters
  const charSplits = wordSplit.words.map((word) => {
    return new SplitText(word, { type: "chars" });
  });

  // collect all characters in order
  const allChars = [];
  charSplits.forEach((split) => {
    allChars.push(...split.chars);
  });

  gsap.set(allChars, { opacity: 1 });

  setTimeout(() => {
    scrambleText(
      allChars,
      true,
      duration,
      charDelay,
      stagger,
      skipChars,
      maxIterations
    );
  }, delay * 1000);

  return { wordSplit, charSplits, allChars };
}
