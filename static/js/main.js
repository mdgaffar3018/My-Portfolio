/* ═══════════════════════════════════════════════════
   ADVANCED PORTFOLIO — MAIN JAVASCRIPT
   Dynamic theme engine, Command palette, Mock IDE, Tabbed SVG skills, etc.
   ═══════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {

    /* ── Theme Engine ───────────────────────────── */
    const themeDropdownBtn = document.getElementById("themeDropdownBtn");
    const themeMenu = document.getElementById("themeMenu");
    const currentTheme = localStorage.getItem("portfolio-theme") || "midnight-gold";

    // Set initial theme
    document.documentElement.setAttribute("data-theme", currentTheme);

    // Toggle theme menu
    if (themeDropdownBtn && themeMenu) {
        themeDropdownBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            themeMenu.classList.toggle("active");
        });
        document.addEventListener("click", () => {
            themeMenu.classList.remove("active");
        });
    }

    // Set theme on click
    document.querySelectorAll("[data-set-theme]").forEach(item => {
        item.addEventListener("click", (e) => {
            const theme = e.currentTarget.getAttribute("data-set-theme");
            document.documentElement.setAttribute("data-theme", theme);
            localStorage.setItem("portfolio-theme", theme);
            showToast(`Theme switched to ${e.currentTarget.textContent.trim()}`, false);
        });
    });

    /* ── Preloader & Scroll Progress ───────────── */
    const preloader = document.getElementById("preloader");
    window.addEventListener("load", () => {
        setTimeout(() => { if (preloader) preloader.classList.add("hidden"); }, 600);
    });
    setTimeout(() => { if (preloader) preloader.classList.add("hidden"); }, 3000);

    const scrollProgress = document.getElementById("scrollProgress");
    function updateScrollProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (scrollProgress) scrollProgress.style.width = progress + "%";
    }
    window.addEventListener("scroll", updateScrollProgress);

    /* ── Interactive Particle Canvas ───────────── */
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
                this.size = Math.random() * 2 + 0.6;
                this.baseSpeedX = (Math.random() - 0.5) * 0.4;
                this.baseSpeedY = (Math.random() - 0.5) * 0.4;
                this.speedX = this.baseSpeedX;
                this.speedY = this.baseSpeedY;
                this.opacity = Math.random() * 0.4 + 0.15;
            }
            update() {
                const dx = this.x - mouseX;
                const dy = this.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    const force = (120 - dist) / 120;
                    this.speedX = this.baseSpeedX + (dx / dist) * force * 1.5;
                    this.speedY = this.baseSpeedY + (dy / dist) * force * 1.5;
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
                const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
                ctx.fillStyle = accentColor ? `${accentColor}cc` : `rgba(212, 162, 58, ${this.opacity})`;
                ctx.fill();
            }
        }

        function initParticles() {
            const count = Math.min(Math.floor((canvas.width * canvas.height) / 9000), 100);
            particles = Array.from({ length: count }, () => new Particle());
        }
        initParticles();

        function connectParticles() {
            const accentSec = getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim();
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 130) {
                        const opacity = (1 - dist / 130) * 0.12;
                        ctx.beginPath();
                        ctx.strokeStyle = accentSec ? `${accentSec}1e` : `rgba(232, 168, 124, ${opacity})`;
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
            "build robust backends.",
            "engineer with Python.",
            "design smooth interfaces.",
            "build full-stack Flask apps.",
            "optimize SQL database logic."
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

            let delay = deleting ? 30 : 60;
            if (!deleting && charIdx === current.length) {
                delay = 2200;
                deleting = true;
            } else if (deleting && charIdx === 0) {
                deleting = false;
                wordIdx = (wordIdx + 1) % words.length;
                delay = 300;
            }
            setTimeout(type, delay);
        }
        type();
    }

    /* ── Navbar Burger Menu Toggle ─────────────── */
    const navbar = document.getElementById("navbar");
    const navToggle = document.getElementById("navToggle");
    const navMenu = document.getElementById("navMenu");
    const navLinks = document.querySelectorAll(".nav-link");

    window.addEventListener("scroll", () => {
        if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 40);
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

    // Scroll Spy navigation active state sync
    const sections = document.querySelectorAll("section[id]");
    function scrollSpy() {
        const scrollY = window.scrollY + 150;
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

    /* ── Scroll Reveal Trigger ──────────────────── */
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

    // Stagger counters
    const counterObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.getAttribute("data-target"), 10);
                    let current = 0;
                    const step = Math.max(1, Math.floor(target / 40));
                    const timer = setInterval(() => {
                        current += step;
                        if (current >= target) { current = target; clearInterval(timer); }
                        el.textContent = current;
                    }, 35);
                    counterObserver.unobserve(el);
                }
            });
        },
        { threshold: 0.5 }
    );
    document.querySelectorAll(".stat-number[data-target]").forEach(el => counterObserver.observe(el));


    /* ── Circular SVG Skills Loader ────────────── */
    function animateRadialSkills(container) {
        const fillElements = container.querySelectorAll(".progress-ring-fill");
        fillElements.forEach(fill => {
            const pct = parseInt(fill.getAttribute("data-pct"), 10);
            const radius = fill.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;
            
            // Set transitions and offsets
            fill.style.strokeDasharray = `${circumference} ${circumference}`;
            fill.style.strokeDashoffset = circumference;
            
            // Animate label
            const label = fill.parentElement.parentElement.querySelector(".progress-percentage-label");
            let count = 0;
            const interval = setInterval(() => {
                count += Math.ceil(pct / 30);
                if (count >= pct) {
                    count = pct;
                    clearInterval(interval);
                }
                if (label) label.textContent = `${count}%`;
            }, 30);

            setTimeout(() => {
                const offset = circumference - (pct / 100) * circumference;
                fill.style.strokeDashoffset = offset;
            }, 100);
        });
    }

    // Trigger skills on view
    const skillsObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateRadialSkills(entry.target);
                    skillsObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.2 }
    );
    const activePane = document.querySelector(".skills-pane.active");
    if (activePane) skillsObserver.observe(activePane);

    /* ── Technical Skills Tabs ─────────────────── */
    const tabButtons = document.querySelectorAll(".tab-btn");
    const skillPanes = document.querySelectorAll(".skills-pane");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const tabId = btn.getAttribute("data-tab-id");
            skillPanes.forEach(pane => {
                pane.classList.remove("active");
                if (pane.getAttribute("id") === tabId) {
                    pane.classList.add("active");
                    // Animate SVG meters inside this active tab
                    animateRadialSkills(pane);
                }
            });
        });
    });

    /* ── Command Palette (Ctrl+K) ──────────────── */
    const cmdPalette = document.getElementById("cmdPalette");
    const cmdPaletteBtn = document.getElementById("cmdPaletteBtn");
    const cmdSearchInput = document.getElementById("cmdSearchInput");
    const cmdResults = document.getElementById("cmdResults");

    function togglePalette() {
        if (!cmdPalette) return;
        cmdPalette.classList.toggle("active");
        if (cmdPalette.classList.contains("active")) {
            setTimeout(() => cmdSearchInput.focus(), 150);
            cmdSearchInput.value = "";
            filterPaletteItems("");
        }
    }

    if (cmdPaletteBtn) cmdPaletteBtn.addEventListener("click", togglePalette);

    // Keyboard Shortcuts
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            togglePalette();
        }
        if (e.key === "Escape" && cmdPalette && cmdPalette.classList.contains("active")) {
            togglePalette();
        }
    });

    if (cmdPalette) {
        cmdPalette.addEventListener("click", (e) => {
            if (e.target === cmdPalette) togglePalette();
        });
    }

    // Filter Command Items
    if (cmdSearchInput) {
        cmdSearchInput.addEventListener("input", (e) => {
            filterPaletteItems(e.target.value.toLowerCase().trim());
        });
    }

    function filterPaletteItems(query) {
        const items = document.querySelectorAll(".cmd-item");
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(query)) {
                item.style.display = "flex";
            } else {
                item.style.display = "none";
            }
        });

        // Set first matching element as active
        const visibleItems = document.querySelectorAll(".cmd-item[style='display: flex;']");
        items.forEach(it => it.classList.remove("active"));
        if (visibleItems.length > 0) {
            visibleItems[0].classList.add("active");
        }
    }

    // Trigger action when clicking a command palette item
    document.querySelectorAll(".cmd-item").forEach(item => {
        item.addEventListener("click", () => {
            triggerCommand(item);
        });
    });

    // Keyboard nav inside palette
    if (cmdSearchInput) {
        cmdSearchInput.addEventListener("keydown", (e) => {
            const items = Array.from(document.querySelectorAll(".cmd-item[style='display: flex;']"));
            if (items.length === 0) return;

            let activeIdx = items.findIndex(it => it.classList.contains("active"));

            if (e.key === "ArrowDown") {
                e.preventDefault();
                items.forEach(it => it.classList.remove("active"));
                activeIdx = (activeIdx + 1) % items.length;
                items[activeIdx].classList.add("active");
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                items.forEach(it => it.classList.remove("active"));
                activeIdx = (activeIdx - 1 + items.length) % items.length;
                items[activeIdx].classList.add("active");
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (activeIdx >= 0) {
                    triggerCommand(items[activeIdx]);
                }
            }
        });
    }

    function triggerCommand(item) {
        const action = item.getAttribute("data-action");
        const target = item.getAttribute("data-target");

        togglePalette(); // close palette

        if (action === "nav") {
            const targetEl = document.querySelector(target);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        } else if (action === "theme") {
            document.documentElement.setAttribute("data-theme", target);
            localStorage.setItem("portfolio-theme", target);
            const themeLabel = item.querySelector("span").textContent;
            showToast(`Theme switched to ${themeLabel}`, false);
        } else if (action === "exec") {
            if (target === "copy-email") {
                navigator.clipboard.writeText("gaffarofficial3018@gmail.com")
                    .then(() => showToast("Email copied to clipboard!", false))
                    .catch(() => showToast("Failed to copy email.", true));
            } else if (target === "github-profile") {
                window.open("https://github.com/mdgaffar3018", "_blank");
            }
        }
    }


    /* ── Mock IDE File Explorer ────────────────── */
    const treeFiles = document.querySelectorAll(".tree-file");
    const editorTabs = document.getElementById("editorTabs");
    const paneTerminal = document.getElementById("pane-terminal-sh");
    const paneCodeViewer = document.getElementById("pane-code-viewer");
    const codeContentEl = document.getElementById("codeViewerContent");

    const mockFiles = {
        "terminal.sh": { type: "terminal" },
        "about.py": {
            type: "code",
            lang: "python",
            content: `class Developer:
    def __init__(self):
        self.name = "Mohammed Gaffar"
        self.role = "College Computer Science Student"
        self.location = "India"
        self.hobbies = ["Algorithms", "Hardware Projects", "Web Architecture"]
        self.core_stack = ["Python", "Flask", "SQLite", "JavaScript"]

    def fetch_status(self):
        return "Always learning, building backends, and coding daily."

# Instantiate developer details
gaffar = Developer()
print(f"{gaffar.name} -- {gaffar.role}")
print(gaffar.fetch_status())`
        },
        "skills.json": {
            type: "code",
            lang: "json",
            content: `{
  "languages": {
    "python": "Expert (Backend & Automation)",
    "javascript": "Intermediate (Dom Manipulation & Scripts)",
    "sql": "Intermediate (DB Schema Architecture)",
    "html_css": "Advanced (Responsive Layouts)"
  },
  "frameworks": {
    "flask": "Proficient",
    "nodejs": "Familiar"
  },
  "databases_and_tools": [
    "PostgreSQL",
    "SQLite",
    "Git",
    "GitHub Sync Engine",
    "VS Code"
  ]
}`
        },
        "contact.sh": {
            type: "code",
            lang: "bash",
            content: `#!/bin/bash

# Contact Details for Mohammed Gaffar
EMAIL="gaffarofficial3018@gmail.com"
GITHUB="https://github.com/mdgaffar3018"
AVAILABILITY="Open to open-source contributions & web backend contracts."

echo "Get in touch at: $EMAIL"
echo "Check portfolio source code at: $GITHUB"
echo "Status: $AVAILABILITY"`
        }
    };

    // Load selected file in editor mock
    function loadIDEFile(filename) {
        // Toggle file tree active styling
        treeFiles.forEach(file => {
            file.classList.toggle("active", file.getAttribute("data-file") === filename);
        });

        // Set Tab UI
        if (editorTabs) {
            let tabIcon = "fa-terminal";
            if (filename.endsWith(".py")) tabIcon = "fa-python text-python";
            else if (filename.endsWith(".json")) tabIcon = "fa-brackets-curly text-json";
            else if (filename.endsWith(".sh") && filename !== "terminal.sh") tabIcon = "fa-file-code text-sh";

            editorTabs.innerHTML = `
                <div class="ide-tab active" data-file="${filename}">
                    <i class="fas ${tabIcon}"></i>
                    <span>${filename}</span>
                </div>
            `;
        }

        // Toggle Panes
        const fileData = mockFiles[filename];
        if (fileData) {
            if (fileData.type === "terminal") {
                paneCodeViewer.classList.remove("active");
                paneTerminal.classList.add("active");
            } else {
                paneTerminal.classList.remove("active");
                paneCodeViewer.classList.add("active");
                if (codeContentEl) {
                    codeContentEl.textContent = fileData.content;
                }
            }
        }
    }

    treeFiles.forEach(file => {
        file.addEventListener("click", () => {
            loadIDEFile(file.getAttribute("data-file"));
        });
    });


    /* ── Terminal Commands Shell ────────────────── */
    const terminalInput = document.getElementById("terminalInput");
    const terminalBody = document.getElementById("terminalBody");

    if (terminalInput && terminalBody) {
        // Force input focus on terminal click
        document.querySelector(".ide-editor-body").addEventListener("click", (e) => {
            if (window.innerWidth > 768 || e.target === terminalInput) {
                terminalInput.focus();
            }
        });

        const shellCommands = {
            help: `Available commands:
  help       - Display list of workspace options
  whoami     - Learn more about the workspace author
  skills     - View programming competency categories
  projects   - Show overall stats of synced projects
  education  - Print educational progress summary
  cat <file> - Concatenate and display mock file (e.g. cat about.py)
  clear      - Clear terminal screen
  sudo       - Elevate terminal permissions`,
            whoami: `Mohammed Gaffar
College Computer Science Student.
Passionate about writing backends in Python, database mapping, and automation.`,
            skills: `• Python & Flask (Backend automation structures)
• JavaScript (Interactive DOM states)
• SQL (SQLite/PostgreSQL schema designs)
• HTML5 & CSS3 stylesheets
• Git and continuous integration workflows`,
            projects: `Synced Repos: Synced directly via GitHub API.
Inspect the 'Works' section below to view individual repositories!`,
            education: `Currently enrolled in Computer Science studies.
Developing automation scripts, web structures, and practical software applications.`,
            sudo: `System Administrator alert: Access denied. Gaffar's workstation requires full credential bypass.`
        };

        const commandList = ["help", "whoami", "skills", "projects", "education", "clear", "sudo", "cat"];
        let commandHistory = [];
        let historyIndex = -1;

        function printToTerminal(text, isError = false) {
            const div = document.createElement("div");
            div.className = "terminal-output" + (isError ? " error" : "");
            div.innerHTML = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            terminalBody.insertBefore(div, terminalInput.parentElement);
        }

        function createPromptLine(cmd) {
            const div = document.createElement("div");
            div.className = "terminal-line";
            div.innerHTML = `<span class="terminal-prompt">gaffar@portfolio:~$</span> ${cmd}`;
            terminalBody.insertBefore(div, terminalInput.parentElement);
        }

        terminalInput.addEventListener("keydown", function (e) {
            // Up/Down Arrows
            if (e.key === "ArrowUp") {
                e.preventDefault();
                if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    this.value = commandHistory[commandHistory.length - 1 - historyIndex];
                }
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    this.value = commandHistory[commandHistory.length - 1 - historyIndex];
                } else if (historyIndex === 0) {
                    historyIndex = -1;
                    this.value = "";
                }
            }
            // Tab Complete
            else if (e.key === "Tab") {
                e.preventDefault();
                const currentVal = this.value.trim().toLowerCase();
                const match = commandList.find(cmd => cmd.startsWith(currentVal));
                if (match) {
                    this.value = match;
                }
            }
            // Execute
            else if (e.key === "Enter") {
                const fullCmd = this.value.trim();
                const cmdParts = fullCmd.toLowerCase().split(" ");
                const cmd = cmdParts[0];
                const arg = cmdParts[1];
                
                this.value = "";
                if (fullCmd === "") return;

                commandHistory.push(fullCmd);
                historyIndex = -1;

                createPromptLine(fullCmd);

                if (cmd === "clear") {
                    const children = Array.from(terminalBody.children);
                    children.forEach(child => {
                        if (child !== terminalInput.parentElement) {
                            child.remove();
                        }
                    });
                } else if (cmd === "cat") {
                    if (!arg) {
                        printToTerminal("Usage: cat <filename> (e.g. cat about.py)", true);
                    } else if (mockFiles[arg]) {
                        if (arg === "terminal.sh") {
                            printToTerminal("Cannot cat an active terminal stream.", true);
                        } else {
                            printToTerminal(mockFiles[arg].content);
                        }
                    } else {
                        printToTerminal(`cat: ${arg}: No such file or directory. Try: about.py, skills.json, contact.sh`, true);
                    }
                } else if (shellCommands[cmd]) {
                    printToTerminal(shellCommands[cmd]);
                } else {
                    printToTerminal(`Command not recognized: '${cmd}'. Enter 'help' for instructions.`, true);
                }

                terminalBody.scrollTop = terminalBody.scrollHeight;
            }
        });
    }

    /* ── Project Sorting Filters ───────────────── */
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
                    card.style.animation = `fadeInUp 0.4s ease ${idx * 0.05}s both`;
                } else {
                    card.classList.add("hidden");
                }
            });
        });
    });

    /* ── Contact Form Email Sender ─────────────── */
    const contactForm = document.getElementById("contactForm");
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toastMessage");

    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById("submitBtn");
            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending message...';
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
                    showToast(data.error || "Failed to process message.", true);
                }
            } catch {
                showToast("Network dispatch error. Please verify mail connection.", true);
            }

            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        });
    }

    function showToast(message, isError) {
        if (!toast || !toastMsg) return;
        toastMsg.textContent = message;
        toast.classList.toggle("error", isError);
        toast.querySelector(".toast-icon i").className = isError
            ? "fas fa-exclamation-circle"
            : "fas fa-check-circle";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 4000);
    }

    /* ── Navigation Actions & back to top ──────── */
    const backToTop = document.getElementById("backToTop");
    if (backToTop) {
        window.addEventListener("scroll", () => {
            backToTop.classList.toggle("visible", window.scrollY > 400);
        });
        backToTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

});
