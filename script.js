/* =========================================================
   THE CLIMBER — 孤高の人
   Modular front-end behaviour. Each module is self-contained
   and only touches the DOM nodes it owns.
   ========================================================= */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  const NavModule = (() => {
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!nav || !toggle || !links) return null;

    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);

    const closeMenu = () => {
      toggle.classList.remove('open');
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
    };

    const init = () => {
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });

      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', 'navLinks');

      toggle.addEventListener('click', () => {
        const isOpen = links.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      });

      links.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && links.classList.contains('open')) closeMenu();
      });
    };

    return { init };
  })();

  /* ---------- Scroll reveal ---------- */
  const RevealModule = (() => {
    const init = () => {
      const els = document.querySelectorAll('.reveal');
      if (!els.length) return;

      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        els.forEach((el) => el.classList.add('visible'));
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      els.forEach((el) => observer.observe(el));
    };

    return { init };
  })();

  /* ---------- Reading progress bar ---------- */
  const ProgressBarModule = (() => {
    const bar = document.getElementById('progressBar');
    if (!bar) return null;

    let ticking = false;

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      bar.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', String(Math.round(pct)));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    const init = () => {
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
    };

    return { init };
  })();

  /* ---------- Back to top ---------- */
  const BackToTopModule = (() => {
    const btn = document.getElementById('backToTop');
    if (!btn) return null;

    const onScroll = () => btn.classList.toggle('visible', window.scrollY > 600);

    const init = () => {
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    };

    return { init };
  })();

  /* ---------- Parallax on hero / quote backgrounds ---------- */
  const ParallaxModule = (() => {
    const targets = Array.from(document.querySelectorAll('[data-parallax]'));
    if (!targets.length || prefersReducedMotion) return null;

    let ticking = false;
    const visible = new Set();

    const update = () => {
      visible.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.2;
        const rect = el.parentElement.getBoundingClientRect();
        const offset = rect.top * speed;
        el.style.transform = `translate3d(0, ${offset}px, 0) scale(1.12)`;
      });
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    const init = () => {
      if (!('IntersectionObserver' in window)) return;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        });
      });
      targets.forEach((el) => observer.observe(el));
      window.addEventListener('scroll', onScroll, { passive: true });
    };

    return { init };
  })();

  /* ---------- Snow — leve chuva de partículas sobre o hero ---------- */
  const SnowModule = (() => {
    const canvas = document.getElementById('snowCanvas');
    if (!canvas || prefersReducedMotion) return null;
    if (window.innerWidth < 480) return null;

    const ctx = canvas.getContext('2d');
    const hero = canvas.closest('.hero');
    let particles = [];
    let width = 0;
    let height = 0;
    let rafId = null;
    let running = false;

    const PARTICLE_COUNT = 55;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const makeParticle = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.6 + Math.random() * 1.8,
      speedY: 0.25 + Math.random() * 0.6,
      speedX: (Math.random() - 0.5) * 0.3,
      drift: Math.random() * Math.PI * 2,
      opacity: 0.25 + Math.random() * 0.45
    });

    const seed = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, makeParticle);
    };

    const step = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#e9e6df';
      particles.forEach((p) => {
        p.drift += 0.01;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.drift) * 0.15;
        if (p.y > height + 4) { p.y = -4; p.x = Math.random() * width; }
        if (p.x > width + 4) p.x = -4;
        if (p.x < -4) p.x = width + 4;

        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(step);
    };

    const start = () => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(step);
    };

    const stop = () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    };

    const init = () => {
      resize();
      seed();
      window.addEventListener('resize', () => { resize(); }, { passive: true });

      if (!('IntersectionObserver' in window) || !hero) {
        start();
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) start();
          else stop();
        });
      }, { threshold: 0.05 });
      observer.observe(hero);
    };

    return { init };
  })();

  /* ---------- Cursor ring (desktop apenas) ---------- */
  const CursorModule = (() => {
    const ring = document.getElementById('cursorRing');
    if (!ring) return null;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return null;

    let targetX = 0;
    let targetY = 0;
    let ticking = false;

    const move = () => {
      ring.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      ticking = false;
    };

    const init = () => {
      document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        ring.classList.add('active');
        if (!ticking) {
          requestAnimationFrame(move);
          ticking = true;
        }
      });

      document.addEventListener('mouseleave', () => ring.classList.remove('active'));

      document.querySelectorAll('a, button').forEach((el) => {
        el.addEventListener('mouseenter', () => ring.classList.add('hover'));
        el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
      });
    };

    return { init };
  })();

  /* ---------- Lightbox with keyboard + arrow navigation ---------- */
  const LightboxModule = (() => {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const caption = document.getElementById('lightboxCaption');
    const counter = document.getElementById('lightboxCounter');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    const items = Array.from(document.querySelectorAll('.gallery-item'));
    if (!lightbox || !img || !items.length) return null;

    let currentIndex = 0;
    let lastFocused = null;

    const render = (index) => {
      currentIndex = (index + items.length) % items.length;
      const item = items[currentIndex];
      const src = item.getAttribute('data-full');
      const alt = item.querySelector('img').getAttribute('alt');
      const cap = item.getAttribute('data-caption') || alt;

      img.classList.remove('loaded');
      img.src = src;
      img.alt = alt;
      img.onload = () => img.classList.add('loaded');

      if (caption) caption.textContent = cap;
      if (counter) counter.textContent = `${currentIndex + 1} / ${items.length}`;
    };

    const open = (index) => {
      lastFocused = document.activeElement;
      render(index);
      lightbox.hidden = false;
      requestAnimationFrame(() => lightbox.classList.add('open'));
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };

    const close = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      const finish = () => { lightbox.hidden = true; };
      if (prefersReducedMotion) finish();
      else setTimeout(finish, 260);
      if (lastFocused) lastFocused.focus();
    };

    const next = () => render(currentIndex + 1);
    const prev = () => render(currentIndex - 1);

    const init = () => {
      items.forEach((item, index) => {
        item.addEventListener('click', () => open(index));
      });

      closeBtn.addEventListener('click', close);
      nextBtn.addEventListener('click', next);
      prevBtn.addEventListener('click', prev);

      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) close();
      });

      document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
      });
    };

    return { init };
  })();

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    [NavModule, RevealModule, ProgressBarModule, BackToTopModule, ParallaxModule, SnowModule, CursorModule, LightboxModule]
      .filter(Boolean)
      .forEach((mod) => mod.init());
  });
})();
