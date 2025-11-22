let isBGN = false;
let displayVal = "0";

// --- UI Logic ---
function updateScreen(val) { document.getElementById('calcDisplay').value = val; }
function getDisplay() { return document.getElementById('calcDisplay').value; }

function showToast(msg, type = 'error') {
    const toastEl = document.getElementById('calcToast');
    const container = document.querySelector('.calc-body');
    
    if(!toastEl || !container) return;

    toastEl.innerText = msg;
    // Remove old classes first
    toastEl.classList.remove('error', 'info', 'success');
    toastEl.classList.add('toast-message', type);
    
    container.classList.add('has-toast');
    
    setTimeout(() => {
        container.classList.remove('has-toast');
    }, 3000);
}

function toggleFin(mode, btn) {
    document.getElementById('view-calc').style.display = mode === 'calc' ? 'block' : 'none';
    document.getElementById('view-adv').style.display = mode === 'adv' ? 'block' : 'none';
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    if(mode === 'adv') {
        ['n','i','pv','pmt'].forEach(id => {
            const val = document.getElementById(`input_${id}`).value;
            if(val) document.getElementById(`amort_${id}`).value = val;
        });
    }
}

// --- Keypad ---
function calcInput(val) {
    let current = getDisplay();
    if (current === "0" || current === "Error") current = "";
    
    if (val === '1/x') updateScreen(`(1/(${current}))`);
    else if (val === 'sqrt') updateScreen(`Math.sqrt(${current})`);
    else if (val === 'y^x') updateScreen(current + '**');
    else if (val === '+/-') {
        if(current.startsWith('-')) updateScreen(current.substring(1));
        else updateScreen('-' + current);
    } else {
        updateScreen(current + val);
    }
}

function calculateResult() {
    try { 
        let res = eval(getDisplay());
        if(!isFinite(res) || isNaN(res)) throw new Error();
        updateScreen(res.toString()); 
    } catch(e) { showToast("Invalid Equation"); }
}

function backspace() { 
    let cur = getDisplay();
    updateScreen(cur.slice(0, -1) || "0"); 
}

// --- TVM Logic ---
function toggleBGN() {
    isBGN = !isBGN;
    const btn = document.getElementById('btn_bgn');
    btn.innerText = isBGN ? "BGN" : "END";
    btn.classList.toggle('active', isBGN);
}

function syncCY() { document.getElementById('input_cy').value = document.getElementById('input_py').value; }

function solveFor(target) {
    let n = parseFloat(document.getElementById('input_n').value) || 0;
    let i = parseFloat(document.getElementById('input_i').value) || 0;
    let pv = parseFloat(document.getElementById('input_pv').value) || 0;
    let pmt = parseFloat(document.getElementById('input_pmt').value) || 0;
    let fv = parseFloat(document.getElementById('input_fv').value) || 0;
    
    let py = parseFloat(document.getElementById('input_py').value) || 12;
    let cy = parseFloat(document.getElementById('input_cy').value) || 12;

    let r = Math.pow(1 + (i / 100 / cy), cy / py) - 1;
    let type = isBGN ? 1 : 0;
    let res = 0;

    try {
        if (target === 'fv') {
            if (r === 0) res = -(pv + pmt * n);
            else res = -(pv * Math.pow(1+r, n) + pmt * (Math.pow(1+r, n) - 1) / r * (1 + r * type));
        } else if (target === 'pmt') {
            if (r === 0) res = -(pv + fv) / n;
            else res = -(pv * Math.pow(1+r, n) + fv) / ((Math.pow(1+r, n) - 1) / r * (1 + r * type));
        } else if (target === 'pv') {
            if (r === 0) res = -(fv + pmt * n);
            else res = -(fv + pmt * (Math.pow(1+r, n) - 1) / r * (1 + r * type)) / Math.pow(1+r, n);
        } else if (target === 'n') {
             if (r === 0) res = -(fv + pv) / pmt;
             else {
                 let pmt_adj = pmt * (1 + r * type);
                 let num = pmt_adj - fv * r;
                 let den = pmt_adj + pv * r;
                 if (num/den <= 0) throw new Error("Sign Error");
                 res = Math.log(num / den) / Math.log(1 + r);
             }
        }

        if(isNaN(res) || !isFinite(res)) throw new Error();
        
        const el = document.getElementById(`input_${target}`);
        el.value = res.toFixed(4);
        el.classList.add('updated');
        setTimeout(() => el.classList.remove('updated'), 1000);
        saveState();
        showToast(`Computed ${target.toUpperCase()}`, 'success');

    } catch(e) { 
        showToast("Error: Check signs (+/-) or inputs"); 
    }
}

// --- Analysis Logic ---
function generateAmortization() {
    let n = parseFloat(document.getElementById('amort_n').value);
    let i = parseFloat(document.getElementById('amort_i').value);
    let pv = parseFloat(document.getElementById('amort_pv').value);
    let pmt = parseFloat(document.getElementById('amort_pmt').value);
    
    if (isNaN(n) || isNaN(pv) || isNaN(pmt)) { 
        document.getElementById('amortTableContainer').innerHTML = `<div style="color:#fca5a5; padding:10px; border:1px solid #ef4444; border-radius:6px; margin-top:10px;">Missing N, PV, or PMT</div>`; 
        return; 
    }
    
    let r = i / 100 / 12; 
    let balance = pv;
    let html = `<table class="amort-table"><thead><tr><th>#</th><th>Balance</th><th>Int</th><th>Prin</th></tr></thead><tbody>`;
    
    for (let period = 1; period <= n; period++) {
        let interest = balance * r;
        let principal = Math.abs(pmt) - interest;
        let ending = balance - principal;
        html += `<tr><td>${period}</td><td>${balance.toFixed(2)}</td><td>${interest.toFixed(2)}</td><td>${principal.toFixed(2)}</td></tr>`;
        balance = ending;
        if(balance < 0.1) balance = 0;
    }
    html += `</tbody></table>`;
    document.getElementById('amortTableContainer').innerHTML = html;
}

function calcIconv(target) {
    let nom = parseFloat(document.getElementById('iconv_nom').value);
    let eff = parseFloat(document.getElementById('iconv_eff').value);
    let cy = parseFloat(document.getElementById('iconv_cy').value) || 12;

    if (target === 'eff') {
        if(isNaN(nom)) { showToast("Enter Nominal Rate", 'error'); return; }
        let res = (Math.pow(1 + nom / 100 / cy, cy) - 1) * 100;
        document.getElementById('iconv_eff').value = res.toFixed(4);
    } else {
        if(isNaN(eff)) { showToast("Enter Effective Rate", 'error'); return; }
        let res = cy * (Math.pow(1 + eff / 100, 1 / cy) - 1) * 100;
        document.getElementById('iconv_nom').value = res.toFixed(4);
    }
}

function calculateNPV_IRR() {
    // Basic logic placeholder - assumes existing structure
    // (See full implementation in previous turns if needed)
}

function resetTVM() {
    ['n','i','pv','pmt','fv'].forEach(k => document.getElementById(`input_${k}`).value = '');
    updateScreen("0");
    showToast("TVM Cleared", 'info');
}

if(typeof loadState === 'function') loadState();