// API Configuration
const API_URL = 'http://localhost:3000/api';

// Check authentication on page load
function checkAuth() {
  const session = localStorage.getItem('admin_session');
  
  if (!session) {
    window.location.href = '/admin-login.html';
    return null;
  }
  
  try {
    const data = JSON.parse(session);
    
    // Check if session is older than 24 hours
    const hoursSinceLogin = (Date.now() - data.timestamp) / (1000 * 60 * 60);
    if (hoursSinceLogin > 24) {
      localStorage.removeItem('admin_session');
      window.location.href = '/admin-login.html';
      return null;
    }
    
    return data;
  } catch (error) {
    localStorage.removeItem('admin_session');
    window.location.href = '/admin-login.html';
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
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  
  // Refresh bookings
  document.getElementById('refreshBookings').addEventListener('click', loadBookings);
  
  // Image upload
  document.getElementById('uploadBtn').addEventListener('click', uploadImage);
  document.getElementById('imageFile').addEventListener('change', previewImage);
}

// Switch tabs
function switchTab(tabName) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.dataset.tab === tabName);
  });
}

// Logout
function logout() {
  localStorage.removeItem('admin_session');
  window.location.href = '/admin-login.html';
}

// Load bookings
async function loadBookings() {
  const loadingEl = document.getElementById('bookingsLoading');
  const errorEl = document.getElementById('bookingsError');
  const gridEl = document.getElementById('bookingsGrid');
  
  loadingEl.style.display = 'block';
  errorEl.textContent = '';
  gridEl.innerHTML = '';
  
  try {
    const response = await fetch(`${API_URL}/admin/bookings`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load bookings');
    }
    
    loadingEl.style.display = 'none';
    
    if (data.bookings.length === 0) {
      gridEl.innerHTML = '<p class="no-data">No bookings yet.</p>';
      return;
    }
    
    renderBookings(data.bookings);
    
  } catch (error) {
    loadingEl.style.display = 'none';
    errorEl.textContent = error.message;
  }
}

// Render bookings
function renderBookings(bookings) {
  const gridEl = document.getElementById('bookingsGrid');
  
  gridEl.innerHTML = bookings.map(booking => `
    <div class="booking-card">
      <div class="booking-header">
        <h3>${booking.customer_name}</h3>
        <span class="booking-date">${new Date(booking.created_at).toLocaleDateString()}</span>
      </div>
      
      <div class="booking-details">
        <div class="detail-row">
          <span class="label">Email:</span>
          <span>${booking.customer_email}</span>
        </div>
        <div class="detail-row">
          <span class="label">Phone:</span>
          <span>${booking.customer_phone}</span>
        </div>
        <div class="detail-row">
          <span class="label">Shoot Date:</span>
          <span>${new Date(booking.booking_date).toLocaleDateString()}</span>
        </div>
        <div class="detail-row">
          <span class="label">Time:</span>
          <span>${booking.booking_time}</span>
        </div>
        <div class="detail-row">
          <span class="label">Location:</span>
          <span>${booking.location}</span>
        </div>
        <div class="detail-row">
          <span class="label">Package:</span>
          <span>${booking.package_name}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total:</span>
          <span class="price">$${booking.total_price}</span>
        </div>
        <div class="detail-row">
          <span class="label">Deposit Paid:</span>
          <span class="price paid">$${booking.deposit_paid}</span>
        </div>
      </div>
      
      ${booking.add_ons && JSON.parse(booking.add_ons).length > 0 ? `
        <div class="booking-addons">
          <strong>Add-ons:</strong>
          <ul>
            ${JSON.parse(booking.add_ons).map(addon => `
              <li>${addon.name} - $${addon.price}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Preview image before upload
function previewImage(e) {
  const file = e.target.files[0];
  const previewEl = document.getElementById('uploadPreview');
  
  if (!file) {
    previewEl.innerHTML = '';
    return;
  }
  
  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    document.getElementById('uploadError').textContent = 'File size must be less than 10MB';
    e.target.value = '';
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
  const fileInput = document.getElementById('imageFile');
  const category = document.getElementById('category').value;
  const customFileName = document.getElementById('fileName').value.trim();
  const uploadBtn = document.getElementById('uploadBtn');
  const errorEl = document.getElementById('uploadError');
  const successEl = document.getElementById('uploadSuccess');
  
  errorEl.textContent = '';
  successEl.textContent = '';
  
  // Validate inputs
  if (!fileInput.files[0]) {
    errorEl.textContent = 'Please select an image';
    return;
  }
  
  if (!category) {
    errorEl.textContent = 'Please select a category';
    return;
  }
  
  const file = fileInput.files[0];
  const fileName = customFileName || file.name;
  
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';
  
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    const response = await fetch(`${API_URL}/admin/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        fileData: base64,
        category,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    
    successEl.textContent = `Image uploaded successfully to ${data.path}`;
    
    // Reset form
    fileInput.value = '';
    document.getElementById('fileName').value = '';
    document.getElementById('uploadPreview').innerHTML = '';
    
    // Show note about copying file to public folder
    successEl.innerHTML += '<br><br><strong>Next step:</strong> Copy the uploaded image from Supabase storage to your /public/' + category + '/ folder to use it on the site.';
    
  } catch (error) {
    errorEl.textContent = error.message;
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload Image';
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
