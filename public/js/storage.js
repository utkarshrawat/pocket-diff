// IDS to save
const PERSISTENT_IDS = ['input_n', 'input_i', 'input_pv', 'input_pmt', 'input_fv', 'cf0', 'cashFlows', 'discountRate', 'utilInput'];

function saveState() {
    PERSISTENT_IDS.forEach(id => {
        const el = document.getElementById(id);
        if(el) localStorage.setItem(id, el.value);
    });
    
    // Save Editor Content (if loaded)
    if (typeof editorInstance !== 'undefined') {
        localStorage.setItem('monacoContent', editorInstance.getValue());
    }
}

function loadState() {
    PERSISTENT_IDS.forEach(id => {
        const val = localStorage.getItem(id);
        if(val) document.getElementById(id).value = val;
    });

    // Add Listeners to auto-save on input
    PERSISTENT_IDS.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', saveState);
    });
}