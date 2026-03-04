const navbarTemplate = `
<nav>
  <div class="container">
    <div class="logo">
      <div class="logo-container">
        <a href="/"><span></span>Irick Images</a>
      </div>
    </div>

    <div class="menu-toggle-btn">
      <div class="menu-toggle-btn-wrapper">
        <p>Menu</p>
      </div>
    </div>
  </div>
</nav>

<div class="nav-overlay">
  <div class="nav-items">
    <div class="nav-item">
      <a href="/work">Work</a>
    </div>
    <div class="nav-item">
      <a href="/real-estate">Real Estate</a>
    </div>
    <div class="nav-item">
      <a href="/directors">Portraits</a>
    </div>
    <div class="nav-item">
      <a href="/directors">Performance</a>
    </div>
    <div class="nav-item">
      <a href="/directors">Events, misc.</a>
    </div>
    <div class="nav-item">
      <a href="/directors">Promotional</a>
    </div>
    <div class="nav-item">
      <a href="/contact">Contact</a>
    </div>
    <div class="nav-item">
      <a href="/book">Book Now</a>
    </div>
  </div>

  <div class="nav-footer">
    <div class="container">
      <div class="nav-footer-item">
        <a href="https://www.instagram.com/irickimages/" target="_blank">Instagram</a>
        <a href="https://www.youtube.com/@irickimages" target="_blank">YouTube</a>
      </div>

      <div class="nav-footer-item">
        <a href="/contact">[ &nbsp;Drop a line &nbsp; ]</a>
      </div>
    </div>
  </div>
</div>
`;

class SiteNavbar extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered === "true") return;
    this.dataset.rendered = "true";
    this.innerHTML = navbarTemplate.trim();
  }
}

if (!customElements.get("site-navbar")) {
  customElements.define("site-navbar", SiteNavbar);
}
