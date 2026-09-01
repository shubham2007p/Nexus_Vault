# BUILD SPEC: AI-Native Knowledge Vault (Mini Project, 20-Day Scope)

## 0. Non-negotiable scope lock

This spec deliberately excludes: versioning/undo, multi-step agent loop, approval
workflows, prompt-injection defense layers, `.system/` behavior files, Process
Folder/Vault, semantic/embedding search, multi-agent anything. If you find
yourself designing any of these, STOP — you are drifting outside the 20-day
scope. Ship the thing below fully, then extend only if days remain.

**Deliverable definition of done:** a user can create markdown files in a vault,
link them with plain `[[links]]` and contextual `[[X | relation | context]]`
links, click "Process File" on any file, and see the AI propose new contextual
links which the user accepts or rejects — rendered in an Obsidian-like editor
UI with a graph view of at least the current file's neighborhood.

---

## 1. Tech stack (fixed — do not relitigate this)

- **Frontend:** React + Vite, Tailwind, CodeMirror 6 (for the markdown editor
  with custom `[[...]]` syntax highlighting)
- **Backend:** FastAPI (Python) — fastest path to wiring an LLM tool-calling
  loop with typed schemas
- **Database:** SQLite (single file, zero setup, fine for one user / a demo)
- **LLM:** Anthropic API, `claude-sonnet-4-6`, tool use enabled
- **Graph view:** react-force-graph or vis-network for rendering link
  neighborhoods

No Next.js, no Postgres, no Docker orchestration, no auth system beyond a
single hardcoded demo user. Every one of those is a distraction from the core
demo.

---

## 2. Data model (SQLite schema)

```sql
CREATE TABLE files (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,      -- e.g. "SVM.md"
    content TEXT NOT NULL,          -- raw markdown, source of truth
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE links (
    id INTEGER PRIMARY KEY,
    source_file_id INTEGER NOT NULL REFERENCES files(id),
    target_file_id INTEGER REFERENCES files(id),   -- NULL if target doesn't exist yet
    target_title TEXT NOT NULL,      -- raw text inside [[ ]], resolved or not
    relationship TEXT,               -- NULL for plain links
    context TEXT,                    -- NULL for plain links
    is_ai_suggested INTEGER DEFAULT 0,  -- 1 until user accepts
    status TEXT DEFAULT 'accepted',     -- 'accepted' | 'pending' | 'rejected'
    created_at TEXT
);

CREATE TABLE agent_runs (
    id INTEGER PRIMARY KEY,
    file_id INTEGER NOT NULL REFERENCES files(id),
    raw_response TEXT,     -- full LLM output for debugging/demo
    created_at TEXT
);
```

Decision locked: **Markdown is the source of truth.** Links are parsed out of
`content` on save and mirrored into the `links` table for querying/graph
rendering. If they ever disagree, re-parse from markdown and overwrite the
`links` table — markdown wins, always.

---

## 3. Link syntax (grammar)

Plain link — unchanged from Obsidian:
```
[[Statistics]]
```

Contextual link — pipe-delimited, single line, no nested brackets:
```
[[Statistics | prerequisite_for | Z-score depends on mean and standard deviation]]
```

Parser rule: split on `|`, trim whitespace. 1 segment = plain link. 3 segments
= contextual link (target, relationship, context). Anything else = treat as
plain link and ignore the rest silently (don't crash the parser on malformed
input — just degrade).

Regex for extraction:
```python
LINK_PATTERN = r"\[\[([^\[\]]+)\]\]"
```
then split the captured group on `|`.

---

## 4. Backend build order (do these in sequence, each one working before next)

### Day 1–3: CRUD + link parsing
1. FastAPI app skeleton, SQLite connection, the schema above.
2. `POST /files`, `GET /files`, `GET /files/{id}`, `PUT /files/{id}`,
   `DELETE /files/{id}`.
3. On every `PUT /files/{id}` (save), re-parse `content` for `[[...]]`
   patterns, diff against existing `links` rows for that source file, and
   sync the table (insert new, remove ones no longer present, leave AI
   pending links untouched unless the user explicitly deleted that exact
   link text).
