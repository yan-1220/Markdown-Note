# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Markdown Note Cloud is a pure frontend Markdown note-taking application contained in a single HTML file (`index.html`). It uses IndexedDB for persistent storage and includes Markmap mind map visualization for notes.

## Technology Stack

- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript (vanilla, inline in HTML)
- **Storage**: IndexedDB (via Dexie.js) + localStorage
- **Markdown Processing**: marked.js (for Markdown to HTML conversion)
- **Security**: DOMPurify (for XSS prevention when rendering HTML)
- **Code Highlighting**: highlight.js (already integrated)
- **Mind Map Visualization**: Markmap (d3.js-based) - displays note content as interactive mind map

## Running the Application

No build step required. Open `index.html` directly in a browser or use a local server:

```bash
# Direct opening (Windows)
start index.html

# Local server (recommended for full functionality)
python -m http.server 8000
# Then open http://localhost:8000
```

## Architecture

### Single-File Application Structure

The entire application is contained in `index.html` with inline JavaScript. All dependencies are loaded via CDN.

### Data Storage

**IndexedDB Schema** (via Dexie.js):
```javascript
// Database: "MarkdownNoteDB", version 1
// Table: "notes"
{
  id: "unique-id",           // Primary key (auto-generated)
  title: "Note title",
  content: "# Markdown content",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp"
}
```

**localStorage** is used as fallback/cache for quick access.

### Application Flow

1. **Initialization**: Dexie.js database → load notes → render list (sorted by `updatedAt`, newest first)
2. **Note Selection**: Click note → load from IndexedDB → display in Markdown view (default)
3. **Auto-save**: Editor changes → debounce (1.5s) → update IndexedDB
4. **Markdown Rendering**: `marked.parse()` → `DOMPurify.sanitize()` → `innerHTML` (highlight.js applies automatically)
5. **Mind Map**: Markmap transformer → D3.js tree visualization

### UI Layout & View Modes

**Three Views**: Markdown (default, full-screen rendered), Edit (split: editor + preview), Mind Map (D3.js tree)

**Layout**: Left sidebar (30%, note list + search) | Right content (70%, view-dependent)

**Toggle buttons**: "✏️ Edit", "✅ Done", "🧠 Mind Map", "📄 Markdown"

## Key Implementation Patterns

### Critical Patterns

**Auto-save with Debounce** (1.5s):
```javascript
textarea.addEventListener('input', debounce(async () => {
  await db.notes.update(currentNoteId, {
    title, content, updatedAt: new Date().toISOString()
  });
}, 1500));
```

**Safe Markdown Rendering** (ALWAYS sanitize to prevent XSS):
```javascript
const htmlOutput = DOMPurify.sanitize(marked.parse(textarea.value));
previewElement.innerHTML = htmlOutput;
```

**Search**: Full-text search with `<mark>` highlighting, debounced filtering, Esc to clear

**Time Display**: Relative time in list ("2 hours ago"), ISO timestamps in detail view

## Security & Styling

- **XSS Prevention**: ALWAYS use DOMPurify.sanitize() before rendering marked.js output
- **Storage**: IndexedDB only (local, no server, no auth)
- **Theme**: Pure black background (`#000000`) with blue accents (`#3b82f6`) - maintain consistency when adding features

## Code Structure

Single-file architecture in `index.html`:
- `<head>`: CDN dependencies (marked.js, DOMPurify, highlight.js, Markmap, Dexie.js, d3.js, Tailwind CSS)
- `<style>`: Custom CSS overrides for pure black theme
- `<body>`: HTML structure with Tailwind classes
- `<script>`: Application logic (~1000+ lines) - DB init, CRUD, UI handlers, Markdown rendering, search, Markmap

**Important**: All JavaScript is inline. No separate .js files. Maintain single-file pattern.

## Key Features

- IndexedDB storage (Dexie.js) with localStorage fallback
- Full-text search with keyword highlighting
- Auto-save (1.5s debounce)
- Three view modes: Markdown / Edit / Mind Map
- Code syntax highlighting (highlight.js)
- Responsive mobile layout
