/* NightZone Tầng 1 — Hub welcome gate.
   Plain JS (no framework). Fetches data/members.json and renders:
   - 3 member cards (discovery)
   - member introduction blocks
   - map list (Google Maps links for the 2 venues)
   Hub links out to member websites; it does not copy their content. */
(function () {
  "use strict";

  var DATA_URL = "data/members.json";

  var MEMBER_URLS = {
    garden303: "https://gardenstation303-mainnet.vercel.app",
    lumia909: "https://lumia909.vercel.app",
    lovelyanimals: "https://tnkh160389githubio.vercel.app"
  };

  /* Scattered moments collage — media from the 3 members' own libraries.
     Label (HTML overlay chip) always matches the app the media belongs to.
     Order: Garden/Lumia items interleaved (incl. 8 REAL food photos from
     Nguyễn's own uploads, all Garden 303), Lovely Animals grouped
     together at the END. */
  var COLLAGE = [
    { src: "images/garden-dancers.jpg", kind: "img", app: "garden303", label: "303 Garden Station", shape: "tall", alt: "Dancer tại 303 Garden Station" },
    { src: "images/food-garden-decor01.jpg", kind: "img", app: "garden303", label: "303 Garden Station", shape: "tall", alt: "Bàn tiệc sinh nhật — 303 Garden Station" },
    { src: "images/lumia-sign.jpg", kind: "img", app: "lumia909", label: "Lumia 909", shape: "sq", alt: "Biển hiệu Lumia 909" },
    { src: "images/food-garden-decor02.jpg", kind: "img", app: "garden303", label: "303 Garden Station", shape: "wide", alt: "Bò nướng thớt gỗ kèm khoai tây chiên — 303 Garden Station" },
    { src: "images/garden-party.jpg", kind: "img", app: "garden303", label: "303 Garden Station", shape: "tall", alt: "Tiệc nhóm đông tại 303 Garden Station" },
    { src: "images/food-garden-decor03.jpg", kind: "img", app: "garden303", label: "303 Garden Station", shape: "tall", alt: "Bàn tiệc sinh nhật — 303 Garden Station" },
    { src: "videos/notte-1.mp4", kind: "video", app: "lumia909", label: "Lumia 909", shape: "tall", alt: "Clip NOTTE — Lumia 909" },
    { src: "images/food-garden-decor04.jpg", kind: "img", app: "garden303", label: "303 Garden Station", shape: "wide", alt: "Sashimi cá tươi trình bày — 303 Garden Station" },
    { src: "images/lumia-lounge.jpg", kind: "img", app: "lumia909", label: "Lumia 909", shape: "wide", alt: "Không gian Lounge — Lumia 909" },
    { src: "images/food-garden-decor05.jpg", kind: "img", app: "garden303", label: "303 Garden Station", shape: "tall", alt: "Lẩu và hải sản — 303 Garden Station" },
    { src: "videos/garden-dance.mp4", kind: "video", app: "garden303", label: "303 Garden Station", shape: "tall", alt: "Clip dancer — 303 Garden Station" },
    { src: "images/food-garden-decor06.jpg", kind: "img", app: "garden303", label: "303 Garden Station", shape: "wide", alt: "Mẹt thịt nguội và món khai vị — 303 Garden Station" },
    { src: "images/lumia-customers.jpg", kind: "img", app: "lumia909", label: "Lumia 909", shape: "tall", alt: "Khách tại Lumia 909" },
    { src: "images/food-garden-decor07.jpg", kind: "img", app: "garden303", label: "303 Garden Station", shape: "wide", alt: "Xiên nướng và cánh gà — 303 Garden Station" },
    { src: "images/garden-stage.jpg", kind: "img", app: "garden303", label: "303 Garden Station", shape: "wide", alt: "Dancer trên sân khấu — 303 Garden Station" },
    { src: "images/food-garden-decor08.jpg", kind: "img", app: "garden303", label: "303 Garden Station", shape: "wide", alt: "Bò lúc lắc trên đá nóng — 303 Garden Station" },
    { src: "images/lovely-corgi.jpg", kind: "img", app: "lovelyanimals", label: "Lovely Animals", shape: "tall", alt: "Corgi vui vẻ — Lovely Animals" },
    { src: "images/lovely-panda.jpg", kind: "img", app: "lovelyanimals", label: "Lovely Animals", shape: "tall", alt: "Gấu trúc ôm tre — Lovely Animals" },
    { src: "images/lovely-cat.jpg", kind: "img", app: "lovelyanimals", label: "Lovely Animals", shape: "tall", alt: "Mèo cam trong vườn hoa — Lovely Animals" }
  ];

  function collageHtml(item) {
    var media = item.kind === "video"
      ? '<video src="' + esc(item.src) + '" autoplay muted loop playsinline disablepictureinpicture aria-label="' + esc(item.alt) + '"></video>'
      : '<img src="' + esc(item.src) + '" alt="' + esc(item.alt) + '" loading="lazy">';
    return (
      '<a class="nz-col-item col-' + esc(item.shape) + '" href="' + esc(MEMBER_URLS[item.app]) + '" target="_blank" rel="noopener noreferrer" data-app="' + esc(item.app) + '">' +
        media +
        '<span class="nz-col-label">' + esc(item.label) + '</span>' +
      '</a>'
    );
  }

  function renderCollage() {
    var wrap = document.getElementById("nz-collage");
    if (!wrap) return;
    wrap.innerHTML = "";
    COLLAGE.forEach(function (item) {
      wrap.appendChild(el(collageHtml(item)));
    });
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function cardHtml(m) {
    var facts = "";
    if (m.address) facts += '<div>Địa chỉ: <b>' + esc(m.address) + '</b></div>';
    if (m.hours) facts += '<div>Giờ mở cửa: <b>' + esc(m.hours) + '</b></div>';
    if (m.hotline) facts += '<div>Liên hệ: <b>' + esc(m.hotline_name ? m.hotline_name + " " : "") + esc(m.hotline) + '</b></div>';
    if (m.dishes) facts += '<div>Menu: <b>' + esc(m.dishes) + '</b></div>';

    var openBadge = m.hours
      ? '<div class="nz-open"><span class="nz-open-dot"></span>Đang mở ' + esc(m.hours) + '</div>'
      : "";

    var mapsLink = m.maps_url
      ? '<a class="nz-card-maps" href="' + esc(m.maps_url) + '" target="_blank" rel="noopener noreferrer">Chỉ đường ↗</a>'
      : "";

    var media = m.image
      ? '<a class="nz-card-media" href="' + esc(m.url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(m.name) + '">' +
        '<img src="' + esc(m.image) + '" alt="' + esc(m.image_alt || m.name) + '" loading="lazy"></a>'
      : "";

    return (
      '<article class="nz-card" data-member="' + esc(m.id) + '">' +
        media +
        '<div class="nz-card-body">' +
        '<div class="nz-card-cat">' + esc(m.category) + '</div>' +
        '<h3>' + esc(m.name) + '</h3>' +
        '<div class="nz-card-tagline">' + esc(m.tagline) + '</div>' +
        '<p class="nz-card-intro">' + esc(m.intro) + '</p>' +
        openBadge +
        '<div class="nz-card-facts">' + facts + '</div>' +
        '<div class="nz-card-actions">' +
          '<a class="nz-card-visit" href="' + esc(m.url) + '" target="_blank" rel="noopener noreferrer">Truy cập website ↗</a>' +
          mapsLink +
        '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function introHtml(m) {
    return (
      '<div class="nz-intro-block" data-member="' + esc(m.id) + '">' +
        '<h3>' + esc(m.name) + '<span>' + esc(m.short) + '</span></h3>' +
        '<p>' + esc(m.intro) + ' ' + introExtra(m) + '</p>' +
      '</div>'
    );
  }

  function introExtra(m) {
    if (m.id === "garden303") {
      return "Phù hợp nhóm bạn, sinh nhật, tiếp khách — không gian garden beer ngoài trời, lounge và phòng VIP riêng tư.";
    }
    if (m.id === "lumia909") {
      return "Phù hợp team, sinh nhật, chill tối — không gian Neon Jungle, DJ, dancer.";
    }
    return "Dành cho ai cần một khoảng lặng — podcast, vlog, thiên nhiên và động vật dễ thương.";
  }

  function mapHtml(m) {
    return (
      '<div class="nz-map-item" data-member="' + esc(m.id) + '">' +
        '<div><h3>' + esc(m.name) + '</h3><p>' + esc(m.address) + '</p></div>' +
        '<a class="nz-map-link" href="' + esc(m.maps_url) + '" target="_blank" rel="noopener noreferrer">Chỉ đường ↗</a>' +
      '</div>'
    );
  }

  function render(data) {
    var members = data.members || [];

    var cardsWrap = document.getElementById("nz-cards");
    if (cardsWrap) {
      cardsWrap.innerHTML = "";
      members.forEach(function (m) {
        cardsWrap.appendChild(el(cardHtml(m)));
      });
    }

    var introWrap = document.getElementById("nz-intro");
    if (introWrap) {
      introWrap.innerHTML = "";
      members.forEach(function (m) {
        introWrap.appendChild(el(introHtml(m)));
      });
    }

    var mapWrap = document.getElementById("nz-map-list");
    if (mapWrap) {
      var withMaps = members.filter(function (m) { return m.maps_url; });
      mapWrap.innerHTML = "";
      withMaps.forEach(function (m) {
        mapWrap.appendChild(el(mapHtml(m)));
      });
    }
  }

  function renderError() {
    var cardsWrap = document.getElementById("nz-cards");
    if (cardsWrap) {
      cardsWrap.innerHTML =
        '<p style="color:rgba(255,255,255,.65);font-size:14px;">Không tải được danh sách thành viên. Truy cập trực tiếp: ' +
        '<a href="https://gardenstation303-mainnet.vercel.app" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;">Garden 303</a> · ' +
        '<a href="https://lumia909.vercel.app" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;">Lumia 909</a> · ' +
        '<a href="https://tnkh160389githubio.vercel.app" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;">Lovely Animals</a></p>';
    }
  }

  /* Section titles reveal on scroll. Hidden state is applied by JS only
     (class .reveal), so no-JS / no-IntersectionObserver still shows them. */
  function revealTitles() {
    var titles = document.querySelectorAll(".nz-sec-title");
    if (!titles.length) return;
    if (!("IntersectionObserver" in window)) return; // titles stay visible
    titles.forEach(function (t) { t.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    titles.forEach(function (t) { io.observe(t); });
  }

  function init() {
    renderCollage();
    revealTitles();
    fetch(DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(render)
      .catch(renderError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
