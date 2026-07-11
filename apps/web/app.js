async function loadPartials() {
  const headerSlot = document.getElementById("site-header");
  const footerSlot = document.getElementById("site-footer");
  const v = "20250610";

  const tasks = [];
  if (headerSlot) {
    tasks.push(
      fetch(`partials/header.html?v=${v}`, { cache: "no-store" })
        .then((res) => res.text())
        .then((html) => {
          headerSlot.innerHTML = html;
        })
    );
  }
  if (footerSlot) {
    tasks.push(
      fetch(`partials/footer.html?v=${v}`, { cache: "no-store" })
        .then((res) => res.text())
        .then((html) => {
          footerSlot.innerHTML = html;
        })
    );
  }

  if (tasks.length) await Promise.all(tasks);
}

function initNavigation() {
  const topbar = document.querySelector(".topbar");
  const mobileToggle = document.querySelector(".mobile-toggle");

  if (mobileToggle && topbar) {
    mobileToggle.addEventListener("click", () => {
      topbar.classList.toggle("open");
    });
  }

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href === currentPage) {
      link.classList.add("active");
    } else if (
      (currentPage === "index.html" || currentPage === "") &&
      href.startsWith("index.html#") &&
      href.slice("index.html".length) === window.location.hash
    ) {
      link.classList.add("active");
    }
  });

  document.querySelectorAll('a[href*="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const url = new URL(anchor.href, window.location.href);
      if (url.pathname.split("/").pop() !== (window.location.pathname.split("/").pop() || "index.html")) return;
      const id = url.hash.slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", url.hash || window.location.pathname);
    });
  });
}

document.querySelectorAll("[data-billing]").forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.billing;
    document.querySelectorAll("[data-billing]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    document.querySelectorAll("[data-monthly][data-yearly]").forEach((price) => {
      price.textContent = mode === "yearly" ? price.dataset.yearly : price.dataset.monthly;
    });
  });
});

document.querySelectorAll("[data-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = form.querySelector(".form-message");
    if (message) {
      message.style.display = "block";
    }
    form.reset();
  });
});

const demoLogin = document.querySelector("[data-demo-login]");
if (demoLogin) {
  demoLogin.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.href = "https://uygulama.bachmain.com/kayit";
  });
}

document.querySelectorAll('a[href="giris.html"], a[href*="giris.html"]').forEach((a) => {
  a.setAttribute("href", "https://uygulama.bachmain.com/giris");
});

/* ── v2 Landing Interactions ── */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));

function animateCounter(el) {
  const target = parseInt(el.dataset.counter, 10);
  if (Number.isNaN(target)) return;

  const duration = 1800;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(target * eased).toLocaleString("tr-TR");
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target.toLocaleString("tr-TR");
  }

  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll("[data-counter]").forEach((el) => counterObserver.observe(el));

document.querySelectorAll(".v2-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const group = tab.closest(".v2-showcase");
    if (!group) return;

    group.querySelectorAll(".v2-tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");

    const target = tab.dataset.tab;
    group.querySelectorAll(".v2-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === target);
    });
  });
});

const slider = document.querySelector(".v2-testimonial-slider");
if (slider) {
  const track = slider.querySelector(".v2-testimonial-track");
  const dots = slider.querySelectorAll(".v2-slider-dots button");
  let currentSlide = 0;
  let autoplayTimer;

  function goToSlide(index) {
    const quotes = track.querySelectorAll(".v2-quote");
    if (!quotes.length) return;

    currentSlide = ((index % quotes.length) + quotes.length) % quotes.length;
    const offset = currentSlide * (quotes[0].offsetWidth + 24);
    track.style.transform = `translateX(-${offset}px)`;

    dots.forEach((dot, i) => dot.classList.toggle("active", i === currentSlide));
  }

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      goToSlide(i);
      resetAutoplay();
    });
  });

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);
  }

  resetAutoplay();

  window.addEventListener("resize", () => goToSlide(currentSlide));
}

const backTop = document.querySelector(".v2-back-top");
if (backTop) {
  window.addEventListener("scroll", () => {
    backTop.classList.toggle("visible", window.scrollY > 600);
  }, { passive: true });
}

document.querySelectorAll("[data-tilt]").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-8px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

const v2Header = document.querySelector(".v2-header");
if (v2Header) {
  window.addEventListener("scroll", () => {
    v2Header.classList.toggle("scrolled", window.scrollY > 20);
  }, { passive: true });
}

document.querySelectorAll(".v2-faq-item").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    const list = item.closest(".v2-faq-list");
    if (!list) return;
    list.querySelectorAll(".v2-faq-item").forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

document.querySelectorAll(".v2-trust-card").forEach((card, i) => {
  card.style.animationDelay = `${i * 0.08}s`;
});

