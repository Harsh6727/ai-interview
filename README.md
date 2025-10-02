# AI Interview Assistant

A Vite-powered React (JavaScript) SPA with a lightweight Express API for running short, timed, resume-aware technical assessments.

Candidates upload a resume, confirm their details, take a multi-question test, and receive a score + summary. Interviewers get a searchable, sortable dashboard of completed attempts.

---

## ✨ Features

* **Resume upload & parsing** (PDF/DOCX/TXT) in the browser
* **Auto-extract candidate details** (name/email/phone) via OpenAI Assistants v2
* **Timed multi-question assessment** with per-question countdown
* **Prefetching** of the next question for a snappy flow
* **Autosave & quick resume** if a tab closes/reopens within 5 minutes
* **Interviewer dashboard**: search (name/email/phone), sort (date/score), view attempt details
* **Redux state model** with normalized results and attempt history
* **Modern UI** built with Tailwind CSS

---

## 🧱 Tech Stack

**Frontend:** React 18, Vite, Redux Toolkit, React-Redux, Tailwind CSS
**Parsing:** `pdfjs-dist` (PDF), `mammoth` (DOCX)
**Backend:** Node.js **18+** (uses global `fetch`, `FormData`, `Blob`), Express, CORS, dotenv
**AI:** OpenAI Files + Assistants v2 (resume field extraction); endpoints for question **generate/evaluate/summary**

---

## ⚙️ Requirements

* **Node.js 18+** (required for native `fetch`, `FormData`, `Blob` in the server)
* An **OpenAI API key**

---

## 🚀 Quickstart

```bash
# 1) Install dependencies (client + server)
npm install

# 2) Start Vite (frontend) and Express (API) together
npm run dev
# Frontend: http://localhost:5173
# API:      http://localhost:3001  (proxied from the Vite dev server)
```

### Production

```bash
npm run build   # Produces ./dist via Vite
npm start       # Runs Express, serving built assets + JSON APIs
```

---

## 🔐 Environment Variables

Create a `.env` in the project root:

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (defaults shown)
OPENAI_MODEL=gpt-4o           # Model used by /api/extract
OPENAI_ASSISTANT_ID=          # If omitted, server creates a temporary Assistant and cleans it up
```

> **Why Node 18+?** The `/api/extract` route converts base64 → `Blob` and sends it within `FormData` to OpenAI’s Files API—these are native in Node 18+.

---

## 🗂 Project Layout (highlights)

```
server/
  index.js                # Express entrypoint
  routes/
    extract.js            # /api/extract               (resume detail extraction)
    test-generate.js      # /api/test/generate         (builds a question)
    test-evaluate.js      # /api/test/evaluate         (grades an answer)
    test-summary.js       # /api/test/summary          (final score + summary)

src/
  App.jsx                 # Root app shell
  main.jsx                # Vite entry
  Providers.jsx           # Redux + persist providers
  IntervieweeTab.jsx      # Candidate flow
  InterviewerTab.jsx      # Interviewer dashboard
  components/
    TestRunner.jsx        # Timed test experience
    ui/*.jsx              # Tailwind UI primitives
  store/                  # Redux slices + store
  lib/utils.js            # cn() helper (clsx + tailwind-merge)
  utils/openaiFetch.js    # OpenAI fetch helper with retries

index.html                # Vite HTML entry
postcss.config.js         # Tailwind/PostCSS (ESM)
tailwind.config.js        # Tailwind config
vite.config.js            # Vite config + alias + /api proxy
```

---

## 🔌 API Overview

### `POST /api/extract`

**Body (JSON):**

```json
{
  "fileBase64": "data:...;base64,... OR raw base64 string",
  "mime": "application/pdf",
  "fileName": "resume.pdf"
}
```

**Response:**

```json
{ "name": "Jane Doe", "email": "jane@example.com", "phone": "+1..." }
```

* Uploads the file to **OpenAI Files** (`purpose: assistants`)
* Uses **Assistants v2** with a strict JSON schema to extract `{name, email, phone}`
* Cleans/normalizes values and **deletes** uploaded OpenAI resources afterward

### `POST /api/test/generate`

* **In:** `{ spec: { type, difficulty, role, resumeText?, timeLimitSec, nonce, history[] } }`
* **Out:** normalized question `{ id, prompt, options?, type, difficulty, time_limit_seconds }`

### `POST /api/test/evaluate`

* **In:** `{ question, answer }`
* **Out:** normalized grade `{ grade: { total: 0..10 }, feedback?: "..." }`

### `POST /api/test/summary`

* **In:** `{ perQuestionMax: 10, questions: [{ id, answer, score? }] }`
* **Out:** `{ finalScore: number, summary: string }`

> In development, Vite proxies `/api/*` to `http://localhost:3001`, so the frontend can just call `/api/...`.

---

## 🧠 Core Concepts

* **Candidate:** person taking assessments; stored with contact info and latest results.
* **Attempt:** one **complete** test run by a candidate (multiple questions). The interviewer dashboard lists finished attempts.
* **Autosave/Resume:** progress is saved to `localStorage`; if the user returns within 5 minutes, they can resume where they left off.
