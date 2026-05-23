import { navHTML, footerHTML, attachScrollNav } from './shared.js'

document.getElementById('app').innerHTML = /* html */ `
  ${navHTML()}

  <header class="page-hero">
    <div class="silk"></div>
    <div class="page-hero__inner" style="align-items: flex-end;">
      <h1 class="page-hero__title page-hero__title--left">Play</h1>
      <div></div>
    </div>
  </header>

  <div class="play-grid">
    <a class="play-card play-card--dark" href="#">
      <span style="position:absolute; inset:0; background: radial-gradient(circle at 30% 40%, #ff4757 1px, transparent 1.5px), radial-gradient(circle at 70% 70%, #ff4757 1px, transparent 1.5px), radial-gradient(circle at 50% 20%, #ff4757 1px, transparent 1.5px); background-size: 80px 80px;"></span>
    </a>
    <a class="play-card" href="#">JACK WATSON</a>
    <a class="play-card" href="#">JACK WATSON</a>
    <a class="play-card" href="#">JACK WATSON</a>
  </div>

  <section class="play-section">
    <h3>Project Name</h3>
    <p>this this that that sooo on</p>
  </section>

  <section class="play-section">
    <h3>Project Name</h3>
    <p>this this that that sooo on</p>
  </section>

  <section class="play-section">
    <h3>Project Name</h3>
    <p>this this that that sooo on</p>
  </section>

  ${footerHTML()}
`

attachScrollNav()
