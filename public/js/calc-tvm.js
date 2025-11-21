let displayVal = "0";

function updateScreen() { document.getElementById('calcDisplay').innerText = displayVal; }

function calcInput(val) {
    if (val === '.' && displayVal.includes('.')) return;
    if (val === '+/-') { displayVal = (parseFloat(displayVal) * -1).toString(); }
    else if (['+', '-', '*', '/'].includes(val)) { displayVal += val; }
    else {
        if (displayVal === "0") displayVal = val;
        else displayVal += val;
    }
    updateScreen();
}

function calculateResult() {
    try { displayVal = eval(displayVal).toString(); updateScreen(); } catch (e) { displayVal = "Error"; }
}

function assignToInput(key) {
    try {
        const val = parseFloat(eval(displayVal));
        document.getElementById(`input_${key}`).value = val;
        displayVal = "0";
        updateScreen();
        saveState(); // Trigger auto-save
    } catch (e) { alert("Invalid Number"); }
}

function resetTVM() {
    ['n','i','pv','pmt','fv'].forEach(k => document.getElementById(`input_${k}`).value = '');
    saveState();
}

function solveFor(target) {
    let n = parseFloat(document.getElementById('input_n').value);
    let i = parseFloat(document.getElementById('input_i').value);
    let pv = parseFloat(document.getElementById('input_pv').value);
    let pmt = parseFloat(document.getElementById('input_pmt').value);
    let fv = parseFloat(document.getElementById('input_fv').value);

    let r = i / 100;
    let res = 0;
    
    try {
        if (target === 'fv') {
            if (r === 0) res = -(pv + pmt * n);
            else res = -(pv * Math.pow(1+r, n) + pmt * (Math.pow(1+r, n) - 1) / r);
        } else if (target === 'pmt') {
            if (r === 0) res = -(pv + fv) / n;
            else res = -(pv * Math.pow(1+r, n) + fv) / ((Math.pow(1+r, n) - 1) / r);
        } else if (target === 'pv') {
            res = -(fv + pmt * (Math.pow(1+r, n) - 1) / r) / Math.pow(1+r, n);
        }
        
        document.getElementById(`input_${target}`).value = res.toFixed(4);
        document.getElementById('calcStatus').innerText = `Computed ${target.toUpperCase()}`;
        saveState();
    } catch (e) {
        document.getElementById('calcStatus').innerText = "Error";
    }
}