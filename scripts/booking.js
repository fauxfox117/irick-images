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
const API_URL = "https://pplpwchruftvuwburumb.supabase.co/functions/v1";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwbHB3Y2hydWZ0dnV3YnVydW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjAxOTksImV4cCI6MjA4MzAzNjE5OX0.0VdXrFhcgx_zqnt6Reipfgt3jtqfx6zstsz1DZTnFRA";
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";
let paypalSdkPromise = null;

function getApiHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ANON_KEY}`,
  };
}

function setPaymentMessage(message, isError = false) {
  const messageEl = document.getElementById("payment-message");
  if (!messageEl) return;

  messageEl.textContent = message;
  if (!message) {
    messageEl.classList.remove("error");
    return;
  }

  if (isError) {
    messageEl.classList.add("error");
  } else {
    messageEl.classList.remove("error");
  }
}

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
    initializePayPalCheckout();
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
}

function getBookingPayload() {
  return {
    package: bookingState.selectedPackage,
    addOns: bookingState.selectedAddOns,
    customerInfo: bookingState.customerInfo,
  };
}

async function loadPayPalSdk() {
  if (window.paypal) {
    return window.paypal;
  }

  if (!PAYPAL_CLIENT_ID) {
    throw new Error("PayPal is not configured. Set VITE_PAYPAL_CLIENT_ID.");
  }

  if (paypalSdkPromise) {
    return paypalSdkPromise;
  }

  paypalSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=USD&intent=capture`;
    script.async = true;

    script.onload = () => {
      if (window.paypal) {
        resolve(window.paypal);
      } else {
        paypalSdkPromise = null;
        reject(new Error("PayPal SDK failed to initialize."));
      }
    };

    script.onerror = () => {
      paypalSdkPromise = null;
      reject(new Error("Failed to load PayPal SDK."));
    };

    document.head.appendChild(script);
  });

  return paypalSdkPromise;
}

async function createPayPalOrder() {
  const response = await fetch(`${API_URL}/create-payment-intent`, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify({
      amount: bookingState.depositPrice,
      bookingData: getBookingPayload(),
      totalPrice: bookingState.totalPrice,
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.orderID) {
    throw new Error(result.error || "Unable to create PayPal order.");
  }

  return result.orderID;
}

async function capturePayPalOrder(orderID) {
  const response = await fetch(`${API_URL}/capture-paypal-order`, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify({ orderID }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Unable to capture PayPal payment.");
  }

  return result;
}

async function initializePayPalCheckout() {
  const paymentElementEl = document.getElementById("payment-element");
  if (!paymentElementEl) return;

  setPaymentMessage("");
  paymentElementEl.innerHTML = "<p>Loading PayPal checkout...</p>";

  try {
    const paypal = await loadPayPalSdk();
    paymentElementEl.innerHTML = "";

    await paypal
      .Buttons({
        style: {
          layout: "vertical",
          shape: "rect",
          label: "paypal",
        },
        createOrder: async () => {
          setPaymentMessage("");
          return createPayPalOrder();
        },
        onApprove: async (data) => {
          try {
            setPaymentMessage("Finalizing payment...");
            const captureResult = await capturePayPalOrder(data.orderID);
            const paymentReference =
              captureResult.captureID || captureResult.orderID || data.orderID;
            await completeBooking(paymentReference);
          } catch (error) {
            setPaymentMessage(error.message, true);
          }
        },
        onCancel: () => {
          setPaymentMessage("PayPal checkout was cancelled.", true);
        },
        onError: (error) => {
          console.error("PayPal checkout error:", error);
          setPaymentMessage("Payment failed. Please try again.", true);
        },
      })
      .render("#payment-element");
  } catch (error) {
    console.error("Error initializing PayPal:", error);
    paymentElementEl.innerHTML = "";
    setPaymentMessage(error.message || "Failed to load PayPal checkout.", true);
  }
}

// Complete booking
async function completeBooking(paymentIntentId) {
  try {
    const response = await fetch(`${API_URL}/booking-complete`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        bookingData: getBookingPayload(),
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
    window.location.href = "/booking-success";
  } catch (error) {
    setPaymentMessage(error.message, true);
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", init);
