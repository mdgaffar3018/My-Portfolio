"""
Advanced Portfolio Website — Flask Backend
Auto-fetches repos from GitHub so new projects appear automatically.
"""
import os
import time
import smtplib
import json
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# ── Configuration ──────────────────────────────────────────────
GITHUB_USERNAME = "mdgaffar3018"
GITHUB_API_URL = f"https://api.github.com/users/{GITHUB_USERNAME}/repos"
CACHE_TTL = 600  # refresh every 10 minutes

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
RECIPIENT_EMAIL = os.getenv("RECIPIENT_EMAIL", SMTP_EMAIL)

# ── GitHub Repo Cache ──────────────────────────────────────────
_cache = {"projects": None, "timestamp": 0}

# Custom enrichment data — keyed by EXACT repo name.
# Any repo NOT listed here still shows up, just with auto-generated info.
REPO_ENRICHMENT = {
    "Nova-Multiflix-Website": {
        "title": "Nova Multiflix — Streaming Website",
        "category": "web",
        "description": "A movie streaming website built with Flask, featuring a modern UI with HTML/CSS/JS and a Python backend. Deployed on Vercel.",
        "tech": ["Python", "Flask", "HTML", "CSS", "JavaScript"],
        "image": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
        "live": "https://nova-multiflix-website.vercel.app",
    },
    "portfolio": {
        "title": "Portfolio Website",
        "category": "web",
        "description": "Personal portfolio website showcasing projects and skills. Built with Flask backend and custom CSS frontend, hosted on PythonAnywhere.",
        "tech": ["Python", "Flask", "HTML", "CSS"],
        "image": "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=600&q=80",
        "live": "https://gaffarportfolio.pythonanywhere.com",
    },
    "Finance-Tracker-Desktop-App": {
        "title": "Finance Tracker — Desktop App",
        "category": "desktop",
        "description": "Python app using SQL + PyQt6 GUI to track personal finances. Features income/expense logging, category breakdowns, and visual charts.",
        "tech": ["Python", "PyQt6", "SQL", "SQLite"],
        "image": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
        "live": "#",
    },
}

# Language → tech-tag mapping for auto-detected repos
LANG_MAP = {
    "Python": "Python", "HTML": "HTML", "CSS": "CSS",
    "JavaScript": "JavaScript", "TypeScript": "TypeScript",
    "Java": "Java", "C++": "C++", "C": "C", "Shell": "Shell",
    "Jupyter Notebook": "Jupyter",
}

# Stock images for auto-detected repos (rotates)
DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80",
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80",
]


def _beautify_name(repo_name: str) -> str:
    """Turn 'My-Cool-Repo' into 'My Cool Repo'."""
    return repo_name.replace("-", " ").replace("_", " ").title()


def _detect_category(languages: dict) -> str:
    """Guess project category from its language breakdown."""
    langs = {k.lower() for k in languages}
    if langs & {"html", "css", "javascript", "typescript"}:
        return "web"
    return "desktop"


def fetch_github_projects() -> list:
    """Fetch public repos from GitHub API and merge with enrichment data."""
    now = time.time()
    if _cache["projects"] and (now - _cache["timestamp"]) < CACHE_TTL:
        return _cache["projects"]

    try:
        resp = requests.get(
            GITHUB_API_URL,
            params={"sort": "updated", "per_page": 30},
            timeout=8,
            headers={"Accept": "application/vnd.github.v3+json"},
        )
        resp.raise_for_status()
        repos = resp.json()
    except Exception as e:
        print(f"[GitHub API] Error: {e}")
        # Return cached data or hardcoded fallback
        if _cache["projects"]:
            return _cache["projects"]
        return _fallback_projects()

    projects = []
    for idx, repo in enumerate(repos):
        if repo.get("fork"):        # skip forks
            continue

        name = repo["name"]
        enrichment = REPO_ENRICHMENT.get(name, {})

        # Detect tech from GitHub languages endpoint
        tech = enrichment.get("tech")
        if not tech:
            try:
                lang_resp = requests.get(repo["languages_url"], timeout=5)
                lang_resp.raise_for_status()
                tech = [LANG_MAP.get(l, l) for l in lang_resp.json().keys()]
            except Exception:
                tech = [repo.get("language", "Python")] if repo.get("language") else ["Python"]

        project = {
            "id": idx + 1,
            "title": enrichment.get("title", _beautify_name(name)),
            "category": enrichment.get("category", _detect_category(tech)),
            "description": enrichment.get("description", repo.get("description") or f"A {repo.get('language', 'Python')} project."),
            "tech": tech,
            "image": enrichment.get("image", DEFAULT_IMAGES[idx % len(DEFAULT_IMAGES)]),
            "github": repo["html_url"],
            "live": enrichment.get("live", repo.get("homepage") or "#"),
        }
        projects.append(project)

    _cache["projects"] = projects
    _cache["timestamp"] = now
    return projects


def _fallback_projects() -> list:
    """Hardcoded fallback if GitHub API is completely unreachable."""
    return [
        {"id": i + 1, **data, "github": f"https://github.com/{GITHUB_USERNAME}/{name}"}
        for i, (name, data) in enumerate(REPO_ENRICHMENT.items())
    ]


SKILLS = {
    "Languages": [
        {"name": "Python", "level": 90},
        {"name": "HTML", "level": 85},
        {"name": "CSS", "level": 80},
        {"name": "SQL", "level": 75},
    ],
    "Tools & Workflow": [
        {"name": "VS Code", "level": 88},
        {"name": "Git & GitHub", "level": 80},
    ],
}


# ── Routes ─────────────────────────────────────────────────────
@app.route("/")
def index():
    projects = fetch_github_projects()
    return render_template(
        "index.html",
        projects=projects,
        skills=SKILLS,
        project_count=len(projects),
    )


@app.route("/api/projects")
def api_projects():
    projects = fetch_github_projects()
    category = request.args.get("category", "all")
    if category == "all":
        return jsonify(projects)
    filtered = [p for p in projects if p["category"] == category]
    return jsonify(filtered)


@app.route("/contact", methods=["POST"])
def contact():
    data = request.get_json() or request.form
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    subject = data.get("subject", "").strip()
    message = data.get("message", "").strip()

    if not all([name, email, message]):
        return jsonify({"success": False, "error": "Please fill in all required fields."}), 400

    # If SMTP credentials are configured, send email
    if SMTP_EMAIL and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart()
            msg["From"] = SMTP_EMAIL
            msg["To"] = RECIPIENT_EMAIL
            msg["Subject"] = f"Portfolio Contact: {subject or 'No Subject'}"

            body = f"""
New message from your portfolio website:

Name:    {name}
Email:   {email}
Subject: {subject}

Message:
{message}
"""
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
                server.send_message(msg)

            return jsonify({"success": True, "message": "Message sent successfully!"})
        except Exception as e:
            print(f"Email error: {e}")
            return jsonify({"success": False, "error": "Failed to send message. Please try again later."}), 500
    else:
        # No SMTP config — just log the message
        print(f"\n{'='*50}")
        print(f"NEW CONTACT MESSAGE")
        print(f"{'='*50}")
        print(f"Name:    {name}")
        print(f"Email:   {email}")
        print(f"Subject: {subject}")
        print(f"Message: {message}")
        print(f"{'='*50}\n")
        return jsonify({"success": True, "message": "Message received! (Email not configured — logged to console)"})


# ── Run ────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)
