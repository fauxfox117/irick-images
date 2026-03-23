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

    const allImages = [
      "/spotlight/_EPG1798.webp",
      "/spotlight/_EPG4506.webp",
      "/spotlight/_EPG4536.webp",
      "/spotlight/_EPG4716.webp",
      "/spotlight/_EPG5747.webp",
      "/spotlight/_EPG6997.webp",
      "/spotlight/_EPG9466.webp",
      "/spotlight/EDIT19-2.webp",
      "/spotlight/OUTLINES.webp",
      "/spotlight/DJI_20251201172047_0094_D_DTE.webp",
      "/spotlight/4.webp",
      "/spotlight/1 2.webp",
    ];

    const itemCount = this.isMobile ? 10 : allImages.length;
    const imagesToShow = allImages.slice(0, itemCount);

    // create gallery items
    imagesToShow.forEach((src, i) => {
      const galleryItem = document.createElement("div");
      galleryItem.className = "spotlight-gallery-item";

      const img = document.createElement("img");
      img.src = src;
      img.alt = `Spotlight ${i + 1}`;

      galleryItem.appendChild(img);
      this.galleryContainer.appendChild(galleryItem);
    });

    this.galleryItems = this.galleryContainer.querySelectorAll(
      ".spotlight-gallery-item",
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

      // Add click to open modal
      item.addEventListener("click", (e) => {
        const img = item.querySelector("img");
        this.openModal(img.src);
      });
    });
  }

  // handle mobile click interactions
  handleMobileEvents() {
    this.galleryItems.forEach((item, index) => {
      item.addEventListener("click", () => {
        // Check if this is an expansion click or a modal open
        const img = item.querySelector("img");

        // If already expanded, open modal
        if (
          this.currentExpandedIndex === index &&
          this.clickedItems.has(index)
        ) {
          this.openModal(img.src);
          return;
        }

        if (
          this.clickedItems.has(index) &&
          this.currentExpandedIndex === index
        ) {
          this.clickedItems.delete(index);
          const nextIndex =
            this.clickedItems.size > 0 ? Math.min(...this.clickedItems) : 0;
          this.currentExpandedIndex = nextIndex;
        } else {
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
      ".spotlight-gallery-item",
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

  // open modal with image
  openModal(imageSrc) {
    const modal = document.getElementById("spotlightModal");
    const modalImage = document.getElementById("spotlightModalImage");

    if (modal && modalImage) {
      modalImage.src = imageSrc;
      modal.style.display = "flex";
      document.body.style.overflow = "hidden"; // prevent scrolling
      // Re-setup listeners when modal opens
      this.setupModalListeners();
    }
  }

  // close modal
  closeModal() {
    const modal = document.getElementById("spotlightModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  // setup modal event listeners
  setupModalListeners() {
    // Handle close button
    const modal = document.getElementById("spotlightModal");
    if (!modal) return;

    const closeBtn = modal.querySelector(".spotlight-modal-close");
    const backdrop = modal.querySelector(".spotlight-modal-backdrop");

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeModal();
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", () => this.closeModal());
    }

    // Close on ESC key - use a proper listener
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        const currentModal = document.getElementById("spotlightModal");
        if (currentModal && currentModal.style.display === "flex") {
          this.closeModal();
        }
      }
    };

    // Remove old listener if it exists, then add new one
    document.removeEventListener("keydown", handleEsc);
    document.addEventListener("keydown", handleEsc);
  }
}

const spotlightGallery = new SpotlightGallery();

window.SpotlightGallery = SpotlightGallery;
window.spotlightGallery = spotlightGallery;
