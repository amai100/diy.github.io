/* =========================================================
   DIY 机器人工房 — shared interactions
   ========================================================= */

(() => {
  "use strict";

  const root = document.documentElement;
  const header = document.getElementById("siteHeader");
  const progress = document.querySelector(".scroll-progress");
  const menuToggle = document.querySelector(".menu-toggle");
  const themeToggle = document.querySelector(".theme-toggle");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- theme ---------- */

  const metaTheme = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme, persist = true) {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    if (persist) {
      try {
        localStorage.setItem("diy-theme", theme);
      } catch (error) {
        /* storage can be unavailable */
      }
    }
    if (metaTheme) {
      metaTheme.setAttribute("content", theme === "light" ? "#f2f6fb" : "#060a12");
    }
    if (themeToggle) {
      const next = theme === "light" ? "深色" : "浅色";
      themeToggle.setAttribute("aria-label", `切换到${next}模式`);
      themeToggle.setAttribute("title", `切换到${next}模式`);
    }
  }

  if (themeToggle) {
    applyTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark", false);
    themeToggle.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
    });
  }

  /* ---------- header + scroll progress ---------- */

  let ticking = false;

  function onScroll() {
    const y = window.scrollY || 0;

    if (header) {
      header.classList.toggle("is-scrolled", y > 12);
    }

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
      progress.style.width = `${pct}%`;
    }

    const toTop = document.querySelector(".to-top");
    if (toTop) {
      toTop.classList.toggle("is-visible", y > 640);
    }

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
  onScroll();

  /* ---------- mobile menu ---------- */

  function closeMenu() {
    if (!header || !header.classList.contains("menu-open")) return;
    header.classList.remove("menu-open");
    document.body.classList.remove("menu-locked");
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "打开菜单");
    }
  }

  if (menuToggle && header) {
    menuToggle.addEventListener("click", () => {
      const open = !header.classList.contains("menu-open");
      header.classList.toggle("menu-open", open);
      document.body.classList.toggle("menu-locked", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    });

    document.querySelectorAll("#siteNav a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
      if (header.classList.contains("menu-open") && !header.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 920) closeMenu();
    });
  }

  /* ---------- reveal on scroll ---------- */

  const revealItems = Array.from(document.querySelectorAll(".reveal"));

  function showAll() {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );

    revealItems.forEach((item) => {
      const delay = item.dataset.revealDelay;
      if (delay) item.style.setProperty("--reveal-delay", `${delay}ms`);
      observer.observe(item);
    });
  }

  /* ---------- pointer spotlight ---------- */

  if (!reduceMotion.matches && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-spotlight]").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const rect = element.getBoundingClientRect();
        element.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        element.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    });
  }

  /* ---------- toast ---------- */

  let toastTimer;

  function toast(message) {
    let node = document.getElementById("toast");
    if (!node) {
      node = document.createElement("div");
      node.id = "toast";
      node.className = "toast";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => node.classList.remove("is-visible"), 2200);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.top = "-1000px";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      toast("邮箱已复制");
    } catch (error) {
      toast("复制失败，请手动选择邮箱");
    }
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => copyText(button.dataset.copy));
  });

  /* ---------- dialogs ---------- */

  document.querySelectorAll("[data-open-dialog]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const dialog = document.getElementById(trigger.dataset.openDialog);
      if (dialog && typeof dialog.showModal === "function") {
        dialog.showModal();
      }
    });
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => dialog.close());
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  /* ---------- back to top ---------- */

  document.querySelectorAll("[data-to-top]").forEach((button) => {
    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
  });

  /* ---------- footer year ---------- */

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
