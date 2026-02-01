// API Configuration
const API_URL = "https://pplpwchruftvuwburumb.supabase.co/functions/v1";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwbHB3Y2hydWZ0dnV3YnVydW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjAxOTksImV4cCI6MjA4MzAzNjE5OX0.0VdXrFhcgx_zqnt6Reipfgt3jtqfx6zstsz1DZTnFRA";

// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const loginBtn = document.getElementById("loginBtn");
  const errorEl = document.getElementById("loginError");

  // Clear previous errors
  errorEl.textContent = "";
  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";

  try {
    const response = await fetch(`${API_URL}/admin-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    // Store session data
    localStorage.setItem(
      "admin_session",
      JSON.stringify({
        user: data.user,
        session: data.session,
        timestamp: Date.now(),
      }),
    );

    // Redirect to dashboard
    window.location.href = "/admin-dashboard.html";
  } catch (error) {
    errorEl.textContent = error.message;
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
});

// Auto-fill for development (remove in production)
if (window.location.hostname === "localhost") {
  console.log(
    "Development mode: Check your Supabase dashboard for admin user credentials",
  );
}
