import { defineConfig } from "vite";
import { resolve } from "path";

const pageRoutes = {
  "/work": "/pages/work.html",
  "/contact": "/pages/contact.html",
  "/real-estate": "/pages/real-estate.html",
  "/portraits": "/pages/portraits.html",
  "/events": "/pages/events.html",
  "/performance": "/pages/performance.html",
  "/promotional": "/pages/promotional.html",
  "/book": "/pages/book.html",
  "/booking-success": "/pages/booking-success.html",
  "/admin": "/pages/admin-login.html",
  "/admin-login": "/pages/admin-login.html",
  "/admin-dashboard": "/pages/admin-dashboard.html",
};

function mpaRewritePlugin() {
  return {
    name: "mpa-rewrite",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        // normalize trailing slash and strip query string for matching
        const url = (req.url?.split("?")[0] || "").replace(/\/$/, "");
        if (url && pageRoutes[url]) {
          req.url = pageRoutes[url];
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [mpaRewritePlugin()],
  appType: "mpa",
  optimizeDeps: {
    include: ["three", "gsap", "gsap/SplitText"],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        work: resolve(__dirname, "pages/work.html"),
        portraits: resolve(__dirname, "pages/portraits.html"),
        events: resolve(__dirname, "pages/events.html"),
        performance: resolve(__dirname, "pages/performance.html"),
        promotional: resolve(__dirname, "pages/promotional.html"),
        contact: resolve(__dirname, "pages/contact.html"),
        realEstate: resolve(__dirname, "pages/real-estate.html"),
        book: resolve(__dirname, "pages/book.html"),
        bookingSuccess: resolve(__dirname, "pages/booking-success.html"),
        adminLogin: resolve(__dirname, "pages/admin-login.html"),
        adminDashboard: resolve(__dirname, "pages/admin-dashboard.html"),
      },
    },
    assetsInclude: [
      "**/*.webp",
      "**/*.jpeg",
      "**/*.jpg",
      "**/*.png",
      "**/*.svg",
      "**/*.gif",
    ],
    copyPublicDir: true,
  },
});
