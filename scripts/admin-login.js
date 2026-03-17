// API Configuration
const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    window.location.href = "/admin-dashboard";
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
