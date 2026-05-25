import { navHTML, footerHTML, attachScrollNav } from './shared.js'

document.getElementById('app').innerHTML = /* html */ `
  ${navHTML()}

  <header class="page-hero">
    <div class="silk"></div>
    <div class="page-hero__inner">
      <h1 class="page-hero__title page-hero__title--left">Craft trough Design</h1>
    </div>
  </header>

  <section class="about-intro">
    <div class="eyebrow">(01) QUICK INTRO</div>
    <p>
      I pay attention to how software influences behavior over time. Defaults, incentives, and interfaces quietly shape what people do, often more than intention. My work turns those patterns into products and systems built for clarity, use, and return.
    </p>
  </section>

  <div class="about-photo">
    <div style="width: 240px; aspect-ratio: 3/4; background: linear-gradient(160deg, #d4a574 0%, #8b4513 100%); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); font-family: var(--serif); font-size: 14px;">photo</div>
    <span>(01) I'm Sree</span>
  </div>

  <section class="about-music">
    <div class="about-music__head">i love music</div>
    <div class="album-grid">
      <div class="album"></div>
      <div class="album"></div>
      <div class="album"></div>
      <div class="album" style="background: #b71c1c; color: white; font-family: var(--serif); font-size: 11px; padding: 8px; text-align: center; align-items: flex-start;">
        <div>
          <div style="font-weight: 500; font-size: 14px;">GUNFIGHTER<br/>BALLADS</div>
          <div style="margin-top: 4px;">MARTY ROBBINS</div>
        </div>
      </div>
      <div class="album"></div>
      <div class="album"></div>
      <div class="album"></div>
      <div class="about-music__caption" style="display: flex; align-items: flex-end; justify-content: flex-end;">in no particular order.</div>
    </div>
  </section>

  <section class="page-hero" style="min-height: 70vh;">
    <div class="silk"></div>
    <div class="page-hero__inner" style="flex-direction: column; align-items: flex-start;">
      <div class="eyebrow" style="margin-bottom: 16px;">(02) ABOUT</div>
      <p style="font-family: var(--sans); font-size: 14px; color: var(--navy); max-width: 460px; line-height: 1.5;">
        I'm Sreenidhi, a designer whose interest in design began with a fascination for people and software, and the way each continually shapes the other.
        <br/><br/>
        I'm especially interested in how culture, technology, and human behavior shape one another over time. I carry that lens into my work, creating things informed by both craft and curiosity.
      </p>
    </div>
  </section>

  ${footerHTML()}
`

attachScrollNav()
