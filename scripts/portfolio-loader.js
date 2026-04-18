import { galleryImages } from "../data/galleryImages.js";

// API Configuration
const SUPABASE_URL = `${import.meta.env.VITE_SUPABASE_URL || ""}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Derive category from the clean URL path (e.g. /real-estate → "real-estate")
function getPortfolioCategory() {
  const path = window.location.pathname;
  const segment = path.split("/").filter(Boolean).pop() || "";
  const category = segment.replace(".html", "") || "real-estate";

  // Map events page to events-misc folder in Supabase
  if (category === "events") {
    return "events-misc";
  }

  return category;
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

// Sort images by orientation and build smart rows
async function renderGallery(imageUrls, snapshotsSection, category) {
  snapshotsSection.innerHTML = "";

  // Step 1: Load all images and detect orientation
  const imageMetadata = await Promise.all(
    imageUrls.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const isLandscape = img.naturalWidth > img.naturalHeight;
            resolve({
              url,
              isLandscape,
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          };
          img.onerror = () => resolve(null);
          img.src = url;
        }),
    ),
  );

  const validImages = imageMetadata.filter(Boolean);

  // Step 2: Separate landscape and portrait
  const landscapeImages = validImages.filter((img) => img.isLandscape);
  const portraitImages = validImages.filter((img) => !img.isLandscape);

  // Step 3: Group portraits first, then landscapes at bottom
  const arrangedImages = [...portraitImages, ...landscapeImages];

  // Step 4: Build rows (2 per row)
  const imagesPerRow = 2;
  let currentRow = null;

  arrangedImages.forEach((imgData, index) => {
    if (index % imagesPerRow === 0) {
      currentRow = document.createElement("div");
      currentRow.classList.add("snap-row");
      snapshotsSection.appendChild(currentRow);
    }

    const snapImg = document.createElement("div");
    snapImg.classList.add("snap-img", `img-${index + 1}`);
    snapImg.dataset.lazySrc = imgData.url;

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

  // Fill remaining spots
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
      detail: { category, count: validImages.length },
    }),
  );
}

// Try fetching from Supabase; returns an array of URLs or null on failure
async function fetchSupabaseImages(category) {
  if (!ANON_KEY || !import.meta.env.VITE_SUPABASE_URL) return null;

  try {
    const url = `${SUPABASE_URL}/get-images?category=${category}`;
    console.log('Fetching Supabase images from:', url);
    
    const response = await fetch(
      url,
      { headers: { Authorization: `Bearer ${ANON_KEY}` } },
    );
    const data = await response.json();
    
    console.log(`Supabase response for ${category}:`, data);

    if (data.images && data.images.length > 0) {
      console.log(`Found ${data.images.length} images in Supabase`);
      return data.images.map((img) => img.url);
    }
  } catch (err) {
    console.error("Supabase fetch error:", err);
    if (import.meta.env.DEV)
      console.warn("Supabase fetch failed, using local images:", err.message);
  }

  return null;
}

// Main loader — hardcoded first, then Supabase added
async function loadPortfolioImages() {
  const supabaseCategory = getPortfolioCategory(); // This returns "events-misc" for events page
  console.log('Portfolio category:', supabaseCategory);
  
  const snapshotsSection = document.querySelector(".film-snapshots .container");

  if (!snapshotsSection) return;

  // 1. Get local/hardcoded images - use the local key which might differ from Supabase folder
  const localCategory =
    supabaseCategory === "events-misc" ? "events" : supabaseCategory;
  const localImages = galleryImages[localCategory] || [];
  console.log(`Local images for ${localCategory}:`, localImages.length);

  // 2. Try Supabase — combine with local images
  const supabaseImages = await fetchSupabaseImages(supabaseCategory);
  console.log('Supabase images:', supabaseImages?.length || 0);

  // 3. Combine both arrays (Supabase first, then local fallback)
  const allImages = [...(supabaseImages || []), ...localImages];
  console.log('Total images:', allImages.length);

  if (allImages.length > 0) {
    renderGallery(allImages, snapshotsSection, supabaseCategory);
  } else {
    if (import.meta.env.DEV)
      console.warn(`No images found for category: ${supabaseCategory}`);
    document.dispatchEvent(
      new CustomEvent("portfolioLoaded", {
        detail: { category: supabaseCategory, count: 0 },
      }),
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
