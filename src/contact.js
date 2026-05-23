import { navHTML, footerHTML, attachScrollNav } from './shared.js'

document.getElementById('app').innerHTML = /* html */ `
  ${navHTML()}

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

  ${footerHTML()}
`

attachScrollNav()
