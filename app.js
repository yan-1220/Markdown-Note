// Wait for Firebase modules to load
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebaseModules) {
            resolve(window.firebaseModules);
        } else {
            const checkInterval = setInterval(() => {
                if (window.firebaseModules) {
                    clearInterval(checkInterval);
                    resolve(window.firebaseModules);
                }
            }, 50);
        }
    });
}

// Firebase modules will be loaded asynchronously
let initializeApp, getAuth, signInAnonymously, signInWithCustomToken;
let getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp;

// ============================================================================
// Firebase Configuration
// ============================================================================

// TODO: Replace with your Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Replace with your app ID
const APP_ID = "markdown-note-cloud";

// Demo mode flag - will use localStorage if Firebase is not configured
const USE_DEMO_MODE = firebaseConfig.apiKey === "YOUR_API_KEY";

// ============================================================================
// Global State
// ============================================================================

let app;
let auth;
let db;
let currentUser = null;
let notesCollectionRef = null;
let currentNoteId = null;
let notes = [];
let unsubscribeSnapshot = null;
let autoSaveTimeout = null;

// ============================================================================
// DOM Elements
// ============================================================================

const elements = {
    loading: document.getElementById('loading'),
    userInfo: document.getElementById('userInfo'),
    noteList: document.getElementById('noteList'),
    noteListPanel: document.getElementById('noteListPanel'),
    editorPanel: document.getElementById('editorPanel'),
    newNoteBtn: document.getElementById('newNoteBtn'),
    noteTitle: document.getElementById('noteTitle'),
    noteContent: document.getElementById('noteContent'),
    markdownPreview: document.getElementById('markdownPreview'),
    deleteNoteBtn: document.getElementById('deleteNoteBtn'),
    saveStatus: document.getElementById('saveStatus'),
    backToListBtn: document.getElementById('backToListBtn'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    demoBanner: document.getElementById('demoBanner'),
    dismissDemo: document.getElementById('dismissDemo')
};

// ============================================================================
// Utility Functions
// ============================================================================

function showLoading(show = true) {
    if (show) {
        elements.loading.classList.add('active');
    } else {
        elements.loading.classList.remove('active');
    }
}

function debounce(func, delay) {
    return function (...args) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小時前`;
    if (minutes > 0) return `${minutes} 分鐘前`;
    return '剛剛';
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================================================
// Theme Management
// ============================================================================

function getTheme() {
    return localStorage.getItem('theme') || 'light';
}

function setTheme(theme) {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
}

function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
        html.classList.add('dark');
        elements.themeIcon.textContent = '☀️';
    } else {
        html.classList.remove('dark');
        elements.themeIcon.textContent = '🌙';
    }
}

function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function initTheme() {
    const savedTheme = getTheme();
    applyTheme(savedTheme);
}

// ============================================================================
// Markdown Rendering
// ============================================================================

function renderMarkdown(markdown) {
    try {
        const rawHtml = marked.parse(markdown || '');
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        elements.markdownPreview.innerHTML = cleanHtml || '<p class="text-gray-400">預覽區域</p>';
    } catch (error) {
        console.error('Markdown rendering error:', error);
        elements.markdownPreview.innerHTML = '<p class="text-red-500">渲染錯誤</p>';
    }
}

// ============================================================================
// Demo Mode (localStorage-based)
// ============================================================================

function getDemoNotes() {
    const notesJson = localStorage.getItem('demo-notes');
    return notesJson ? JSON.parse(notesJson) : [];
}

function saveDemoNotes(notesArray) {
    localStorage.setItem('demo-notes', JSON.stringify(notesArray));
    // Trigger update
    loadDemoNotes();
}

function loadDemoNotes() {
    notes = getDemoNotes();
    notes.sort((a, b) => {
        const aTime = new Date(a.updatedAt || 0);
        const bTime = new Date(b.updatedAt || 0);
        return bTime - aTime;
    });
    renderNoteList();
}

async function createDemoNote() {
    showLoading(true);

    const noteId = generateId();
    const now = new Date().toISOString();

    const newNote = {
        id: noteId,
        title: '新筆記',
        content: '',
        createdAt: now,
        updatedAt: now
    };

    const allNotes = getDemoNotes();
    allNotes.push(newNote);
    saveDemoNotes(allNotes);

    currentNoteId = noteId;
    selectNote(noteId);

    showLoading(false);
    console.log('Demo note created:', noteId);
}

async function updateDemoNote(noteId, data) {
    elements.saveStatus.textContent = '儲存中...';

    const allNotes = getDemoNotes();
    const noteIndex = allNotes.findIndex(n => n.id === noteId);

    if (noteIndex !== -1) {
        allNotes[noteIndex] = {
            ...allNotes[noteIndex],
            ...data,
            updatedAt: new Date().toISOString()
        };
        saveDemoNotes(allNotes);

        elements.saveStatus.textContent = '已儲存 ✓';
        setTimeout(() => {
            elements.saveStatus.textContent = '自動儲存 (演示模式)';
        }, 2000);
    }
}

async function deleteDemoNote(noteId) {
    const confirmed = confirm('確定要刪除此筆記嗎？');
    if (!confirmed) return;

    showLoading(true);

    const allNotes = getDemoNotes();
    const filteredNotes = allNotes.filter(n => n.id !== noteId);
    saveDemoNotes(filteredNotes);

    if (currentNoteId === noteId) {
        currentNoteId = null;
        clearEditor();
    }

    showLoading(false);
    console.log('Demo note deleted:', noteId);
}

// ============================================================================
// Firebase Operations
// ============================================================================

async function initFirebase() {
    try {
        showLoading(true);

        if (USE_DEMO_MODE) {
            // Demo mode - use localStorage
            console.log('Running in DEMO MODE (localStorage)');
            currentUser = { uid: 'demo-user' };
            elements.userInfo.textContent = '使用者: 演示模式';

            // Show demo banner if not dismissed
            const demoDismissed = localStorage.getItem('demo-banner-dismissed');
            if (!demoDismissed) {
                elements.demoBanner.classList.remove('hidden');
            }

            // Load notes from localStorage
            loadDemoNotes();

            showLoading(false);
            return;
        }

        // Initialize Firebase
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        // Sign in anonymously (or with custom token if available)
        const userCredential = await signInAnonymously(auth);
        currentUser = userCredential.user;

        // Update UI
        elements.userInfo.textContent = `使用者: ${currentUser.uid.substring(0, 8)}...`;

        // Set up notes collection reference
        notesCollectionRef = collection(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'notes');

        // Start listening to notes
        listenToNotes();

        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization error:', error);
        alert('Firebase 初始化失敗，請檢查配置。錯誤: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function listenToNotes() {
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
    }

    unsubscribeSnapshot = onSnapshot(notesCollectionRef, (snapshot) => {
        notes = [];
        snapshot.forEach((doc) => {
            notes.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by updatedAt (newest first)
        notes.sort((a, b) => {
            const aTime = a.updatedAt?.toDate?.() || new Date(a.updatedAt || 0);
            const bTime = b.updatedAt?.toDate?.() || new Date(b.updatedAt || 0);
            return bTime - aTime;
        });

        renderNoteList();
    }, (error) => {
        console.error('Error listening to notes:', error);
        alert('讀取筆記失敗: ' + error.message);
    });
}

async function createNote() {
    if (USE_DEMO_MODE) {
        return createDemoNote();
    }

    try {
        showLoading(true);

        const noteId = generateId();
        const now = new Date().toISOString();

        await setDoc(doc(notesCollectionRef, noteId), {
            title: '新筆記',
            content: '',
            createdAt: now,
            updatedAt: now
        });

        // Select the newly created note
        currentNoteId = noteId;

        console.log('Note created:', noteId);
    } catch (error) {
        console.error('Error creating note:', error);
        alert('建立筆記失敗: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function updateNote(noteId, data) {
    if (USE_DEMO_MODE) {
        return updateDemoNote(noteId, data);
    }

    try {
        elements.saveStatus.textContent = '儲存中...';

        await setDoc(doc(notesCollectionRef, noteId), {
            ...data,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        elements.saveStatus.textContent = '已儲存 ✓';
        setTimeout(() => {
            elements.saveStatus.textContent = '自動儲存';
        }, 2000);
    } catch (error) {
        console.error('Error updating note:', error);
        elements.saveStatus.textContent = '儲存失敗 ✗';
        alert('更新筆記失敗: ' + error.message);
    }
}

async function deleteNote(noteId) {
    if (USE_DEMO_MODE) {
        return deleteDemoNote(noteId);
    }

    try {
        const confirmed = confirm('確定要刪除此筆記嗎？');
        if (!confirmed) return;

        showLoading(true);

        await deleteDoc(doc(notesCollectionRef, noteId));

        // Clear editor if deleting current note
        if (currentNoteId === noteId) {
            currentNoteId = null;
            clearEditor();
        }

        console.log('Note deleted:', noteId);
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('刪除筆記失敗: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ============================================================================
// UI Rendering
// ============================================================================

function renderNoteList() {
    if (notes.length === 0) {
        elements.noteList.innerHTML = `
            <div class="p-4 text-gray-500 dark:text-gray-400 text-center">
                <p>尚無筆記</p>
                <p class="text-sm mt-2">點擊上方按鈕建立第一篇筆記</p>
            </div>
        `;
        return;
    }

    const html = notes.map(note => {
        const isActive = note.id === currentNoteId;
        return `
            <div class="note-list-item p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 ${isActive ? 'active' : ''}" data-note-id="${note.id}">
                <h3 class="font-semibold text-gray-800 dark:text-gray-200 truncate">${escapeHtml(note.title || '無標題')}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">${escapeHtml(note.content || '無內容').substring(0, 50)}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">${formatDate(note.updatedAt)}</p>
            </div>
        `;
    }).join('');

    elements.noteList.innerHTML = html;

    // Add click event listeners
    document.querySelectorAll('.note-list-item').forEach(item => {
        item.addEventListener('click', () => {
            const noteId = item.getAttribute('data-note-id');
            selectNote(noteId);
        });
    });
}

function selectNote(noteId) {
    currentNoteId = noteId;
    const note = notes.find(n => n.id === noteId);

    if (!note) {
        console.error('Note not found:', noteId);
        return;
    }

    // Update editor
    elements.noteTitle.value = note.title || '';
    elements.noteContent.value = note.content || '';
    elements.noteTitle.disabled = false;
    elements.noteContent.disabled = false;
    elements.deleteNoteBtn.disabled = false;
    elements.saveStatus.textContent = USE_DEMO_MODE ? '自動儲存 (演示模式)' : '自動儲存';

    // Render markdown
    renderMarkdown(note.content);

    // Update note list UI
    renderNoteList();

    // Show editor panel on mobile
    showEditorPanel();
}

function clearEditor() {
    elements.noteTitle.value = '';
    elements.noteContent.value = '';
    elements.noteTitle.disabled = true;
    elements.noteContent.disabled = true;
    elements.deleteNoteBtn.disabled = true;
    elements.saveStatus.textContent = '請選擇或建立筆記';
    elements.markdownPreview.innerHTML = '<p class="text-gray-400 dark:text-gray-500">預覽區域</p>';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// Mobile UI Toggle
// ============================================================================

function showEditorPanel() {
    elements.noteListPanel.classList.add('hidden');
    elements.noteListPanel.classList.remove('md:flex');
    elements.editorPanel.classList.remove('hidden');
    elements.editorPanel.classList.add('flex');
}

function showNoteListPanel() {
    elements.editorPanel.classList.add('hidden');
    elements.editorPanel.classList.remove('flex');
    elements.noteListPanel.classList.remove('hidden');
    elements.noteListPanel.classList.add('flex');
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Check if elements exist
    if (!elements.themeToggle) console.error('themeToggle not found');
    if (!elements.newNoteBtn) console.error('newNoteBtn not found');
    if (!elements.dismissDemo) console.error('dismissDemo not found');

    // Theme toggle button
    elements.themeToggle.addEventListener('click', () => {
        console.log('Theme toggle clicked');
        toggleTheme();
    });

    // Demo banner dismiss
    elements.dismissDemo.addEventListener('click', (e) => {
        console.log('Dismiss demo clicked');
        e.preventDefault();
        elements.demoBanner.classList.add('hidden');
        localStorage.setItem('demo-banner-dismissed', 'true');
    });

    // New Note button
    elements.newNoteBtn.addEventListener('click', () => {
        console.log('New note button clicked');
        createNote();
    });

    // Delete Note button
    elements.deleteNoteBtn.addEventListener('click', () => {
        if (currentNoteId) {
            deleteNote(currentNoteId);
        }
    });

    // Auto-save on title change
    const debouncedTitleSave = debounce((value) => {
        if (currentNoteId) {
            updateNote(currentNoteId, { title: value });
        }
    }, 1500);

    elements.noteTitle.addEventListener('input', (e) => {
        debouncedTitleSave(e.target.value);
        renderNoteList(); // Update list immediately for better UX
    });

    // Auto-save on content change
    const debouncedContentSave = debounce((value) => {
        if (currentNoteId) {
            updateNote(currentNoteId, { content: value });
        }
    }, 1500);

    elements.noteContent.addEventListener('input', (e) => {
        const content = e.target.value;
        debouncedContentSave(content);
        renderMarkdown(content); // Render immediately
    });

    // Back to list button (mobile)
    elements.backToListBtn.addEventListener('click', showNoteListPanel);

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            // Desktop: show both panels
            elements.noteListPanel.classList.remove('hidden');
            elements.noteListPanel.classList.add('flex');
            elements.editorPanel.classList.remove('hidden');
            elements.editorPanel.classList.add('md:flex');
        }
    });
}

// ============================================================================
// Initialize App
// ============================================================================

async function init() {
    try {
        console.log('Starting app initialization...');

        // Initialize theme before anything else
        initTheme();

        // Wait for Firebase modules to load (with timeout)
        try {
            const modules = await waitForFirebase();
            ({
                initializeApp,
                getAuth,
                signInAnonymously,
                signInWithCustomToken,
                getFirestore,
                collection,
                doc,
                setDoc,
                deleteDoc,
                onSnapshot,
                serverTimestamp
            } = modules);

            console.log('Firebase modules loaded');
        } catch (e) {
            console.warn('Firebase modules not available, will use demo mode');
        }

        await initFirebase();
        setupEventListeners();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('App initialization error:', error);
        showLoading(false);
        alert('應用初始化失敗：' + error.message + '\n\n請按F12打開控制台查看詳細錯誤。');
    }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