const screenshotWrap = document.querySelector(".v2-screenshot-wrap");
if (screenshotWrap) {
  window.addEventListener("scroll", () => {
    const rect = screenshotWrap.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, 1 - rect.top / window.innerHeight));
    screenshotWrap.style.setProperty("--parallax", `${progress * 12}px`);
  }, { passive: true });
}

async function boot() {
  await loadPartials();
  initNavigation();
  initNavDropdown();
  initProcessPipeline();
  initB2bTabs();
  initCommandNav();
}

function initNavDropdown() {
  const menu = document.querySelector(".v2-menu");
  const trigger = document.querySelector(".v2-nav-dropdown-trigger");
  const panel = document.getElementById("mega-ozellikler");
  if (!menu || !trigger || !panel) return;

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    if (window.innerWidth > 768) return;
    e.stopPropagation();
    const open = menu.classList.toggle("is-mega-open");
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target)) {
      menu.classList.remove("is-mega-open");
      trigger.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      menu.classList.remove("is-mega-open");
      trigger.setAttribute("aria-expanded", "false");
    }
  });
}

function initProcessPipeline() {
  const pipeline = document.getElementById("bm-pipeline");
  const progress = document.getElementById("bm-pipeline-progress");
  const steps = document.querySelectorAll(".bm-step");
  if (!pipeline || !progress || !steps.length) return;

  let current = 0;
  const total = steps.length;

  function updateStep(index) {
    steps.forEach((step, i) => {
      step.classList.remove("active", "done");
      if (i < index) step.classList.add("done");
      if (i === index) step.classList.add("active");
    });
    const pct = total > 1 ? (index / (total - 1)) * 100 : 0;
    progress.style.width = `${pct}%`;
  }

  updateStep(0);

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      setInterval(() => {
        current = (current + 1) % total;
        updateStep(current);
      }, 2800);
      observer.disconnect();
    },
    { threshold: 0.3 }
  );

  observer.observe(pipeline);
}

function initB2bTabs() {
  const tabs = document.querySelectorAll(".bm-b2b-tab");
  const panels = document.querySelectorAll(".bm-b2b-panel");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.b2b;
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      panels.forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.b2bPanel === target);
      });
    });
  });
}

function initCommandNav() {
  const buttons = document.querySelectorAll(".bm-command-nav button");
  const feed = document.getElementById("bm-feed");
  if (!buttons.length || !feed) return;

  const feeds = {
    overview: [
      ["📦", "Sipariş #4821", "Üretime alındı — Koru Yapı", "live", "Canlı"],
      ["💬", "WhatsApp", "Numune onayı bekleniyor", "wa", "Mesaj"],
      ["🚛", "TIR-07", "Palet yerleşimi %94 dolu", "truck", "Lojistik"],
      ["📍", "Saha ekibi", "3 temsilci haritada aktif", "live", "Harita"],
    ],
    sales: [
      ["📍", "Ahmet K.", "Kadıköy — ziyaret tamamlandı", "live", "Saha"],
      ["📍", "Selin Y.", "Beşiktaş — teklif sunuldu", "live", "Saha"],
      ["🛒", "Saha sipariş", "₺24.800 — onay bekliyor", "live", "Sipariş"],
      ["📈", "Günlük hedef", "%78 tamamlandı", "truck", "KPI"],
    ],
    logistics: [
      ["🚛", "TIR-07", "İstanbul → Ankara · 94% dolu", "truck", "Nakliye"],
      ["📐", "Palet hesabı", "18 palet · 128 koli", "truck", "Hesap"],
      ["🚴", "Kurye #12", "Teslimat 14 dk içinde", "live", "Kurye"],
      ["📡", "Araç GPS", "Filoda 7 aktif araç", "live", "GPS"],
    ],
    b2b: [
      ["🧪", "Numune #891", "Üretim fotoğrafı yüklendi", "live", "B2B"],
      ["💳", "Ödeme planı", "6 taksit — onay bekliyor", "wa", "Finans"],
      ["📄", "Çek görseli", "Müşteri yükledi · incelemede", "truck", "Çek"],
      ["🎁", "Kampanya", "Yaz indirimi — 3 yeni sipariş", "live", "Kampanya"],
    ],
  };

  function renderFeed(key) {
    const items = feeds[key] || feeds.overview;
    feed.innerHTML = items
      .map(
        ([icon, title, desc, tagClass, tagLabel]) =>
          `<div class="bm-feed-item"><div class="bm-feed-icon">${icon}</div><div><strong>${title}</strong><br />${desc}</div><span class="bm-feed-tag ${tagClass}">${tagLabel}</span></div>`
      )
      .join("");
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderFeed(btn.dataset.cmd);
    });
  });
}

if (document.getElementById("site-header") || document.getElementById("site-footer")) {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  initNavigation();
  initNavDropdown();
  initProcessPipeline();
  initB2bTabs();
  initCommandNav();
}