4. `GET /files/{id}/backlinks` — files where `target_file_id = id`.
5. `GET /files/{id}/graph` — returns `{nodes, edges}` for this file plus its
   direct forward links and backlinks (1-hop neighborhood only — do not do
   multi-hop traversal, it's not needed for the demo and adds complexity).

**Checkpoint:** you can create/edit/link files via curl or Postman and see
the links table populate correctly before touching the frontend.

### Day 4–6: Frontend shell
1. Vite + React + Tailwind scaffold.
2. Three-pane Obsidian-style layout: file tree (left) / editor (center) /
   backlinks+graph panel (right).
3. CodeMirror 6 editor with a custom syntax highlight mode that colors
   `[[plain links]]` one color and `[[contextual | links | like-this]]`
   another (visually distinguishing them is the single highest-value
   "premium feel" detail — prioritize it).
4. Wire file tree to load/save via the API from Day 1–3.

**Checkpoint:** you can navigate files, edit markdown, save, and see links
rendered/highlighted correctly.

### Day 7–9: Graph view + backlinks panel
1. Render the `/graph` endpoint's 1-hop neighborhood with react-force-graph.
2. Clicking a node in the graph navigates to that file.
3. Backlinks panel lists incoming links with their relationship/context if
   present.

**Checkpoint:** opening any file shows its correct local graph and backlinks.

### Day 10–13: The AI agent (the actual novel part)

This is intentionally simple — ONE LLM call, ONE round of tool use, no loop.

1. Tool schema (pass to the API):
```python
tools = [
    {
        "name": "propose_link",
        "description": "Propose a new contextual link from the current file to another file in the vault.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target_title": {"type": "string"},
                "relationship": {"type": "string"},
                "context": {"type": "string"},
                "reasoning": {"type": "string"}
            },
            "required": ["target_title", "relationship", "context"]
        }
    }
]
```
2. `POST /files/{id}/process` endpoint:
   - Fetch current file content.
   - Fetch list of ALL other file titles in the vault (just titles, not full
     content — keeps context small; this sidesteps the context-window
     problem entirely for a vault of realistic mini-project size, e.g.
     <200 files).
   - Fetch current file's existing links (so the LLM doesn't propose
     duplicates).
   - Single prompt: "Here is the current note. Here are all other note
     titles in the vault. Here are existing links from this note. Propose
     0-5 new contextual links to other existing notes, using propose_link.
     Only propose links to notes that already exist in the provided title
     list. Do not repeat existing links."
   - Call Claude once with `tool_choice: {"type": "any"}` or loop only over
     multiple `tool_use` blocks in a single response (NOT multiple API
     round-trips — one response, possibly many tool calls in it, is enough).
   - For each `propose_link` tool call, insert a row into `links` with
     `is_ai_suggested=1, status='pending'`.
   - Log the raw response into `agent_runs`.
3. `POST /links/{id}/accept` and `POST /links/{id}/reject` — accept sets
   `status='accepted'` and also appends the actual `[[...]]` syntax into the
   source file's markdown content at the end (under an "AI-suggested
   connections" heading, or inline if you want to be fancier); reject just
   deletes the row.

**Checkpoint:** clicking "Process File" on a populated vault produces
sensible pending links, shown distinctly in the UI (dashed border / different
color), with accept/reject buttons.

### Day 14–16: Polish pass
1. Pending AI links render visually distinct in both the editor gutter and
   the graph (dashed edges).
2. Empty states, loading states, basic error handling on the process
   endpoint (LLM call fails → show a toast, don't crash).
3. Seed the vault with 15–20 real notes (use your actual ML/CS notes) before
   demo day — a demo on an empty vault proves nothing.

### Day 17–18: Report + slides
Whatever your college requires. Screenshot the graph view, the contextual
link syntax, and one before/after Process File example — those three images
carry the whole demo.

### Day 19–20: Buffer
Reserved for whatever broke. If nothing broke, this is where you'd add
Process Folder as a stretch goal — not before.

---

## 5. Explicit stretch goals (only if Day 19–20 buffer survives)

In priority order, do not start #2 until #1 is fully done:
1. Process Folder (same logic as Process File, scoped to a folder's files)
2. Simple keyword/full-text search across vault (SQLite FTS5 — built in,
   no new dependency)
3. Relationship-type filter on the graph view (show only `prerequisite_for`
   edges, etc.)

Do NOT attempt: embeddings/semantic search, undo/versioning, multi-file
agent loop, prompt injection defenses. Out of scope for this deliverable,
full stop.

---

## 6. What makes this "premium" without extra scope

The Obsidian-like feel comes almost entirely from three cheap details, not
from feature count:
- Smooth CodeMirror syntax highlighting distinguishing plain vs contextual
  links (Day 4–6)
- A force-directed graph that actually animates on load (Day 7–9)
- Command-palette-style `Cmd+K` file switcher (small addition, high
  perceived-polish payoff — add during Day 14–16 polish pass if time allows)

Do not chase visual polish before the core loop (create → link → process →
accept) works end to end. A rough-looking working loop beats a polished
broken one for a mini project defense.
