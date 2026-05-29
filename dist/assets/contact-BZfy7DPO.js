import"./styles-DPnw2qBL.js";function e(){return`
    <nav class="nav">
      <ul class="nav__links">
        <li><a href="/">Home</a></li>
        <li><a href="/what-i-do/">What I Do</a></li>
        <li><a href="/play/">Play</a></li>
        <li><a href="/about/">About</a></li>
        <li><a href="/contact/">Contact</a></li>
      </ul>
      <a class="nav__menu" href="#"><span class="plus">[+]</span>Menu</a>
    </nav>
  `}function i(){return`
    <footer class="footer" id="footer">
      <div class="silk"></div>
      <div class="footer__inner">
        <div class="footer__top">
          <p class="footer__tagline">Design for the internet,<br/>built with intention.</p>
          <div class="footer__nav">
            <a href="/about/">About</a>
            <a href="mailto:sreenidhi.dev@gmail.com">Email</a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://substack.com/" target="_blank" rel="noreferrer">Substack</a>
          </div>
        </div>
        <div>
          <div class="footer__email">sreenidhi.dev@gmail.com</div>
          <div class="footer__bottom">
            <span>© 2026 Sreenidhi</span>
            <span>↳</span>
          </div>
        </div>
      </div>
    </footer>
  `}function t(){const a=()=>{window.scrollY>140?document.body.classList.add("is-scrolled"):document.body.classList.remove("is-scrolled")};window.addEventListener("scroll",a,{passive:!0}),a()}document.getElementById("app").innerHTML=`
  ${e()}

  <header class="contact-hero">
    <div class="silk"></div>
    <div class="contact-hero__inner">
      <div>
        <h1 class="contact-hero__title">Let's create what's next.</h1>
        <div class="contact-card">
          <div class="contact-card__label">Emails</div>
          <div>sreenidhi.dev@gmail.com</div>
        </div>
      </div>

      <div class="contact-hero__email">sreenidhi.dev@gmail.com</div>
    </div>
  </header>

  ${i()}
`;t();
