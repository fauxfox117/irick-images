function initPreloader() {
  const preloader = document.querySelector('.preloader');
  const textFill = document.querySelector('.text-fill');
  
  let progress = 0;
  const duration = 2000; // 2 seconds
  const interval = 20; // Update every 20ms
  const increment = 100 / (duration / interval);

  const timer = setInterval(() => {
    progress += increment;
    
    if (progress >= 100) {
      progress = 100;
      clearInterval(timer);
      
      // Fade out preloader after fill completes
      setTimeout(() => {
        preloader.style.opacity = '0';
        setTimeout(() => {
          preloader.style.display = 'none';
        }, 500);
      }, 200);
    }
    
    // Update clip-path for bottom-to-top fill
    textFill.style.clipPath = `inset(${100 - progress}% 0 0 0)`;
  }, interval);
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPreloader);
} else {
  initPreloader();
}
