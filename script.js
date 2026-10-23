(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* Current year */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* Mobile navigation */
  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");
  const navScrim = $("#navScrim");
  const siteHeader = $("#siteHeader");

  const setMenu = (open) => {
    if (!navToggle || !navMenu) return;
    navMenu.classList.toggle("is-open", open);
    if (navScrim) navScrim.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  };

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      setMenu(navToggle.getAttribute("aria-expanded") !== "true");
    });

    if (navScrim) {
      navScrim.addEventListener("click", () => setMenu(false));
    }

    navMenu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("click", (event) => {
      if (!siteHeader.contains(event.target) && navMenu.classList.contains("is-open")) {
        setMenu(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navMenu.classList.contains("is-open")) {
        setMenu(false);
        navToggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 880) setMenu(false);
    });
  }

  /* Reveal content as it enters the viewport */
  const revealItems = $$("[data-reveal]");

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* Animated counters */
  const animateCount = (element) => {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;

    const prefix = element.dataset.prefix || "";
    const useComma = element.dataset.format === "comma";
    const format = (value) => prefix + (useComma ? value.toLocaleString("en-IN") : String(value));

    if (reduceMotion.matches) {
      element.textContent = format(target);
      return;
    }

    const duration = 1300;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = format(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    element.textContent = format(0);
    requestAnimationFrame(tick);
  };

  const counters = $$("[data-count]");

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          counterObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.45 }
    );

    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(animateCount);
  }

  /* Scroll progress, sticky header, active navigation */
  const progressBar = $(".scroll-progress");
  const navItems = $$("[data-nav]");
  const sections = navItems
    .map((link) => {
      const id = link.getAttribute("href");
      return { link, section: id ? $(id) : null };
    })
    .filter((item) => item.section);

  let scrollQueued = false;

  const updateOnScroll = () => {
    scrollQueued = false;
    const top = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (progressBar) {
      progressBar.style.transform = `scaleX(${maxScroll > 0 ? Math.min(top / maxScroll, 1) : 0})`;
    }

    if (siteHeader) siteHeader.classList.toggle("is-scrolled", top > 18);

    if (sections.length) {
      const probe = top + window.innerHeight * 0.34;
      let current = null;

      sections.forEach(({ section }) => {
        if (section.getBoundingClientRect().top + top <= probe) current = section;
      });

      sections.forEach(({ link, section }) => {
        const active = section === current;
        link.classList.toggle("is-current", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
  };

  const queueScrollUpdate = () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(updateOnScroll);
  };

  window.addEventListener("scroll", queueScrollUpdate, { passive: true });
  window.addEventListener("resize", queueScrollUpdate, { passive: true });
  window.addEventListener("load", queueScrollUpdate);
  updateOnScroll();

  /* Ripple feedback for buttons */
  document.addEventListener("click", (event) => {
    const target = event.target.closest(".btn");
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const ripple = document.createElement("span");

    ripple.className = "ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    target.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  });

  /* Click pulse for orbit-border buttons */
  $$(".star-btn").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.remove("is-pulsing");
      void button.offsetWidth;
      button.classList.add("is-pulsing");
      button.addEventListener(
        "animationend",
        () => button.classList.remove("is-pulsing"),
        { once: true }
      );
    });
  });

  /* Pointer spotlight */
  if (finePointer.matches && !reduceMotion.matches) {
    $$("[data-spotlight]").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const rect = element.getBoundingClientRect();
        element.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        element.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    });
  }

  /* Card tilt */
  if (finePointer.matches && !reduceMotion.matches) {
    $$("[data-tilt]").forEach((card) => {
      let rect = null;
      let frame = null;
      let targetX = 0;
      let targetY = 0;

      const applyTilt = () => {
        frame = null;
        card.style.transform = `perspective(900px) rotateX(${targetX}deg) rotateY(${targetY}deg) translateZ(0)`;
      };

      const move = (event) => {
        if (!rect) rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const strength = card.classList.contains("winner-card") ? 3.5 : 5;

        targetX = (0.5 - y) * strength;
        targetY = (x - 0.5) * strength;

        if (!frame) frame = requestAnimationFrame(applyTilt);
      };

      const reset = () => {
        rect = null;
        targetX = 0;
        targetY = 0;
        card.classList.remove("is-tilting");
        card.style.transform = "";
      };

      card.addEventListener("pointerenter", () => {
        rect = card.getBoundingClientRect();
        card.classList.add("is-tilting");
      });

      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", reset);
    });
  }

  /* Gravity Field: a cursor-driven particle field with click snapback */
  if (!reduceMotion.matches) {
    const canvas = $("#gravityCanvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    const cursorElement = $("#gravityCursor");

    if (canvas && ctx) {
      const root = document.documentElement;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

      const CONFIG = {
        particleCount: 180,
        gravity: 0.075,
        orbitForce: 0.12,
        damping: 0.985,
        maxSpeed: 8,
        influenceRadius: 300,
        particleSize: 1.7,
        connectionRadius: 150,
        maxConnections: 65,
        shockwaveStrength: 10,
        shockwaveRadius: 260,
        snapRadius: 300,
        snapScale: 0.1
      };

      let width = window.innerWidth;
      let height = window.innerHeight;
      let dpr = 1;

      const mouse = {
        x: width / 2,
        y: height / 2,
        active: false
      };

      const particles = [];
      const animatedParticles = new Set();
      const snapAnimations = [];
      const waves = [];

      const random = (min, max) => min + Math.random() * (max - min);

      /* Pre-rendered glow sprites keep the 180-particle field smooth. */
      const glowSprites = [];
      const spriteSize = 64;

      for (let i = 0; i < 18; i += 1) {
        const hue = 190 + (i / 17) * 90;
        const sprite = document.createElement("canvas");
        sprite.width = spriteSize;
        sprite.height = spriteSize;
        const spriteCtx = sprite.getContext("2d");
        const half = spriteSize / 2;
        const gradient = spriteCtx.createRadialGradient(half, half, 0, half, half, half);

        gradient.addColorStop(0, `hsla(${hue}, 100%, 72%, 0.9)`);
        gradient.addColorStop(0.22, `hsla(${hue}, 100%, 68%, 0.32)`);
        gradient.addColorStop(0.52, `hsla(${hue}, 100%, 62%, 0.08)`);
        gradient.addColorStop(1, `hsla(${hue}, 100%, 62%, 0)`);
        spriteCtx.fillStyle = gradient;
        spriteCtx.fillRect(0, 0, spriteSize, spriteSize);
        glowSprites.push(sprite);
      }

      class Particle {
        constructor() {
          this.reset();
        }

        reset() {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.vx = random(-0.3, 0.3);
          this.vy = random(-0.3, 0.3);
          this.size = random(0.7, CONFIG.particleSize + 0.5);
          this.hue = random(190, 280);
          this.phase = random(0, Math.PI * 2);
        }

        update() {
          if (animatedParticles.has(this)) return;

          if (!mouse.active) {
            this.x += this.vx;
            this.y += this.vy;
            this.phase += 0.025;
            return;
          }

          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.hypot(dx, dy);

          if (distance < CONFIG.influenceRadius && distance > 1) {
            const nx = dx / distance;
            const ny = dy / distance;
            const falloff = 1 - distance / CONFIG.influenceRadius;
            const force = CONFIG.gravity * falloff * falloff;

            this.vx += nx * force;
            this.vy += ny * force;
            this.vx += -ny * CONFIG.orbitForce * falloff;
            this.vy += nx * CONFIG.orbitForce * falloff;
          }

          const speed = Math.hypot(this.vx, this.vy);
          if (speed > CONFIG.maxSpeed) {
            this.vx = (this.vx / speed) * CONFIG.maxSpeed;
            this.vy = (this.vy / speed) * CONFIG.maxSpeed;
          }

          this.vx *= CONFIG.damping;
          this.vy *= CONFIG.damping;
          this.x += this.vx;
          this.y += this.vy;

          if (this.x < -5) this.x = width + 5;
          if (this.x > width + 5) this.x = -5;
          if (this.y < -5) this.y = height + 5;
          if (this.y > height + 5) this.y = -5;

          this.phase += 0.025;
        }

        draw() {
          const pulse = 0.65 + Math.sin(this.phase) * 0.25;
          const sprite = glowSprites[
            Math.min(17, Math.max(0, Math.round(((this.hue - 190) / 90) * 17)))
          ];
          const glowSize = this.size * 18;

          ctx.globalAlpha = pulse * 0.9;
          ctx.drawImage(sprite, this.x - glowSize / 2, this.y - glowSize / 2, glowSize, glowSize);
          ctx.globalAlpha = 1;

          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${this.hue}, 100%, 78%, ${pulse})`;
          ctx.fill();
        }
      }

      const particleTotal =
        coarsePointer || window.innerWidth < 760 ? 100 : CONFIG.particleCount;
      for (let i = 0; i < particleTotal; i += 1) {
        particles.push(new Particle());
      }

      const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      };

      const showCursor = (x, y) => {
        if (!finePointer.matches) return;
        root.classList.add("has-gravity-cursor");
        document.body.classList.add("cursor-visible");
        if (cursorElement) {
          cursorElement.style.left = `${x}px`;
          cursorElement.style.top = `${y}px`;
        }
      };

      const hideCursor = () => {
        root.classList.remove("has-gravity-cursor");
        document.body.classList.remove("cursor-visible");
      };

      const movePointer = (x, y) => {
        mouse.x = x;
        mouse.y = y;
        mouse.active = true;
        showCursor(x, y);
      };

      const drawConnections = () => {
        if (!mouse.active) return;

        let connections = 0;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        for (const particle of particles) {
          if (connections >= CONFIG.maxConnections) break;

          const dx = mouse.x - particle.x;
          const dy = mouse.y - particle.y;
          const distance = Math.hypot(dx, dy);

          if (distance < CONFIG.connectionRadius) {
            const opacity = (1 - distance / CONFIG.connectionRadius) * 0.82;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(176, 152, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            connections += 1;
          }
        }

        ctx.restore();
      };

      const triggerGravitySnap = (x, y) => {
        const now = performance.now();

        for (const animation of snapAnimations) {
          animatedParticles.delete(animation.particle);
        }
        snapAnimations.length = 0;

        for (const particle of particles) {
          const dx = particle.x - x;
          const dy = particle.y - y;
          const distance = Math.hypot(dx, dy);

          if (distance > CONFIG.snapRadius) continue;

          snapAnimations.push({
            particle,
            originX: particle.x,
            originY: particle.y,
            originVX: particle.vx,
            originVY: particle.vy,
            targetX: x + dx * CONFIG.snapScale,
            targetY: y + dy * CONFIG.snapScale,
            vx: particle.vx * 0.15,
            vy: particle.vy * 0.15,
            phase: "pull",
            lastTime: now
          });
          animatedParticles.add(particle);
        }
      };

      const updateGravitySnap = (now) => {
        for (let i = snapAnimations.length - 1; i >= 0; i -= 1) {
          const animation = snapAnimations[i];
          const particle = animation.particle;
          const dt = Math.min(now - animation.lastTime, 24);
          animation.lastTime = now;
          const step = dt / 16.667;

          if (animation.phase === "pull") {
            const dx = animation.targetX - particle.x;
            const dy = animation.targetY - particle.y;
            const pullStrength = 0.018;

            animation.vx += dx * pullStrength * step;
            animation.vy += dy * pullStrength * step;

            const damping = Math.pow(0.88, step);
            animation.vx *= damping;
            animation.vy *= damping;

            const maxSpeed = 3.2;
            const speed = Math.hypot(animation.vx, animation.vy);
            if (speed > maxSpeed) {
              animation.vx = (animation.vx / speed) * maxSpeed;
              animation.vy = (animation.vy / speed) * maxSpeed;
            }

            particle.x += animation.vx * step;
            particle.y += animation.vy * step;

            const remaining = Math.hypot(animation.targetX - particle.x, animation.targetY - particle.y);
            const currentSpeed = Math.hypot(animation.vx, animation.vy);

            if (remaining < 1.5 && currentSpeed < 0.12) {
              particle.x = animation.targetX;
              particle.y = animation.targetY;
              animation.vx = 0;
              animation.vy = 0;
              animation.phase = "return";
            }
          } else {
            const dx = animation.originX - particle.x;
            const dy = animation.originY - particle.y;
            const returnStrength = 0.009;

            animation.vx += dx * returnStrength * step;
            animation.vy += dy * returnStrength * step;

            const damping = Math.pow(0.92, step);
            animation.vx *= damping;
            animation.vy *= damping;

            const maxSpeed = 1.8;
            const speed = Math.hypot(animation.vx, animation.vy);
            if (speed > maxSpeed) {
              animation.vx = (animation.vx / speed) * maxSpeed;
              animation.vy = (animation.vy / speed) * maxSpeed;
            }

            particle.x += animation.vx * step;
            particle.y += animation.vy * step;

            const remaining = Math.hypot(animation.originX - particle.x, animation.originY - particle.y);
            const currentSpeed = Math.hypot(animation.vx, animation.vy);

            if (remaining < 0.45 && currentSpeed < 0.04) {
              particle.x = animation.originX;
              particle.y = animation.originY;
              particle.vx = animation.originVX;
              particle.vy = animation.originVY;
              animatedParticles.delete(particle);
              snapAnimations.splice(i, 1);
            }
          }
        }
      };

      const shockwave = (x, y) => {
        waves.push({ x, y, radius: 0, alpha: 1 });

        for (const particle of particles) {
          if (animatedParticles.has(particle)) continue;

          const dx = particle.x - x;
          const dy = particle.y - y;
          const distance = Math.hypot(dx, dy);

          if (distance < CONFIG.shockwaveRadius && distance > 1) {
            const strength =
              CONFIG.shockwaveStrength * (1 - distance / CONFIG.shockwaveRadius);
            particle.vx += (dx / distance) * strength;
            particle.vy += (dy / distance) * strength;
          }
        }
      };

      const drawWaves = () => {
        for (let i = waves.length - 1; i >= 0; i -= 1) {
          const wave = waves[i];
          wave.radius += 5;
          wave.alpha -= 0.018;

          if (wave.alpha <= 0) {
            waves.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(167, 139, 250, ${wave.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#8b5cf6";
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      };

      const handleClick = (x, y) => {
        movePointer(x, y);
        triggerGravitySnap(x, y);
        shockwave(x, y);
      };

      const animate = (now) => {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);

        updateGravitySnap(now);

        for (const particle of particles) particle.update();
        drawConnections();
        for (const particle of particles) particle.draw();
        drawWaves();
      };

      window.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "touch") {
          movePointer(event.clientX, event.clientY);
        } else {
          mouse.x = event.clientX;
          mouse.y = event.clientY;
          mouse.active = true;
        }
      }, { passive: true });

      window.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        handleClick(event.clientX, event.clientY);
      }, { passive: true });

      document.addEventListener("pointerenter", () => {
        mouse.active = true;
      });

      document.documentElement.addEventListener("pointerleave", () => {
        mouse.active = false;
        hideCursor();
      });

      window.addEventListener("blur", () => {
        mouse.active = false;
        hideCursor();
      });

      window.addEventListener("resize", resize, { passive: true });

      resize();
      requestAnimationFrame(animate);
    }
  }

  /* Faculty photos: fade in when available, otherwise show initials */
  $$(".faculty-mark img").forEach((image) => {
    const mark = image.closest(".faculty-mark");
    if (!mark) return;

    image.addEventListener("load", () => mark.classList.add("is-loaded"));
    image.addEventListener("error", () => mark.classList.add("is-fallback"));

    if (image.complete) {
      if (image.naturalWidth > 0) mark.classList.add("is-loaded");
      else mark.classList.add("is-fallback");
    }
  });

  /* Student photo fallbacks: .jpg, then .png, then initials */
  $$(".portrait img").forEach((image) => {
    const portrait = image.closest(".portrait");
    let triedPng = false;

    const revealImage = () => {
      if (portrait) portrait.classList.add("is-loaded");
    };

    const handleError = () => {
      const fallback = image.dataset.fallback;
      if (!triedPng && fallback) {
        triedPng = true;
        image.src = fallback;
        return;
      }

      if (portrait) portrait.classList.add("is-fallback");
    };

    image.addEventListener("load", revealImage);
    image.addEventListener("error", handleError);

    if (image.complete) {
      if (image.naturalWidth > 0) revealImage();
      else handleError();
    }
  });

  /* Copy email with toast feedback */
  const copyButton = $("#copyEmail");
  const toast = $("#toast");
  let toastTimer = null;

  const showToast = (message) => {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        /* Fall through to the older copy path. */
      }
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.left = "-9999px";
    document.body.appendChild(helper);
    helper.select();

    try {
      const copied = document.execCommand("copy");
      helper.remove();
      return copied;
    } catch (error) {
      helper.remove();
      return false;
    }
  };

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const email = copyButton.dataset.email;
      if (!email) return;

      try {
        const copied = await copyText(email);
        const label = $(".copy-label", copyButton);
        if (label) label.textContent = copied ? "Copied" : "Copy failed";
        showToast(copied ? "Email copied — talk soon." : `Email: ${email}`);
        setTimeout(() => {
          if (label) label.textContent = "Copy email";
        }, 2200);
      } catch (error) {
        showToast(`Email: ${email}`);
      }
    });
  }
})();
