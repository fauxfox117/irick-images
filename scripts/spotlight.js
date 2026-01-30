class SpotlightGallery {
  constructor() {
    this.galleryContainer = document.querySelector(".spotlight-gallery");
    this.galleryItems = [];
    this.currentExpandedIndex = 0;
    this.isMobile = false;
    this.clickedItems = new Set();

    this.collapsedWidth = 20;
    this.expandedWidth = 400;
    this.mobileExpandedWidth = 100;
    this.gap = 5;

    this.init();
  }

  // check if screen is mobile
  checkScreenSize() {
    const newIsMobile = window.innerWidth < 1000;
    const wasDesktop = !this.isMobile;

    this.isMobile = newIsMobile;

    if ((wasDesktop && this.isMobile) || (!wasDesktop && !this.isMobile)) {
      this.createGallery();
      this.setupEventListeners();
    }
  }

  // create gallery items based on screen size
  createGallery() {
    this.galleryContainer.innerHTML = "";
    this.clickedItems.clear();

    const itemCount = this.isMobile ? 10 : 20;

    // create gallery items
    for (let i = 1; i <= itemCount; i++) {
      const galleryItem = document.createElement("div");
      galleryItem.className = "spotlight-gallery-item";

      const img = document.createElement("img");
      img.src = `/spotlight/spotlight-${i}.jpg`;
      img.alt = `Spotlight ${i}`;

      galleryItem.appendChild(img);
      this.galleryContainer.appendChild(galleryItem);
    }

    this.galleryItems = this.galleryContainer.querySelectorAll(
      ".spotlight-gallery-item"
    );

    this.currentExpandedIndex = 0;
    this.updateGalleryLayout(this.currentExpandedIndex);
  }

  // calculate exact positions for each item
  calculatePositions(expandedIndex) {
    const positions = [];
    const totalItems = this.galleryItems.length;

    const currentExpandedWidth = this.isMobile
      ? this.mobileExpandedWidth
      : this.expandedWidth;

    // calculate total width needed
    let totalWidth = 0;
    for (let i = 0; i < totalItems; i++) {
      if (i === expandedIndex) {
        totalWidth += currentExpandedWidth + this.gap;
      } else {
        totalWidth += this.collapsedWidth + this.gap;
      }
    }
    totalWidth -= this.gap;

    // calculate starting position to center the gallery
    const containerWidth = this.galleryContainer.offsetWidth;
    const startLeft = (containerWidth - totalWidth) / 2;

    let currentLeft = startLeft;

    for (let i = 0; i < totalItems; i++) {
      if (i === expandedIndex) {
        positions.push({
          left: currentLeft,
          width: currentExpandedWidth,
        });
        currentLeft += currentExpandedWidth + this.gap;
      } else {
        positions.push({
          left: currentLeft,
          width: this.collapsedWidth,
        });
        currentLeft += this.collapsedWidth + this.gap;
      }
    }

    return positions;
  }

  // update gallery layout with exact positions
  updateGalleryLayout(expandedIndex) {
    const positions = this.calculatePositions(expandedIndex);

    this.galleryItems.forEach((item, index) => {
      const pos = positions[index];
      item.style.left = `${pos.left}px`;
      item.style.width = `${pos.width}px`;
    });
  }

  // handle desktop mouse interactions
  handleDesktopEvents() {
    this.galleryItems.forEach((item, index) => {
      item.addEventListener("mouseenter", () => {
        this.currentExpandedIndex = index;
        this.updateGalleryLayout(this.currentExpandedIndex);
      });
    });
  }

  // handle mobile click interactions
  handleMobileEvents() {
    this.galleryItems.forEach((item, index) => {
      item.addEventListener("click", () => {
        if (
          this.clickedItems.has(index) &&
          this.currentExpandedIndex === index
        ) {
          this.clickedItems.delete(index);
          // find next available item to expand or default to first
          const nextIndex =
            this.clickedItems.size > 0 ? Math.min(...this.clickedItems) : 0;
          this.currentExpandedIndex = nextIndex;
        } else {
          // add to clicked items and expand
          this.clickedItems.add(index);
          this.currentExpandedIndex = index;
        }

        this.updateGalleryLayout(this.currentExpandedIndex);
      });
    });
  }

  // remove all event listeners
  removeEventListeners() {
    this.galleryItems.forEach((item) => {
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
    });

    this.galleryItems = this.galleryContainer.querySelectorAll(
      ".spotlight-gallery-item"
    );
  }

  // setup event listeners based on screen size
  setupEventListeners() {
    this.removeEventListeners();

    if (this.isMobile) {
      this.handleMobileEvents();
    } else {
      this.handleDesktopEvents();
    }
  }

  // handle window resize
  handleResize() {
    this.checkScreenSize();

    setTimeout(() => {
      this.updateGalleryLayout(this.currentExpandedIndex);
    }, 100);
  }

  // initialize the gallery
  init() {
    if (!this.galleryContainer) {
      return;
    }

    this.checkScreenSize();
    this.createGallery();
    this.setupEventListeners();

    window.addEventListener("resize", () => this.handleResize());
  }

  refresh() {
    this.createGallery();
    this.setupEventListeners();
  }

  destroy() {
    this.removeEventListeners();
    window.removeEventListener("resize", this.handleResize);
    this.galleryContainer.innerHTML = "";
  }
}

const spotlightGallery = new SpotlightGallery();

window.SpotlightGallery = SpotlightGallery;
window.spotlightGallery = spotlightGallery;
