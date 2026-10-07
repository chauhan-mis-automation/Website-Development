(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Same Google Apps Script endpoint as the main Chauhan MIS site,
  // so every lead lands in the same Google Sheet.
  var GOOGLE_SHEET_URL =
    "https://script.google.com/macros/s/AKfycbycI_jfWFjo3vPZ0o32DUzrZHV6sLj49thJYHDND7nLixyV3ofbt-W2-9GIaGFMd4pC/exec";

  /* ---------- Header, progress bar, mobile bar ---------- */
  var header = $(".site-header");
  var progress = $("#progress");
  var mbar = $("#mbar");
  var hero = $(".hero");
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle("scrolled", y > 24);
    progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    if (mbar && hero) {
      var contact = $("#contact");
      var cTop = contact ? contact.getBoundingClientRect().top : 9999;
      var show = y > hero.offsetHeight * 0.6 && cTop > window.innerHeight * 0.6;
      mbar.classList.toggle("show", show);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = $("#burger");
  var nav = $("#nav");
  function closeMenu() {
    nav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
  }
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ---------- Hero: URL typing ---------- */
  var typed = $("#typed");
  if (typed && !reduce) {
    var full = typed.textContent;
    typed.textContent = "";
    var n = 0;
    setTimeout(function tick() {
      n++;
      typed.textContent = full.slice(0, n);
      if (n < full.length) setTimeout(tick, 90);
    }, 450);
  }

  /* ---------- Hero: gentle 3D tilt (mouse only) ---------- */
  var stage = $("#stage");
  if (stage && !reduce && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    stage.addEventListener("mousemove", function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      stage.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
      stage.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
    });
    stage.addEventListener("mouseleave", function () {
      stage.style.setProperty("--ry", "0deg");
      stage.style.setProperty("--rx", "0deg");
    });
  }

  /* ---------- Scroll reveal + process line ---------- */
  var io = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" })
    : null;
  $$(".rv, #steps").forEach(function (el) {
    if (io) io.observe(el); else el.classList.add("in");
  });

  /* ---------- Solutions picker ---------- */
  var tabs = $$(".p-tab");
  var panels = $$(".p-panel");
  function formatINR(v) { return v.toLocaleString("en-IN"); }
  function countUp(panel) {
    var el = $("[data-price]", panel);
    if (!el) return;
    var target = parseInt(el.getAttribute("data-price"), 10);
    if (reduce) { el.textContent = "₹" + formatINR(target) + "+"; return; }
    var start = performance.now();
    var dur = 650;
    (function step(now) {
      var t = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = "₹" + formatINR(Math.round(target * eased)) + "+";
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }
  function selectTab(i, focus) {
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p, k) { p.classList.toggle("is-active", k === i); });
    countUp(panels[i]);
    if (focus) tabs[i].focus();
    // keep the active tab visible in the horizontal strip on small screens
    var list = tabs[i].parentElement;
    if (list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: tabs[i].offsetLeft - 20, behavior: reduce ? "auto" : "smooth" });
    }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(i, false); });
    t.addEventListener("keydown", function (e) {
      var k = i;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") k = (i + 1) % tabs.length;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") k = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") k = 0;
      else if (e.key === "End") k = tabs.length - 1;
      else return;
      e.preventDefault();
      selectTab(k, true);
    });
  });

  // "Get a quote for this" -> preselect the solution in the form
  var serviceSelect = $("#f-service");
  $$("[data-plan]").forEach(function (a) {
    a.addEventListener("click", function () {
      var plan = a.getAttribute("data-plan");
      var opt = $$("option", serviceSelect).filter(function (o) { return o.value.indexOf(plan) === 0; })[0];
      if (opt) serviceSelect.value = opt.value;
    });
  });

  /* ---------- FAQ ---------- */
  $$(".faq-item").forEach(function (item) {
    var btn = $(".faq-q", item);
    btn.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  var firstFaq = $(".faq-item");
  if (firstFaq) {
    firstFaq.classList.add("open");
    $(".faq-q", firstFaq).setAttribute("aria-expanded", "true");
  }

  /* ---------- Lead form ---------- */
  var form = $("#leadForm");
  var btn = $("#submitBtn");
  var btnText = $("#submitText");
  var statusEl = $("#formStatus");
  function setStatus(kind, msg) {
    statusEl.className = "status" + (kind ? " " + kind : "");
    statusEl.textContent = msg || "";
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var hp = form.querySelector('[name="website"]');
    if (hp && hp.value) return; // bot

    var v = function (n) { return form.querySelector('[name="' + n + '"]').value.trim(); };
    var name = v("name"), phone = v("phone"), email = v("email"), service = v("service");

    if (!name || !phone || !email || !service) {
      setStatus("err", "Please fill in your name, phone, email and the website you need.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setStatus("err", "Please enter a valid phone number with at least 10 digits.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus("err", "Please enter a valid email address.");
      return;
    }

    setStatus("", "");
    btn.disabled = true;
    btnText.textContent = "Sending…";

    var payload = {
      name: name,
      phone: phone,
      email: email,
      service: "Web Development Services - " + service,
      message: v("message"),
    };

    // no-cors: Apps Script sends no CORS headers, so the response can't be read;
    // "fetch didn't throw" is treated as success (same as the main site).
    fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    })
      .then(function () {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "website_dev_lead_submit", lead_service: service });
        setStatus("ok", "Thank you! Your message has been sent successfully.");
        form.reset();
        window.location.href = "thank-you.html";
      })
      .catch(function () {
        setStatus("err", "Unable to send your message. Please try again or contact us on WhatsApp.");
        btn.disabled = false;
        btnText.textContent = "Send message";
      });
  });

  var yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
