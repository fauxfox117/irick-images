import { defineConfig } from "vite";
import { resolve } from "path";

const pageRoutes = {
  "/work": "/pages/work.html",
  "/about": "/pages/about.html",
  "/directors": "/pages/directors.html",
  "/contact": "/pages/contact.html",
  "/real-estate": "/pages/real-estate.html",
  "/book": "/pages/book.html",
  "/booking-success": "/pages/booking-success.html",
  "/admin": "/pages/admin-login.html",
  "/admin-dashboard": "/pages/admin-dashboard.html",
};

function mpaRewritePlugin() {
  return {
    name: "mpa-rewrite",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split("?")[0];
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
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        work: resolve(__dirname, "pages/work.html"),
        about: resolve(__dirname, "pages/about.html"),
        directors: resolve(__dirname, "pages/directors.html"),
        contact: resolve(__dirname, "pages/contact.html"),
        realEstate: resolve(__dirname, "pages/real-estate.html"),
        book: resolve(__dirname, "pages/book.html"),
        bookingSuccess: resolve(__dirname, "pages/booking-success.html"),
        adminLogin: resolve(__dirname, "pages/admin-login.html"),
        adminDashboard: resolve(__dirname, "pages/admin-dashboard.html"),
      },
    },
    assetsInclude: [
      "**/*.jpeg",
      "**/*.jpg",
      "**/*.png",
      "**/*.svg",
      "**/*.gif",
    ],
    copyPublicDir: true,
  },
});
