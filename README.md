# AutoApply AI

A local-only autonomous job application system. Scrapes job portals, generates ATS-tailored LaTeX resumes via Groq LLM, auto-fills application forms with Playwright, and sends cold emails — all from your machine. Nothing leaves your network except LLM API calls.

---

## Architecture

```
Frontend (React + Vite :5173)
    ↕ REST + WebSocket
Backend (FastAPI :8000)
    ├── LangGraph Workflows
    │   ├── Portal Apply Flow  →  Scrape → JD Parse → Resume → Apply
    │   └── Cold Email Flow    →  Excel → Classify → Resume → Send
    ├── Services
    │   ├── LLM Router         →  Groq (primary) / Ollama (local) / HuggingFace (fallback)
    │   ├── LaTeX Compiler     →  pdflatex → PDF
    │   ├── QA Cache           →  ChromaDB semantic cache for form Q&A
    │   └── Email Sender       →  Gmail SMTP SSL, 40/day hard limit
    └── SQLite                 →  Jobs, Applications, Emails, Run Logs
```

---

## Requirements

- Python 3.11+
- Node.js 18+
- [pdflatex](https://www.latex-project.org/get/) (MiKTeX on Windows)
- [Ollama](https://ollama.com) running locally (for local LLM + embeddings)
- A [Groq](https://console.groq.com) API key (free tier)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) (for cold email)

---

## Quick Start

### 1. Clone & install Python deps

```bash
git clone <repo-url>
cd agentic
py -m pip install -r requirements.txt
py -m playwright install chromium
```

### 2. Pull Ollama models

```bash
ollama pull phi3:mini
ollama pull gemma2:2b
ollama pull nomic-embed-text
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in at minimum:

```env
GROQ_API_KEY=gsk_...          # Required — get from console.groq.com
LINKEDIN_EMAIL=you@gmail.com  # Portal login credentials
LINKEDIN_PASSWORD=yourpassword
```

For cold email:
```env
GMAIL_ADDRESS=you@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

For Google job discovery (optional, free 2,500/month):
```env
SERPER_API_KEY=your_key       # Get from serper.dev
```

### 4. Add your resume & profile

- Place your LaTeX resume at `gaurav_resume_final.tex` (root)
- Verify `master_profile.json` has your skills, experience, and education

### 5. Start the backend

```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

The API auto-creates `data/autoapply.db` on first start.

### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Usage

### Portal Apply Pipeline

1. Open the dashboard → **Portal Apply Pipeline** panel
2. Select portal (LinkedIn / Naukri / Indeed / Wellfound / Cutshort)
3. Enter job title and location
4. Click **Start Run** — the pipeline will:
   - Scrape matching job listings
   - Fetch and parse each job description
   - Generate an ATS-tailored PDF resume (LaTeX → PDF)
   - Auto-fill and submit the application form
5. Watch live events in the **Live Events** feed
6. Check **Flagged** tab for jobs that need your attention (CAPTCHAs, external ATS redirects)

### Cold Email Campaign

1. Prepare an Excel/CSV with columns: `company`, `email`, `name` (contact name)
2. Open the dashboard → **Cold Emails** tab
3. Upload your file, enter Gmail credentials, set batch size
4. Click **Send Emails** — sends up to 40/day with delays to avoid spam filters

### Flagged Jobs

Jobs are flagged (not failed) when:
- A CAPTCHA was detected — open the job URL manually and solve it
- The apply button redirected to an external ATS — click the link in the Flagged tab to apply directly

Retry flagged jobs from the Flagged tab after handling them manually.

---

## Project Structure

```
agentic/
├── backend/
│   ├── api/           # FastAPI routers (runs, jobs, resumes, cold_email, dashboard, websocket)
│   ├── db/            # SQLite engine + init
│   ├── models/        # SQLModel tables (Job, Application, ColdEmailLog, RunLog)
│   ├── services/      # LLM router, LaTeX compiler, QA cache, email sender, portal templates
│   ├── config.py      # Pydantic-settings (all env vars)
│   └── main.py        # FastAPI app entry point
├── workflows/
│   ├── agents/        # jd_parser, resume, scraper, apply, discovery
│   ├── portal_apply_flow.py
│   ├── cold_email_flow.py
│   ├── state.py       # LangGraph state types
│   └── types.py       # ParsedJD, ApplyResult
├── frontend/          # Vite + React + TypeScript + TailwindCSS
├── tests/             # pytest unit + integration tests
├── data/              # SQLite DB + ChromaDB (gitignored)
├── resumes/           # Generated PDFs (gitignored)
├── screenshots/       # Playwright screenshots (gitignored)
├── logs/              # App logs (gitignored)
├── master_profile.json
├── gaurav_resume_final.tex
├── requirements.txt
└── .env.example
```

---

## Configuration Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | — | Groq API key (llama-3.3-70b-versatile) |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | Ollama server URL |
| `SERPER_API_KEY` | No | — | Serper.dev Google Search API (optional) |
| `LINKEDIN_EMAIL` | No | — | LinkedIn login email |
| `LINKEDIN_PASSWORD` | No | — | LinkedIn login password |
| `NAUKRI_EMAIL` | No | — | Naukri login email |
| `NAUKRI_PASSWORD` | No | — | Naukri login password |
| `GMAIL_ADDRESS` | For cold email | — | Gmail address |
| `GMAIL_APP_PASSWORD` | For cold email | — | Gmail App Password (not regular password) |
| `COLD_EMAIL_DAILY_LIMIT` | No | `40` | Max emails per day |
| `PLAYWRIGHT_HEADLESS` | No | `true` | Set `false` to watch the browser |
| `RESUME_MAX_RETRIES` | No | `3` | Max LLM retries for ATS score |
| `ATS_SCORE_THRESHOLD` | No | `85` | Minimum ATS keyword match % |
| `DAILY_SEARCH_LIMIT` | No | `100` | Max Serper searches per day |
| `FRONTEND_PORT` | No | `5173` | Frontend dev server port |

---

## Running Tests

```bash
py -m pytest tests/ -v
```

Integration tests (require Ollama + pdflatex running):
```bash
py -m pytest tests/integration/ -v
```

---

## Security Notes

- The backend binds to `127.0.0.1` only — not accessible from other machines
- Credentials are read from `.env` only, never logged or sent to the frontend
- CAPTCHAs are never bypassed — jobs are flagged for manual review
- Cold email has a hard 40/day limit enforced in code
- Gmail App Password is used, never your regular Google password
