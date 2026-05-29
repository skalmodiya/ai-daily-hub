# 🧠 AI Daily Hub

> **Your daily AI learning companion** — fresh content every day on frameworks, agents, SAP Business AI, research papers, and trending repositories.

[![Deploy](https://github.com/skalmodiya/ai-daily-hub/actions/workflows/pages.yml/badge.svg)](https://github.com/skalmodiya/ai-daily-hub/actions/workflows/pages.yml)

---

## 🌐 Live URLs

| Platform | URL |
|---|---|
| **github.com** | https://skalmodiya.github.io/ai-daily-hub/ |
| **github.tools.sap** | https://pages.github.tools.sap/I560043/ai-daily-hub/ |

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌟 **Daily Picks** | 6 featured items per day (1 per category) — changes automatically every midnight |
| 🎁 **Bonus Picks** | 4 extra items for deeper exploration |
| 📈 **GitHub Trending** | Live AI trending repos (falls back to curated list) |
| 🔥 **Streak Tracker** | Tracks your daily visit streak in the browser |
| ✅ **Mark as Learned** | Click ○ on any card to mark it learned — persists across sessions |
| 🔍 **Search** | Full-text search across titles, descriptions, and tags |
| 🏷️ **Category Filter** | Filter by: Frameworks · Agents · SAP AI · Papers · Repos · Concepts |
| 🔗 **Share** | One-click copy of the page URL |
| 📊 **Progress** | See how many items you've learned out of the full library |

---

## 📚 Content Categories

- **Frameworks** — LangChain, LangGraph, AutoGen, CrewAI, DSPy, LlamaIndex, Ollama, PydanticAI, smolagents, Agno, Semantic Kernel
- **AI Agents** — ReAct, Plan-Execute, MCP, Agentic RAG, Computer Use, Tool Use, Multi-agent patterns
- **SAP AI** — SAP AI Core, Joule, AI Launchpad, HANA Vector Engine, Generative AI Hub, BTP AI Services, ABAP + AI
- **Research Papers** — Chain-of-Thought, RAG, LoRA, Constitutional AI, Tree of Thoughts, Toolformer, Gorilla, RLHF
- **Repos** — Ollama, LangChain, vLLM, Dify, GraphRAG, n8n, LiteLLM, Open WebUI, Instructor, Mem0
- **Concepts** — RAG, Embeddings, Vector DBs, Prompt Engineering, Fine-tuning, Hallucination, Tokenization, MoE

---

## 💻 Run Locally

### Option 1 — Double-click (Windows)

1. Clone the repo:
   ```
   git clone https://github.com/skalmodiya/ai-daily-hub.git
   cd ai-daily-hub
   ```
2. Double-click **`start.bat`** — opens the browser at `http://localhost:3000` automatically.

### Option 2 — Python (any OS)

```bash
git clone https://github.com/skalmodiya/ai-daily-hub.git
cd ai-daily-hub
python serve.py
# Opens http://localhost:3000 automatically
```

Custom port:
```bash
python serve.py 8080
```

### Option 3 — Node.js / npx

```bash
git clone https://github.com/skalmodiya/ai-daily-hub.git
cd ai-daily-hub
npx serve .
# Opens http://localhost:3000
```

### Option 4 — VS Code Live Server

1. Install the **Live Server** extension in VS Code
2. Open the `ai-daily-hub` folder
3. Right-click `index.html` → **Open with Live Server**

> **Note:** Do NOT open `index.html` directly as a `file://` URL — the `fetch()` call for `content.json` will be blocked by the browser's CORS policy. Always use a local server.

---

## 🗂️ Project Structure

```
ai-daily-hub/
├── index.html                  # Main page (layout + sections)
├── css/
│   └── style.css               # Full design system (dark glassmorphism)
├── js/
│   └── app.js                  # All application logic
├── data/
│   └── content.json            # 100+ curated AI learning items
├── serve.py                    # Local Python dev server
├── start.bat                   # Windows one-click launcher
├── .nojekyll                   # Prevents Jekyll processing on GitHub Pages
└── .github/
    └── workflows/
        └── pages.yml           # GitHub Actions deploy workflow
```

---

## 🔧 How Daily Rotation Works

Content is selected using a **date-seeded pseudo-random number generator** (Mulberry32). The seed is `YYYYMMDD` — so:

- Every day shows **different** picks
- Everyone visiting on the same day sees the **same** picks
- No server, no database — pure client-side JavaScript

---

## ➕ Adding New Content

Open `data/content.json` and add a new item following this schema:

```json
{
  "id": "unique-kebab-id",
  "category": "framework | agent | sap-ai | paper | repo | concept",
  "title": "Item Title",
  "description": "2–3 sentence description of what this is and why it matters.",
  "url": "https://link-to-resource.com",
  "tags": ["tag1", "tag2", "tag3"],
  "difficulty": "beginner | intermediate | advanced",
  "emoji": "🔗"
}
```

Then commit and push — GitHub Pages deploys automatically.

---

## 🚀 Deploying Your Own Copy

### github.com

1. Fork this repo
2. Go to **Settings → Pages → Source** → select **GitHub Actions**
3. Push any change to `main` — the workflow deploys automatically

### github.tools.sap

Since GitHub Actions may be disabled at the org level on SAP GHE, deployment uses direct branch push:

```bash
# Add SAP remote (first time only)
git remote add sap https://github.tools.sap/I560043/ai-daily-hub.git

# Deploy: push site files directly to gh-pages branch
git checkout --orphan gh-pages-tmp
git add -A
git commit -m "Deploy"
git push sap gh-pages-tmp:gh-pages --force
git checkout main
git branch -D gh-pages-tmp
```

---

## 🤝 Contributing

Contributions are welcome! To add new AI learning content:

1. Fork the repo
2. Add items to `data/content.json`
3. Open a pull request

---

## 📄 License

MIT — free to use, fork, and adapt.
