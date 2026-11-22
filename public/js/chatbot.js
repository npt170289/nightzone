/* NightZone — Chatbot Tầng 1 (Phase B).
   Internal keyword bot ONLY (no LLM, no BitNet, no Pi AI in this tier).
   Pattern: Lumia 909 (plain JS) — detectLang() + T() keyword matching,
   400ms reply delay, modal with 2 tabs, quick chips.
   Scope: Garden 303 + Lumia 909 ONLY (Lovely Animals is a Hub member but
   NOT in the chatbot's knowledge scope). Data comes from
   data/members.json — venue facts (address, hours, hotline, dish counts,
   URLs) are NEVER hardcoded here; only the hub-level wording is.
   No log API, no Supabase, no backend dependency in Phase B.
   The bot NEVER calls payment/wallet APIs and NEVER books a table.
   Tier 2 (Pi AI) is DEFERRED: the AI tab shows an UNAVAILABLE notice;
   NO pinet.com iframe is embedded anywhere in this file. */
(function () {
  "use strict";

  var DATA_URL = "data/members.json";
  var VENUE_IDS = ["garden303", "lumia909"]; // chatbot scope: 2 real venues only
  var FALLBACK_URLS = {
    garden303: "https://gardenstation303-mainnet.vercel.app",
    lumia909: "https://lumia909.vercel.app"
  };

  var members = null;      // fetched members.json (all members, as in the hub)
  var venues = null;       // the 2 in-scope venues, in members.json order
  var dataPromise = null;

  /* ---------- helpers (same shape as the hub's main.js) ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }
  function safeHttps(url) {
    return typeof url === "string" && /^https:\/\//.test(url) ? url : null;
  }

  /* ---------- data ---------- */
  function loadData() {
    if (dataPromise) return dataPromise;
    dataPromise = fetch(DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        members = data || {};
        var list = (members.members || []).filter(function (m) {
          return VENUE_IDS.indexOf(m.id) !== -1;
        });
        // Keep members.json order (Garden first, Lumia second).
        venues = list;
        return venues;
      })
      .catch(function () {
        members = null;
        venues = null;
        return null;
      });
    return dataPromise;
  }
  function ensureData() {
    return dataPromise ? dataPromise : loadData();
  }
  function venueById(id) {
    if (!venues) return null;
    for (var i = 0; i < venues.length; i++) {
      if (venues[i].id === id) return venues[i];
    }
    return null;
  }
  /* Area label derived from the venue's own address (no hardcoded facts). */
  function areaOf(m) {
    var a = (m && m.address) || "";
    if (/gò vấp/i.test(a)) return "Gò Vấp";
    if (/chợ quán/i.test(a)) return "Chợ Quán / Quận 5";
    return "";
  }
  function venueLine(m) {
    // "303 Garden Station — 303 Phạm Văn Đồng, P. Hạnh Thông, Gò Vấp, TP.HCM"
    return m.name + " — " + m.address;
  }
  function venueActions(m) {
    var out = [];
    if (safeHttps(m.url)) out.push({ label: "Website " + m.name + " ↗", href: m.url });
    if (safeHttps(m.maps_url)) out.push({ label: "Chỉ đường ↗", href: m.maps_url });
    return out;
  }
  function bothActions() {
    var out = [];
    (venues || []).forEach(function (m) {
      if (safeHttps(m.url)) out.push({ label: "Website " + m.name + " ↗", href: m.url });
    });
    return out;
  }

  /* ---------- language detection (Lumia pattern) ---------- */
  function detectLang(q) {
    var s = q || "";
    if (/[\u4e00-\u9fff]/.test(s)) return "cn";
    var lower = s.toLowerCase();
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(lower)) return "vi";
    if (/\b(dat ban|dia chi|thuc don|mo cua|thanh toan|o dau|tim quan|so sanh)\b/.test(lower)) return "vi";
    if (/\b(menu|booking|book|address|open|hours|price|vip|hello|hi|hey|table|reservation|how|what|where|when|pay|payment|compare|find|beer|garden|lounge|nightzone)\b/.test(lower)) return "en";
    return "vi";
  }

  /* ---------- Tier 1 answers ----------
     T(q) returns { text, actions }.
     text: plain string (rendered with textContent — user input is never
     injected as HTML). actions: optional [{label, href}] rendered as
     clickable link buttons under the message (href must be https). */
  function T(q) {
    var lang = detectLang(q);
    var s = (q || "").toLowerCase();
    var has = function () {
      for (var i = 0; i < arguments.length; i++) {
        if (s.indexOf(arguments[i]) !== -1) return true;
      }
      return false;
    };
    var garden = venueById("garden303");
    var lumia = venueById("lumia909");

    /* ---- Intent 1: greeting / what is NightZone ---- */
    if (has("nightzone", "là gì", "la gi", "giới thiệu", "gioi thieu", "hệ sinh thái", "he sinh thai", "cổng chào", "cong chao", "hub", "xin chào", "xin chao", "chào", "chao", "hello", "你好", "您好", "生态系统", "夜生活", "这是什么", "介绍")) {
      if (lang === "cn") return { text: "您好！NightZone 是夜生活娱乐生态系统的入口：303 Garden Station（Gò Vấp）和 Lumia 909（Chợ Quán）。我可以介绍这两个场所、比较它们，并带您进入它们的网站。我不在这里接受订位——订位请通过场所网站或致电。您想了解哪个场所？", actions: bothActions() };
      if (lang === "en") return { text: "Hi! NightZone is the gateway to a nightlife entertainment ecosystem: 303 Garden Station (Gò Vấp) and Lumia 909 (Chợ Quán). I can introduce both venues, compare them, and take you to their websites. I don't take bookings here — please book through the venue website or by phone. Which venue would you like to know about?", actions: bothActions() };
      return { text: "Dạ chào bạn! NightZone là cổng chào hệ sinh thái giải trí về đêm: 303 Garden Station (Gò Vấp) và Lumia 909 (Chợ Quán). Mình giới thiệu 2 quán, so sánh giúp bạn và đưa bạn sang website của quán. Mình không nhận đặt bàn ở đây — đặt bàn qua web quán hoặc gọi hotline nhé. Bạn muốn tìm hiểu quán nào ạ?", actions: bothActions() };
    }

    /* ---- Intent 3: compare Garden vs Lumia (checked before discover,
       so "quán nào hơn" is not mistaken for a search) ---- */
    if (has("so sánh", "so sanh", "nào hơn", "nao hon", "nào ngon", "nao ngon", "khác nhau", "khac nhau", "khác gì", "khac gi", "vs", "compare", "comparison", "better", "difference", "versus", "哪个好", "比较", "区别", "有什么不同")) {
      if (!garden || !lumia) return dataNotReady(lang);
      var rows = [
        ["Địa chỉ / Address / 地址", garden.address, lumia.address],
        ["Khu vực / Area / 区域", areaOf(garden), areaOf(lumia)],
        ["Giờ mở cửa / Hours / 营业时间", garden.hours, lumia.hours],
        ["Menu", garden.dishes, lumia.dishes],
        ["Hotline", (garden.hotline_name ? garden.hotline_name + " " : "") + garden.hotline, (lumia.hotline_name ? lumia.hotline_name + " " : "") + lumia.hotline],
        ["Phong cách / Vibe / 风格", garden.category, lumia.category]
      ];
      var lines = rows.map(function (r) { return "• " + r[0] + ": " + r[1] + " | " + r[2]; }).join("\n");
      if (lang === "cn") return { text: "303 Garden Station 与 Lumia 909 的比较（资料来源：NightZone）：\n" + lines + "\n两家都是啤酒花园、Lounge、DJ、舞者，营业时间相同。选哪家取决于您所在的区域和喜欢的氛围——我不替您决定。请告诉我您在哪个区域，我可以告诉您两家分别在哪里。", actions: bothActions() };
      if (lang === "en") return { text: "303 Garden Station vs Lumia 909 (from NightZone data):\n" + lines + "\nBoth are beer gardens / lounges with DJs and dancers, and both open the same hours. Which one fits you depends on your area and the vibe you like — I won't decide for you. Tell me your area and I can tell you where each one is.", actions: bothActions() };
      return { text: "So sánh 303 Garden Station và Lumia 909 (theo dữ liệu NightZone):\n" + lines + "\nCả 2 đều là Beer Garden / Lounge, có DJ, dancer, giờ mở cửa giống nhau. Quán nào hợp bạn thì tùy khu vực và vibe bạn thích — mình không kết luận thay bạn. Bạn cho mình biết bạn đang ở khu vực nào, mình nói cho bạn mỗi quán nằm ở đâu nhé.", actions: bothActions() };
    }

    /* ---- Intent 6: booking (hub does NOT book) ---- */
    if (has("đặt bàn", "dat ban", "đặt", "dat", "booking", "book", "reservation", "reserve", "table", "预订", "预定", "订桌", "订位", "订座")) {
      if (!garden || !lumia) return dataNotReady(lang);
      if (lang === "cn") return { text: "NightZone 不接受订位。请通过场所网站订位，或致电：303 Garden Station — " + (garden.hotline_name ? garden.hotline_name + " " : "") + garden.hotline + "；Lumia 909 — " + (lumia.hotline_name ? lumia.hotline_name + " " : "") + lumia.hotline + "。两家营业时间均为 " + garden.hours + "。", actions: bothActions() };
      if (lang === "en") return { text: "NightZone doesn't take bookings. Please book through the venue website or by phone: 303 Garden Station — " + (garden.hotline_name ? garden.hotline_name + " " : "") + garden.hotline + "; Lumia 909 — " + (lumia.hotline_name ? lumia.hotline_name + " " : "") + lumia.hotline + ". Both open " + garden.hours + ".", actions: bothActions() };
      return { text: "Dạ NightZone không nhận đặt bàn ạ. Bạn đặt bàn qua website của quán hoặc gọi hotline: 303 Garden Station — " + (garden.hotline_name ? garden.hotline_name + " " : "") + garden.hotline + "; Lumia 909 — " + (lumia.hotline_name ? lumia.hotline_name + " " : "") + lumia.hotline + ". Cả 2 quán đều mở " + garden.hours + " ạ.", actions: bothActions() };
    }

    /* ---- Intent 2: discover a venue (Member Discovery only) ----
       Asks the area + need, states the limits honestly, then states ONLY
       verified area facts. NEVER asserts distance or closeness. */
    if (has("tìm", "tim", "beer garden", "beer", "đi đâu", "di dau", "đi tối", "di toi", "tối nay", "toi nay", "tối", "toi", "khu vực", "khu vuc", "quận", "gò vấp", "go vap", "chợ quán", "cho quan", "quận 1", "quan 1", "quận 5", "quan 5", "gần", "gan", "chơi", "choi", "đi chơi", "di choi", "gợi ý", "goi y", "find", "looking for", "where to go", "recommend", "suggest", "附近", "找", "哪里", "推荐", "啤酒", "去哪", "今晚")) {
      if (!garden || !lumia) return dataNotReady(lang);
      var areaFacts = (lang === "cn")
        ? "目前我只了解 NightZone 的 2 个成员场所，没有外部场所搜索数据，也不知道您的当前位置。关于区域，我只知道 4 个事实：\n• 303 Garden Station 位于 Gò Vấp 区域。\n• Lumia 909 位于 Chợ Quán / Quận 5 区域。\n• 目前所知的 2 个成员场所都不在 Quận 1。\n• NightZone 没有数据来确定哪家离您最近。"
        : (lang === "en")
        ? "I only know NightZone's 2 member venues — I have no outside place-search data and I don't know your current location. About areas, I only know 4 facts:\n• 303 Garden Station is in the Gò Vấp area.\n• Lumia 909 is in the Chợ Quán / District 5 area.\n• Neither of the 2 member venues I know is in District 1.\n• NightZone has no data to determine which venue is closest to you."
        : "Mình chỉ biết 2 quán thành viên của NightZone, không có dữ liệu tìm kiếm địa điểm bên ngoài và không biết vị trí hiện tại của bạn. Về khu vực, mình chỉ biết đúng 4 điều:\n• 303 Garden Station nằm tại khu vực Gò Vấp.\n• Lumia 909 nằm tại khu vực Chợ Quán / Quận 5.\n• 2 quán thành viên mình biết không nằm tại Quận 1.\n• NightZone chưa có dữ liệu để xác định quán nào gần khách nhất.";
      var askArea = (lang === "cn")
        ? "请告诉我您在哪个区域、几位、什么场合，我可以告诉您两家分别在哪里、有什么特色，再由您自己选择。"
        : (lang === "en")
        ? "Tell me your area, how many people, and the occasion, and I can tell you where each venue is and what it's like — then you can choose."
        : "Bạn cho mình biết bạn đang ở khu vực nào, đi mấy người, dịp gì — mình nói cho bạn mỗi quán nằm ở đâu, có gì, rồi bạn tự chọn nhé.";
      return { text: areaFacts + "\n" + askArea, actions: bothActions() };
    }

    /* ---- Intent 5: menu / price / promotion / specific dish ----
       NO details. Overview dish count is OK; anything specific routes
       to the member website or hotline. NO price claim of any kind —
       members.json contains no price information. */
    if (has("menu", "món", "mon", "giá", "gia", "khuyến mãi", "khuyen mai", "ưu đãi", "uu dai", "giảm", "giam", "ăn", "uống", "uong", "thực đơn", "thuc don", "món ăn", "mon an", "giá cả", "gia ca", "price", "promo", "promotion", "discount", "offer", "dish", "food", "drink", "菜", "菜单", "价格", "优惠", "点菜", "吃什么")) {
      if (!garden || !lumia) return dataNotReady(lang);
      var counts = (lang === "cn")
        ? "菜单概况：303 Garden Station 有" + garden.dishes + "；Lumia 909 有" + lumia.dishes + "。"
        : (lang === "en")
        ? "Menu overview: 303 Garden Station has " + garden.dishes + "; Lumia 909 has " + lumia.dishes + "."
        : "Menu tổng quan: 303 Garden Station có " + garden.dishes + "; Lumia 909 có " + lumia.dishes + ".";
      var route = (lang === "cn")
        ? "具体菜品、价格和优惠请直接查看场所网站或致电：303 Garden Station — " + (garden.hotline_name ? garden.hotline_name + " " : "") + garden.hotline + "；Lumia 909 — " + (lumia.hotline_name ? lumia.hotline_name + " " : "") + lumia.hotline + "。我这里没有价格信息，所以不便回答价格问题。"
        : (lang === "en")
        ? "For specific dishes, prices, and promotions, please check the venue website or call: 303 Garden Station — " + (garden.hotline_name ? garden.hotline_name + " " : "") + garden.hotline + "; Lumia 909 — " + (lumia.hotline_name ? lumia.hotline_name + " " : "") + lumia.hotline + ". I don't have price information here, so I can't answer price questions."
        : "Món cụ thể, giá và khuyến mãi bạn xem trên website của quán hoặc gọi hotline: 303 Garden Station — " + (garden.hotline_name ? garden.hotline_name + " " : "") + garden.hotline + "; Lumia 909 — " + (lumia.hotline_name ? lumia.hotline_name + " " : "") + lumia.hotline + ". Mình không có thông tin giá ở đây nên không trả lời được câu hỏi về giá ạ.";
      return { text: counts + "\n" + route, actions: bothActions() };
    }

    /* ---- Intent 4: info about a specific venue ---- */
    if (has("địa chỉ", "dia chi", "ở đâu", "o dau", "giờ", "gio", "mở cửa", "mo cua", "hotline", "liên hệ", "lien he", "điện thoại", "dien thoai", "số điện thoại", "so dien thoai", "address", "hours", "open", "contact", "phone", "tel", "garden", "303", "lumia", "909", "地址", "在哪", "营业", "时间", "电话", "联系")) {
      if (!garden || !lumia) return dataNotReady(lang);
      var target = null;
      if (has("garden", "303")) target = garden;
      else if (has("lumia", "909")) target = lumia;
      if (target) {
        return { text: venueInfoText(target, lang), actions: venueActions(target) };
      }
      // No venue named: give both venues' key info.
      if (lang === "cn") return { text: venueInfoText(garden, lang) + "\n\n" + venueInfoText(lumia, lang), actions: bothActions() };
      if (lang === "en") return { text: venueInfoText(garden, lang) + "\n\n" + venueInfoText(lumia, lang), actions: bothActions() };
      return { text: venueInfoText(garden, lang) + "\n\n" + venueInfoText(lumia, lang), actions: bothActions() };
    }

    /* ---- Intent 7: honest fallback ---- */
    if (lang === "cn") return { text: "抱歉，我没有这方面的信息。NightZone 只了解 303 Garden Station 和 Lumia 909 的概况（地址、营业时间、电话、菜单数量）。您可以问我：\n• NightZone 是什么？\n• 比较两个场所\n• 找啤酒花园\n• 地址和营业时间\n或直接查看场所网站、致电咨询。", actions: bothActions() };
    if (lang === "en") return { text: "Sorry, I don't have information on that. NightZone only knows the overviews of 303 Garden Station and Lumia 909 (address, hours, hotline, menu size). You can ask me:\n• What is NightZone?\n• Compare the two venues\n• Find a beer garden\n• Address and hours\nOr check the venue websites or call them directly.", actions: bothActions() };
    return { text: "Dạ mình chưa có thông tin này ạ. NightZone chỉ biết tổng quan về 303 Garden Station và Lumia 909 (địa chỉ, giờ mở cửa, hotline, số món). Bạn có thể hỏi mình:\n• NightZone là gì?\n• So sánh 2 quán\n• Tìm Beer Garden\n• Địa chỉ & giờ mở cửa\nHoặc xem website của quán / gọi hotline để hỏi trực tiếp nhé.", actions: bothActions() };
  }

  function venueInfoText(m, lang) {
    var hot = (m.hotline_name ? m.hotline_name + " " : "") + (m.hotline || "");
    if (lang === "cn") {
      return m.name + "\n• 地址：" + m.address + "\n• 营业时间：" + m.hours + "\n• 电话：" + hot + (m.dishes ? "\n• 菜单：" + m.dishes : "") + "\n• 简介：" + m.intro;
    }
    if (lang === "en") {
      return m.name + "\n• Address: " + m.address + "\n• Hours: " + m.hours + "\n• Hotline: " + hot + (m.dishes ? "\n• Menu: " + m.dishes : "") + "\n• About: " + m.intro;
    }
    return m.name + "\n• Địa chỉ: " + m.address + "\n• Giờ mở cửa: " + m.hours + "\n• Hotline: " + hot + (m.dishes ? "\n• Menu: " + m.dishes : "") + "\n• Giới thiệu: " + m.intro;
  }

  function dataNotReady(lang) {
    var acts = [
      { label: "Website 303 Garden Station ↗", href: FALLBACK_URLS.garden303 },
      { label: "Website Lumia 909 ↗", href: FALLBACK_URLS.lumia909 }
    ];
    if (lang === "cn") return { text: "抱歉，我暂时无法加载场所信息。请直接访问场所网站查看地址、营业时间和电话。", actions: acts };
    if (lang === "en") return { text: "Sorry, I can't load the venue information right now. Please check the venue websites directly for address, hours, and hotline.", actions: acts };
    return { text: "Dạ mình chưa tải được thông tin quán lúc này ạ. Bạn xem trực tiếp trên website của quán để biết địa chỉ, giờ mở cửa và hotline nhé.", actions: acts };
  }

  /* ---------- modal UI (Lumia pattern, NightZone styling) ---------- */
  var modal = null;
  var chatBody = null;
  var chatInput = null;
  var chipsRow = null;
  var inputRow = null;
  var aiPanel = null;

  function greetingText() {
    return "Dạ chào bạn! Mình là lễ tân 2 quán: 303 Garden Station (Gò Vấp) và Lumia 909 (Chợ Quán).\nMình đưa bạn sang website của quán nhé.\nHi! I'm the receptionist for 2 venues: 303 Garden Station (Gò Vấp) and Lumia 909 (Chợ Quán).\nLet me take you to their websites.\n您好！我是两家店的前台：303 Garden Station（Gò Vấp）和 Lumia 909（Chợ Quán）。\n我来带您进入它们的网站。";
  }

  function addMsg(text, who) {
    var m = document.createElement("div");
    m.className = "nz-msg " + who;
    m.textContent = text;
    chatBody.appendChild(m);
    chatBody.scrollTop = chatBody.scrollHeight;
    return m;
  }
  function addActions(actions) {
    if (!actions || !actions.length) return;
    var row = document.createElement("div");
    row.className = "nz-msg-actions";
    actions.forEach(function (a) {
      if (!safeHttps(a.href)) return;
      var link = document.createElement("a");
      link.className = "nz-msg-link";
      link.href = a.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = a.label;
      row.appendChild(link);
    });
    if (row.childNodes.length) {
      chatBody.appendChild(row);
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }
  function ask(q) {
    var userQ = (q || "").trim();
    if (!userQ) return;
    addMsg(userQ, "user");
    ensureData().then(function () {
      var ans = T(userQ);
      setTimeout(function () {
        addMsg(ans.text, "bot");
        addActions(ans.actions);
      }, 400);
    });
  }

  function switchTab(which) {
    var tabIn = document.getElementById("nz-tab-internal");
    var tabAi = document.getElementById("nz-tab-ai");
    if (!tabIn || !tabAi) return;
    if (which === "ai") {
      tabAi.classList.add("active");
      tabIn.classList.remove("active");
      chatBody.style.display = "none";
      chipsRow.style.display = "none";
      inputRow.style.display = "none";
      aiPanel.style.display = "";
    } else {
      tabIn.classList.add("active");
      tabAi.classList.remove("active");
      aiPanel.style.display = "none";
      chatBody.style.display = "";
      chipsRow.style.display = "";
      inputRow.style.display = "";
      if (chatInput) chatInput.focus();
    }
  }

  function openChat() {
    if (document.getElementById("nz-chat-modal")) return;
    loadData();
    modal = el(
      '<div class="nz-chat-backdrop" id="nz-chat-modal">' +
        '<div class="nz-chat-modal" role="dialog" aria-label="NightZone — Lễ tân hub">' +
          '<div class="nz-chat-head">' +
            '<span class="nz-chat-avatar">💬</span>' +
            '<span class="nz-chat-title">NightZone — Lễ tân hub</span>' +
            '<button type="button" class="nz-chat-close" id="nz-chat-close" aria-label="Đóng">✕</button>' +
          '</div>' +
          '<div class="nz-chat-tabs">' +
            '<button type="button" class="nz-chat-tab active" id="nz-tab-internal">Nội bộ</button>' +
            '<button type="button" class="nz-chat-tab" id="nz-tab-ai">AI</button>' +
          '</div>' +
          '<div class="nz-chat-body" id="nz-chat-body"></div>' +
          '<div class="nz-chat-ai" id="nz-chat-ai" style="display:none;">' +
            '<p><b>Trợ lý AI chưa khả dụng.</b></p>' +
            '<p>Trợ lý AI NightZone đang được chuẩn bị và sẽ cần mở bằng Pi Browser với tài khoản Pi. Hiện tại bạn dùng tab <b>Nội bộ</b> để được hỗ trợ nhé.</p>' +
            '<p class="nz-chat-ai-en">The NightZone AI assistant is not available yet. It will require Pi Browser with a Pi account. Please use the <b>Internal</b> tab for now.</p>' +
            '<button type="button" class="nz-chat-ai-back" id="nz-chat-ai-back">← Quay lại tab Nội bộ</button>' +
          '</div>' +
          '<div class="nz-chat-chips" id="nz-chat-chips">' +
            '<button type="button" data-q="Tìm Beer Garden">Tìm Beer Garden</button>' +
            '<button type="button" data-q="Địa chỉ và giờ mở cửa">Địa chỉ &amp; giờ mở cửa</button>' +
          '</div>' +
          '<div class="nz-chat-input-row" id="nz-chat-input-row">' +
            '<input id="nz-chat-input" type="text" placeholder="Nhắn cho NightZone..." autocomplete="off">' +
            '<button type="button" class="nz-chat-send" id="nz-chat-send">Gửi</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(modal);

    chatBody = document.getElementById("nz-chat-body");
    chatInput = document.getElementById("nz-chat-input");
    chipsRow = document.getElementById("nz-chat-chips");
    inputRow = document.getElementById("nz-chat-input-row");
    aiPanel = document.getElementById("nz-chat-ai");

    addMsg(greetingText(), "bot");
    addActions(bothActions());

    document.getElementById("nz-chat-send").addEventListener("click", function () {
      ask(chatInput.value);
      chatInput.value = "";
      chatInput.focus();
    });
    chatInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { ask(chatInput.value); chatInput.value = ""; }
    });
    chipsRow.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button[data-q]") : null;
      if (b) ask(b.getAttribute("data-q"));
    });
    document.getElementById("nz-tab-internal").addEventListener("click", function () { switchTab("internal"); });
    document.getElementById("nz-tab-ai").addEventListener("click", function () { switchTab("ai"); });
    document.getElementById("nz-chat-ai-back").addEventListener("click", function () { switchTab("internal"); });

    function close() {
      if (modal) { modal.remove(); modal = null; }
    }
    document.getElementById("nz-chat-close").addEventListener("click", close);
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    document.addEventListener("keydown", function escClose(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", escClose); }
    });
    chatInput.focus();
  }

  function init() {
    var fab = document.getElementById("nz-chat-fab");
    if (!fab) return;
    fab.addEventListener("click", openChat);
    // Warm the data cache so the first question answers immediately.
    loadData();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Test/debug handle (harmless): lets the Phase C render test call T()
     directly. Not used by the hub UI. */
  window.NightZoneChat = { T: T, detectLang: detectLang };
})();
