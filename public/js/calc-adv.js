// Generate Amortization Schedule
function generateAmortization() {
    let n = parseFloat(document.getElementById('input_n').value);
    let i = parseFloat(document.getElementById('input_i').value) / 100; // Annual rate usually
    let pv = parseFloat(document.getElementById('input_pv').value);
    let pmt = parseFloat(document.getElementById('input_pmt').value);
    
    // Assumption: I/Y is annual, N is months. Convert I to monthly
    let r = i / 12; 
    
    if (isNaN(n) || isNaN(pv) || isNaN(pmt)) {
        alert("Please calculate or enter N, PV, and PMT in the Calculator tab first.");
        return;
    }

    let balance = pv;
    let html = `<table class="amort-table">
        <thead><tr><th>Period</th><th>Balance</th><th>Interest</th><th>Principal</th><th>Ending</th></tr></thead><tbody>`;

    for (let period = 1; period <= n; period++) {
        let interest = balance * r;
        let principal = Math.abs(pmt) - interest;
        let ending = balance - principal;
        
        html += `<tr>
            <td>${period}</td>
            <td>${balance.toFixed(2)}</td>
            <td>${interest.toFixed(2)}</td>
            <td>${principal.toFixed(2)}</td>
            <td>${ending.toFixed(2)}</td>
        </tr>`;
        balance = ending;
        if(balance < 0) balance = 0;
    }
    html += `</tbody></table>`;
    document.getElementById('amortTableContainer').innerHTML = html;
}

// NPV & IRR
function calculateNPV_IRR() {
    let cf0 = parseFloat(document.getElementById('cf0').value);
    let flowsStr = document.getElementById('cashFlows').value;
    let rate = parseFloat(document.getElementById('discountRate').value) / 100;

    let flows = flowsStr.split(',').map(num => parseFloat(num.trim()));
    if (isNaN(cf0)) cf0 = 0;

    // 1. NPV
    let npv = cf0;
    flows.forEach((cf, t) => {
        npv += cf / Math.pow(1 + rate, t + 1);
    });

    // 2. IRR (Binary Search Approximation)
    let irr = computeIRR(cf0, flows);

    let resBox = document.getElementById('npvResult');
    resBox.style.display = 'block';
    resBox.innerHTML = `
        <strong>NPV:</strong> ${npv.toFixed(2)} <br>
        <strong>IRR:</strong> ${(irr * 100).toFixed(4)}%
    `;
}

function computeIRR(cf0, flows) {
    let low = -0.99;
    let high = 10.0; // 1000%
    let guess = 0;
    
    for (let i = 0; i < 50; i++) {
        guess = (low + high) / 2;
        let npv = cf0;
        flows.forEach((cf, t) => {
            npv += cf / Math.pow(1 + guess, t + 1);
        });
        if (npv > 0) low = guess;
        else high = guess;
    }
    return guess;
}