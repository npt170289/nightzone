/* NightZone Tầng 1 — Hub welcome gate.
   Plain JS (no framework). Fetches data/members.json and renders:
   - 3 member cards (discovery)
   - member introduction blocks
   - map list (Google Maps links for the 2 venues)
   Hub links out to member websites; it does not copy their content. */
(function () {
  "use strict";

  var DATA_URL = "data/members.json";

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

    return (
      '<article class="nz-card" data-member="' + esc(m.id) + '">' +
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

  function init() {
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
