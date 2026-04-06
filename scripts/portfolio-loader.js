import { galleryImages } from "../data/galleryImages.js";

// API Configuration
const SUPABASE_URL = `${import.meta.env.VITE_SUPABASE_URL || ""}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Derive category from the clean URL path (e.g. /real-estate → "real-estate")
function getPortfolioCategory() {
  const path = window.location.pathname;
  const segment = path.split("/").filter(Boolean).pop() || "";
  return segment.replace(".html", "") || "real-estate";
}

// Lazy-load observer: loads images when they enter/near the viewport
const lazyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const url = el.dataset.lazySrc;
      if (!url) return;

      // Set the sizer <img> src
      const sizer = el.querySelector(".snap-sizer");
      if (sizer) sizer.src = url;

      // Set mask backgrounds
      el.querySelectorAll(".mask").forEach((mask) => {
        mask.style.backgroundImage = `url("${url}")`;
        mask.style.backgroundPosition = "50% 50%";
        mask.style.backgroundRepeat = "no-repeat";
        mask.style.backgroundSize = "contain";
        mask.style.opacity = "1";
      });

      lazyObserver.unobserve(el);
    });
  },
  { rootMargin: "200px" },
);

// Build the gallery grid from an array of image URLs
function renderGallery(imageUrls, snapshotsSection, category) {
  snapshotsSection.innerHTML = "";

  const imagesPerRow = 2;
  let currentRow = null;

  imageUrls.forEach((url, index) => {
    if (index % imagesPerRow === 0) {
      currentRow = document.createElement("div");
      currentRow.classList.add("snap-row");
      snapshotsSection.appendChild(currentRow);
    }

    const snapImg = document.createElement("div");
    snapImg.classList.add("snap-img", `img-${index + 1}`);
    snapImg.dataset.lazySrc = url;

    // Hidden image to establish natural aspect ratio (src set by observer)
    const sizer = document.createElement("img");
    sizer.alt = "";
    sizer.classList.add("snap-sizer");
    snapImg.appendChild(sizer);

    for (let i = 0; i < 9; i++) {
      const mask = document.createElement("div");
      mask.classList.add("mask");
      snapImg.appendChild(mask);
    }

    currentRow.appendChild(snapImg);
    lazyObserver.observe(snapImg);
  });

  // Fill remaining spots in last row with empty divs
  if (currentRow) {
    const remaining = imagesPerRow - currentRow.children.length;
    for (let i = 0; i < remaining; i++) {
      const emptyDiv = document.createElement("div");
      emptyDiv.classList.add("snap-img");
      currentRow.appendChild(emptyDiv);
    }
  }

  document.dispatchEvent(
    new CustomEvent("portfolioLoaded", {
      detail: { category, count: imageUrls.length },
    }),
  );
}

// Try fetching from Supabase; returns an array of URLs or null on failure
async function fetchSupabaseImages(category) {
  if (!ANON_KEY || !import.meta.env.VITE_SUPABASE_URL) return null;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/get-images?category=${category}`,
      { headers: { Authorization: `Bearer ${ANON_KEY}` } },
    );
    const data = await response.json();

    if (data.images && data.images.length > 0) {
      return data.images.map((img) => img.url);
    }
  } catch (err) {
    if (import.meta.env.DEV)
      console.warn("Supabase fetch failed, using local images:", err.message);
  }

  return null;
}

// Main loader — hardcoded first, then Supabase override
async function loadPortfolioImages() {
  const category = getPortfolioCategory();
  const snapshotsSection = document.querySelector(".film-snapshots .container");

  if (!snapshotsSection) return;

  // 1. Immediately render local/hardcoded images
  const localImages = galleryImages[category] || [];

  if (localImages.length > 0) {
    renderGallery(localImages, snapshotsSection, category);
  }

  // 2. Try Supabase — if it returns images, replace the gallery
  const supabaseImages = await fetchSupabaseImages(category);

  if (supabaseImages) {
    renderGallery(supabaseImages, snapshotsSection, category);
  } else if (localImages.length === 0) {
    if (import.meta.env.DEV)
      console.warn(`No images found for category: ${category}`);
    document.dispatchEvent(
      new CustomEvent("portfolioLoaded", { detail: { category, count: 0 } }),
    );
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadPortfolioImages);
} else {
  loadPortfolioImages();
}

export { loadPortfolioImages, getPortfolioCategory };
