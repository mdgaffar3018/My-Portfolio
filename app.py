"""
Advanced Portfolio Website — Flask Backend
100% auto-synced with GitHub — every repo change is reflected automatically.
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
CACHE_TTL = 60  # refresh every 60 seconds — catches renames/deletes fast

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
RECIPIENT_EMAIL = os.getenv("RECIPIENT_EMAIL", SMTP_EMAIL)

# ── GitHub Auto-Sync ───────────────────────────────────────────
_cache = {"projects": [], "categories": set(), "timestamp": 0}

# Language → tech-tag mapping
LANG_MAP = {
    "Python": "Python", "HTML": "HTML", "CSS": "CSS",
    "JavaScript": "JavaScript", "TypeScript": "TypeScript",
    "Java": "Java", "C++": "C++", "C": "C", "C#": "C#",
    "Shell": "Shell", "Jupyter Notebook": "Jupyter",
    "PHP": "PHP", "Ruby": "Ruby", "Go": "Go", "Rust": "Rust",
    "Dart": "Dart", "Kotlin": "Kotlin", "Swift": "Swift",
}

# Rotating stock images by primary language
LANG_IMAGES = {
    "python":     "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&q=80",
    "html":       "https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=600&q=80",
    "css":        "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=600&q=80",
    "javascript": "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&q=80",
    "java":       "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80",
}
DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80",
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80",
]


def _beautify_name(repo_name):
    """Turn 'My-Cool-Repo' into 'My Cool Repo'."""
    return repo_name.replace("-", " ").replace("_", " ").title()


def _pick_image(primary_lang, idx):
    """Pick a relevant image based on the primary language."""
    if primary_lang:
        img = LANG_IMAGES.get(primary_lang.lower())
        if img:
            return img
    return DEFAULT_IMAGES[idx % len(DEFAULT_IMAGES)]


def _detect_category(langs):
    """Guess project category from its language list."""
    lower = {l.lower() for l in langs}
    if lower & {"html", "css", "javascript", "typescript", "php"}:
        return "web"
    if lower & {"dart", "kotlin", "swift"}:
        return "mobile"
    return "desktop"


def _build_description(repo):
    """Build a description from GitHub data."""
    # Use GitHub description if set
    if repo.get("description"):
        return repo["description"]
    # Auto-generate a simple one
    lang = repo.get("language") or "code"
    return f"A {lang} project — check it out on GitHub."


def fetch_github_projects():
    """
    Fetch ALL public repos from GitHub API.
    Everything is dynamic — titles from repo names, descriptions from GitHub,
    live links from the homepage field, tech from the languages endpoint.
    Renames, deletions, and new repos are all reflected automatically.
    """
    now = time.time()
    if _cache["projects"] and (now - _cache["timestamp"]) < CACHE_TTL:
        return _cache["projects"], _cache["categories"]

    try:
        resp = requests.get(
            GITHUB_API_URL,
            params={"sort": "pushed", "direction": "desc", "per_page": 30},
            timeout=8,
            headers={"Accept": "application/vnd.github.v3+json"},
        )
        resp.raise_for_status()
        repos = resp.json()
    except Exception as e:
        print(f"[GitHub API] Error: {e}")
        if _cache["projects"]:
            return _cache["projects"], _cache["categories"]
        return [], set()

    projects = []
    categories = set()

    for idx, repo in enumerate(repos):
        if repo.get("fork"):
            continue

        name = repo["name"]
        primary_lang = repo.get("language")

        # Fetch languages from GitHub API
        try:
            lang_resp = requests.get(repo["languages_url"], timeout=5)
            lang_resp.raise_for_status()
            lang_data = lang_resp.json()
            tech = [LANG_MAP.get(l, l) for l in lang_data.keys()]
        except Exception:
            tech = [primary_lang] if primary_lang else ["Python"]

        if not tech:
            tech = [primary_lang] if primary_lang else ["Python"]

        category = _detect_category(tech)
        categories.add(category)

        # Live link: use GitHub homepage field (set in repo settings)
        live = repo.get("homepage") or "#"
        # Clean up empty strings
        if not live.strip():
            live = "#"

        project = {
            "id": idx + 1,
            "title": _beautify_name(name),
            "category": category,
            "description": _build_description(repo),
            "tech": tech,
            "image": _pick_image(primary_lang, idx),
            "github": repo["html_url"],
            "live": live,
        }
        projects.append(project)

    _cache["projects"] = projects
    _cache["categories"] = categories
    _cache["timestamp"] = now
    return projects, categories


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
    projects, categories = fetch_github_projects()
    return render_template(
        "index.html",
        projects=projects,
        skills=SKILLS,
        project_count=len(projects),
        categories=sorted(categories),
    )


@app.route("/api/projects")
def api_projects():
    projects, _ = fetch_github_projects()
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
