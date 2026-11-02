# 📘 Nexus Vault: Comprehensive User & Architecture Guide (v2.1.0)

> **Nexus Vault** is an AI-native personal knowledge management (PKM) vault and academic workspace. It bridges the gap between chaotic, intuitive note capture and textbook-grade formal knowledge representation.

---

## 1. System Architecture Overview

```
                                      ┌─────────────────────────────────────────────────────────┐
                                      │                    Universal AI Hub                     │
                                      │  Groq (LPU) · Anthropic · OpenAI · Gemini · Ollama/Local │
                                      └────────────────────────────┬────────────────────────────┘
                                                                   │
                                            ┌──────────────────────┴──────────────────────┐
                                            ▼                                             ▼
                             ┌─────────────────────────────┐               ┌─────────────────────────────┐
                             │       📁 raw/ Folder        │               │     📁 process/ Folder      │
                             │   (Raw Intuitive Notes)     │               │   (Formal Companion Notes)  │
                             │                             │  Synthesize   │                             │
                             │  • Lecture scribbles        ├──────────────►│  • Textbook definitions     │
                             │  • Fragmented intuitions    │ (Companion    │  • LaTeX step-by-step math  │
                             │  • Quick unedited thoughts  │  Non-Mutating)│  • Rigorous formal theorems │
                             └──────────────┬──────────────┘               └──────────────┬──────────────┘
                                            │                                             │
                                            └──────────────────────┬──────────────────────┘
                                                                   ▼
                                                   ┌──────────────────────────────┐
                                                   │   Bidirectional Knowledge    │
                                                   │  Graph & Semantic Wikilinks  │
                                                   │    [[Target|relation|ctx]]   │
                                                   └──────────────────────────────┘
```

---

## 2. Core Functional Pillars

### 2.1 Dual Folder Architecture (`raw/` & `process/`)
Nexus Vault strictly organizes notes into two distinct, dedicated spaces:

1. **`raw/` (Raw Notes Folder)**:
   - Reserved for unstructured note capture: lecture scribbles, personal metaphors, intuitive mental models, and raw thoughts.
   - Accessible in the sidebar tree under the `raw/` folder with real-time note count badge.
   - Notes are mirrored on disk inside the physical `./raw/` directory.

2. **`process/` (Processed Notes Folder)**:
   - Contains formal, textbook-grade companion notes created by the AI synthesis engine.
   - Contains formal definitions, step-by-step LaTeX derivations ($...$ and $$...$$), theorems, and computational caveats.
   - Notes are mirrored on disk inside the physical `./process/` directory.
   - Directly linked to their corresponding raw note via companion metadata (`raw_file_id` / `formal_file_id`).

### 2.2 Universal AI Model Hub & In-App Selector
Located in the editor toolbar **right next to the Save button** with a `Bot` (robot) icon:

- **Supported AI Providers**:
  - **Groq Cloud (LPU)**: Ultra-fast inference ($\approx 500\text{--}800\text{ tokens/sec}$). Models: `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`.
  - **Anthropic (Claude)**: Deep scholarship and semantic nuance. Models: `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229`.
  - **OpenAI (ChatGPT)**: Industry standard. Models: `gpt-4o-mini`, `gpt-4o`, `o3-mini`, `gpt-4-turbo`.
  - **Google Gemini**: Massive context window. Models: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`.
  - **OpenRouter**: Unified access to hundreds of open/proprietary models. Models: `meta-llama/llama-3.3-70b-instruct`, `anthropic/claude-3.5-sonnet`, `deepseek/deepseek-chat`.
  - **Mistral AI**: European frontier models. Models: `mistral-small-latest`, `mistral-large-latest`.
  - **Custom / Local (Ollama, LM Studio)**: Private on-device inference (`http://localhost:11434/v1`).
- **Key Auto-Detection**: Pasting an API key automatically selects the correct provider based on signature prefixes (`gsk_`, `sk-ant-`, `sk-`, `AIza`, `sk-or-`).
- **Live Latency Benchmarking**: The *Test Key & Model* button dispatches an instant health verification call and displays response latency in milliseconds.

