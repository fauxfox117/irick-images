// API Configuration
const SUPABASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Derive category from the clean URL path (e.g. /real-estate → "real-estate")
function getPortfolioCategory() {
  const path = window.location.pathname;
  const segment = path.split("/").filter(Boolean).pop() || "";
  return segment.replace(".html", "") || "real-estate";
}

// Dynamically load images from Supabase Storage via edge function
async function loadPortfolioImages() {
  const category = getPortfolioCategory();
  const snapshotsSection = document.querySelector(".film-snapshots .container");

  if (!snapshotsSection) return;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/get-images?category=${category}`,
      { headers: { Authorization: `Bearer ${ANON_KEY}` } },
    );
    const data = await response.json();

    if (!data.images || data.images.length === 0) {
      console.warn(`No images found for category: ${category}`);
      document.dispatchEvent(
        new CustomEvent("portfolioLoaded", { detail: { category, count: 0 } }),
      );
      return;
    }

    // Clear existing content
    snapshotsSection.innerHTML = "";

    // Create rows (3 images per row)
    const imagesPerRow = 3;
    let currentRow = null;

    data.images.forEach((image, index) => {
      // Create new row every 3 images
      if (index % imagesPerRow === 0) {
        currentRow = document.createElement("div");
        currentRow.classList.add("snap-row");
        snapshotsSection.appendChild(currentRow);
      }

      // Create image container
      const snapImg = document.createElement("div");
      snapImg.classList.add("snap-img", `img-${index + 1}`);

      // Create 9 mask divs with the image as background
      for (let i = 0; i < 9; i++) {
        const mask = document.createElement("div");
        mask.classList.add("mask");
        mask.style.background = `url(${image.url}) no-repeat 50% 50%`;
        mask.style.backgroundSize = "cover";
        snapImg.appendChild(mask);
      }

      currentRow.appendChild(snapImg);
    });

    // Fill remaining spots in last row with empty divs
    if (currentRow) {
      const imagesInLastRow = currentRow.children.length;
      for (let i = imagesInLastRow; i < imagesPerRow; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.classList.add("snap-img");
        currentRow.appendChild(emptyDiv);
      }
    }

    // Notify film.js to reinitialize scroll animations on the new DOM nodes
    document.dispatchEvent(
      new CustomEvent("portfolioLoaded", {
        detail: { category, count: data.images.length },
      }),
    );

    console.log(`Loaded ${data.images.length} images for ${category}`);
  } catch (error) {
    console.error("Failed to load portfolio images:", error);
    document.dispatchEvent(
      new CustomEvent("portfolioLoaded", {
        detail: { category, count: 0, error: true },
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
