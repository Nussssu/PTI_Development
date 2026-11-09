/* =========================================================
   PTI Development — site shell, rendering & motion
   ========================================================= */
(function () {
  const D = window.PTI;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const page = document.body.dataset.page || "home";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const G = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const motion = G && !reduce;
  if (motion) { document.documentElement.classList.add("has-motion"); gsap.registerPlugin(ScrollTrigger); }
  const pad = (n) => String(n).padStart(2, "0");
  const desktop = () => window.matchMedia("(min-width: 1100px)").matches;

  /* ---------- Icons ---------- */
  const I = {
    arrow: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13L13 3M13 3H5M13 3V11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    right: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9h14m0 0l-5-5m5 5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.6" stroke="currentColor" stroke-width="1.8"/></svg>',
    units: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" stroke-width="1.8"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7.2" stroke="currentColor" stroke-width="1.2"/><path d="M5 8.2l2 2 4-4.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    phone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 3h3l2 5-2.5 1.5a11 11 0 006 6L15 13l5 2v3a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    mail: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 6l8.5 7 8.5-7" stroke="currentColor" stroke-width="1.7"/></svg>',
    office: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 8h2M14 8h2M8 12h2M14 12h2" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    wa: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.5-.3z"/></svg>',
    fb: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8V6c0-1 .5-1.5 1.5-1.5H17V1h-3c-3 0-4 2-4 4.5V8H7.5v3.5H10V23h4V11.5h3l.5-3.5H14z"/></svg>',
    ig: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>',
    li: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.01 5 2.5 2.5 0 01.01-5zM3 9h4v12H3zM9 9h3.8v1.7h.1a4.2 4.2 0 013.8-2c4 0 4.8 2.7 4.8 6.1V21h-4v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H9z"/></svg>',
    spark: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.2 9.8L24 12l-9.8 2.2L12 24l-2.2-9.8L0 12l9.8-2.2z"/></svg>'
  };
  const btn = (href, text, cls = "") => `<a class="btn ${cls}" href="${href}" data-magnetic><span>${text}</span><span class="btn-ico">${I.arrow}</span></a>`;
  const NAV = [["index.html", "Home", "home"], ["about.html", "About", "about"], ["services.html", "Services", "services"], ["projects.html", "Projects", "projects"], ["contact.html", "Contact", "contact"]];

  /* =========================================================
     SHELL
     ========================================================= */
  function shell() {
    const active = page === "project" ? "projects" : page;
    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = `
      <div class="wrap">
        <a class="logo" href="index.html" aria-label="PTI Development home">
          <img class="logo-light" src="assets/img/pti-logo-horizontal-white.svg" alt="PTI Development">
          <img class="logo-dark" src="assets/img/pti-logo-horizontal.svg" alt="" aria-hidden="true">
        </a>
        <nav class="nav" aria-label="Main">
          ${NAV.slice(0, 4).map(([h, t, k]) => `<a href="${h}" class="${k === active ? "is-active" : ""}"><span data-text="${t}">${t}</span></a>`).join("")}
        </nav>
        ${btn("contact.html", "Get Started", "header-cta")}
        <button class="burger" aria-label="Open menu" aria-expanded="false"><i></i><i></i></button>
      </div>`;
    document.body.prepend(header);

    const mm = document.createElement("div");
    mm.className = "mobile-menu";
    mm.innerHTML = NAV.map(([h, t], i) => `<a class="big" href="${h}"><small>${pad(i + 1)}</small>${t}</a>`).join("") +
      `<div class="mm-foot"><a href="${D.phoneHref}">${D.phone}</a><a href="mailto:${D.email}">${D.email}</a></div>`;
    document.body.appendChild(mm);
    const burger = $(".burger", header);
    burger.addEventListener("click", () => {
      const open = document.documentElement.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open);
      if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
      if (open && motion) gsap.fromTo($$(".big, .mm-foot", mm), { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .9, ease: "expo.out", delay: .25 });
    });

    const footer = document.createElement("footer");
    footer.className = "footer";
    footer.innerHTML = `
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <a class="footer-logo" href="index.html"><img src="assets/img/pti-logo-white.svg" alt="PTI Development" style="height:64px"></a>
            <p style="margin-top:24px;max-width:34ch;opacity:.7">Shaping Dreams into Homes. Invest in Value, Live in Trust.</p>
          </div>
          <div>
            <h4>Links</h4>
            <div class="footer-links">${NAV.map(([h, t]) => `<a href="${h}">${t}</a>`).join("")}</div>
          </div>
          <div class="footer-contact">
            <h4 style="margin-bottom:2px">Contact</h4>
            <div><small>Phone</small><a href="${D.phoneHref}">${D.phone}</a></div>
            <div><small>Email</small><a href="mailto:${D.email}">${D.email}</a></div>
            <div><small>Address</small>${D.address}</div>
          </div>
        </div>
        <div class="footer-big" aria-hidden="true">PTI Development</div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ${D.company} All Rights Reserved.</span>
          <div class="socials">
            <a href="#" aria-label="Facebook">${I.fb}</a><a href="#" aria-label="Instagram">${I.ig}</a><a href="#" aria-label="LinkedIn">${I.li}</a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(footer);

    // CTA block shared by every page
    $$("[data-render='cta']").forEach((n) => {
      n.outerHTML = `
      <section class="cta" data-theme="dark" data-floor="Book a meeting">
        <div class="cta-bg" data-parallax="12"><img src="assets/img/skyline-up.webp" alt="" loading="lazy"></div>
        <div class="wrap cta-inner">
          <div>
            <span class="eyebrow" data-reveal>Let's talk</span>
            <h2 data-split style="margin-top:22px">Ready to<br>Build Your <span class="serif">Dream?</span></h2>
            <p class="lead" data-reveal>We will show you finished and under construction projects, introduce you to the features of the areas and tell you about the real estate market in Dhaka.</p>
          </div>
          <a class="cta-badge" href="contact.html" data-magnetic data-reveal aria-label="Book the meeting">
            <svg class="ring" viewBox="0 0 100 100"><defs><path id="cta-c" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0"/></defs><text><textPath href="#cta-c">Book the meeting · Book the meeting ·</textPath></text></svg>
            <svg width="34" height="34" viewBox="0 0 16 16" fill="none"><path d="M3 13L13 3M13 3H5M13 3V11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </section>`;
    });

    // cursor
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const c = document.createElement("div");
      c.className = "cursor";
      c.innerHTML = '<div class="cursor-ring"></div><div class="cursor-dot"></div>';
      document.body.appendChild(c);
      const ring = $(".cursor-ring", c), dot = $(".cursor-dot", c);
      let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
      addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; });
      (function loop() { rx += (mx - rx) * .16; ry += (my - ry) * .16; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
      document.addEventListener("mouseover", (e) => {
        const lab = e.target.closest("[data-cursor]");
        const link = e.target.closest("a, button, .tw-floor");
        c.classList.toggle("has-label", !!lab);
        c.classList.toggle("is-link", !!link && !lab);
        ring.textContent = lab ? lab.dataset.cursor : "";
      });
    }

    // modal
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = '<button class="modal-close" aria-label="Close video">✕</button><div class="modal-box"></div>';
    document.body.appendChild(modal);
    const close = () => { modal.classList.remove("is-open"); setTimeout(() => $(".modal-box", modal).innerHTML = "", 400); window.__lenis && window.__lenis.start(); };
    modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest(".modal-close")) close(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    window.__openVideo = (id) => {
      $(".modal-box", modal).innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="PTI project video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      modal.classList.add("is-open");
      window.__lenis && window.__lenis.stop();
    };
  }

  /* =========================================================
     RENDERERS (content from data.js)
     ========================================================= */
  const card = (p, i, total) => `
    <a class="p-card" href="project.html?p=${p.slug}" data-cursor="View" data-area="${p.area}">
      <div class="p-card-media">
        <img src="${p.img}" alt="${p.name}" loading="lazy">
        <span class="p-index">${pad(i + 1)} / ${pad(total)}</span>
        <span class="status">${p.status}</span>
      </div>
      <div class="p-card-body">
        <h3>${p.name}</h3>
        <div class="p-facts"><span>${I.units}${p.units} Units</span><span>${I.pin}${p.location}</span></div>
      </div>
    </a>`;

  const odometer = (value, suffix) => {
    const cols = String(value).split("").map((d) => `<span class="odo-col" data-d="${d}"><span>${Array.from({ length: 20 }, (_, k) => `<span>${k % 10}</span>`).join("")}</span></span>`).join("");
    return `<div class="odo" aria-label="${value}${suffix}">${cols}${suffix ? `<sup>${suffix}</sup>` : ""}</div>`;
  };
  const statCard = (s, i) => `
    <div class="num-card" data-reveal>
      <img src="${s.img}" alt="" loading="lazy">
      <div class="elev-head"><span>Floor ${pad(i + 1)}</span><span class="elev-arrows"><i></i><i></i></span></div>
      <div>${odometer(s.value, s.suffix)}<div class="num-label">${s.label}</div></div>
    </div>`;

  const renderers = {
    "projects-h": (n) => n.innerHTML = D.projects.map((p, i) => card(p, i, D.projects.length)).join(""),
    "projects-grid": (n) => n.innerHTML = D.projects.map((p, i) => card(p, i, D.projects.length)).join(""),
    "filters": (n) => {
      const areas = [...new Set(D.projects.map((p) => p.area))];
      n.innerHTML = `<button class="chip is-active" data-f="*">All<sup>${D.projects.length}</sup></button>` +
        areas.map((a) => `<button class="chip" data-f="${a}">${a}<sup>${D.projects.filter((p) => p.area === a).length}</sup></button>`).join("");
    },
    "stats-home": (n) => n.innerHTML = D.stats.home.map(statCard).join(""),
    "stats-about": (n) => n.innerHTML = D.stats.about.map(statCard).join(""),
    "values": (n) => n.innerHTML = D.values.map((v, i) => `
      <div class="value" data-reveal>
        <img src="${v.img}" alt="" loading="lazy">
        <span class="vn">${pad(i + 1)}</span>
        <div><h3>${v.title}</h3><p>${v.text}</p></div>
      </div>`).join(""),
    "team": (n) => n.innerHTML = D.team.map((m, i) => `
      <div class="member ${i < 2 ? "lead-member" : ""}" data-reveal>
        <div class="member-photo"><img src="assets/img/team/${m.img}.webp" alt="${m.name}" loading="lazy"></div>
        <div><h3>${m.name}</h3><small>${m.role}</small></div>
      </div>`).join(""),
    "services": (n) => n.innerHTML = D.services.map((s, i) => `
      <article class="svc-card">
        <div>
          <span class="svc-num">${pad(i + 1)} / ${pad(D.services.length)}</span>
          <h2>${s.title}</h2>
          <p class="lead">${s.text}</p>
          <ul class="svc-list">${s.points.map((p) => `<li>${I.check}${p}</li>`).join("")}</ul>
          ${btn("projects.html", "Our Projects", i === 1 ? "" : "dark")}
        </div>
        <div class="svc-media"><img src="${s.img}" alt="${s.title}" loading="lazy"></div>
      </article>`).join(""),
    "faq": (n) => n.innerHTML = D.faq.map((f, i) => `
      <div class="faq-item ${i === 0 ? "is-open" : ""}" data-reveal>
        <button class="faq-q" aria-expanded="${i === 0}"><span><span class="n">${pad(i + 1)}</span>${f.q}</span><span class="faq-ico"></span></button>
        <div class="faq-a"><p>${f.a}</p></div>
      </div>`).join(""),
    "testimonial": (n) => {
      const t = D.testimonial;
      n.innerHTML = `
        <div class="quote-card">
          <div class="quote-mark" aria-hidden="true">“</div>
          <div>
            <p class="quote-text" data-reveal>${t.text}</p>
            <div class="quote-by" data-reveal><span class="avatar">${t.name.split(" ").map((w) => w[0]).join("")}</span><div><b>${t.name}</b><small>${t.role}</small></div></div>
          </div>
        </div>`;
    },
    "marquee": (n) => {
      const words = ["Property Development", "Land Share Purchase", "Legal & Compliance", "Halal Investment", "On-Time Delivery", "Transparent Pricing"];
      const item = `<div class="marquee-item">${words.map((w) => `<span>${w}</span>${I.spark}`).join("")}</div>`;
      n.innerHTML = `<div class="marquee-track">${item}${item}${item}</div>`;
    },
    "contact-cards": (n) => n.innerHTML = `
      <a class="c-card" href="${D.phoneHref}" data-reveal><span class="ico">${I.phone}</span><span><small>Call us</small><b>${D.phone}</b></span></a>
      <a class="c-card" href="mailto:${D.email}" data-reveal><span class="ico">${I.mail}</span><span><small>Email</small><b>${D.email}</b></span></a>
      <div class="c-card" data-reveal><span class="ico">${I.office}</span><span><small>Office</small><b>${D.addressLong}</b></span></div>
      <a class="c-card wa" href="${D.whatsapp}" target="_blank" rel="noopener" data-reveal><span class="ico">${I.wa}</span><span><small style="opacity:.8">WhatsApp</small><b>Message us anytime</b></span></a>`
  };

  function render() {
    $$("[data-render]").forEach((n) => { const r = renderers[n.dataset.render]; if (r) r(n); });
    if (page === "project") renderProject();
  }

  function renderProject() {
    const slug = new URLSearchParams(location.search).get("p");
    const p = D.projects.find((x) => x.slug === slug) || D.projects[0];
    const idx = D.projects.indexOf(p);
    document.title = `${p.name} — PTI Development`;
    $$("[data-p]").forEach((n) => {
      const k = n.dataset.p;
      if (k === "img") n.src = p.img, n.alt = p.name;
      else if (k === "map") n.src = `https://www.google.com/maps?q=${encodeURIComponent(p.area + ", Dhaka, Bangladesh")}&output=embed`;
      else n.textContent = k === "units" ? `${p.units} Units` : k === "index" ? `Project ${pad(idx + 1)} / ${pad(D.projects.length)}` : p[k];
    });
    const rel = D.projects.filter((x) => x !== p);
    const relN = $("[data-related]");
    if (relN) relN.innerHTML = rel.map((x) => card(x, D.projects.indexOf(x), D.projects.length)).join("");
  }

  /* =========================================================
     BEHAVIOUR (works with or without GSAP)
     ========================================================= */
  function behaviour() {
    // header: solid / hide on scroll down / theme under header
    const header = $(".site-header");
    let lastY = 0;
    const sections = $$("[data-theme]");
    const onScroll = () => {
      const y = scrollY;
      header.classList.toggle("is-solid", y > 40);
      header.classList.toggle("is-hidden", y > lastY && y > 400 && !document.documentElement.classList.contains("menu-open"));
      lastY = y;
      let theme = "dark";
      for (const s of sections) { const r = s.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) { theme = s.dataset.theme; break; } }
      document.documentElement.dataset.themeNow = theme === "dark" ? "dark" : "light";
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // FAQ
    $$(".faq-item").forEach((item) => {
      const a = $(".faq-a", item), q = $(".faq-q", item);
      if (item.classList.contains("is-open")) a.style.height = "auto";
      q.addEventListener("click", () => {
        const open = !item.classList.contains("is-open");
        $$(".faq-item.is-open").forEach((o) => { if (o !== item) { const oa = $(".faq-a", o); oa.style.height = oa.scrollHeight + "px"; requestAnimationFrame(() => oa.style.height = "0px"); o.classList.remove("is-open"); $(".faq-q", o).setAttribute("aria-expanded", false); } });
        item.classList.toggle("is-open", open);
        q.setAttribute("aria-expanded", open);
        if (open) { a.style.height = a.scrollHeight + "px"; a.addEventListener("transitionend", () => { if (item.classList.contains("is-open")) a.style.height = "auto"; }, { once: true }); }
        else { a.style.height = a.scrollHeight + "px"; requestAnimationFrame(() => a.style.height = "0px"); }
        setTimeout(() => G && ScrollTrigger.refresh(), 650);
      });
    });

    // project filters
    const filters = $("[data-render='filters']");
    if (filters) filters.addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      $$(".chip", filters).forEach((c) => c.classList.toggle("is-active", c === b));
      const f = b.dataset.f;
      const cards = $$(".projects-grid .p-card");
      const apply = () => {
        cards.forEach((c) => c.classList.toggle("is-hidden", f !== "*" && c.dataset.area !== f));
        if (motion) gsap.fromTo(cards.filter((c) => !c.classList.contains("is-hidden")), { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: .07, duration: .8, ease: "expo.out", clearProps: "transform" });
        G && ScrollTrigger.refresh();
      };
      motion ? gsap.to(cards, { opacity: 0, y: -20, duration: .25, stagger: .02, onComplete: apply }) : apply();
    });

    // video
    $$("[data-video]").forEach((b) => b.addEventListener("click", () => window.__openVideo(D.youtubeId)));

    // contact form -> opens the visitor's mail app with the enquiry filled in
    const form = $("#contact-form");
    if (form) form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const note = $(".form-note", form);
      if (!form.checkValidity()) { note.textContent = "Please fill in every field marked *."; form.reportValidity(); return; }
      const body = `Name: ${f.first} ${f.last}\nEmail: ${f.email}\nPhone: ${f.phone}\n\n${f.message}`;
      location.href = `mailto:${D.email}?subject=${encodeURIComponent("Website enquiry from " + f.first + " " + f.last)}&body=${encodeURIComponent(body)}`;
      note.textContent = "Thank you! Your email app is opening with your message ready to send.";
    });

    // magnetic
    if (window.matchMedia("(hover: hover)").matches) $$("[data-magnetic]").forEach((m) => {
      m.addEventListener("mousemove", (e) => {
        const r = m.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .25, y = (e.clientY - r.top - r.height / 2) * .35;
        m.style.transform = `translate(${x}px, ${y}px)`;
      });
      m.addEventListener("mouseleave", () => { m.style.transition = "transform .6s cubic-bezier(.22,1,.36,1), color .5s"; m.style.transform = ""; setTimeout(() => m.style.transition = "", 600); });
    });

    // page transitions: floors stack up, then navigate
    const curtain = document.createElement("div");
    curtain.className = "floors-curtain";
    curtain.innerHTML = "<i></i>".repeat(6);
    document.body.appendChild(curtain);
    if (motion) document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const href = a.getAttribute("href");
      if (!/^[\w-]+\.html(\?.*)?$/.test(href)) return;
      e.preventDefault();
      sessionStorage.setItem("pti-nav", "1");
      document.documentElement.classList.remove("menu-open");
      gsap.to($$("i", curtain), { scaleX: 1, duration: .55, stagger: .06, ease: "power3.inOut", onComplete: () => location.href = href });
    });
    addEventListener("pageshow", (e) => { if (e.persisted && motion) gsap.set($$("i", curtain), { scaleX: 0 }); });
  }

  /* =========================================================
     MOTION
     ========================================================= */
  function splitLines(n) {
    const parts = n.innerHTML.split(/<br\s*\/?>/i);
    n.innerHTML = parts.map((p) => `<span class="line-mask"><span>${p.trim()}</span></span>`).join("");
    return $$(".line-mask > span", n);
  }

  function splitWords(root) {
    const walk = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) frag.appendChild(document.createTextNode(t));
            else { const s = document.createElement("span"); s.className = "w"; s.textContent = t; frag.appendChild(s); }
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== "BR") walk(c);
      });
    };
    walk(root);
    return $$(".w", root);
  }

  function heroIntro() {
    const hero = $(".hero");
    if (!hero) return gsap.timeline();
    const media = $(".hero-media", hero);
    const src = media.dataset.src;
    const BANDS = 8;
    media.innerHTML = Array.from({ length: BANDS }, (_, i) =>
      `<div class="hero-band" style="top:${(i * 100) / BANDS}%;height:calc(${100 / BANDS}% + 1px);overflow:hidden">
         <img src="${src}" alt="" style="position:absolute;left:0;width:100%;height:${BANDS * 100}%;top:${-i * 100}%;object-fit:cover;object-position:70% center">
       </div>`).join("");
    const bands = $$(".hero-band", media).reverse(); // bottom floor first

    // blueprint elevation drawn in strokes
    const bp = $(".hero-blueprint", hero);
    let s = `<svg viewBox="0 0 320 560" aria-hidden="true"><line x1="-40" y1="556" x2="360" y2="556" pathLength="1"/><rect x="40" y="60" width="240" height="496" pathLength="1"/>`;
    for (let y = 100; y < 556; y += 40) s += `<line x1="40" y1="${y}" x2="280" y2="${y}" pathLength="1"/>`;
    for (let y = 70; y < 540; y += 40) for (let x = 56; x < 270; x += 56) s += `<rect x="${x}" y="${y}" width="40" height="22" pathLength="1"/>`;
    s += `<path d="M20 60 L300 60 M160 60 L160 10 M150 10 L170 10" pathLength="1"/></svg>`;
    bp.innerHTML = s;
    const strokes = $$("line, rect, path", bp);
    gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });

    const lines = splitLines($("h1", hero));
    const tl = gsap.timeline({ paused: true });
    tl.to(strokes, { strokeDashoffset: 0, duration: 1.2, stagger: { each: .006, from: "end" }, ease: "power2.inOut" }, 0)
      .fromTo(bands, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: .9, stagger: .09, ease: "expo.inOut" }, .5)
      .to(bp, { opacity: .12, duration: 1.2 }, 1.3)
      .fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: .1, ease: "expo.out" }, .9)
      .fromTo($$("[data-hero-in]", hero), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .08, ease: "expo.out" }, 1.3);

    // scroll: media drifts, content lifts away
    gsap.to(media, { yPercent: 18, scale: 1.05, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    gsap.to($(".hero-content", hero), { yPercent: -20, opacity: .2, ease: "none", scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true } });
    return tl;
  }

  function pageHeroIntro() {
    const ph = $(".page-hero");
    if (!ph) return gsap.timeline();
    const lines = splitLines($("h1", ph));
    const img = $(".bg img", ph);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo($(".bg", ph), { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.3, ease: "expo.inOut" }, 0)
      .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2, ease: "expo.out" }, .2)
      .fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: .1, ease: "expo.out" }, .6)
      .fromTo($$("[data-hero-in]", ph), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .08, ease: "expo.out" }, .9);
    gsap.to(img, { yPercent: -12, ease: "none", scrollTrigger: { trigger: ph, start: "top top", end: "bottom top", scrub: true } });
    return tl;
  }

  function scrollMotion() {
    // headings split into lines
    $$("[data-split]").forEach((h) => {
      const lines = splitLines(h);
      gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: .1, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 85%" } });
    });

    // generic reveals
    ScrollTrigger.batch("[data-reveal]:not(.hero [data-reveal])", {
      start: "top 88%",
      onEnter: (els) => gsap.fromTo(els, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: .08, ease: "expo.out", overwrite: true })
    });

    // image clip reveals
    $$("[data-clip]").forEach((m) => {
      gsap.fromTo(m, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: m, start: "top 80%" } });
      const img = $("img", m);
      if (img) gsap.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 2, ease: "expo.out", scrollTrigger: { trigger: m, start: "top 80%" } });
    });

    // parallax
    $$("[data-parallax]").forEach((p) => {
      const amt = +p.dataset.parallax || 10;
      gsap.fromTo(p, { yPercent: -amt }, { yPercent: amt, ease: "none", scrollTrigger: { trigger: p.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // statement: words light up while scrolling
    $$(".statement-text").forEach((st) => {
      const words = splitWords(st);
      gsap.to(words, { opacity: 1, stagger: .1, ease: "none", scrollTrigger: { trigger: st, start: "top 80%", end: "bottom 45%", scrub: true } });
    });

    // marquee with scroll-velocity direction
    $$(".marquee-track").forEach((track) => {
      let x = 0, dir = -1;
      const w = () => track.scrollWidth / 3;
      ScrollTrigger.create({ onUpdate: (self) => { dir = self.direction === 1 ? -1 : 1; } });
      gsap.ticker.add(() => {
        x += dir * 1.1;
        if (x <= -w()) x += w();
        if (x > 0) x -= w();
        track.style.transform = `translate3d(${x}px,0,0)`;
      });
    });

    // horizontal projects (desktop pin)
    const track = $(".ph-track");
    if (track) {
      ScrollTrigger.matchMedia({
        "(min-width: 1100px)": () => {
          const dist = () => track.scrollWidth - innerWidth + innerWidth * .05;
          const tw = gsap.to(track, {
            x: () => -dist() + innerWidth * .3 - 40, ease: "none",
            scrollTrigger: { trigger: ".projects-h", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
          });
          gsap.to(".ph-progress i", { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".projects-h", start: "top top", end: () => "+=" + dist(), scrub: true } });
          $$(".p-card", track).forEach((c) => {
            gsap.fromTo($(".p-card-media", c), { clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)", ease: "expo.out", duration: 1.2,
              scrollTrigger: { trigger: c, containerAnimation: tw, start: "left 95%" } });
          });
          return () => {};
        }
      });
    }

    // grid cards
    $$(".projects-grid .p-card").forEach((c) => {
      gsap.fromTo($(".p-card-media", c), { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.3, ease: "expo.inOut", scrollTrigger: { trigger: c, start: "top 90%" } });
    });

    // odometers roll like an elevator floor display
    $$(".num-card").forEach((card) => {
      ScrollTrigger.create({
        trigger: card, start: "top 85%", once: true,
        onEnter: () => {
          card.classList.add("is-rolling");
          $$(".odo-col", card).forEach((col, k) => {
            const d = +col.dataset.d;
            gsap.fromTo(col.firstElementChild, { yPercent: 0 }, { yPercent: -((10 + d) / 20) * 100, duration: 2.2 + k * .25, ease: "expo.inOut", delay: .2, onComplete: () => card.classList.remove("is-rolling") });
          });
        }
      });
    });

    // video frame opens up
    $$(".video-frame").forEach((v) => {
      gsap.fromTo(v, { clipPath: "inset(14% 16% 14% 16% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "none", scrollTrigger: { trigger: v, start: "top 95%", end: "center 55%", scrub: true } });
      gsap.fromTo($("img", v), { scale: 1.35 }, { scale: 1, ease: "none", scrollTrigger: { trigger: v, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // services cards stack + shrink
    const svc = $$(".svc-card");
    ScrollTrigger.matchMedia({
      "(min-width: 901px)": () => {
        svc.forEach((c, i) => {
          c.style.zIndex = i + 1;
          if (i === svc.length - 1) return;
          gsap.to(c, { scale: .92 - (svc.length - i) * .01, filter: "brightness(.8)", ease: "none", scrollTrigger: { trigger: svc[i + 1], start: "top bottom", end: "top 20%", scrub: true } });
        });
      }
    });

    // process line
    $$(".process-step").forEach((p, i) => gsap.fromTo(p, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 1, delay: i * .12, ease: "expo.out", scrollTrigger: { trigger: p.parentElement, start: "top 85%" } }));

    // footer big text
    const fb = $(".footer-big");
    if (fb) gsap.fromTo(fb, { xPercent: 8 }, { xPercent: -14, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });
  }

  function smoothScroll() {
    if (!motion || typeof window.Lenis === "undefined") return;
    const lenis = new Lenis({ lerp: .1, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function intro(done) {
    const curtainBands = () => $$(".floors-curtain i");
    const fromNav = sessionStorage.getItem("pti-nav") === "1";
    sessionStorage.removeItem("pti-nav");
    const seen = sessionStorage.getItem("pti-seen") === "1";

    if (fromNav || seen) {
      gsap.set(curtainBands(), { scaleX: 1, transformOrigin: (i) => (i % 2 ? "left" : "right") });
      gsap.to(curtainBands(), { scaleX: 0, duration: .6, stagger: .05, ease: "power3.inOut", delay: .05, onComplete: () => gsap.set(curtainBands(), { clearProps: "transformOrigin" }) });
      setTimeout(done, 250);
      return;
    }
    sessionStorage.setItem("pti-seen", "1");
    const L = document.createElement("div");
    L.className = "loader";
    L.innerHTML = `<div class="loader-inner">
        <svg viewBox="0 0 74 92"><path d="M0.00454068 18.3256H0V73.5928H18.4044V92H36.827V91.9728H73.5949V55.1674V18.3619H73.6085V0H0.00908136V18.3256H0.00454068ZM18.4271 18.3619H55.195V55.1674H36.7997V73.5701H18.4271V18.3619Z" pathLength="1"/></svg>
        <div class="loader-bar"><i></i></div>
        <div class="loader-count">LAYING FOUNDATION <span>000</span></div>
      </div>`;
    document.body.appendChild(L);
    const path = $("path", L), cnt = $(".loader-count span", L), o = { v: 0 };
    gsap.set(path, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.timeline({ onComplete: () => { L.remove(); } })
      .to(path, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, 0)
      .to(o, { v: 100, duration: 1.3, ease: "power2.inOut", onUpdate: () => cnt.textContent = String(Math.round(o.v)).padStart(3, "0") }, 0)
      .to($(".loader-bar i", L), { scaleX: 1, duration: 1.3, ease: "power2.inOut" }, 0)
      .to(path, { fill: "#D9A55B", duration: .4 }, 1)
      .to($(".loader-inner", L), { y: -30, opacity: 0, duration: .5, ease: "power2.in" }, 1.45)
      .add(done, 1.6)
      .to(L, { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, 1.7);
  }

  /* =========================================================
     BOOT
     ========================================================= */
  shell();
  render();
  behaviour();

  const tower = window.RisingTower ? new RisingTower($$("[data-floor]")) : null;

  if (!motion) {
    $$(".odo-col").forEach((c) => c.firstElementChild.style.transform = `translateY(-${((10 + +c.dataset.d) / 20) * 100}%)`);
    tower && tower.start();
    return;
  }

  smoothScroll();
  const heroTl = page === "home" ? heroIntro() : pageHeroIntro();
  scrollMotion();
  intro(() => {
    heroTl.play();
    setTimeout(() => tower && tower.start(), 700);
  });
  addEventListener("load", () => ScrollTrigger.refresh());
})();
