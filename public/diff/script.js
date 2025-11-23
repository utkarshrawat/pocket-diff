let diffEditorInstance = null;
let diffNavigator = null;
let currentDiffIndex = -1;
let pendingMerge = null;

require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});

require(['vs/editor/editor.main'], function () {
    const el = document.getElementById('monacoDiff');
    if (el) {
        diffEditorInstance = monaco.editor.createDiffEditor(el, {
            theme: 'vs-dark',
            originalEditable: true,
            readOnly: false,
            automaticLayout: true,
            renderSideBySide: true,
            scrollBeyondLastLine: false
        });
    }
});

// --- COMPARATOR LOGIC ---
function compareMonaco() {
    if (!diffEditorInstance) return;

    const raw1 = document.getElementById('rawJson1').value || "";
    const raw2 = document.getElementById('rawJson2').value || "";
    const ignoreOrder = document.getElementById('ignoreOrder').checked;

    try {
        // Handle empty inputs gracefully
        const val1 = raw1.trim() === "" ? "{}" : raw1;
        const val2 = raw2.trim() === "" ? "{}" : raw2;

        let obj1 = JSON.parse(val1);
        let obj2 = JSON.parse(val2);

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

        document.getElementById('resultArea').classList.remove('hidden');
        
        setTimeout(updateStats, 500);

    } catch (e) {
        alert("Invalid JSON: " + e.message);
    }
}

function deepSortObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(deepSortObject).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = deepSortObject(obj[key]);
        return acc;
    }, {});
}

// --- INPUT LOGIC ---
function clearInput(side) {
    if (side === 'left') document.getElementById('rawJson1').value = "";
    else document.getElementById('rawJson2').value = "";
}

// --- MERGE LOGIC ---
function initMerge(direction) {
    if (currentDiffIndex === -1 || !diffNavigator || diffNavigator.length === 0) {
        alert("No difference selected.");
        return;
    }

    pendingMerge = { direction: direction, index: currentDiffIndex };
    
    const text = direction === 'left' 
        ? "Replace ORIGINAL (Left) content with MODIFIED (Right)?" 
        : "Replace MODIFIED (Right) content with ORIGINAL (Left)?";
    
    document.getElementById('modalText').innerText = text;
    document.getElementById('confirmModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    pendingMerge = null;
}

function executeMerge() {
    if (!pendingMerge) return;
    
    const diff = diffNavigator[pendingMerge.index];
    const originalModel = diffEditorInstance.getModel().original;
    const modifiedModel = diffEditorInstance.getModel().modified;

    // Define variables for source (where we copy FROM) and target (where we paste TO)
    let sourceModel, targetModel, sourceStart, sourceEnd, targetStart, targetEnd, targetInputId;

    if (pendingMerge.direction === 'left') {
        // Copy Right -> Left
        sourceModel = modifiedModel;
        targetModel = originalModel;
        sourceStart = diff.modifiedStartLineNumber;
        sourceEnd   = diff.modifiedEndLineNumber;
        targetStart = diff.originalStartLineNumber;
        targetEnd   = diff.originalEndLineNumber;
        targetInputId = 'rawJson1';
    } else {
        // Copy Left -> Right
        sourceModel = originalModel;
        targetModel = modifiedModel;
        sourceStart = diff.originalStartLineNumber;
        sourceEnd   = diff.originalEndLineNumber;
        targetStart = diff.modifiedStartLineNumber;
        targetEnd   = diff.modifiedEndLineNumber;
        targetInputId = 'rawJson2';
    }

    // --- LOGIC ---
    let textToCopy = "";
    let rangeToReplace = null;

    // 1. GET TEXT
    if (sourceEnd === 0) {
        // Source is empty (Deletion) -> We copy empty string
        textToCopy = ""; 
    } else {
        // Source has content -> Get full lines
        // We use 99999 as max column to ensure we grab the whole line content
        const rangeSource = new monaco.Range(sourceStart, 1, sourceEnd, 99999);
        textToCopy = sourceModel.getValueInRange(rangeSource);
    }

    // 2. DETERMINE TARGET RANGE
    if (targetEnd === 0) {
        // INSERTION: Target has no lines here.
        // We must insert AFTER the targetStart line.
        // If targetStart is 0 (empty file), we insert at line 1.
        const insertLine = targetStart === 0 ? 1 : targetStart + 1;
        rangeToReplace = new monaco.Range(insertLine, 1, insertLine, 1);
        
        // If we are inserting into a non-empty file, we might need a newline
        if (targetStart > 0) {
            textToCopy = "\n" + textToCopy; 
        }
    } else {
        // REPLACEMENT / DELETION: Target has lines to be removed/overwritten.
        rangeToReplace = new monaco.Range(targetStart, 1, targetEnd, 99999);
        
        // If we are deleting (textToCopy is empty), we might leave a blank line.
        // Better to replace the whole range including the newline if possible, 
        // but Monaco handles line deletions best by replacing the range with null/empty.
    }

    // 3. EXECUTE EDIT
    targetModel.pushEditOperations(
        [], 
        [{ range: rangeToReplace, text: textToCopy, forceMoveMarkers: true }], 
        () => null
    );

    // 4. SYNC & REFRESH
    document.getElementById(targetInputId).value = targetModel.getValue();
    closeModal();
    
    // Silent refresh to update diff highlights without alerting user
    // This handles cases where JSON becomes temporarily invalid (e.g., missing comma) 
    // allowing the user to see the red error line in the editor and fix it manually.
    setTimeout(() => {
        try {
            // Don't re-parse/re-set models (that resets cursor). 
            // Just trigger a diff calculation update if the editor handles it, 
            // OR re-run full compare if we want to ensure sync.
            // Re-running full compare is safest for "Invalid JSON" states:
            compareMonaco();
        } catch (e) {
            console.log("Merge created invalid JSON state - user manual fix required.");
        }
    }, 200);
}

// --- NAVIGATION ---
function updateStats() {
    if (!diffEditorInstance) return;
    diffNavigator = diffEditorInstance.getLineChanges();
    const count = diffNavigator ? diffNavigator.length : 0;
    document.getElementById('diffStats').innerText = `${count} Diff${count !== 1 ? 's' : ''}`;
    
    const displayStyle = count > 0 ? 'flex' : 'none';
    document.getElementById('btnMergeLeft').style.display = displayStyle;
    document.getElementById('btnMergeRight').style.display = displayStyle;

    if (count > 0) {
        if (currentDiffIndex >= count || currentDiffIndex < 0) {
            currentDiffIndex = -1;
            navDiff('next');
        }
    }
}

function navDiff(dir) {
    if (!diffNavigator || !diffNavigator.length) return;
    
    if (dir === 'next') {
        currentDiffIndex++;
        if (currentDiffIndex >= diffNavigator.length) currentDiffIndex = 0;
    } else {
        currentDiffIndex--;
        if (currentDiffIndex < 0) currentDiffIndex = diffNavigator.length - 1;
    }

    const diff = diffNavigator[currentDiffIndex];
    const line = diff.modifiedStartLineNumber > 0 ? diff.modifiedStartLineNumber : diff.originalStartLineNumber;
    
    diffEditorInstance.getModifiedEditor().revealLineInCenter(line);
    diffEditorInstance.getModifiedEditor().setPosition({column: 1, lineNumber: line});
    diffEditorInstance.getModifiedEditor().focus();
    
    document.getElementById('diffStats').innerText = `Diff ${currentDiffIndex + 1} of ${diffNavigator.length}`;
}

function showDiffSearch() {
    if (diffEditorInstance) diffEditorInstance.getModifiedEditor().trigger('source', 'actions.find');
}