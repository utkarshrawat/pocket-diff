function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // Save active tab to local storage
    localStorage.setItem('activeTab', tabId);

    // Refresh Monaco if needed
    setTimeout(() => {
        if (typeof editorInstance !== 'undefined' && editorInstance) editorInstance.layout();
        if (typeof diffEditorInstance !== 'undefined' && diffEditorInstance) diffEditorInstance.layout();
    }, 100);
}

// On Load
window.addEventListener('DOMContentLoaded', () => {
    // Load last used tab
    const lastTab = localStorage.getItem('activeTab') || 'home';
    openTab(lastTab);
    
    // Init Storage Loading (defined in storage.js)
    if (typeof loadState === 'function') loadState();
});