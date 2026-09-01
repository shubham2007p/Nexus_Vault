<div align="center">

<br/>

<h1 align="center">⚡ Nexus Vault</h1>

<p align="center">
  <strong>An AI-Native Knowledge Vault with Contextual Link Graphs & One-Click Agent Synthesis.</strong>
</p>

<p align="center">
  <em>Stop organizing notes manually. Let AI discover meaningful connections across your brain.</em>
</p>

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active%20Development-76B900?style=for-the-badge&logo=circle&logoColor=white" alt="Status"/>&nbsp;
  <img src="https://img.shields.io/badge/Node.js-v24+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>&nbsp;
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>&nbsp;
  <img src="https://img.shields.io/badge/CodeMirror-6-black?style=for-the-badge&logo=codemirror&logoColor=white" alt="CodeMirror"/>&nbsp;
  <img src="https://img.shields.io/badge/License-Source%20Available-orange?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="License"/>
</p>

<p align="center">
  <a href="#-the-problem">The Problem</a>&ensp;·&ensp;
  <a href="#-the-solution">The Solution</a>&ensp;·&ensp;
  <a href="#-link-syntax--grammar">Link Syntax</a>&ensp;·&ensp;
  <a href="#-features">Features</a>&ensp;·&ensp;
  <a href="#-quick-start">Quick Start</a>&ensp;·&ensp;
  <a href="#-roadmap">Roadmap</a>&ensp;·&ensp;
  <a href="#-design-philosophy">Philosophy</a>
</p>

</div>

---

## ⚡ What is Nexus Vault?

Most note-taking tools are **passive file containers**. You write notes, manually search for related concepts, and draw links by hand.

**Nexus Vault is active.**

It is an Obsidian-inspired knowledge vault powered by an autonomous LLM Agent loop. It parses standard markdown `[[links]]` alongside pipe-delimited **contextual links** `[[Target | relationship | context]]`, visualizes local 1-hop link neighborhoods using an interactive force-directed graph, and features a one-click **"Process File"** agent that analyzes note semantics to propose new contextual relationships for one-click Accept or Reject.

---

## 🔴 The Problem

Traditional personal knowledge management (PKM) tools suffer from **link decay** and **manual overhead**.

| Note Tool | What you spend time on | The Flaw |
|---|---|---|
| Obsidian / Notion | Writing static `[[wikilinks]]` manually (30 min+) | Misses non-obvious cross-domain links |
| Roam Research | Adding bidirectional links | No explicit relationship semantics (`prerequisite_for`, etc.) |
| AI Note Assistants | Pasting notes into ChatGPT | Zero awareness of existing vault structure & link graph |

**Result?** Your vault becomes a digital graveyard of disconnected notes instead of a connected second brain.

---

## 🟢 The Solution

Nexus Vault introduces **Contextual Links** and **Tool-Calling AI Discovery**.

```
┌─────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│ Current Note    │──────▶│ AI Agent (Tool-Use)    │──────▶│ Backlinks & Graph Pane │
│                 │       │                        │       │                        │
│ • Raw Markdown  │       │ • Reads Vault Titles   │       │ • Proposed Links       │
│ • Existing Links│       │ • Executes propose_link│       │ • [Accept] / [Reject]  │
└─────────────────┘       └────────────────────────┘       └────────────────────────┘
```

1. **Write standard markdown notes.**
2. **Click `Process File`.** The AI analyzes your note against all titles in the vault.
3. **Accept or Reject.** Accepted links automatically insert `[[Target | relationship | context]]` into your source note and sync with the graph.

---

## 🔗 Link Syntax & Grammar

Nexus Vault supports both classic plain wikilinks and semantic contextual links:

### 1. Plain Link (Standard Obsidian)
```markdown
[[Neural Networks]]
```

### 2. Contextual Link (Semantic Pipeline)
```markdown
[[Backpropagation | relies_on | Uses multivariable chain rule for weight derivatives]]
```

> **Parser Rule:**
> Split inner content on `|`. 
> - **1 segment:** Plain Link (`target_title`)
> - **3 segments:** Contextual Link (`target_title | relationship | context`)

---

## ✨ Features

### 🎨 Authentic Obsidian Dark Aesthetics
- **Dark Mode Palette:** `#1e1e1e` main editor background, `#181818` inspector sidebars, `#2e2e2e` borders, and high-contrast `#dcddde` typography.
- **CodeMirror 6 Custom Highlighter:** Real-time inline decoration badges rendering plain links in blue (`#70a5fd`) and contextual links in purple/emerald (`#c4b5fd`).

### 🕸️ Interactive 1-Hop Local Graph View
- Built with `react-force-graph-2d` to visualize node neighborhoods in real-time.
- **Solid lines** for accepted links vs. **animated dashed orange lines** for pending AI suggestions.
- Interactive node clicking for instant vault navigation.

### 🤖 One-Click AI Link Agent
- Evaluates note content using Anthropic tool calling (`propose_link`) with intelligent heuristic fallback.
- Recommends 1–5 contextual connections with reasoning.
- Accepting a link automatically updates SQLite and appends the markdown syntax directly to the note.

