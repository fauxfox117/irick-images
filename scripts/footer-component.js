const footerTemplate = `
<footer>
  <div class="footer-row form">
    <div class="container">
      <div class="footer-name">
        <h3>Irick</h3>
        <h3>Images</h3>
      </div>

      <div class="footer-form-copy">
        <p>A living record of projects, people, and process.</p>
      </div>

      <div class="footer-submit-btn">
        <a href="/contact" class="scramble-hover">[ &nbsp;Start Exchange&nbsp; ]</a>
      </div>
    </div>
  </div>

  <div class="footer-row meta">
    <div class="container">
      <div class="footer-meta-row">
        <div class="meta-info">
          <p>Get in touch</p>
          <p>justin.irick34@gmail.com</p>
        </div>

        <div class="meta-info">
          <a href="https://www.youtube.com/@JustinIrick" target="_blank" class="scramble-hover">YouTube</a>
          <a href="https://www.instagram.com/irickimages/" target="_blank" class="scramble-hover">Instagram</a>
        </div>

        <div class="meta-info">
          <a href="/work" class="scramble-hover">Projects</a>
        </div>
      </div>

      <div class="footer-meta-row">
        <p>Developed by Steven Bolin</p>
        <p>&copy; 2025 Irick Images</p>
      </div>
    </div>
  </div>
</footer>
`;

class SiteFooter extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered === "true") return;
    this.dataset.rendered = "true";
    this.innerHTML = footerTemplate.trim();
  }
}

if (!customElements.get("site-footer")) {
  customElements.define("site-footer", SiteFooter);
}
