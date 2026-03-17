import { packages, addOns } from "../data/bookingData.js";

// Booking state
const bookingState = {
  currentStep: 1,
  selectedPackage: null,
  selectedAddOns: [],
  customerInfo: {},
  totalPrice: 0,
};

// Initialize booking flow
function init() {
  renderPackages();
  setupEventListeners();
  updateProgress();
}

// Render packages
function renderPackages() {
  const grid = document.getElementById("packagesGrid");
  grid.innerHTML = packages
    .map(
      (pkg) => `
    <div class="package-card" data-package-id="${pkg.id}">
      <div class="package-header">
        <h3>${pkg.name}</h3>
        <p class="package-price">$${pkg.price}</p>
      </div>
      <p class="package-description">${pkg.description}</p>
      <ul class="package-includes">
        ${pkg.includes.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `,
    )
    .join("");

  // Add click handlers to the entire card
  document.querySelectorAll(".package-card").forEach((card, index) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => selectPackage(packages[index]));
  });
}

// Render add-ons
function renderAddOns() {
  const grid = document.getElementById("addonsGrid");
  grid.innerHTML = addOns
    .map(
      (addon) => `
    <div class="addon-card" data-addon-id="${addon.id}">
      <div class="addon-header">
        <div>
          <h3>${addon.name}</h3>
          <p class="addon-price">+$${addon.price}</p>
        </div>
        <input type="checkbox" class="addon-checkbox" />
      </div>
      <ul class="addon-includes">
        ${addon.includes.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `,
    )
    .join("");

  // Add click handlers to the entire card
  document.querySelectorAll(".addon-card").forEach((card, index) => {
    card.style.cursor = "pointer";
    const checkbox = card.querySelector(".addon-checkbox");

    card.addEventListener("click", (e) => {
      // Don't toggle twice if clicking directly on checkbox
      if (e.target === checkbox) return;

      checkbox.checked = !checkbox.checked;
      toggleAddOn(addOns[index]);
    });

    // Keep the checkbox change handler for direct checkbox clicks
    checkbox.addEventListener("change", () => toggleAddOn(addOns[index]));
  });
}

// Select package
function selectPackage(pkg) {
  bookingState.selectedPackage = pkg;

  // Update UI
  document.querySelectorAll(".package-card").forEach((card) => {
    card.classList.remove("selected");
  });
  document
    .querySelector(`[data-package-id="${pkg.id}"]`)
    .classList.add("selected");

  // Enable continue button
  document.getElementById("nextToAddons").disabled = false;

  calculateTotal();
}

// Toggle add-on
function toggleAddOn(addon) {
  const index = bookingState.selectedAddOns.findIndex((a) => a.id === addon.id);

  if (index > -1) {
    bookingState.selectedAddOns.splice(index, 1);
  } else {
    bookingState.selectedAddOns.push(addon);
  }

  calculateTotal();
}

// Calculate total price
function calculateTotal() {
  const packagePrice = bookingState.selectedPackage?.price || 0;
  const addOnsPrice = bookingState.selectedAddOns.reduce(
    (sum, addon) => sum + addon.price,
    0,
  );

  bookingState.totalPrice = packagePrice + addOnsPrice;

  updateSummary();
}

// Update summary display
function updateSummary() {
  const summaryContent = document.getElementById("summaryContent");

  const summaryHTML = `
    <div class="summary-item">
      <span>${bookingState.selectedPackage?.name}</span>
      <span>$${bookingState.selectedPackage?.price}</span>
    </div>
    ${bookingState.selectedAddOns
      .map(
        (addon) => `
      <div class="summary-item">
        <span>${addon.name}</span>
        <span>$${addon.price}</span>
      </div>
    `,
      )
      .join("")}
  `;

  if (summaryContent) summaryContent.innerHTML = summaryHTML;

  const totalEl = document.getElementById("totalPrice");
  if (totalEl) totalEl.textContent = `$${bookingState.totalPrice}`;
}

// Navigate between steps
function goToStep(step) {
  // Hide all steps
  document.querySelectorAll(".booking-step").forEach((el) => {
    el.classList.remove("active");
  });

  // Show target step
  document
    .querySelector(`.booking-step[data-step="${step}"]`)
    .classList.add("active");

  bookingState.currentStep = step;
  updateProgress();

  // Special actions for certain steps
  if (step === 2) {
    renderAddOns();
  } else if (step === 3) {
    updateSummary();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Update progress indicator
function updateProgress() {
  document.querySelectorAll(".progress-step").forEach((step) => {
    const stepNum = parseInt(step.dataset.step);
    if (stepNum < bookingState.currentStep) {
      step.classList.add("completed");
      step.classList.remove("active");
    } else if (stepNum === bookingState.currentStep) {
      step.classList.add("active");
      step.classList.remove("completed");
    } else {
      step.classList.remove("active", "completed");
    }
  });
}

// Validate customer form
function validateForm() {
  const form = document.getElementById("customerForm");
  const formData = new FormData(form);

  bookingState.customerInfo = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    date: formData.get("date"),
    time: formData.get("time"),
    location: formData.get("location"),
    notes: formData.get("notes") || "",
  };

  return form.checkValidity();
}

// Submit booking request via Netlify Forms
async function submitBooking() {
  const submitBtn = document.getElementById("submitBooking");
  submitBtn.textContent = "Sending...";
  submitBtn.disabled = true;

  try {
    const formData = new URLSearchParams();
    formData.append("form-name", "booking");
    formData.append("bot-field", ""); // honeypot
    formData.append("package-name", bookingState.selectedPackage?.name || "");
    formData.append("package-price", bookingState.selectedPackage?.price || 0);
    formData.append(
      "add-ons",
      bookingState.selectedAddOns.map((a) => `${a.name} ($${a.price})`).join(", ") || "None",
    );
    formData.append("total-price", bookingState.totalPrice);
    formData.append("name", bookingState.customerInfo.name);
    formData.append("email", bookingState.customerInfo.email);
    formData.append("phone", bookingState.customerInfo.phone);
    formData.append("date", bookingState.customerInfo.date);
    formData.append("time", bookingState.customerInfo.time || "Not specified");
    formData.append("location", bookingState.customerInfo.location);
    formData.append("notes", bookingState.customerInfo.notes || "");

    const res = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!res.ok) {
      throw new Error("Form submission failed");
    }

    // Show confirmation
    const bookingContainer = document.querySelector(".booking-container");
    const confirmation = document.querySelector(".booking-confirmation");

    if (bookingContainer) bookingContainer.style.display = "none";
    if (confirmation) {
      confirmation.style.display = "flex";
      const nameEl = confirmation.querySelector(".confirm-name");
      if (nameEl) nameEl.textContent = bookingState.customerInfo.name;
    }
  } catch (err) {
    console.error("Booking error:", err);
    alert("Something went wrong. Please try again or contact us directly.");
    submitBtn.textContent = "Submit Request";
    submitBtn.disabled = false;
  }
}

// Setup event listeners
function setupEventListeners() {
  document
    .getElementById("nextToAddons")
    .addEventListener("click", () => goToStep(2));
  document
    .getElementById("backToPackages")
    .addEventListener("click", () => goToStep(1));
  document
    .getElementById("nextToDetails")
    .addEventListener("click", () => goToStep(3));
  document
    .getElementById("backToAddons")
    .addEventListener("click", () => goToStep(2));

  document.getElementById("submitBooking").addEventListener("click", () => {
    if (validateForm()) {
      submitBooking();
    } else {
      alert("Please fill out all required fields");
    }
  });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", init);
