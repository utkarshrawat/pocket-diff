// Globals
let editorInstance = null;
let diffEditorInstance = null;
let diffNavigator = null;
let currentDiffIndex = -1;

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});

require(['vs/editor/editor.main'], function () {
    // 1. Beautifier
    const savedContent = localStorage.getItem('monacoContent') || '{\n\t"message": "Paste JSON here"\n}';
    
    editorInstance = monaco.editor.create(document.getElementById('monacoBeautify'), {
        value: savedContent,
        language: 'json',
        theme: 'vs-dark',
        automaticLayout: true
    });
    
    editorInstance.onDidChangeModelContent(() => {
        saveState();
    });

    // 2. Diff Editor
    diffEditorInstance = monaco.editor.createDiffEditor(document.getElementById('monacoDiff'), {
        theme: 'vs-dark',
        originalEditable: true, // Allow editing left side too for convenience
        readOnly: false,
        automaticLayout: true,
        renderSideBySide: true
    });
});

// --- Beautifier Functions ---
function beautifyMonaco() {
    try {
        const val = editorInstance.getValue();
        const parsed = JSON.parse(val);
        editorInstance.setValue(JSON.stringify(parsed, null, 4));
        editorInstance.getAction('editor.action.formatDocument').run();
    } catch (e) { alert("Invalid JSON"); }
}

function showFindWidget() {
    if (editorInstance) editorInstance.getAction('actions.find').run();
}

function toggleFolding(action) {
    if (editorInstance) {
        if (action === 'fold') editorInstance.trigger('source', 'editor.foldAll');
        if (action === 'unfold') editorInstance.trigger('source', 'editor.unfoldAll');
    }
}

// --- Diff/Comparator Functions ---
function deepSortObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(deepSortObject).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = deepSortObject(obj[key]);
        return acc;
    }, {});
}

function compareMonaco() {
    const t1 = document.getElementById('rawJson1').value;
    const t2 = document.getElementById('rawJson2').value;
    const ignoreOrder = document.getElementById('ignoreOrder').checked;
    
    try {
        let obj1 = JSON.parse(t1);
        let obj2 = JSON.parse(t2);

        if (ignoreOrder) {
            obj1 = deepSortObject(obj1);
            obj2 = deepSortObject(obj2);
        }

        const originalModel = monaco.editor.createModel(JSON.stringify(obj1, null, 4), 'json');
        const modifiedModel = monaco.editor.createModel(JSON.stringify(obj2, null, 4), 'json');
        
        diffEditorInstance.setModel({
            original: originalModel,
            modified: modifiedModel
        });

        // Show navigation controls
        document.getElementById('diffNav').classList.remove('hidden');
        document.getElementById('diffNav').style.display = "flex"; // Force flex
        
        // Wait for render then calculate stats
        setTimeout(calculateDiffs, 500);

    } catch (e) {
        alert("Invalid JSON: " + e.message);
    }
}

function calculateDiffs() {
    diffNavigator = diffEditorInstance.getLineChanges();
    const count = diffNavigator ? diffNavigator.length : 0;
    document.getElementById('diffStats').innerText = `${count} Diff(s)`;
    
    if (count > 0) {
        currentDiffIndex = -1;
        navDiff('next');
    }
}

function navDiff(direction) {
    if (!diffNavigator || diffNavigator.length === 0) return;
    
    if (direction === 'next') {
        currentDiffIndex++;
        if (currentDiffIndex >= diffNavigator.length) currentDiffIndex = 0;
    } else {
        currentDiffIndex--;
        if (currentDiffIndex < 0) currentDiffIndex = diffNavigator.length - 1;
    }

    const diff = diffNavigator[currentDiffIndex];
    // Jump to the diff line in the modified (right) editor
    const lineToJump = diff.modifiedStartLineNumber > 0 ? diff.modifiedStartLineNumber : diff.originalStartLineNumber;
    
    diffEditorInstance.getModifiedEditor().revealLineInCenter(lineToJump);
    diffEditorInstance.getModifiedEditor().setPosition({column: 1, lineNumber: lineToJump});
    diffEditorInstance.getModifiedEditor().focus();
    
    document.getElementById('diffStats').innerText = `Diff ${currentDiffIndex + 1}/${diffNavigator.length}`;
}

function showDiffSearch() {
    // Open Find widget in the modified (right) editor
    diffEditorInstance.getModifiedEditor().trigger('source', 'actions.find');
}