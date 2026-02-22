/* ═══════════════════════════════════════════════════
   ADVANCED PORTFOLIO — MAIN JAVASCRIPT
   Particle canvas, typing, scroll-reveal, counters,
   project filter, carousel, navbar, contact form,
   scroll progress, 3D tilt, magnetic buttons, text scramble
   ═══════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {

    /* ── Preloader ──────────────────────────────── */
    const preloader = document.getElementById("preloader");
    window.addEventListener("load", () => {
        setTimeout(() => preloader.classList.add("hidden"), 600);
    });
    setTimeout(() => preloader.classList.add("hidden"), 3000);

    /* ── Scroll Progress Bar ───────────────────── */
    const scrollProgress = document.getElementById("scrollProgress");
    function updateScrollProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        scrollProgress.style.width = progress + "%";
    }
    window.addEventListener("scroll", updateScrollProgress);

    /* ── Particle Canvas ───────────────────────── */
    const canvas = document.getElementById("particleCanvas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        let particles = [];
        let mouseX = -1000, mouseY = -1000;

        function resizeCanvas() {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
        }
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Track mouse for interactive particles
        canvas.parentElement.addEventListener("mousemove", (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });
        canvas.parentElement.addEventListener("mouseleave", () => {
            mouseX = -1000;
            mouseY = -1000;
        });

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.baseSpeedX = (Math.random() - 0.5) * 0.4;
                this.baseSpeedY = (Math.random() - 0.5) * 0.4;
                this.speedX = this.baseSpeedX;
                this.speedY = this.baseSpeedY;
                this.opacity = Math.random() * 0.5 + 0.1;
            }
            update() {
                // Mouse interaction - particles get pushed away
                const dx = this.x - mouseX;
                const dy = this.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    const force = (100 - dist) / 100;
                    this.speedX = this.baseSpeedX + (dx / dist) * force * 2;
                    this.speedY = this.baseSpeedY + (dy / dist) * force * 2;
                } else {
                    this.speedX += (this.baseSpeedX - this.speedX) * 0.05;
                    this.speedY += (this.baseSpeedY - this.speedY) * 0.05;
                }

                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(212, 162, 58, ${this.opacity})`;
                ctx.fill();
            }
        }

        function initParticles() {
            const count = Math.min(Math.floor((canvas.width * canvas.height) / 8000), 120);
            particles = Array.from({ length: count }, () => new Particle());
        }
        initParticles();

        function connectParticles() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        const opacity = (1 - dist / 120) * 0.15;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(232, 168, 124, ${opacity})`;
                        ctx.lineWidth = 0.6;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            connectParticles();
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    /* ── Typing Effect ─────────────────────────── */
    const typedEl = document.getElementById("typedText");
    if (typedEl) {
        const words = [
            "build things with code.",
            "love Python.",
            "create web apps.",
            "solve problems creatively.",
            "learn new tech daily."
        ];
        let wordIdx = 0, charIdx = 0, deleting = false;

        function type() {
            const current = words[wordIdx];
            if (deleting) {
                typedEl.textContent = current.substring(0, charIdx - 1);
                charIdx--;
            } else {
                typedEl.textContent = current.substring(0, charIdx + 1);
                charIdx++;
            }

            let delay = deleting ? 40 : 80;
            if (!deleting && charIdx === current.length) {
                delay = 2000;
                deleting = true;
            } else if (deleting && charIdx === 0) {
                deleting = false;
                wordIdx = (wordIdx + 1) % words.length;
                delay = 400;
            }
            setTimeout(type, delay);
        }
        type();
    }

    /* ── Navbar ─────────────────────────────────── */
    const navbar = document.getElementById("navbar");
    const navToggle = document.getElementById("navToggle");
    const navMenu = document.getElementById("navMenu");
    const navLinks = document.querySelectorAll(".nav-link");

    window.addEventListener("scroll", () => {
        navbar.classList.toggle("scrolled", window.scrollY > 60);
    });

    if (navToggle && navMenu) {
        navToggle.addEventListener("click", () => {
            navToggle.classList.toggle("active");
            navMenu.classList.toggle("active");
        });
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                navToggle.classList.remove("active");
                navMenu.classList.remove("active");
            });
        });
    }

    /* ── Smooth Scrolling with Parallax ─────────── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    /* ── Scroll Spy ────────────────────────────── */
    const sections = document.querySelectorAll("section[id]");
    function scrollSpy() {
        const scrollY = window.scrollY + 200;
        sections.forEach(sec => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            const id = sec.getAttribute("id");
            const link = document.querySelector(`.nav-link[data-section="${id}"]`);
            if (link) {
                link.classList.toggle("active", scrollY >= top && scrollY < top + height);
            }
        });
    }
    window.addEventListener("scroll", scrollSpy);

    /* ── Scroll Reveal (with Stagger) ──────────── */
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        },
        { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

    // Add stagger class to grid containers automatically
    document.querySelectorAll(".skills-grid, .projects-grid").forEach(grid => {
        grid.classList.add("reveal-stagger");
    });

    /* ── Animated Counters ─────────────────────── */
    const counterObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.getAttribute("data-target"), 10);
                    animateCounter(el, target);
                    counterObserver.unobserve(el);
                }
            });
        },
        { threshold: 0.5 }
    );
    document.querySelectorAll(".stat-number[data-target]").forEach(el =>
        counterObserver.observe(el)
    );

    function animateCounter(el, target) {
        let current = 0;
        const step = Math.max(1, Math.floor(target / 60));
        const timer = setInterval(() => {
            current += step;
            if (current >= target) { current = target; clearInterval(timer); }
            el.textContent = current;
        }, 30);
    }

    /* ── Skill Bar Animation ───────────────────── */
    const skillObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const fill = entry.target;
                    fill.style.width = fill.getAttribute("data-width") + "%";
                    skillObserver.unobserve(fill);
                }
            });
        },
        { threshold: 0.3 }
    );
    document.querySelectorAll(".skill-fill").forEach(el => skillObserver.observe(el));

    /* ── Project Filters ───────────────────────── */
    const filterBtns = document.querySelectorAll(".filter-btn");
    const projectCards = document.querySelectorAll(".project-card");

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filter = btn.getAttribute("data-filter");
            projectCards.forEach((card, idx) => {
                const cat = card.getAttribute("data-category");
                if (filter === "all" || cat === filter) {
                    card.classList.remove("hidden");
                    card.style.animation = `fadeInUp 0.5s var(--ease) ${idx * 0.08}s both`;
                } else {
                    card.classList.add("hidden");
                }
            });
        });
    });

    /* ── 3D Tilt Effect on Cards ───────────────── */
    document.querySelectorAll(".project-card, .skill-category, .timeline-card").forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
        });
    });

    /* ── Magnetic Button Effect ─────────────────── */
    document.querySelectorAll(".btn, .nav-cta, .social-link, .filter-btn").forEach(btn => {
        btn.addEventListener("mousemove", (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });
        btn.addEventListener("mouseleave", () => {
            btn.style.transform = "translate(0, 0)";
        });
    });

    /* ── Text Scramble Effect on Section Tags ──── */
    const chars = "!<>-_\\/[]{}—=+*^?#_ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    function scrambleText(el) {
        const original = el.textContent;
        let iteration = 0;
        const interval = setInterval(() => {
            el.textContent = original
                .split("")
                .map((char, index) => {
                    if (index < iteration) return original[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join("");
            iteration += 1 / 2;
            if (iteration >= original.length) {
                clearInterval(interval);
                el.textContent = original;
            }
        }, 30);
    }

    const scrambleObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    scrambleText(entry.target);
                    scrambleObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );
    document.querySelectorAll(".section-tag").forEach(el => scrambleObserver.observe(el));

    /* ── Parallax on Scroll ────────────────────── */
    function parallax() {
        const scrollY = window.scrollY;
        const heroContent = document.querySelector(".hero-content");
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
            heroContent.style.opacity = 1 - scrollY / 800;
        }
        // Aurora parallax
        document.querySelectorAll(".aurora-blob").forEach((blob, i) => {
            const speed = 0.05 + i * 0.02;
            blob.style.transform = `translateY(${scrollY * speed}px)`;
        });
    }
    window.addEventListener("scroll", parallax);

    /* ── Testimonial Carousel ──────────────────── */
    const track = document.getElementById("carouselTrack");
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");
    const dotsContainer = document.getElementById("carouselDots");

    if (track) {
        const slides = track.querySelectorAll(".testimonial-card");
        let currentSlide = 0;

        slides.forEach((_, i) => {
            const dot = document.createElement("div");
            dot.classList.add("dot");
            if (i === 0) dot.classList.add("active");
            dot.addEventListener("click", () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });

        function goToSlide(idx) {
            currentSlide = idx;
            track.style.transform = `translateX(-${idx * 100}%)`;
            dotsContainer.querySelectorAll(".dot").forEach((d, i) => {
                d.classList.toggle("active", i === idx);
            });
        }

        prevBtn.addEventListener("click", () => {
            goToSlide((currentSlide - 1 + slides.length) % slides.length);
        });
        nextBtn.addEventListener("click", () => {
            goToSlide((currentSlide + 1) % slides.length);
        });

        let autoPlay = setInterval(() => {
            goToSlide((currentSlide + 1) % slides.length);
        }, 5000);

        track.parentElement.addEventListener("mouseenter", () => clearInterval(autoPlay));
        track.parentElement.addEventListener("mouseleave", () => {
            autoPlay = setInterval(() => {
                goToSlide((currentSlide + 1) % slides.length);
            }, 5000);
        });

        // Swipe support for mobile
        let touchStart = 0;
        track.addEventListener("touchstart", (e) => { touchStart = e.touches[0].clientX; });
        track.addEventListener("touchend", (e) => {
            const diff = touchStart - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                diff > 0
                    ? goToSlide((currentSlide + 1) % slides.length)
                    : goToSlide((currentSlide - 1 + slides.length) % slides.length);
            }
        });
    }

    /* ── Contact Form ──────────────────────────── */
    const contactForm = document.getElementById("contactForm");
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMessage");

    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById("submitBtn");
            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            const formData = {
                name: document.getElementById("contactName").value,
                email: document.getElementById("contactEmail").value,
                subject: document.getElementById("contactSubject").value,
                message: document.getElementById("contactMessage").value,
            };

            try {
                const res = await fetch("/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                const data = await res.json();

                if (data.success) {
                    showToast(data.message, false);
                    contactForm.reset();
                } else {
                    showToast(data.error || "Something went wrong.", true);
                }
            } catch {
                showToast("Network error. Please try again.", true);
            }

            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        });
    }

    function showToast(message, isError) {
        toastMsg.textContent = message;
        toast.classList.toggle("error", isError);
        toast.querySelector(".toast-icon i").className = isError
            ? "fas fa-exclamation-circle"
            : "fas fa-check-circle";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 4000);
    }

    /* ── Back To Top ───────────────────────────── */
    const backToTop = document.getElementById("backToTop");
    window.addEventListener("scroll", () => {
        backToTop.classList.toggle("visible", window.scrollY > 500);
    });
    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

});
