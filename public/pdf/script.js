// --- TABS (Fixed Logic) ---
function openSubTab(tabId, el) {
    // 1. Hide ALL sub-tabs
    document.querySelectorAll('.sub-tab').forEach(t => {
        t.style.display = 'none';
        t.classList.remove('active');
    });

    // 2. Show TARGET sub-tab
    const target = document.getElementById(tabId);
    if (target) {
        target.style.display = 'flex';
        target.classList.add('active');
    }

    // 3. Update Sidebar Buttons
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
}

// --- 1. VIEWER ---
let currentObjectUrl = null;

function loadViewer(input) {
    if (input.files.length === 0) return;
    const file = input.files[0];
    
    document.getElementById('viewLabel').innerText = file.name;
    
    // Cleanup previous URL
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = URL.createObjectURL(file);
    
    const container = document.getElementById('pdfFrameContainer');
    container.innerHTML = `<embed src="${currentObjectUrl}" type="application/pdf" class="pdf-embed" />`;
    container.classList.remove('hidden');
}

function clearViewer() {
    const input = document.getElementById('viewInput');
    input.value = ""; // Reset file input so onchange fires again
    
    document.getElementById('viewLabel').innerText = "Click to Open PDF";
    document.getElementById('pdfFrameContainer').innerHTML = "";
    document.getElementById('pdfFrameContainer').classList.add('hidden');
    
    if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
    }
}

// --- 2. MERGE ---
let filesToMerge = [];

function handleMergeSelect(input) {
    const list = document.getElementById('mergeList');
    // Append new files to existing list or replace? Let's append.
    const newFiles = Array.from(input.files);
    filesToMerge = filesToMerge.concat(newFiles);
    
    renderMergeList();
    document.getElementById('btnMerge').classList.remove('hidden');
}

function renderMergeList() {
    const list = document.getElementById('mergeList');
    list.innerHTML = "";
    
    filesToMerge.forEach((file, index) => {
        list.innerHTML += `
            <li>
                <span>📄 ${file.name}</span> 
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="color:#94a3b8; font-size:12px;">${(file.size/1024/1024).toFixed(2)} MB</span>
                    <button onclick="removeMergeFile(${index})" style="background:none; border:none; cursor:pointer;">❌</button>
                </div>
            </li>`;
    });

    if (filesToMerge.length === 0) {
        document.getElementById('btnMerge').classList.add('hidden');
    }
}

function removeMergeFile(index) {
    filesToMerge.splice(index, 1);
    renderMergeList();
}

function clearMerge() {
    filesToMerge = [];
    renderMergeList();
    document.getElementById('mergeInput').value = "";
}

async function executeMerge() {
    if (filesToMerge.length < 2) { alert("Please select at least 2 PDF files."); return; }

    try {
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create(); 

        for (const file of filesToMerge) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const pdfBytes = await mergedPdf.save();
        downloadBlob(pdfBytes, "merged_document.pdf");
    } catch(e) {
        alert("Error merging PDFs: " + e.message);
    }
}

// --- 3. SPLIT ---
let fileToSplit = null;
let totalPages = 0;

async function handleSplitSelect(input) {
    if(input.files.length === 0) return;
    fileToSplit = input.files[0];
    document.getElementById('splitLabel').innerText = fileToSplit.name;
    
    try {
        const arrayBuffer = await fileToSplit.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        totalPages = pdf.getPageCount();
        
        document.getElementById('totalPages').innerText = totalPages;
        document.getElementById('splitControls').classList.remove('hidden');
    } catch (e) {
        alert("Error loading PDF. Is it encrypted?");
    }
}

function clearSplit() {
    fileToSplit = null;
    totalPages = 0;
    document.getElementById('splitInput').value = "";
    document.getElementById('splitLabel').innerText = "📂 Select PDF";
    document.getElementById('pageRange').value = "";
    document.getElementById('splitControls').classList.add('hidden');
}

async function executeSplit() {
    if (!fileToSplit) return;
    
    const rangeStr = document.getElementById('pageRange').value;
    const indices = parsePageRange(rangeStr, totalPages);
    
    if (indices.length === 0) { alert("Invalid page range or out of bounds."); return; }

    try {
        const arrayBuffer = await fileToSplit.arrayBuffer();
        const srcPdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const newPdf = await PDFLib.PDFDocument.create();
        
        const copiedPages = await newPdf.copyPages(srcPdf, indices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        downloadBlob(pdfBytes, `split_pages.pdf`);
    } catch(e) {
        alert("Error splitting PDF: " + e.message);
    }
}

function parsePageRange(str, max) {
    const pages = new Set();
    const parts = str.split(',');
    
    parts.forEach(part => {
        const range = part.trim().split('-');
        if (range.length === 1) {
            const p = parseInt(range[0]);
            if (!isNaN(p) && p >= 1 && p <= max) pages.add(p - 1); // 0-based
        } else if (range.length === 2) {
            let start = parseInt(range[0]);
            let end = parseInt(range[1]);
            if (!isNaN(start) && !isNaN(end)) {
                start = Math.max(1, start);
                end = Math.min(max, end);
                for (let i = start; i <= end; i++) pages.add(i - 1);
            }
        }
    });
    
    return Array.from(pages).sort((a, b) => a - b);
}

// --- UTILS ---
function downloadBlob(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// --- INIT ---
// Ensure correct tab is visible on load
document.addEventListener("DOMContentLoaded", () => {
    openSubTab('tool-view', document.querySelector('.sidebar-btn.active'));
});