import { packages, addOns } from "../data/bookingData.js";

// Booking state
const bookingState = {
  currentStep: 1,
  selectedPackage: null,
  selectedAddOns: [],
  customerInfo: {},
  totalPrice: 0,
  depositPrice: 0,
};

// API Configuration
const API_URL = "http://localhost:3000/api";

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
      <button class="btn-select-package">Select Package</button>
    </div>
  `,
    )
    .join("");

  // Add click handlers
  document.querySelectorAll(".btn-select-package").forEach((btn, index) => {
    btn.addEventListener("click", () => selectPackage(packages[index]));
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

  // Add change handlers
  document.querySelectorAll(".addon-checkbox").forEach((checkbox, index) => {
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
  bookingState.depositPrice = Math.round(bookingState.totalPrice * 0.5);

  updateSummary();
}

// Update summary display
function updateSummary() {
  const summaryContent = document.getElementById("summaryContent");
  const finalSummary = document.getElementById("finalSummary");

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
  if (finalSummary) finalSummary.innerHTML = summaryHTML;

  document.getElementById("totalPrice").textContent =
    `$${bookingState.totalPrice}`;
  document.getElementById("depositPrice").textContent =
    `$${bookingState.depositPrice}`;
  document.getElementById("finalDepositPrice").textContent =
    `$${bookingState.depositPrice}`;
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
  } else if (step === 4) {
    updateSummary();
    // Payment setup will be added when Stripe keys are available
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

// Setup event listeners
function setupEventListeners() {
  // Step navigation
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

  document.getElementById("nextToPayment").addEventListener("click", () => {
    if (validateForm()) {
      goToStep(4);
    } else {
      alert("Please fill out all required fields");
    }
  });

  document
    .getElementById("backToDetails")
    .addEventListener("click", () => goToStep(3));

  document
    .getElementById("submitPayment")
    .addEventListener("click", handlePayment);
}

// Handle payment submission
async function handlePayment() {
  const messageEl = document.getElementById("payment-message");
  const submitBtn = document.getElementById("submitPayment");

  try {
    submitBtn.disabled = true;
    messageEl.textContent = "Processing payment...";

    // Create payment intent
    const response = await fetch(`${API_URL}/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: bookingState.depositPrice,
        bookingData: {
          package: bookingState.selectedPackage,
          addOns: bookingState.selectedAddOns,
          customerInfo: bookingState.customerInfo,
        },
        totalPrice: bookingState.totalPrice,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Payment setup failed:", errorText);
      throw new Error("Payment setup failed");
    }

    const data = await response.json();
    const { clientSecret } = data;

    // For now, simulate successful payment
    // When Stripe keys are added, this will integrate with Stripe Elements
    await completeBooking("simulated_payment_" + Date.now());
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.classList.add("error");
    submitBtn.disabled = false;
  }
}

// Complete booking
async function completeBooking(paymentIntentId) {
  try {
    const response = await fetch(`${API_URL}/booking-complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingData: {
          package: bookingState.selectedPackage,
          addOns: bookingState.selectedAddOns,
          customerInfo: bookingState.customerInfo,
        },
        paymentIntentId,
        totalPrice: bookingState.totalPrice,
        depositPaid: bookingState.depositPrice,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Booking submission failed:", errorText);
      throw new Error("Booking submission failed");
    }

    const data = await response.json();
    console.log("Booking completed:", data);

    // Redirect to success page
    window.location.href = "/booking-success.html";
  } catch (error) {
    document.getElementById("payment-message").textContent = error.message;
    document.getElementById("payment-message").classList.add("error");
    document.getElementById("submitPayment").disabled = false;
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", init);
