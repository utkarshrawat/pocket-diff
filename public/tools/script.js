// --- TAB LOGIC ---
function openSubTab(tabId, el) {
    document.querySelectorAll('.sub-tab').forEach(t => t.style.display = 'none');
    document.getElementById(tabId).style.display = 'block';
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    if(el) el.classList.add('active');
}

// --- 1. TEXT TRANSFORMER ---
function convertText(action) {
    const input = document.getElementById('utilInput').value;
    let output = "";
    try {
        if(action === 'upper') output = input.toUpperCase();
        else if(action === 'lower') output = input.toLowerCase();
        else if(action === 'title') output = input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        else if(action === 'base64enc') output = btoa(input);
        else if(action === 'base64dec') output = atob(input);
        else if(action === 'urlenc') output = encodeURIComponent(input);
        else if(action === 'urldec') output = decodeURIComponent(input);
        else if(action === 'camel') output = input.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
        else if(action === 'snake') output = input.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map(x => x.toLowerCase()).join('_');
        else if(action === 'kebab') output = input.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map(x => x.toLowerCase()).join('-');
        
        document.getElementById('utilOutput').value = output;
        updateTextStats();
    } catch(e) { document.getElementById('utilOutput').value = "Error: " + e.message; }
}

function updateTextStats() {
    const val = document.getElementById('utilInput').value;
    document.getElementById('textStats').innerText = `${val.length} chars | ${val.trim() ? val.trim().split(/\s+/).length : 0} words`;
}

function clearText() {
    document.getElementById('utilInput').value = "";
    document.getElementById('utilOutput').value = "";
    updateTextStats();
}

function copyOutput() {
    const el = document.getElementById('utilOutput');
    el.select();
    navigator.clipboard.writeText(el.value);
}

// --- 2. REGEX TESTER ---
function runRegex() {
    const patStr = document.getElementById('regexPattern').value;
    const txt = document.getElementById('regexInput').value;
    const res = document.getElementById('regexResult');
    
    if(!patStr || !txt) { res.innerHTML = "Matches will appear here..."; return; }
    
    try {
        const match = patStr.match(new RegExp('^/(.*?)/([gimyus]*)$'));
        const regex = match ? new RegExp(match[1], match[2]) : new RegExp(patStr, 'g');
        const matches = txt.match(regex);
        
        if (matches) {
            const count = matches.length;
            // Escape HTML to prevent injection when displaying matches
            const safeMatches = matches.map(m => m.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"));
            res.innerHTML = `Found <strong>${count}</strong> match${count!==1?'es':''}:<br><code>${safeMatches.join('</code>, <code>')}</code>`;
        } else {
            res.innerHTML = "No matches found.";
        }
    } catch(e) { res.innerHTML = `<span style="color:#ef4444">Invalid Regex Pattern</span>`; }
}

function loadRegexExample() {
    document.getElementById('regexPattern').value = '/[a-z0-9]+@[a-z]+\\.[a-z]{2,}/gi';
    document.getElementById('regexInput').value = 'Contact support@example.com or sales@test.co.uk for info.';
    runRegex();
}

function clearRegex() {
    document.getElementById('regexPattern').value = "";
    document.getElementById('regexInput').value = "";
    document.getElementById('regexResult').innerHTML = "Matches will appear here...";
}

// --- 3. JWT DECODER ---
function decodeJWT() {
    const token = document.getElementById('jwtInput').value.trim();
    if(!token) return;

    try {
        const parts = token.split('.');
        if(parts.length !== 3) throw new Error();

        const decode = (str) => {
            const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
            const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            return JSON.stringify(JSON.parse(json), null, 4);
        };

        document.getElementById('jwtHeader').textContent = decode(parts[0]);
        document.getElementById('jwtPayload').textContent = decode(parts[1]);
    } catch(e) {
        document.getElementById('jwtHeader').textContent = "Error parsing JWT";
        document.getElementById('jwtPayload').textContent = "Invalid Token";
    }
}

function loadJwtExample() {
    document.getElementById('jwtInput').value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    decodeJWT();
}

function clearJwt() {
    document.getElementById('jwtInput').value = "";
    document.getElementById('jwtHeader').textContent = "{}";
    document.getElementById('jwtPayload').textContent = "{}";
}

// --- 4. TIME ---
function convertTime(dir) {
    if (dir === 'toHuman') {
        const ts = document.getElementById('tsInput').value;
        if(!ts) return;
        const date = ts.length > 11 ? new Date(parseInt(ts)) : new Date(parseInt(ts) * 1000);
        document.getElementById('tsResult').innerText = date.toString();
    } else {
        const d = document.getElementById('dateInput').value;
        if(!d) return;
        const date = new Date(d);
        document.getElementById('dateResult').innerText = Math.floor(date.getTime() / 1000);
    }
}

function clearTime() {
    document.getElementById('tsInput').value = "";
    document.getElementById('dateInput').value = "";
    document.getElementById('tsResult').innerText = "";
    document.getElementById('dateResult').innerText = "";
}

// --- 5. COLOR ---
function convertColor(src) {
    const p = document.getElementById('colorPicker');
    const h = document.getElementById('colorHex');
    const r = document.getElementById('colorRgb');
    const v = document.getElementById('colorPreview');
    
    let hex = h.value;

    if(src === 'picker') { 
        hex = p.value;
        h.value = hex; 
    }
    else if(src === 'hex') { 
        if(!hex.startsWith('#')) hex = '#' + hex;
        p.value = hex; 
    }
    
    // Hex to RGB
    const bigint = parseInt(hex.replace('#',''), 16);
    const red = (bigint >> 16) & 255;
    const green = (bigint >> 8) & 255;
    const blue = bigint & 255;
    
    if(!isNaN(red)) {
        r.value = `rgb(${red}, ${green}, ${blue})`;
        v.style.background = hex;
    }
}

function clearColor() {
    document.getElementById('colorPicker').value = "#000000";
    document.getElementById('colorHex').value = "";
    document.getElementById('colorRgb').value = "";
    document.getElementById('colorPreview').style.background = "transparent";
}