### 2.3 Academic Note Synthesis Workflow
Transforms raw classroom notes into textbook-grade formal companions:
1. Open any raw note in `raw/`.
2. Click **Synthesize Note** in the top bar.
3. The AI agent executes structured academic synthesis:
   - **Intuition Bridge**: Preserves student analogies and personal mental models.
   - **Core Definitions**: Formalizes terms with mathematical rigor.
   - **Mathematical Derivations**: Step-by-step LaTeX equations and proofs.
   - **Theorems & Laws**: Formal theoretical statements and implications.
   - **Vault Wikilinks**: Integrates with existing vault note titles.
4. **Review & Save**:
   - Preview formatted markdown before saving.
   - Companion note is saved in `process/` and bidirectionally linked to the raw note.
   - Previous revisions are archived in `synthesis_versions` with overwrite protection.

### 2.4 Semantic Contextual Wikilinking & Graph Indexing
Nexus Vault supports both standard Obsidian links and typed contextual links:

- **Plain Link**: `[[Target Note]]`
- **Contextual Link**: `[[Target Note | relationship | context explanation]]`
  - Examples of relationships: `prerequisite_for`, `relies_on`, `generalizes`, `implements`, `complements`.

- **AI Semantic Link Discovery**:
  - Click **Discover Links** in the top bar or **Discover AI Links** in the inspector.
  - The AI agent analyzes note content against all titles in the vault and proposes contextual links.
  - Accept or reject each proposal in the review modal with one click.

### 2.5 2D Knowledge Graph Visualization
- **Global Perspective**: High-level overview of the entire vault cluster with degree-weighted node sizes and community clustering.
- **Local Neighborhood**: Radial 1-hop and 2-hop focus on the currently active note.
- **Fullscreen Mode**: Press `G` or click the expand button to pan, zoom, and inspect interconnected nodes with collision-free labels.

---

## 3. What Was Removed / Replaced from Earlier Versions

| Feature | Earlier Status | Updated v2.1.0 Status | Reason for Change |
| :--- | :--- | :--- | :--- |
| **Sidebar Search** | Collapsible on-demand icon | **Always-Visible Live Search Bar** | Collapsible icon added friction; persistent search provides instant real-time filtering across both `raw/` and `process/` folders. |
| **AI Provider** | Hardcoded Anthropic Claude | **Universal AI Model Hub** | Users can now bring any key (Groq, OpenAI, Anthropic, Gemini, OpenRouter, Mistral, Ollama) and test latency dynamically. |
| **Note Hierarchy** | Flat unorganized list | **Dual Folders (`raw/` & `process/`)** | Separates raw student intuitions from AI-formalized academic textbook notes. |
| **Storage Model** | Database-only | **Two-Way Database & Disk Sync** | Physical `.md` files are now mirrored on disk in `./raw` and `./process` for backup and external editor compatibility. |
| **Patch Notes Modal** | Outdated v1.2.0 info | **Updated v2.1.0 Universal Guide** | Reflects all active features, shortcuts, and folder workflows. |

---

## 4. Keyboard Shortcuts Quick Reference

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> | Open Quick Switcher Modal | Global |
| <kbd>⌘S</kbd> / <kbd>Ctrl+S</kbd> | Manually Save Active Note | Editor |
| <kbd>G</kbd> | Toggle Fullscreen Knowledge Graph | Editor / Graph View |
| <kbd>Esc</kbd> | Close Modals / Exit Fullscreen Graph | Global |
| <kbd>Enter ↵</kbd> | Jump to Note in Quick Switcher | Quick Switcher |
| <kbd>↑</kbd> <kbd>↓</kbd> | Navigate Results in Quick Switcher | Quick Switcher |

---

## 5. Development & Running

### Starting the Application
```bash
npm start
```
Runs concurrently:
- **Backend API Server**: `http://localhost:3001` (Express + SQLite)
- **Frontend App**: `http://localhost:5173` (React 18 + Vite)

### Environment Configuration (`.env`)
```env
PORT=3001

# Optional fallback keys (can also be configured via the in-app AI Model button)
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```
*(If no API key is provided, the application automatically uses its intelligent heuristic matcher for link discovery).*

