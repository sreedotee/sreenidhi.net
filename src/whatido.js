import { navHTML, footerHTML, toolsMarqueeHTML, attachScrollNav } from './shared.js'

document.getElementById('app').innerHTML = /* html */ `
  ${navHTML()}

  <header class="page-hero">
    <div class="silk"></div>
    <div class="page-hero__inner">
      <div class="page-hero__left">
        <div>Have a project or idea in mind?</div>
        <a class="lets-talk" href="https://cal.com/jacobschneider/15min?overlayCalendar=true">
          ↳ LET'S TALK
        </a>
      </div>
      <h1 class="page-hero__title">What I do</h1>
    </div>
  </header>

  <section class="service-block">
    <div class="service-block__inner" style="grid-template-columns: 1fr 1fr;">
      <div>
        <div class="service-block__num">(01)</div>
        <p class="service-block__text">
          I design high-performing digital products that are intuitive, scalable, and easy to use. With clear user flows, thoughtful interfaces, and flexible design systems, I create polished experiences that feel seamless across every touchpoint and support long-term growth goals.
        </p>
        <div class="service-block__tags">
          <span class="tag">User Flows</span>
          <span class="tag">Wireframes</span>
          <span class="tag">Design Systems</span>
          <span class="tag">Prototypes</span>
        </div>
      </div>
      <div class="service-block__media" style="background: linear-gradient(160deg, #e8eef7 0%, #d8e3f0 100%);">
        <span style="font-family: var(--serif); font-size: 56px; color: rgba(4,8,61,0.2);">📱</span>
      </div>
    </div>
  </section>

  <section class="service-block">
    <div class="service-block__inner">
      <div class="service-block__media" style="background: #0e0f12;">
        <span style="font-family: var(--serif); font-size: 56px; color: rgba(255,255,255,0.4);">💻</span>
      </div>
      <div>
        <div class="service-block__num">(02)</div>
        <p class="service-block__text" style="margin-left: auto;">
          I design high-performing websites that are fast, responsive, and easy to manage. With clean structure, smooth animations, and flexible components, I create polished experiences that look great on every device and support conversion-focused goals.
        </p>
        <div class="service-block__tags" style="margin-left: auto;">
          <span class="tag">Responsive Design</span>
          <span class="tag">Animations</span>
          <span class="tag">Accessibility</span>
          <span class="tag">Flexible Components</span>
        </div>
      </div>
    </div>
  </section>

  <section class="service-block">
    <div class="service-block__inner">
      <div>
        <div class="service-block__num">(03)</div>
        <p class="service-block__text">
          I create brand identities that give products a clear and memorable presence. From logos and typography to visual systems and assets, every element is designed to feel cohesive across touchpoints.
        </p>
        <div class="service-block__tags">
          <span class="tag">Logo Design</span>
          <span class="tag">Typography</span>
          <span class="tag">Visual Identity</span>
          <span class="tag">Brand Messaging</span>
        </div>
      </div>
      <div class="service-block__media" style="background: var(--paper);">
        <span style="font-family: var(--serif); font-size: 56px; color: rgba(4,8,61,0.25);">⚯</span>
      </div>
    </div>
  </section>

  <section class="section" id="tools">
    <div class="section__inner">
      <div class="section__head">
        <div>
          <div class="eyebrow">(04) TOOLS I USE</div>
          <span class="phonetic">/tuːlz aɪ juːz/</span>
        </div>
      </div>
    </div>
    ${toolsMarqueeHTML()}
  </section>

  ${footerHTML()}
`

attachScrollNav()
