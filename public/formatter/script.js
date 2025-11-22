let editorInstance = null;
let currentLang = 'json';

// Default Placeholders
const DEFAULT_JSON = '{\n\t"message": "Paste JSON here"\n}';
const DEFAULT_SQL = '-- Enter your SQL query here\nSELECT * FROM users';

// Store content for each mode separately
const state = {
    json: DEFAULT_JSON,
    sql: DEFAULT_SQL
};

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});

require(['vs/editor/editor.main'], function () {
    // Load saved JSON from local storage if available
    const saved = localStorage.getItem('monacoContent');
    if (saved && saved.trim() !== "") {
        state.json = saved;
    }

    editorInstance = monaco.editor.create(document.getElementById('monacoBeautify'), {
        value: state.json,
        language: 'json',
        theme: 'vs-dark',
        automaticLayout: true
    });

    // Event: Save state on change
    editorInstance.onDidChangeModelContent(() => {
        state[currentLang] = editorInstance.getValue();
        
        if(currentLang === 'json') {
            const val = editorInstance.getValue();
            if(val !== DEFAULT_JSON) {
                localStorage.setItem('monacoContent', val);
            }
        }
    });

    // Event: Clear Placeholder on Focus
    editorInstance.onDidFocusEditorText(() => {
        const val = editorInstance.getValue();
        if ((currentLang === 'json' && val === DEFAULT_JSON) || (currentLang === 'sql' && val === DEFAULT_SQL)) {
            editorInstance.setValue("");
        }
    });

    // Event: Restore Placeholder on Blur if empty
    editorInstance.onDidBlurEditorText(() => {
        const val = editorInstance.getValue();
        if (val.trim() === "") {
            editorInstance.setValue(currentLang === 'json' ? DEFAULT_JSON : DEFAULT_SQL);
        }
    });
});

// --- UI HELPERS ---

function showToast(msg, type = 'error') {
    const container = document.getElementById('toastContainer');
    const messageEl = document.getElementById('toastMessage');
    
    messageEl.innerText = msg;
    
    // Reset classes
    messageEl.className = 'toast-message';
    messageEl.classList.add(type); // 'error', 'warning', 'success'
    
    container.classList.add('visible');
    
    // Hide after 3 seconds
    setTimeout(() => {
        container.classList.remove('visible');
    }, 3000);
}

function setEditorMode(lang) {
    if(currentLang === lang) return; 

    state[currentLang] = editorInstance.getValue();

    currentLang = lang;
    document.getElementById('btnModeJson').classList.toggle('active', lang === 'json');
    document.getElementById('btnModeSql').classList.toggle('active', lang === 'sql');
    monaco.editor.setModelLanguage(editorInstance.getModel(), lang);

    let content = state[lang];
    if (!content || content.trim() === "") {
        content = (lang === 'json') ? DEFAULT_JSON : DEFAULT_SQL;
    }
    editorInstance.setValue(content);
}

function clearEditor() {
    editorInstance.setValue("");
    editorInstance.focus();
}

// --- VALIDATION & FORMATTING ---

function validateSQL(sql) {
    if (!sql || sql === DEFAULT_SQL) return true;

    let depth = 0;
    for (let char of sql) {
        if (char === '(') depth++;
        if (char === ')') depth--;
        if (depth < 0) return "Unexpected closing parenthesis ')' found.";
    }
    if (depth > 0) return "Unclosed parenthesis '(' found.";

    const keywords = /(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|SHOW|GRANT|REVOKE|TRUNCATE)/i;
    if (!keywords.test(sql)) return "No valid SQL command found.";

    return true;
}

function formatCode() {
    const val = editorInstance.getValue();
    
    if (val === DEFAULT_JSON || val === DEFAULT_SQL || val.trim() === "") return;

    if (currentLang === 'json') {
        try { 
            const parsed = JSON.parse(val);
            editorInstance.setValue(JSON.stringify(parsed, null, 4));
            showToast("JSON Formatted Successfully", "success");
        } catch(e) { 
            showToast("Invalid JSON: " + e.message, "error");
        }
    } else {
        // SQL Validation
        const validation = validateSQL(val);
        if (validation !== true) {
            showToast("SQL Warning: " + validation, "warning");
        } else {
            // Only show success toast if no warnings
            // But we still run formatting below regardless of warning
            // because SQL beautifiers often fix ugly (but valid) code.
        }

        let formatted = val
            .replace(/\s+/g, ' ') 
            .replace(/\s(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|LIMIT|INSERT|UPDATE|DELETE|HAVING|VALUES|SET|INNER JOIN|LEFT JOIN|RIGHT JOIN|ON)\s/gi, '\n$1 ')
            .replace(/\s(CASE|WHEN|THEN|ELSE|END)\s/gi, '\n\t$1 ')
            .replace(/;/g, ';\n'); 

        editorInstance.setValue(formatted);
        editorInstance.getAction('editor.action.formatDocument').run();
        
        if(validation === true) showToast("SQL Formatted Successfully", "success");
    }
}

function showFindWidget() { editorInstance.trigger('source', 'actions.find'); }

function toggleFolding(action) {
    if (action === 'fold') editorInstance.trigger('source', 'editor.foldAll');
    if (action === 'unfold') editorInstance.trigger('source', 'editor.unfoldAll');
}