// API Configuration
const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Escape HTML entities to prevent XSS
function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Check authentication on page load
function checkAuth() {
  const session = localStorage.getItem("admin_session");

  if (!session) {
    window.location.href = "/admin";
    return null;
  }

  try {
    const data = JSON.parse(session);

    // Check if session is older than 24 hours
    const hoursSinceLogin = (Date.now() - data.timestamp) / (1000 * 60 * 60);
    if (hoursSinceLogin > 24) {
      localStorage.removeItem("admin_session");
      window.location.href = "/admin";
      return null;
    }

    return data;
  } catch (error) {
    localStorage.removeItem("admin_session");
    window.location.href = "/admin";
    return null;
  }
}

// Initialize dashboard
function init() {
  const session = checkAuth();
  if (!session) return;

  setupEventListeners();
  loadBookings();
}

// Setup event listeners
function setupEventListeners() {
  // Logout
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Refresh bookings
  document
    .getElementById("refreshBookings")
    .addEventListener("click", loadBookings);

  // Refresh photos
  document
    .getElementById("refreshPhotos")
    .addEventListener("click", loadPhotos);
  document
    .getElementById("manageCategory")
    .addEventListener("change", loadPhotos);

  // Image upload
  document.getElementById("uploadBtn").addEventListener("click", uploadImage);
  document.getElementById("imageFile").addEventListener("change", previewImage);
}

// Switch tabs
function switchTab(tabName) {
  // Update buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  // Update content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.toggle("active", content.dataset.tab === tabName);
  });
}

// Logout
function logout() {
  localStorage.removeItem("admin_session");
  window.location.href = "/admin";
}

// Load bookings
async function loadBookings() {
  const loadingEl = document.getElementById("bookingsLoading");
  const errorEl = document.getElementById("bookingsError");
  const gridEl = document.getElementById("bookingsGrid");

  loadingEl.style.display = "block";
  errorEl.textContent = "";
  gridEl.innerHTML = "";

  try {
    const response = await fetch(`${API_URL}/admin-bookings`, {
      headers: { Authorization: `Bearer ${ANON_KEY}` },
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load bookings");
    }

    loadingEl.style.display = "none";

    if (data.bookings.length === 0) {
      gridEl.innerHTML = '<p class="no-data">No bookings yet.</p>';
      return;
    }

    renderBookings(data.bookings);
  } catch (error) {
    loadingEl.style.display = "none";
    errorEl.textContent = error.message;
  }
}

// Render bookings
function renderBookings(bookings) {
  const gridEl = document.getElementById("bookingsGrid");

  gridEl.innerHTML = bookings
    .map(
      (booking) => `
    <div class="booking-card" data-booking-id="${esc(booking.id)}">
      <div class="booking-header">
        <h3>${esc(booking.customer_name)}</h3>
        <span class="booking-date">${new Date(booking.created_at).toLocaleDateString()}</span>
      </div>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="label">Email:</span>
          <span>${esc(booking.customer_email)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Phone:</span>
          <span>${esc(booking.customer_phone)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Shoot Date:</span>
          <span>${new Date(booking.booking_date).toLocaleDateString()}</span>
        </div>
        <div class="detail-row">
          <span class="label">Time:</span>
          <span>${esc(booking.booking_time)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Location:</span>
          <span>${esc(booking.location)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Package:</span>
          <span>${esc(booking.package_name)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total:</span>
          <span class="price">$${esc(booking.total_price)}</span>
        </div>
        <div class="detail-row">
          <span class="label">Deposit Paid:</span>
          <span class="price paid">$${esc(booking.deposit_paid)}</span>
        </div>
      </div>
      
      ${
        booking.add_ons && JSON.parse(booking.add_ons).length > 0
          ? `
        <div class="booking-addons">
          <strong>Add-ons:</strong>
          <ul>
            ${JSON.parse(booking.add_ons)
              .map(
                (addon) => `
              <li>${esc(addon.name)} - $${esc(addon.price)}</li>
            `,
              )
              .join("")}
          </ul>
        </div>
      `
          : ""
      }
       <div class="booking-actions">
        <button class="btn-confirm" data-booking-id="${esc(booking.id)}">Confirm</button>
        <button class="btn-delete" data-booking-id="${esc(booking.id)}">Delete</button>
      </div>
    </div>
  `,
    )
    .join("");

  // Add event listeners after rendering
  document.querySelectorAll(".btn-confirm").forEach((btn) => {
    btn.addEventListener("click", () => confirmBooking(btn.dataset.bookingId));
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteBooking(btn.dataset.bookingId));
  });
}

