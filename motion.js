/* CG Performance Training: motion layer.
   Reveals content as it scrolls into view, gives the homepage hero an entrance,
   and counts the stats up. Does nothing if the visitor prefers reduced motion. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  try {
    var HERO = '#welcome, .hero, .page-hero';
    var legal = !!document.querySelector('.page-hero .updated'); // terms, privacy, cookies, consent: header only

    var plain = legal ? '.page-hero .tag, .page-hero h1, .page-hero .updated' : [
      // homepage
      '.hero-eyebrow', '.hero-sub', '.hero-ctas', '.section-tag', '.section-title', '.divider',
      '.about-text p', '.stat', '.about-text > .btn-primary', '.results-cta',
      '.partner-copy p', '.partner-code', '.partner-copy > .btn-primary',
      '.inquiry-info > p', '.inquiry-features li', '#booking .container > p',
      // about + results
      '.page-tag', '.page-title', '.page-sub', '.about-text-block p', '.slider-intro', '.slider-hint',
      '.social-icons', '.applied-link', '.cta-section p', '.cta-section .btn-primary', '.cta-section .btn-secondary',
      // packages + plan pages
      '.hero .tag', '.hero h1', '.hero .price-display', '.hero .price-note', '.hero .tagline', '.hero .btn-buy',
      '.section-label', '.content h2', '.content p', '.features li', '.products-subhead', '.products-help'
    ].join(', ');

    var tiles = legal ? null : [
      '.about-photo-wrap', '.result-card', '.partner-logo-panel', '#inquiryForm', '.calendly-wrap', '.map-wrap', '.location-item',
      '.benefit-card', '.comparison-slider', '.t-card', '.cta-box', '.compare-card', '.plan-card', '.plan-cta-card', '.product-card',
      '.card'
    ].join(', ');

    // Homepage hero: one line per span so the lines can arrive one after another
    var title = document.querySelector('.hero-title');
    if (title && !title.querySelector('.ln')) {
      var lines = [document.createElement('span')];
      Array.prototype.slice.call(title.childNodes).forEach(function (n) {
        if (n.nodeName === 'BR') lines.push(document.createElement('span'));
        else lines[lines.length - 1].appendChild(n);
      });
      title.textContent = '';
      lines.forEach(function (l) { l.className = 'ln'; title.appendChild(l); });
    }
    // Homepage coach photo: a clipping box so the photo can zoom inside its frame
    var photo = document.querySelector('.about-photo-wrap > img.about-photo');
    if (photo) {
      var clip = document.createElement('div');
      clip.className = 'about-photo-clip';
      photo.parentNode.insertBefore(clip, photo);
      clip.appendChild(photo);
    }

    // Mark what reveals
    var all = Array.prototype.slice.call(document.querySelectorAll(tiles ? plain + ', ' + tiles : plain));
    var targets = all.filter(function (el) {
      if (!el.getClientRects().length) return false;                       // hidden elements stay untouched
      var p = tiles && el.parentElement && el.parentElement.closest(tiles);
      return !p;                                                            // nothing nested inside a tile
    });
    targets.forEach(function (el) {
      el.classList.add('rv');
      if (tiles && el.matches(tiles)) el.classList.add('tile');
    });
    root.classList.add('motion');

    var io = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var delay = (el.closest(HERO) && window.scrollY < 50 ? 350 : 0) + Math.min(i++, 7) * 80;
        el.style.setProperty('--d', delay + 'ms');
        el.classList.add('in');
        io.unobserve(el);
        var n = el.classList.contains('stat') ? el.querySelector('.stat-num') : null;
        if (n) countUp(n, delay);
        // afterwards, hand the element back to its normal hover styles
        setTimeout(function () { el.classList.remove('rv', 'tile', 'in'); el.style.removeProperty('--d'); }, delay + 1600);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('loaded'); }); });

    function countUp(el, delay) {
      var m = el.textContent.trim().match(/^(\d+)(%?)$/);
      if (!m) return;
      var end = +m[1], suffix = m[2], t0 = null;
      function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / 1400, 1), eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      el.textContent = '0' + suffix;
      setTimeout(function () { requestAnimationFrame(step); }, delay);
    }

    // Scroll-linked: the page header eases away, the coach photo settles from a slight zoom
    var inner = document.querySelector('.hero-content, .page-hero-content');
    var hero = inner && inner.closest(HERO);
    var ticking = false;
    function frame() {
      ticking = false;
      var y = window.scrollY || 0, vh = window.innerHeight || 800;
      if (inner && hero) {
        var h = hero.offsetHeight;
        var p = Math.max(0, Math.min((y - h * 0.6) / (h * 0.4), 1)); // stay fully visible for the first 60% of the header, then ease away
        inner.style.transform = 'translate3d(0,' + (p * 70) + 'px,0) scale(' + (1 - p * 0.06) + ')';
        inner.style.opacity = String(1 - p * 0.7);
      }
      if (photo) {
        var r = photo.getBoundingClientRect();
        var q = Math.max(0, Math.min((vh - r.top) / (vh + r.height), 1));
        photo.style.transform = 'scale(' + (1.16 - q * 0.16) + ')';
      }
    }
    if (inner || photo) {
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
      window.addEventListener('resize', frame);
      frame();
    }
  } catch (err) {
    root.classList.remove('motion'); // if anything goes wrong, show the page as normal
  }
})();
