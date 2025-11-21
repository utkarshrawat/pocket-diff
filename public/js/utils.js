// --- Text Transformation Logic ---

function convertText(action) {
    const inputEl = document.getElementById('utilInput');
    const outputEl = document.getElementById('utilOutput');
    const input = inputEl.value;
    
    if (!input) return;

    let output = "";

    try {
        switch(action) {
            case 'upper': output = input.toUpperCase(); break;
            case 'lower': output = input.toLowerCase(); break;
            
            case 'title': 
                output = input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                break;

            case 'base64enc': output = btoa(input); break;
            case 'base64dec': output = atob(input); break;
            case 'urlenc': output = encodeURIComponent(input); break;
            case 'urldec': output = decodeURIComponent(input); break;
            
            case 'camel': 
                output = input.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
                break;
            
            case 'snake':
                output = input.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
                    .map(x => x.toLowerCase()).join('_');
                break;

            case 'kebab':
                output = input.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
                    .map(x => x.toLowerCase()).join('-');
                break;
        }
        outputEl.value = output;
        updateStats();
    } catch (e) {
        outputEl.value = "Error: " + e.message;
    }
}

// --- Helper Functions ---

function updateStats() {
    const inVal = document.getElementById('utilInput').value;
    const outVal = document.getElementById('utilOutput').value;

    const calc = (txt) => {
        return `${txt.length} chars | ${txt.trim() ? txt.trim().split(/\s+/).length : 0} words`;
    };

    document.getElementById('inputStats').innerText = calc(inVal);
    document.getElementById('outputStats').innerText = calc(outVal);
    
    // Auto-save for persistence
    if(typeof saveState === 'function') saveState();
}

function clearText() {
    document.getElementById('utilInput').value = "";
    document.getElementById('utilOutput').value = "";
    updateStats();
}

function copyOutput() {
    const outputEl = document.getElementById('utilOutput');
    if (!outputEl.value) return;
    
    outputEl.select();
    navigator.clipboard.writeText(outputEl.value).then(() => {
        const btn = document.querySelector('.icon-btn[onclick="copyOutput()"]');
        const original = btn.innerText;
        btn.innerText = "✅ Copied!";
        setTimeout(() => btn.innerText = original, 1500);
    });
}