// Confirm booking
async function confirmBooking(bookingId) {
  if (!confirm("Confirm this booking?")) return;

  try {
    const response = await fetch(
      `${API_URL}/update-booking/${bookingId}/confirm`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${ANON_KEY}` },
      },
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to confirm booking");
    }

    // Reload bookings
    await loadBookings();
    alert("Booking confirmed successfully!");
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// Delete booking
async function deleteBooking(bookingId) {
  if (
    !confirm(
      "Are you sure you want to delete this booking? This cannot be undone.",
    )
  )
    return;

  try {
    const response = await fetch(`${API_URL}/update-booking/${bookingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ANON_KEY}` },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to delete booking");
    }

    // Reload bookings
    await loadBookings();
    alert("Booking deleted successfully!");
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// Preview image before upload
function previewImage(e) {
  const file = e.target.files[0];
  const previewEl = document.getElementById("uploadPreview");

  if (!file) {
    previewEl.innerHTML = "";
    return;
  }

  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    document.getElementById("uploadError").textContent =
      "File size must be less than 10MB";
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    previewEl.innerHTML = `
      <img src="${e.target.result}" alt="Preview" />
      <p>${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</p>
    `;
  };
  reader.readAsDataURL(file);
}

// Upload image
async function uploadImage() {
  const fileInput = document.getElementById("imageFile");
  const category = document.getElementById("category").value;
  const customFileName = document.getElementById("fileName").value.trim();
  const uploadBtn = document.getElementById("uploadBtn");
  const errorEl = document.getElementById("uploadError");
  const successEl = document.getElementById("uploadSuccess");

  errorEl.textContent = "";
  successEl.textContent = "";

  // Validate inputs
  if (!fileInput.files[0]) {
    errorEl.textContent = "Please select an image";
    return;
  }

  if (!category) {
    errorEl.textContent = "Please select a category";
    return;
  }

  const file = fileInput.files[0];
  const fileName = customFileName || file.name;

  // Additional validation
  if (!fileName.trim()) {
    errorEl.textContent = "File name cannot be empty";
    return;
  }

  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading...";

  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);

    if (!base64) {
      throw new Error("Failed to convert image to base64");
    }

    const payload = {
      fileName: fileName.trim(),
      base64Image: base64,
      category,
    };

    console.log("Upload payload:", {
      fileName: payload.fileName,
      category: payload.category,
      base64Length: payload.base64Image?.length,
      base64Prefix: payload.base64Image?.substring(0, 50),
    });

    const response = await fetch(`${API_URL}/upload-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Upload failed:", data);
      throw new Error(
        data.error || `Upload failed with status ${response.status}`,
      );
    }

    successEl.textContent = `Image uploaded successfully to ${data.path}`;

    // Reset form
    fileInput.value = "";
    document.getElementById("fileName").value = "";
    document.getElementById("uploadPreview").innerHTML = "";

    // Refresh photos to show the new upload
    await loadPhotos();
  } catch (error) {
    errorEl.textContent = error.message;
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload Image";
  }
}

// Helper: Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Load photos
async function loadPhotos() {
  const loadingEl = document.getElementById("photosLoading");
  const errorEl = document.getElementById("photosError");
  const gridEl = document.getElementById("photosGrid");
  const category = document.getElementById("manageCategory").value;

  loadingEl.style.display = "block";
  errorEl.textContent = "";
  gridEl.innerHTML = "";

  try {
    const url = category
      ? `${API_URL}/get-images?category=${category}`
      : `${API_URL}/get-images?category=all`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${ANON_KEY}` },
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load photos");
    }

    loadingEl.style.display = "none";

    if (data.images.length === 0) {
      gridEl.innerHTML = '<p class="no-data">No photos found.</p>';
      return;
    }

    renderPhotos(data.images);
  } catch (error) {
    loadingEl.style.display = "none";
    errorEl.textContent = error.message;
  }
}

// Render photos
function renderPhotos(photos) {
  const gridEl = document.getElementById("photosGrid");

  gridEl.innerHTML = photos
    .map(
      (photo) => `
    <div class="photo-card">
      <img src="${esc(photo.url)}" alt="${esc(photo.name)}" loading="lazy" />
      <div class="photo-info">
        <p class="photo-name">${esc(photo.name)}</p>
        <p class="photo-category">${esc(photo.category)}</p>
        <p class="photo-size">${(photo.size / 1024).toFixed(1)} KB</p>
      </div>
      <div class="photo-actions">
        <select class="category-select" data-path="${esc(photo.path)}" data-current-category="${esc(photo.category)}">
          <option value="" disabled selected>Move to...</option>
          <option value="real-estate">Real Estate</option>
          <option value="portraits">Portraits</option>
          <option value="performance">Performance</option>
          <option value="events-misc">Events, misc.</option>
          <option value="promotional">Promotional</option>
        </select>
        <button class="btn-delete-photo" data-path="${esc(photo.path)}">Delete</button>
      </div>
    </div>
  `,
    )
    .join("");

  // Add category change handlers
  document.querySelectorAll(".category-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      const newCategory = e.target.value;
      const path = e.target.dataset.path;
      const currentCategory = e.target.dataset.currentCategory;

      if (newCategory && newCategory !== currentCategory) {
        movePhoto(path, newCategory);
      }
    });
  });

  // Add delete handlers
  document.querySelectorAll(".btn-delete-photo").forEach((btn) => {
    btn.addEventListener("click", () => deletePhoto(btn.dataset.path));
  });
}

// Delete photo
async function deletePhoto(path) {
  if (!confirm(`Delete ${path}? This cannot be undone.`)) return;

  try {
    const response = await fetch(`${API_URL}/manage-photos`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ path }),
    });

    const text = await response.text();
    if (!response.ok) {
      let message;
      try {
        message = JSON.parse(text).error;
      } catch {
        message = text;
      }
      throw new Error(
        `[${response.status}] ${message || "Failed to delete photo"}`,
      );
    }

    await loadPhotos();
    alert("Photo deleted successfully!");
  } catch (error) {
    alert("Error deleting photo: " + error.message);
    console.error("deletePhoto error:", error);
  }
}

// Move photo to different category
async function movePhoto(oldPath, newCategory) {
  const fileName = oldPath.split("/").pop();
  const newPath = `${newCategory}/${fileName}`;

  if (!confirm(`Move ${fileName} to ${newCategory}?`)) return;

  try {
    const response = await fetch(`${API_URL}/manage-photos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ oldPath, newPath }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to move photo");
    }

    await loadPhotos();
    alert("Photo moved successfully!");
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", init);
