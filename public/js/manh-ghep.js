/* Mảnh ghép — tile-assembly photo reveal (Nguyễn, 2026-11-26).
   Shared effect spec, identical across the 5 ecosystem sites.
   Pure vanilla JS, no dependencies. Applies to the "Khoảnh khắc"
   collage images and the member-card photos (static <img> only —
   <video> elements are never touched).
   - 20 tiles (5 cols x 4 rows) desktop, 12 tiles (4x3) on small screens.
   - Tiles fly in from small random offsets + fade in, staggered ~35ms,
     total ~0.9-1.0s, ease-out cubic.
   - IntersectionObserver, play once when first entering the viewport
     (rootMargin 80px); already in view on load plays on load.
   - Graceful degradation: no JS / no IntersectionObserver / reduced
     motion -> the full image shows normally, nothing is hidden.
   - After the assembly the tiles are removed and the real <img> fades
     back in, so the final state is the untouched original image. */
(function () {
  "use strict";

  var COLS_DESKTOP = 5, ROWS_DESKTOP = 4;
  var COLS_MOBILE = 4, ROWS_MOBILE = 3;
  var STAGGER_MS = 35;      /* ~35-50ms between tiles */
  var TILE_MS = 320;        /* per-tile transition duration */
  var LOAD_TIMEOUT_MS = 3000;
  var SELECTOR = ".nz-col-item img, .nz-card-media img";

  function reducedMotion() {
    return window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isMobile() {
    return window.matchMedia &&
      window.matchMedia("(max-width: 767px)").matches;
  }

  function escUrl(src) {
    return String(src).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  /* Build the tile layer over the photo's box and play the assembly.
     The <img> is hidden only for the duration of the animation. */
  function play(img) {
    var box = img.parentElement; /* .nz-col-item (a) or .nz-card-media (a) */
    if (!box) return;
    var w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;

    var cols = isMobile() ? COLS_MOBILE : COLS_DESKTOP;
    var rows = isMobile() ? ROWS_MOBILE : ROWS_DESKTOP;
    var tileW = w / cols, tileH = h / rows;
    var src = img.getAttribute("src");
    if (!src) return;

    var layer = document.createElement("div");
    layer.className = "mg-tiles";
    layer.setAttribute("aria-hidden", "true");

    var total = cols * rows;
    for (var i = 0; i < total; i++) {
      var col = i % cols, row = Math.floor(i / cols);
      var t = document.createElement("div");
      t.className = "mg-tile";
      t.style.left = (col * tileW) + "px";
      t.style.top = (row * tileH) + "px";
      t.style.width = Math.ceil(tileW + 1) + "px";
      t.style.height = Math.ceil(tileH + 1) + "px";
      t.style.backgroundImage = 'url("' + escUrl(src) + '")';
      t.style.backgroundSize = w + "px " + h + "px";
      t.style.backgroundPosition = (-col * tileW) + "px " + (-row * tileH) + "px";
      /* Small random fly-in offset + slight shrink, staggered. */
      t.style.transform =
        "translate(" + rand(-22, 22).toFixed(1) + "px," +
        rand(-22, 22).toFixed(1) + "px) scale(0.94)";
      t.style.transitionDelay = (i * STAGGER_MS) + "ms";
      layer.appendChild(t);
    }

    img.classList.add("mg-hidden");
    box.insertBefore(layer, img.nextSibling);

    /* Force reflow so the start state applies before we play. */
    void layer.offsetWidth;
    layer.classList.add("mg-play");

    var totalMs = (total - 1) * STAGGER_MS + TILE_MS + 120;
    setTimeout(function () {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
      img.classList.add("mg-fade-in");
      img.classList.remove("mg-hidden");
      setTimeout(function () { img.classList.remove("mg-fade-in"); }, 400);
    }, totalMs);
  }

  /* Wait for the photo to be loaded (lazy images may not be yet), then
     play. Broken images (naturalWidth 0) are skipped entirely. */
  function arm(img) {
    if (img.dataset.mgDone) return;
    img.dataset.mgDone = "1";

    function go() {
      if (img.complete && img.naturalWidth === 0) return; /* broken: skip */
      play(img);
    }
    if (img.complete) { go(); return; }
    var done = false;
    function once() { if (!done) { done = true; go(); } }
    img.addEventListener("load", once, { once: true });
    img.addEventListener("error", function () { done = true; }, { once: true });
    setTimeout(once, LOAD_TIMEOUT_MS);
  }

  function observe(img) {
    io.observe(img);
  }

  var io = null;

  function scan(root) {
    var imgs = (root || document).querySelectorAll(SELECTOR);
    for (var i = 0; i < imgs.length; i++) {
      if (!imgs[i].dataset.mgSeen) {
        imgs[i].dataset.mgSeen = "1";
        observe(imgs[i]);
      }
    }
  }

  function init() {
    /* Degradation: without IntersectionObserver, or with reduced
       motion, show every image normally — do nothing at all. */
    if (!("IntersectionObserver" in window) || reducedMotion()) return;

    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          io.unobserve(en.target);
          arm(en.target);
        }
      });
    }, { rootMargin: "80px", threshold: 0.05 });

    scan(document);

    /* Collage + member cards render via JS (collage on DOMContentLoaded,
       cards after the members.json fetch) — catch late additions. */
    if ("MutationObserver" in window) {
      var mo = new MutationObserver(function () { scan(document); });
      mo.observe(document.body, { childList: true, subtree: true });
      /* Stop watching once everything visible has played; the observer
         is cheap, but there is no need to keep it past 30s. */
      setTimeout(function () { mo.disconnect(); }, 30000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