### ⚡ Quick Switcher (`Cmd+K` / `Ctrl+K`)
- Fuzzy command palette modal for instant note search across the entire vault.

---

## 🛠️ Tech Stack

<p>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>&nbsp;
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>&nbsp;
  <img src="https://img.shields.io/badge/SQLite3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>&nbsp;
  <img src="https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>&nbsp;
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>&nbsp;
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind"/>&nbsp;
  <img src="https://img.shields.io/badge/CodeMirror_6-000000?style=for-the-badge&logo=codemirror&logoColor=white" alt="CodeMirror"/>
</p>

### Visual System Tokens

| Token | Hex Value | Usage |
|---|---|---|
| Main Background | `#1e1e1e` | Editor canvas & main workspace |
| Sidebar Background | `#181818` | Explorer & Backlinks inspector |
| Card / Active | `#262626` / `#363636` | Active note selection & card containers |
| Border | `#2e2e2e` | Pane dividers & component boundaries |
| Plain Link Badge | `#70a5fd` | Standard `[[Wikilink]]` styling |
| Contextual Link | `#c4b5fd` | Semantic `[[Target | rel | ctx]]` badge |
| Pending AI Link | `#fbbf24` | Dashed border AI suggestions |

---

## 🗺️ Roadmap

| Version | Milestone | What It Delivers | Status |
|---|---|---|---|
| **V0.1** | `CRUD & Parsing` | SQLite schema, Express API, regex link parser | ✅ Done |
| **V0.2** | `Editor & UI` | Three-pane layout, CodeMirror 6 custom link plugin | ✅ Done |
| **V0.3** | `Graph & Backlinks` | 1-hop force-directed graph view & backlinks inspector | ✅ Done |
| **V0.4** | `AI Agent` | Single-shot tool calling (`propose_link`) with Accept/Reject | ✅ Done |
| **V0.5** | `Polish & Seeding` | 16 pre-seeded CS/ML notes, `Cmd+K` command palette | ✅ Done |
| **V0.6** | `Process Folder` | Multi-file folder link discovery & batch processing | ⬜ Planned |
| **V0.7** | `FTS5 Search` | Built-in SQLite full-text search across vault | ⬜ Planned |

---

## 🗂️ Repository Structure

```
Nexus_Vault/
├── server/
│   ├── index.js          # Express API server & routes (Port 3001)
│   ├── db.js             # SQLite database connection & schema (vault.db)
│   ├── parser.js         # [[Link]] and [[Target|Rel|Ctx]] regex parser & sync
│   ├── ai.js             # Anthropic tool calling engine for link proposals
│   └── seed.js           # 16 pre-seeded CS & ML notes
├── src/
│   ├── components/
│   │   ├── FileTree.jsx       # Left pane: Vault explorer & search
│   │   ├── Editor.jsx         # Center pane: CodeMirror 6 markdown editor
│   │   ├── GraphView.jsx      # Right pane: Force-directed neighborhood graph
│   │   ├── Backlinks.jsx      # Right pane: Backlinks & AI inspector
│   │   └── CommandPalette.jsx # Cmd+K quick switcher modal
│   ├── extensions/
│   │   └── codemirrorLinkPlugin.js # CodeMirror 6 custom syntax plugin
│   ├── App.jsx                # Layout & global state controller
│   ├── index.css              # Obsidian theme & custom styles
│   └── main.jsx               # React DOM entry point
├── package.json
├── vite.config.js
└── vault-app-build-spec.md
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone git@github.com:shubham2007p/Nexus_Vault.git
cd Nexus_Vault
npm install
```

### 2. Configure Environment (Optional)

Create a `.env` file in the root directory:

```env
PORT=3001
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```
*(Note: If no API key is provided, Nexus Vault automatically uses its built-in intelligent heuristic engine for link suggestions).*

### 3. Run the Application

```bash
npm start
```

This concurrently boots:
- **Node.js Express Backend** on `http://localhost:3001`
- **Vite React Frontend** on `http://localhost:5173`

---

## 🧠 Design Philosophy

**`[1]` Markdown is the Source of Truth.**  
Links are parsed directly from content and synced to SQLite for graph rendering. Markdown always wins.

**`[2]` Substance Over Noise.**  
No complex multi-step agent loops or prompt injection fluff. One single-shot tool call that proposes real, semantic connections.

**`[3]` Obsidian Feel in the Web Browser.**  
Distinguishing plain vs. contextual links with custom editor syntax highlighting delivers an immediate, premium experience.

---

## 📜 License

Nexus Vault is **source-available**, not open-source.

```
✅ Personal use          ✅ Educational use       ✅ Research
✅ View & study code     ✅ Fork to contribute    ❌ Redistribute
❌ Commercial use        ❌ Resell / sublicense   ❌ Independent forks
```

---

<div align="center">

*Built with focus by <a href="https://github.com/shubham2007p">@shubham2007p</a> — 2026*

`●` *Connecting ideas, node by node.*

</div>
