/* ==========================================================================
   MAGZ lightbox
   Makes case-study imagery clickable: opens full-screen, arrow through the set,
   Esc/backdrop to close. Collects every content image on the page — anything
   inside a link, nav, header or footer is left alone so navigation still wins.
   Opt an image out with data-no-zoom.
   ========================================================================== */
(function () {
  'use strict';

  var images = Array.prototype.filter.call(document.images, function (img) {
    if (img.hasAttribute('data-no-zoom')) return false;
    if (img.closest('a, nav, header, footer')) return false;
    return true;
  });
  if (!images.length) return;

  /* Caption: the figure's own caption, else the alt text, else the label of a
     wrapping role="img" group (used where one graphic is sliced into pieces). */
  function captionFor(img) {
    var fig = img.closest('figure');
    var cap = fig && fig.querySelector('figcaption');
    if (cap && cap.textContent.trim()) return cap.textContent.trim();
    if (img.alt && img.alt.trim()) return img.alt.trim();
    var group = img.closest('[role="img"][aria-label]');
    if (group) return group.getAttribute('aria-label').trim();
    return '';
  }

  var box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Image viewer');
  box.innerHTML =
    '<div class="lightbox-stage">' +
      '<figure class="lightbox-figure">' +
        '<img class="lightbox-img" alt="">' +
        '<figcaption class="lightbox-caption"></figcaption>' +
      '</figure>' +
    '</div>' +
    '<button class="lightbox-btn lightbox-close" type="button" aria-label="Close image viewer">&times;</button>' +
    '<div class="lightbox-controls">' +
      '<button class="lightbox-btn lightbox-prev" type="button" aria-label="Previous image">&#8592;</button>' +
      '<p class="lightbox-counter" aria-hidden="true"></p>' +
      '<button class="lightbox-btn lightbox-next" type="button" aria-label="Next image">&#8594;</button>' +
    '</div>';
  document.body.appendChild(box);

  var stage    = box.querySelector('.lightbox-stage');
  var full     = box.querySelector('.lightbox-img');
  var caption  = box.querySelector('.lightbox-caption');
  var btnClose = box.querySelector('.lightbox-close');
  var btnPrev  = box.querySelector('.lightbox-prev');
  var btnNext  = box.querySelector('.lightbox-next');
  var counter  = box.querySelector('.lightbox-counter');

  var single = images.length < 2;
  btnPrev.hidden = single;
  btnNext.hidden = single;

  var index = 0;
  var lastFocus = null;
  var isOpen = false;

  function preload(i) {
    var img = images[i];
    if (img) new Image().src = img.currentSrc || img.src;
  }

  function show(i) {
    index = (i + images.length) % images.length;
    var img = images[index];
    full.src = img.currentSrc || img.src;
    full.alt = img.alt || '';
    caption.textContent = captionFor(img);
    counter.textContent = single ? '' : (index + 1) + ' / ' + images.length;
    if (!single) { preload(index + 1 >= images.length ? 0 : index + 1); }
  }

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    isOpen = true;
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    (single ? btnClose : btnNext).focus();
  }

  function close() {
    isOpen = false;
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* Make each image behave like a button, for mouse and keyboard alike. */
  images.forEach(function (img, i) {
    img.classList.add('zoomable');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    if (!img.alt || !img.alt.trim()) img.setAttribute('aria-label', 'Enlarge image');
    img.addEventListener('click', function () { open(i); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        open(i);
      }
    });
  });

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', function () { show(index - 1); });
  btnNext.addEventListener('click', function () { show(index + 1); });

  /* Click the backdrop (but not the picture itself) to dismiss. */
  stage.addEventListener('click', function (e) {
    if (e.target === stage || e.target === stage.firstElementChild) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { close(); return; }
    if (single) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });

  /* Keep Tab inside the dialog while it is open. */
  box.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var stops = [btnClose, btnPrev, btnNext].filter(function (b) { return !b.hidden; });
    var first = stops[0];
    var last = stops[stops.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* Swipe between images on touch devices. */
  var touchX = null;
  stage.addEventListener('touchstart', function (e) {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (touchX === null || single) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(dx < 0 ? index + 1 : index - 1);
    touchX = null;
  }, { passive: true });
})();
