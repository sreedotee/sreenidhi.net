/* Shared layout pieces: top nav, silk footer, on-scroll behaviour.
   Used by every page. */

export const TOOLS = ['Lately', 'NetLogo', 'Mobbin', 'Figma', 'Paper', 'Claude', 'Cursor', 'Linear', 'Notion', 'Framer']

export function navHTML () {
  return /* html */ `
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
  `
}

export function footerHTML () {
  return /* html */ `
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
  `
}

export function toolsMarqueeHTML () {
  const cards = TOOLS.map((t) => `<div class="tool-card">${t}</div>`).join('')
  return /* html */ `
    <div class="tools-marquee">
      <div class="tools-track">${cards}${cards}</div>
    </div>
  `
}

export function attachScrollNav () {
  const onScroll = () => {
    if (window.scrollY > 140) document.body.classList.add('is-scrolled')
    else document.body.classList.remove('is-scrolled')
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}
