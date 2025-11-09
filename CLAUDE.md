# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Markdown Note Cloud is a pure frontend Markdown note-taking application that uses Firebase Firestore as the real-time database for storing and syncing notes. Users can create, edit, and delete notes with live Markdown preview.

## Technology Stack

- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript (vanilla)
- **Database & Auth**: Firebase (Firestore + Authentication)
- **Markdown Processing**: marked.js (for Markdown to HTML conversion)
- **Security**: DOMPurify (for XSS prevention when rendering HTML)
- **Future Enhancement**: highlight.js (for code syntax highlighting)

## Development Environment Setup

This project requires Python tools (`uv`) and GitHub CLI (`gh`) for environment management. See `PROJECT_SETUP_GUIDE.md` for detailed setup instructions.

### Required Tools

1. **uv** - Python package manager (faster than pip)
   ```bash
   # Install on Windows
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

2. **gh** - GitHub CLI
   ```bash
   # Install on Windows
   winget install --id GitHub.cli

   # Authenticate
   gh auth login
   ```

### Environment Setup Workflow

```bash
# Create virtual environment
uv venv

# Activate virtual environment (Windows)
.venv\Scripts\activate

# Install dependencies (if requirements.txt exists)
uv pip install -r requirements.txt
```

## Architecture

### Firebase Structure

**Collection Path**: `/artifacts/{appId}/users/{userId}/notes`

Each note document contains:
```javascript
{
  "title": "Note title",
  "content": "# Markdown content here",
  "createdAt": "2025-11-09T14:30:00Z",
  "updatedAt": "2025-11-09T14:35:00Z"
}
```

### Authentication Flow

1. App initializes Firebase SDK with `__firebase_config`
2. User signs in via `signInWithCustomToken` or `signInAnonymously`
3. Get `userId` from auth response
4. All notes are stored under `/artifacts/{appId}/users/{userId}/notes`

### Data Flow

1. **Initialization**: Firebase auth → get userId → setup notesCollectionRef
2. **Real-time sync**: Use `onSnapshot(notesCollectionRef)` to listen for changes
3. **Note selection**: Click note → load from local cache → populate editor
4. **Auto-save**: Editor changes → debounce (1-2s) → `setDoc()` with merge
5. **Markdown render**: textarea input → `DOMPurify.sanitize(marked.parse(text))` → update preview

### UI Layout

**Desktop** (dual-column):
- Left (30%): Note list with "New Note" button
- Right (70%): Editor (top) + Live preview (bottom)

**Mobile** (single view):
- Default: Note list only
- On selection: Editor/preview with back button

## Key Implementation Patterns

### Auto-save with Debounce

All title and content changes should auto-save to Firestore using debounce (1-2 second delay) to prevent excessive writes.

```javascript
// Pattern to follow
textarea.addEventListener('input', debounce(async () => {
  await setDoc(doc(db, notesCollectionRef, noteId), {
    title,
    content,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}, 1500));
```

### Safe Markdown Rendering

Always sanitize HTML output to prevent XSS attacks:

```javascript
// REQUIRED pattern
const htmlOutput = DOMPurify.sanitize(marked.parse(textarea.value));
previewElement.innerHTML = htmlOutput;
```

### Note List Sorting

Notes should be sorted by `updatedAt` (newest first) in JavaScript after fetching from Firestore, as the collection path structure doesn't support native ordering.

## Security Considerations

1. **XSS Prevention**: Always use DOMPurify before rendering marked.js output
2. **Firestore Rules**: Ensure security rules restrict access to `/users/{userId}/notes` to authenticated user only
3. **Environment Variables**: Never commit Firebase config or tokens to repository
4. **Auth Tokens**: Use `__initial_auth_token` or anonymous auth for user identification

## Git Workflow

This project is not yet initialized as a Git repository. When ready to upload:

```bash
# Initialize and create first commit
git init
git add .
git commit -m "Initial commit: Markdown Note Cloud"

# Create and push to GitHub (using gh CLI)
gh repo create markdown-note-cloud --public --source=. --push
```

See `GITHUB_UPLOAD_GUIDE.md` for detailed Git and GitHub workflow instructions.

## Important Files

- `plan.txt` - Complete project specification in Chinese (detailed feature requirements)
- `PROJECT_SETUP_GUIDE.md` - Environment setup guide for Python/uv/gh tools
- `GITHUB_UPLOAD_GUIDE.md` - Git and GitHub upload workflow documentation

## Development Guidelines

1. **Frontend Only**: This is a pure frontend application with no backend server
2. **Real-time Updates**: Use Firestore `onSnapshot` for live data synchronization
3. **Responsive Design**: Use Tailwind CSS for mobile-first responsive layouts
4. **Performance**: Implement debouncing for auto-save to minimize Firestore writes
5. **User Experience**: Provide loading states and friendly error messages for Firestore operations

## File Structure (when implemented)

```
markdown-note-cloud/
├── index.html              # Main application entry point
├── styles.css              # Custom styles (supplementing Tailwind)
├── app.js                  # Main application logic
├── firebase-config.js      # Firebase initialization
├── markdown-renderer.js    # Markdown processing utilities
├── .gitignore             # Git ignore rules
└── docs/                  # Documentation
    ├── plan.txt
    ├── PROJECT_SETUP_GUIDE.md
    └── GITHUB_UPLOAD_GUIDE.md
```
